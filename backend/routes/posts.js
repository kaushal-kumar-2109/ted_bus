const express = require("express");
const router = express.Router();
const Post = require("../models/post");
const User = require("../models/customer");
const Notification = require("../models/notification");
const { verifyToken, verifyCanPost, verifyModerator } = require("../middleware/auth");
const { postLimiter } = require("../middleware/rateLimiter");
const { success, created, error, notFound, paginated, forbidden } = require("../utils/apiResponse");

const APP_URL = process.env.APP_URL || "http://localhost:4200";

// Helper to generate social share links
const buildShareLinks = (postId, title) => {
  const url = encodeURIComponent(`${APP_URL}/community/posts/${postId}`);
  const text = encodeURIComponent(title);
  return {
    twitter: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
    whatsapp: `https://wa.me/?text=${text}%20${url}`,
    linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${url}&title=${text}`,
  };
};

// Helper to normalize category query parameter
const normalizeCategory = (category) => {
  const categoryMap = {
    "Journey Story": "travel-story",
    "Travel Tip": "travel-tips",
    "Route Advice": "route-review",
    "Destination Guide": "destination-review",
    "JourneyStory": "travel-story",
    "TravelTip": "travel-tips",
    "RouteAdvice": "route-review",
    "DestinationGuide": "destination-review"
  };
  return categoryMap[category] || category;
};

// ──────────────────────────────────────────────
// GET /posts/trending/all  — BEFORE /:postId
// ──────────────────────────────────────────────
router.get("/trending/all", async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const posts = await Post.find({ isPublished: true, isApproved: true })
      .populate("author", "firstName lastName profilePicture verificationBadge")
      .sort({ trendingScore: -1, likesCount: -1 })
      .limit(parseInt(limit));
    return success(res, { posts }, "Trending posts retrieved");
  } catch (err) {
    return error(res, "Error fetching trending posts", 500, err.message);
  }
});

// ──────────────────────────────────────────────
// GET /posts/featured
// ──────────────────────────────────────────────
router.get("/featured", async (req, res) => {
  try {
    const { limit = 6 } = req.query;
    const posts = await Post.find({ isPublished: true, isApproved: true, isFeatured: true })
      .populate("author", "firstName lastName profilePicture verificationBadge")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    return success(res, { posts }, "Featured posts retrieved");
  } catch (err) {
    return error(res, "Error fetching featured posts", 500, err.message);
  }
});

// ──────────────────────────────────────────────
// GET /posts/user/:userId
// ──────────────────────────────────────────────
router.get("/user/:userId", async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [posts, total] = await Promise.all([
      Post.find({ author: req.params.userId, isPublished: true, isApproved: true })
        .populate("author", "firstName lastName profilePicture verificationBadge")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Post.countDocuments({ author: req.params.userId, isPublished: true }),
    ]);

    return paginated(res, posts, total, page, limit, "User posts retrieved");
  } catch (err) {
    return error(res, "Error fetching user posts", 500, err.message);
  }
});

// ──────────────────────────────────────────────
// POST /posts/search
// ──────────────────────────────────────────────
router.post("/search", async (req, res) => {
  try {
    const { query, category, destinations, tags, page = 1, limit = 10 } = req.body;

    const filter = { isPublished: true, isApproved: true };

    if (query) {
      filter.$or = [
        { title: { $regex: query, $options: "i" } },
        { content: { $regex: query, $options: "i" } },
        { tags: { $in: [new RegExp(query, "i")] } },
        { authorName: { $regex: query, $options: "i" } },
      ];
    }
    if (category) filter.category = normalizeCategory(category);
    if (destinations?.length > 0) filter.destinations = { $in: destinations };
    if (tags?.length > 0) filter.tags = { $in: tags };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [posts, total] = await Promise.all([
      Post.find(filter)
        .populate("author", "firstName lastName profilePicture verificationBadge")
        .sort({ trendingScore: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Post.countDocuments(filter),
    ]);

    return paginated(res, posts, total, page, limit, "Search results");
  } catch (err) {
    return error(res, "Search failed", 500, err.message);
  }
});

// ──────────────────────────────────────────────
// POST /posts  — Create Post (verified users only)
// ──────────────────────────────────────────────
router.post("/", verifyCanPost, postLimiter, async (req, res) => {
  try {
    const { title, content, category, coverImage, images, videos, tags, destinations, routes } = req.body;

    if (!title || !content || !category) {
      return error(res, "Title, content, and category are required", 400);
    }

    const shareLinks = buildShareLinks("placeholder", title);

    const post = new Post({
      author: req.userId,
      authorName: req.user.fullName || `${req.user.firstName} ${req.user.lastName}`,
      authorAvatar: req.user.profilePicture,
      title,
      content,
      category,
      coverImage: coverImage || null,
      images: images || [],
      videos: videos || [],
      tags: tags || [],
      destinations: destinations || [],
      routes: routes || [],
      isPublished: true,
      isApproved: true,
      moderationStatus: "approved",
    });

    await post.save();

    // Set real share links now that we have the ID
    post.socialShareLinks = buildShareLinks(post._id, title);
    await post.save();

    await User.findByIdAndUpdate(req.userId, { $inc: { totalPosts: 1 } });

    return created(res, { post }, "Post created successfully");
  } catch (err) {
    return error(res, "Error creating post", 500, err.message);
  }
});

// ──────────────────────────────────────────────
// GET /posts  — All Posts
// ──────────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const { category, page = 1, limit = 10, sortBy = "createdAt", order = "desc" } = req.query;

    const filter = { isPublished: true, isApproved: true };
    if (category) filter.category = normalizeCategory(category);

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortObj = { [sortBy]: order === "asc" ? 1 : -1 };

    const [posts, total] = await Promise.all([
      Post.find(filter)
        .populate("author", "firstName lastName profilePicture verificationBadge")
        .sort(sortObj)
        .skip(skip)
        .limit(parseInt(limit)),
      Post.countDocuments(filter),
    ]);

    return paginated(res, posts, total, page, limit, "Posts retrieved");
  } catch (err) {
    return error(res, "Error fetching posts", 500, err.message);
  }
});

// ──────────────────────────────────────────────
// GET /posts/:postId
// ──────────────────────────────────────────────
router.get("/:postId", async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(
      req.params.postId,
      { $inc: { views: 1 } },
      { new: true }
    )
      .populate("author", "firstName lastName profilePicture bio followerCount verificationBadge")
      .populate({
        path: "comments",
        populate: { path: "author", select: "firstName lastName profilePicture verificationBadge" },
      });

    if (!post) return notFound(res, "Post");
    return success(res, { post }, "Post retrieved");
  } catch (err) {
    return error(res, "Error fetching post", 500, err.message);
  }
});

// ──────────────────────────────────────────────
// PUT /posts/:postId  — Edit Own Post
// ──────────────────────────────────────────────
router.put("/:postId", verifyToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return notFound(res, "Post");
    if (post.author.toString() !== req.userId && req.user.role === "user") {
      return forbidden(res, "You can only edit your own posts");
    }

    const allowed = ["title", "content", "category", "coverImage", "images", "videos", "tags", "destinations", "routes"];
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) post[field] = req.body[field];
    });

    if (req.body.title) {
      post.socialShareLinks = buildShareLinks(post._id, req.body.title);
    }

    await post.save();
    return success(res, { post }, "Post updated successfully");
  } catch (err) {
    return error(res, "Error updating post", 500, err.message);
  }
});

// ──────────────────────────────────────────────
// POST /posts/:postId/like
// ──────────────────────────────────────────────
router.post("/:postId/like", verifyToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return notFound(res, "Post");

    const alreadyLiked = post.likes.some((id) => id.toString() === req.userId);

    if (alreadyLiked) {
      post.likes = post.likes.filter((id) => id.toString() !== req.userId);
    } else {
      post.likes.push(req.userId);
      // Send notification to post author if not self-like
      if (post.author.toString() !== req.userId) {
        await Notification.create({
          recipient: post.author,
          sender: req.userId,
          type: "like_post",
          title: "New Like",
          message: `${req.user.firstName} liked your post "${post.title}"`,
          link: `/community/posts/${post._id}`,
          entityType: "post",
          entityId: post._id,
        });
      }
    }

    post.likesCount = post.likes.length;
    await post.save();

    return success(res, { likesCount: post.likesCount, liked: !alreadyLiked }, alreadyLiked ? "Post unliked" : "Post liked");
  } catch (err) {
    return error(res, "Error toggling like", 500, err.message);
  }
});

// ──────────────────────────────────────────────
// POST /posts/:postId/save  — Bookmark
// ──────────────────────────────────────────────
router.post("/:postId/save", verifyToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return notFound(res, "Post");

    const user = await User.findById(req.userId);
    const alreadySaved = user.savedPosts.some((id) => id.toString() === req.params.postId);

    if (alreadySaved) {
      user.savedPosts = user.savedPosts.filter((id) => id.toString() !== req.params.postId);
      post.savedCount = Math.max(0, post.savedCount - 1);
    } else {
      user.savedPosts.push(req.params.postId);
      post.savedCount += 1;
    }

    await Promise.all([user.save(), post.save()]);
    return success(res, { saved: !alreadySaved, savedCount: post.savedCount }, alreadySaved ? "Post unsaved" : "Post saved");
  } catch (err) {
    return error(res, "Error saving post", 500, err.message);
  }
});

// ──────────────────────────────────────────────
// POST /posts/:postId/share
// ──────────────────────────────────────────────
router.post("/:postId/share", verifyToken, async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(
      req.params.postId,
      { $inc: { shares: 1 } },
      { new: true }
    );
    if (!post) return notFound(res, "Post");
    return success(res, { shares: post.shares, shareLinks: post.socialShareLinks }, "Post shared");
  } catch (err) {
    return error(res, "Error sharing post", 500, err.message);
  }
});

// ──────────────────────────────────────────────
// POST /posts/:postId/report
// ──────────────────────────────────────────────
router.post("/:postId/report", verifyToken, async (req, res) => {
  try {
    const { reason, description } = req.body;
    if (!reason) return error(res, "Report reason is required", 400);

    const post = await Post.findByIdAndUpdate(
      req.params.postId,
      { $inc: { reportCount: 1 }, isReported: true },
      { new: true }
    );
    if (!post) return notFound(res, "Post");

    // Create moderation record
    const ContentModeration = require("../models/moderation");
    await ContentModeration.create({
      contentType: "post",
      contentId: post._id,
      reportedBy: req.userId,
      reason,
      description,
      status: "pending",
    });

    return success(res, {}, "Post reported successfully. Our team will review it.");
  } catch (err) {
    return error(res, "Error reporting post", 500, err.message);
  }
});

// ──────────────────────────────────────────────
// DELETE /posts/:postId
// ──────────────────────────────────────────────
router.delete("/:postId", verifyToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return notFound(res, "Post");

    if (post.author.toString() !== req.userId && req.user.role === "user") {
      return forbidden(res, "You can only delete your own posts");
    }

    await Promise.all([
      Post.findByIdAndDelete(req.params.postId),
      User.findByIdAndUpdate(req.userId, { $inc: { totalPosts: -1 } }),
    ]);

    return success(res, {}, "Post deleted successfully");
  } catch (err) {
    return error(res, "Error deleting post", 500, err.message);
  }
});

// ──────────────────────────────────────────────
// GET /posts/:postId/share-links
// ──────────────────────────────────────────────
router.get("/:postId/share-links", async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId).select("title socialShareLinks");
    if (!post) return notFound(res, "Post");
    const links = post.socialShareLinks || buildShareLinks(post._id, post.title);
    return success(res, { shareLinks: links }, "Share links retrieved");
  } catch (err) {
    return error(res, "Error fetching share links", 500, err.message);
  }
});

module.exports = router;
