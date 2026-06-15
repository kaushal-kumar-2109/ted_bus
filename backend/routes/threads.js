const express = require("express");
const router = express.Router();
const Thread = require("../models/thread");
const Forum = require("../models/forum");
const User = require("../models/customer");
const { verifyToken } = require("../middleware/auth");

// Create Thread
router.post("/", verifyToken, async (req, res) => {
  try {
    const { forumId, title, content, tags } = req.body;

    if (!forumId || !title || !content) {
      return res
        .status(400)
        .json({ message: "Forum ID, title, and content are required" });
    }

    const forum = await Forum.findById(forumId);
    if (!forum) {
      return res.status(404).json({ message: "Forum not found" });
    }

    const user = await User.findById(req.userId);

    const thread = new Thread({
      forum: forumId,
      title,
      content,
      author: req.userId,
      authorName: `${user.firstName} ${user.lastName}`,
      tags: tags || [],
      isPinned: false,
      isLocked: false,
      isApproved: true,
    });

    await thread.save();

    // Update forum
    forum.threads.push(thread._id);
    forum.threadsCount += 1;
    forum.lastActivity = new Date();
    await forum.save();

    res.status(201).json({
      message: "Thread created successfully",
      thread,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error creating thread",
      error: error.message,
    });
  }
});

// Get Forum Threads
router.get("/forum/:forumId", async (req, res) => {
  try {
    const { page = 1, limit = 20, sortBy = "createdAt" } = req.query;
    const skip = (page - 1) * limit;

    const sortObj = {};
    sortObj[sortBy] = -1;

    const threads = await Thread.find({ forum: req.params.forumId })
      .populate("author", "firstName lastName profilePicture")
      .sort({ isPinned: -1, ...sortObj })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Thread.countDocuments({ forum: req.params.forumId });

    res.status(200).json({
      message: "Threads retrieved successfully",
      threads,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching threads",
      error: error.message,
    });
  }
});

// Get Thread by ID
router.get("/:threadId", async (req, res) => {
  try {
    const thread = await Thread.findByIdAndUpdate(
      req.params.threadId,
      { $inc: { views: 1 } },
      { new: true }
    )
      .populate("author", "firstName lastName profilePicture bio")
      .populate({
        path: "replies",
        populate: { path: "author", select: "firstName lastName profilePicture" },
      });

    if (!thread) {
      return res.status(404).json({ message: "Thread not found" });
    }

    res.status(200).json({
      message: "Thread retrieved successfully",
      thread,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching thread",
      error: error.message,
    });
  }
});

// Like Thread
router.post("/:threadId/like", verifyToken, async (req, res) => {
  try {
    const thread = await Thread.findById(req.params.threadId);

    if (!thread) {
      return res.status(404).json({ message: "Thread not found" });
    }

    const alreadyLiked = thread.likes.includes(req.userId);

    if (alreadyLiked) {
      thread.likes = thread.likes.filter((id) => id.toString() !== req.userId);
    } else {
      thread.likes.push(req.userId);
    }

    thread.likesCount = thread.likes.length;
    await thread.save();

    res.status(200).json({
      message: alreadyLiked ? "Thread unliked" : "Thread liked",
      likesCount: thread.likesCount,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error liking thread",
      error: error.message,
    });
  }
});

// Pin/Unpin Thread (Moderator)
router.post("/:threadId/pin", verifyToken, async (req, res) => {
  try {
    const thread = await Thread.findById(req.params.threadId);

    if (!thread) {
      return res.status(404).json({ message: "Thread not found" });
    }

    const forum = await Forum.findById(thread.forum);

    // Check if user is moderator
    if (!forum.moderators.includes(req.userId)) {
      return res.status(403).json({
        message: "Only moderators can pin threads",
      });
    }

    thread.isPinned = !thread.isPinned;
    await thread.save();

    res.status(200).json({
      message: thread.isPinned ? "Thread pinned" : "Thread unpinned",
      isPinned: thread.isPinned,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error pinning thread",
      error: error.message,
    });
  }
});

// Lock/Unlock Thread (Moderator)
router.post("/:threadId/lock", verifyToken, async (req, res) => {
  try {
    const thread = await Thread.findById(req.params.threadId);

    if (!thread) {
      return res.status(404).json({ message: "Thread not found" });
    }

    const forum = await Forum.findById(thread.forum);

    if (!forum.moderators.includes(req.userId)) {
      return res.status(403).json({
        message: "Only moderators can lock threads",
      });
    }

    thread.isLocked = !thread.isLocked;
    await thread.save();

    res.status(200).json({
      message: thread.isLocked ? "Thread locked" : "Thread unlocked",
      isLocked: thread.isLocked,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error locking thread",
      error: error.message,
    });
  }
});

// Delete Thread
router.delete("/:threadId", verifyToken, async (req, res) => {
  try {
    const thread = await Thread.findById(req.params.threadId);

    if (!thread) {
      return res.status(404).json({ message: "Thread not found" });
    }

    if (thread.author.toString() !== req.userId) {
      return res.status(403).json({
        message: "You can only delete your own threads",
      });
    }

    // Remove from forum
    await Forum.findByIdAndUpdate(
      thread.forum,
      { $pull: { threads: thread._id }, $inc: { threadsCount: -1 } }
    );

    await Thread.findByIdAndDelete(req.params.threadId);

    res.status(200).json({
      message: "Thread deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting thread",
      error: error.message,
    });
  }
});

// Search Threads
router.post("/search", async (req, res) => {
  try {
    const { query, forumId, tags, page = 1, limit = 20 } = req.body;

    const filter = {};

    if (query) {
      filter.$or = [
        { title: { $regex: query, $options: "i" } },
        { content: { $regex: query, $options: "i" } },
      ];
    }

    if (forumId) {
      filter.forum = forumId;
    }

    if (tags && tags.length > 0) {
      filter.tags = { $in: tags };
    }

    const skip = (page - 1) * limit;

    const threads = await Thread.find(filter)
      .populate("author")
      .sort({ views: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Thread.countDocuments(filter);

    res.status(200).json({
      message: "Search results",
      threads,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Error searching threads",
      error: error.message,
    });
  }
});

module.exports = router;
