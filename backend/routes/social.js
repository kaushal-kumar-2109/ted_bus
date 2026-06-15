const express = require("express");
const router = express.Router();
const Post = require("../models/post");
const { success, error, notFound } = require("../utils/apiResponse");

const APP_URL = process.env.APP_URL || "http://localhost:4200";

// ──────────────────────────────────────────────
// GET /social/share-links/:postId
// ──────────────────────────────────────────────
router.get("/share-links/:postId", async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId).select("title socialShareLinks");
    if (!post) return notFound(res, "Post");

    const url = encodeURIComponent(`${APP_URL}/community/posts/${post._id}`);
    const text = encodeURIComponent(post.title);

    const shareLinks = post.socialShareLinks || {
      twitter: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      whatsapp: `https://wa.me/?text=${text}%20${url}`,
      linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${url}&title=${text}`,
    };

    return success(res, {
      postId: post._id,
      postTitle: post.title,
      shareLinks,
      directLink: `${APP_URL}/community/posts/${post._id}`,
    }, "Share links retrieved");
  } catch (err) {
    return error(res, "Error generating share links", 500, err.message);
  }
});

// ──────────────────────────────────────────────
// GET /social/analytics/:postId  — Engagement analytics
// ──────────────────────────────────────────────
router.get("/analytics/:postId", async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId).select(
      "title likesCount commentsCount shares views savedCount trendingScore readTime createdAt"
    );
    if (!post) return notFound(res, "Post");

    const engagementRate = post.views > 0
      ? (((post.likesCount + post.commentsCount) / post.views) * 100).toFixed(2)
      : 0;

    return success(res, {
      postId: post._id,
      title: post.title,
      analytics: {
        views: post.views,
        likes: post.likesCount,
        comments: post.commentsCount,
        shares: post.shares,
        saves: post.savedCount,
        trendingScore: post.trendingScore,
        engagementRate: `${engagementRate}%`,
        readTime: `${post.readTime} min`,
        publishedAt: post.createdAt,
      },
    }, "Analytics retrieved");
  } catch (err) {
    return error(res, "Error fetching analytics", 500, err.message);
  }
});

// ──────────────────────────────────────────────
// GET /social/trending-tags
// ──────────────────────────────────────────────
router.get("/trending-tags", async (req, res) => {
  try {
    const tags = await Post.aggregate([
      { $match: { isPublished: true, isApproved: true } },
      { $unwind: "$tags" },
      { $group: { _id: "$tags", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 },
      { $project: { tag: "$_id", count: 1, _id: 0 } },
    ]);
    return success(res, { tags }, "Trending tags retrieved");
  } catch (err) {
    return error(res, "Error fetching trending tags", 500, err.message);
  }
});

// ──────────────────────────────────────────────
// GET /social/community-stats  — Platform-wide stats
// ──────────────────────────────────────────────
router.get("/community-stats", async (req, res) => {
  try {
    const User = require("../models/customer");
    const Forum = require("../models/forum");

    const [totalPosts, totalUsers, totalForums, topPosts] = await Promise.all([
      Post.countDocuments({ isPublished: true }),
      User.countDocuments({ isActive: true }),
      Forum.countDocuments({}),
      Post.find({ isPublished: true, isApproved: true })
        .sort({ trendingScore: -1 })
        .limit(3)
        .select("title likesCount commentsCount authorName"),
    ]);

    return success(res, {
      stats: {
        totalPosts,
        totalUsers,
        totalForums,
        topPosts,
      },
    }, "Community stats retrieved");
  } catch (err) {
    return error(res, "Error fetching community stats", 500, err.message);
  }
});

module.exports = router;
