const express = require("express");
const router = express.Router();
const Comment = require("../models/comment");
const Post = require("../models/post");
const User = require("../models/customer");
const Notification = require("../models/notification");
const { verifyToken } = require("../middleware/auth");

// Create Comment
router.post("/", verifyToken, async (req, res) => {
  try {
    const { postId, content, parentCommentId } = req.body;

    if (!postId || !content) {
      return res
        .status(400)
        .json({ message: "Post ID and content are required" });
    }

    if (content.length > 2000) {
      return res.status(400).json({
        message: "Comment exceeds maximum length of 2000 characters",
      });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const user = await User.findById(req.userId);

    const comment = new Comment({
      post: postId,
      author: req.userId,
      authorName: `${user.firstName} ${user.lastName}`,
      authorAvatar: user.profilePicture,
      content,
      parentComment: parentCommentId || null,
      isApproved: true,
    });

    await comment.save();

    // Update post comment count
    post.comments.push(comment._id);
    post.commentsCount = post.comments.length;
    await post.save();

    // Update user comment count
    user.totalComments += 1;
    await user.save();

    // Add reply to parent comment if exists
    if (parentCommentId) {
      const parentComment = await Comment.findById(parentCommentId);
      if (parentComment) {
        parentComment.replies.push(comment._id);
        await parentComment.save();
      }
    }

    res.status(201).json({
      message: "Comment created successfully",
      comment,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error creating comment",
      error: error.message,
    });
  }
});

// Get Comments for Post
router.get("/post/:postId", async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const comments = await Comment.find({
      post: req.params.postId,
      parentComment: null,
    })
      .populate("author", "firstName lastName profilePicture")
      .populate({
        path: "replies",
        populate: { path: "author", select: "firstName lastName profilePicture" },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Comment.countDocuments({
      post: req.params.postId,
      parentComment: null,
    });

    res.status(200).json({
      message: "Comments retrieved successfully",
      comments,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching comments",
      error: error.message,
    });
  }
});

// Like Comment
router.post("/:commentId/like", verifyToken, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    const alreadyLiked = comment.likes.includes(req.userId);

    if (alreadyLiked) {
      comment.likes = comment.likes.filter((id) => id.toString() !== req.userId);
    } else {
      comment.likes.push(req.userId);
    }

    comment.likesCount = comment.likes.length;
    await comment.save();

    res.status(200).json({
      message: alreadyLiked ? "Comment unliked" : "Comment liked",
      likesCount: comment.likesCount,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error liking comment",
      error: error.message,
    });
  }
});

// Edit Comment
router.put("/:commentId", verifyToken, async (req, res) => {
  try {
    const { content } = req.body;
    const comment = await Comment.findById(req.params.commentId);

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    if (comment.author.toString() !== req.userId) {
      return res.status(403).json({
        message: "You can only edit your own comments",
      });
    }

    comment.content = content || comment.content;
    comment.updatedAt = new Date();
    await comment.save();

    res.status(200).json({
      message: "Comment updated successfully",
      comment,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating comment",
      error: error.message,
    });
  }
});

// Delete Comment
router.delete("/:commentId", verifyToken, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    if (comment.author.toString() !== req.userId) {
      return res.status(403).json({
        message: "You can only delete your own comments",
      });
    }

    // Remove from post
    await Post.findByIdAndUpdate(
      comment.post,
      { $pull: { comments: comment._id }, $inc: { commentsCount: -1 } }
    );

    // Remove from parent comment if exists
    if (comment.parentComment) {
      await Comment.findByIdAndUpdate(
        comment.parentComment,
        { $pull: { replies: comment._id } }
      );
    }

    // Update user comment count
    await User.findByIdAndUpdate(req.userId, { $inc: { totalComments: -1 } });

    await Comment.findByIdAndDelete(req.params.commentId);

    res.status(200).json({
      message: "Comment deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting comment",
      error: error.message,
    });
  }
});

// Report Comment
router.post("/:commentId/report", verifyToken, async (req, res) => {
  try {
    const comment = await Comment.findByIdAndUpdate(
      req.params.commentId,
      { isReported: true },
      { new: true }
    );

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    res.status(200).json({
      message: "Comment reported successfully",
      comment,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error reporting comment",
      error: error.message,
    });
  }
});

module.exports = router;
