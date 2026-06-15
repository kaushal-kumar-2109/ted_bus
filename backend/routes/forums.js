const express = require("express");
const router = express.Router();
const Forum = require("../models/forum");
const User = require("../models/customer");
const { verifyToken, verifyAdmin } = require("../middleware/auth");

// Create Forum (Admin)
router.post("/", async (req, res) => {
  try {
    const { title, slug, description, category, icon, rules } = req.body;

    if (!title || !slug || !category) {
      return res
        .status(400)
        .json({ message: "Title, slug, and category are required" });
    }

    // Check if forum already exists
    const existingForum = await Forum.findOne({ slug });
    if (existingForum) {
      return res.status(409).json({ message: "Forum slug already exists" });
    }

    const forum = new Forum({
      title,
      slug,
      description,
      category,
      icon,
      rules: rules || [],
      moderators: [],
    });

    await forum.save();

    res.status(201).json({
      message: "Forum created successfully",
      forum,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error creating forum",
      error: error.message,
    });
  }
});

// Get All Forums
router.get("/", async (req, res) => {
  try {
    const { category, page = 1, limit = 20 } = req.query;

    const filter = { isActive: true };
    if (category) filter.category = category;

    const skip = (page - 1) * limit;

    const forums = await Forum.find(filter)
      .populate("moderators", "firstName lastName profilePicture")
      .populate("subscribers")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Forum.countDocuments(filter);

    res.status(200).json({
      message: "Forums retrieved successfully",
      forums,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching forums",
      error: error.message,
    });
  }
});

// Get Forum by Slug
router.get("/slug/:slug", async (req, res) => {
  try {
    const forum = await Forum.findOne({ slug: req.params.slug })
      .populate("moderators")
      .populate("subscribers")
      .populate("threads");

    if (!forum) {
      return res.status(404).json({ message: "Forum not found" });
    }

    res.status(200).json({
      message: "Forum retrieved successfully",
      forum,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching forum",
      error: error.message,
    });
  }
});

// Subscribe to Forum
router.post("/:forumId/subscribe", verifyToken, async (req, res) => {
  try {
    const forum = await Forum.findById(req.params.forumId);

    if (!forum) {
      return res.status(404).json({ message: "Forum not found" });
    }

    const alreadySubscribed = forum.subscribers.includes(req.userId);

    if (alreadySubscribed) {
      forum.subscribers = forum.subscribers.filter(
        (id) => id.toString() !== req.userId
      );
      forum.subscribersCount = forum.subscribers.length;
    } else {
      forum.subscribers.push(req.userId);
      forum.subscribersCount = forum.subscribers.length;
    }

    await forum.save();

    res.status(200).json({
      message: alreadySubscribed ? "Unsubscribed from forum" : "Subscribed to forum",
      subscribersCount: forum.subscribersCount,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error subscribing to forum",
      error: error.message,
    });
  }
});

// Get Forum Statistics
router.get("/:forumId/stats", async (req, res) => {
  try {
    const forum = await Forum.findById(req.params.forumId);

    if (!forum) {
      return res.status(404).json({ message: "Forum not found" });
    }

    res.status(200).json({
      message: "Forum statistics",
      stats: {
        title: forum.title,
        threadsCount: forum.threadsCount,
        postsCount: forum.postsCount,
        subscribersCount: forum.subscribersCount,
        moderatorsCount: forum.moderators.length,
        category: forum.category,
        lastActivity: forum.lastActivity,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching forum statistics",
      error: error.message,
    });
  }
});

// Add Moderator (Admin)
router.post("/:forumId/moderators", async (req, res) => {
  try {
    const { userId } = req.body;

    const forum = await Forum.findById(req.params.forumId);
    if (!forum) {
      return res.status(404).json({ message: "Forum not found" });
    }

    if (forum.moderators.includes(userId)) {
      return res.status(400).json({ message: "User is already a moderator" });
    }

    forum.moderators.push(userId);
    await forum.save();

    res.status(200).json({
      message: "Moderator added successfully",
      forum,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error adding moderator",
      error: error.message,
    });
  }
});

// Get Popular Forums
router.get("/popular/all", async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const popularForums = await Forum.find({ isActive: true })
      .sort({ subscribersCount: -1, threadsCount: -1 })
      .limit(parseInt(limit));

    res.status(200).json({
      message: "Popular forums retrieved",
      forums: popularForums,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching popular forums",
      error: error.message,
    });
  }
});

module.exports = router;
