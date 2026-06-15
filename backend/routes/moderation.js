const express = require("express");
const router = express.Router();
const ContentModeration = require("../models/moderation");
const Post = require("../models/post");
const Comment = require("../models/comment");
const User = require("../models/customer");
const Notification = require("../models/notification");
const { verifyToken, verifyModerator, verifyAdmin } = require("../middleware/auth");
const { success, created, error, notFound, paginated } = require("../utils/apiResponse");

// ──────────────────────────────────────────────
// POST /moderation/report  — Any authenticated user can report
// ──────────────────────────────────────────────
router.post("/report", verifyToken, async (req, res) => {
  try {
    const { contentType, contentId, reason, description } = req.body;

    if (!contentType || !contentId || !reason) {
      return error(res, "Content type, content ID, and reason are required", 400);
    }

    const validReasons = ["spam", "hate-speech", "misinformation", "inappropriate", "harassment", "copyright", "other"];
    if (!validReasons.includes(reason)) {
      return error(res, `Reason must be one of: ${validReasons.join(", ")}`, 400);
    }

    // Prevent duplicate reports from same user
    const existing = await ContentModeration.findOne({
      contentId,
      reportedBy: req.userId,
      status: "pending",
    });
    if (existing) return error(res, "You have already reported this content", 409);

    const moderation = new ContentModeration({
      contentType,
      contentId,
      reportedBy: req.userId,
      reason,
      description,
      status: "pending",
    });

    await moderation.save();

    // Mark content as reported
    if (contentType === "post") {
      await Post.findByIdAndUpdate(contentId, { $inc: { reportCount: 1 }, isReported: true });
    } else if (contentType === "comment") {
      await Comment.findByIdAndUpdate(contentId, { isReported: true });
    }

    return created(res, {}, "Content reported. Our moderation team will review it.");
  } catch (err) {
    return error(res, "Error reporting content", 500, err.message);
  }
});

// ──────────────────────────────────────────────
// GET /moderation/pending  — Mods only
// ──────────────────────────────────────────────
router.get("/pending", verifyModerator, async (req, res) => {
  try {
    const { page = 1, limit = 20, contentType } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = { status: "pending" };
    if (contentType) filter.contentType = contentType;

    const [reports, total] = await Promise.all([
      ContentModeration.find(filter)
        .populate("reportedBy", "firstName lastName email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      ContentModeration.countDocuments(filter),
    ]);

    return paginated(res, reports, total, page, limit, "Pending reports retrieved");
  } catch (err) {
    return error(res, "Error fetching reports", 500, err.message);
  }
});

// ──────────────────────────────────────────────
// GET /moderation/history  — Mods only
// ──────────────────────────────────────────────
router.get("/history", verifyModerator, async (req, res) => {
  try {
    const { page = 1, limit = 20, contentType, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = {};
    if (contentType) filter.contentType = contentType;
    if (status) filter.status = status;

    const [reports, total] = await Promise.all([
      ContentModeration.find(filter)
        .populate("reportedBy", "firstName lastName")
        .populate("reviewedBy", "firstName lastName")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      ContentModeration.countDocuments(filter),
    ]);

    return paginated(res, reports, total, page, limit, "Moderation history retrieved");
  } catch (err) {
    return error(res, "Error fetching history", 500, err.message);
  }
});

// ──────────────────────────────────────────────
// POST /moderation/:reportId/review  — Mods only
// ──────────────────────────────────────────────
router.post("/:reportId/review", verifyModerator, async (req, res) => {
  try {
    const { action, notes } = req.body;
    if (!action || !["approve", "reject"].includes(action)) {
      return error(res, "Action must be 'approve' (remove content) or 'reject' (dismiss report)", 400);
    }

    const moderation = await ContentModeration.findById(req.params.reportId);
    if (!moderation) return notFound(res, "Report");
    if (moderation.status !== "pending") return error(res, "Report already reviewed", 400);

    moderation.status = "reviewed";
    moderation.reviewedBy = req.userId;
    moderation.reviewedAt = new Date();
    moderation.reviewNotes = notes;

    if (action === "approve") {
      // Remove content
      moderation.moderationAction = "remove-content";

      if (moderation.contentType === "post") {
        const post = await Post.findByIdAndUpdate(moderation.contentId, {
          isApproved: false,
          moderationStatus: "rejected",
          rejectionReason: moderation.reason,
        }, { new: true });

        if (post) {
          await Notification.create({
            recipient: post.author,
            type: "content_moderated",
            title: "Content Removed",
            message: `Your post "${post.title}" was removed for violating community guidelines: ${moderation.reason}`,
            link: "/community",
          });
        }
      } else if (moderation.contentType === "comment") {
        await Comment.findByIdAndUpdate(moderation.contentId, {
          isApproved: false,
          moderationStatus: "rejected",
        });
      } else if (moderation.contentType === "user") {
        await User.findByIdAndUpdate(moderation.contentId, {
          isBanned: true,
          banReason: `Community guidelines violation: ${moderation.reason}`,
        });
      }
    } else {
      moderation.moderationAction = "none";
    }

    await moderation.save();
    return success(res, { moderation }, `Report ${action === "approve" ? "actioned — content removed" : "dismissed"}`);
  } catch (err) {
    return error(res, "Error reviewing report", 500, err.message);
  }
});

// ──────────────────────────────────────────────
// GET /moderation/stats/all  — Admin only
// ──────────────────────────────────────────────
router.get("/stats/all", verifyAdmin, async (req, res) => {
  try {
    const [totalReports, pendingReports, reviewedReports, reasonBreakdown, contentTypeBreakdown] = await Promise.all([
      ContentModeration.countDocuments(),
      ContentModeration.countDocuments({ status: "pending" }),
      ContentModeration.countDocuments({ status: "reviewed" }),
      ContentModeration.aggregate([
        { $group: { _id: "$reason", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      ContentModeration.aggregate([
        { $group: { _id: "$contentType", count: { $sum: 1 } } },
      ]),
    ]);

    return success(res, {
      stats: {
        totalReports,
        pendingReports,
        reviewedReports,
        dismissedReports: reviewedReports,
        reasonBreakdown,
        contentTypeBreakdown,
      },
    }, "Moderation statistics retrieved");
  } catch (err) {
    return error(res, "Error fetching stats", 500, err.message);
  }
});

// ──────────────────────────────────────────────
// POST /moderation/users/:userId/ban  — Admin only
// ──────────────────────────────────────────────
router.post("/users/:userId/ban", verifyAdmin, async (req, res) => {
  try {
    const { reason, duration } = req.body;
    if (!reason) return error(res, "Ban reason is required", 400);

    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { isBanned: true, banReason: reason, isActive: false, bannedAt: new Date() },
      { new: true }
    );
    if (!user) return notFound(res, "User");

    await Promise.all([
      Post.updateMany({ author: req.params.userId }, { isPublished: false }),
      Comment.updateMany({ author: req.params.userId }, { isApproved: false }),
    ]);

    return success(res, { user }, "User banned successfully");
  } catch (err) {
    return error(res, "Error banning user", 500, err.message);
  }
});

// ──────────────────────────────────────────────
// POST /moderation/users/:userId/unban  — Admin only
// ──────────────────────────────────────────────
router.post("/users/:userId/unban", verifyAdmin, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { isBanned: false, banReason: null, isActive: true },
      { new: true }
    );
    if (!user) return notFound(res, "User");
    return success(res, { user }, "User unbanned successfully");
  } catch (err) {
    return error(res, "Error unbanning user", 500, err.message);
  }
});

// ──────────────────────────────────────────────
// GET /moderation/users/flagged  — Admin only
// ──────────────────────────────────────────────
router.get("/users/flagged", verifyAdmin, async (req, res) => {
  try {
    const flagged = await ContentModeration.aggregate([
      { $match: { contentType: "post", status: "pending" } },
      {
        $lookup: {
          from: "posts",
          localField: "contentId",
          foreignField: "_id",
          as: "post",
        },
      },
      { $unwind: "$post" },
      { $group: { _id: "$post.author", reportCount: { $sum: 1 } } },
      { $sort: { reportCount: -1 } },
      { $limit: 20 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $project: {
          userId: "$_id",
          reportCount: 1,
          "user.firstName": 1,
          "user.lastName": 1,
          "user.email": 1,
          "user.isBanned": 1,
        },
      },
    ]);

    return success(res, { flaggedUsers: flagged }, "Flagged users retrieved");
  } catch (err) {
    return error(res, "Error fetching flagged users", 500, err.message);
  }
});

module.exports = router;
