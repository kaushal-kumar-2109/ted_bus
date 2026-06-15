const express = require("express");
const router = express.Router();
const User = require("../models/customer");
const Post = require("../models/post");
const Notification = require("../models/notification");
const { verifyToken, verifyAdmin } = require("../middleware/auth");
const { success, created, error, notFound, paginated, forbidden } = require("../utils/apiResponse");

// ──────────────────────────────────────────────
// GET /users/:userId/profile  — Public profile
// ──────────────────────────────────────────────
router.get("/:userId/profile", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select(
      "-password -loginAttempts -lockUntil -emailVerificationToken -passwordResetToken"
    );
    if (!user) return notFound(res, "User");

    const [posts, savedPosts] = await Promise.all([
      Post.find({ author: user._id, isPublished: true, isApproved: true })
        .sort({ createdAt: -1 })
        .limit(6)
        .select("title excerpt coverImage category likesCount commentsCount createdAt tags"),
      Post.find({ _id: { $in: user.savedPosts } })
        .sort({ createdAt: -1 })
        .limit(6)
        .select("title excerpt coverImage category authorName createdAt"),
    ]);

    return success(res, {
      user,
      recentPosts: posts,
      savedPosts,
    }, "Profile retrieved");
  } catch (err) {
    return error(res, "Error fetching profile", 500, err.message);
  }
});

// ──────────────────────────────────────────────
// PUT /users/me  — Update Own Profile
// ──────────────────────────────────────────────
router.put("/me", verifyToken, async (req, res) => {
  try {
    const allowed = ["firstName", "lastName", "bio", "city", "state", "country", "gender", "profilePicture", "coverImage", "socialLinks", "notifications"];
    const updates = {};
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const user = await User.findByIdAndUpdate(req.userId, updates, { new: true, runValidators: true });
    return success(res, { user }, "Profile updated successfully");
  } catch (err) {
    return error(res, "Error updating profile", 500, err.message);
  }
});

// ──────────────────────────────────────────────
// POST /users/:userId/follow
// ──────────────────────────────────────────────
router.post("/:userId/follow", verifyToken, async (req, res) => {
  try {
    const targetId = req.params.userId;
    if (targetId === req.userId) return error(res, "You cannot follow yourself", 400);

    const [me, target] = await Promise.all([
      User.findById(req.userId),
      User.findById(targetId),
    ]);

    if (!target) return notFound(res, "User");

    const alreadyFollowing = me.following.some((id) => id.toString() === targetId);

    if (alreadyFollowing) {
      // Unfollow
      me.following = me.following.filter((id) => id.toString() !== targetId);
      target.followers = target.followers.filter((id) => id.toString() !== req.userId);
      me.followingCount = Math.max(0, me.followingCount - 1);
      target.followerCount = Math.max(0, target.followerCount - 1);
    } else {
      // Follow
      me.following.push(targetId);
      target.followers.push(req.userId);
      me.followingCount += 1;
      target.followerCount += 1;

      // Notification
      await Notification.create({
        recipient: target._id,
        sender: req.userId,
        type: "follow",
        title: "New Follower",
        message: `${me.firstName} ${me.lastName} started following you`,
        link: `/profile/${req.userId}`,
        entityType: "user",
        entityId: req.userId,
      });
    }

    await Promise.all([me.save(), target.save()]);

    return success(res, {
      following: !alreadyFollowing,
      followerCount: target.followerCount,
    }, alreadyFollowing ? "Unfollowed" : "Following");
  } catch (err) {
    return error(res, "Error following user", 500, err.message);
  }
});

// ──────────────────────────────────────────────
// GET /users/:userId/activity  — Activity Feed
// ──────────────────────────────────────────────
router.get("/:userId/activity", async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [posts, total] = await Promise.all([
      Post.find({ author: req.params.userId, isPublished: true, isApproved: true })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select("title excerpt category likesCount commentsCount views createdAt coverImage tags"),
      Post.countDocuments({ author: req.params.userId, isPublished: true }),
    ]);

    return paginated(res, posts, total, page, limit, "Activity feed retrieved");
  } catch (err) {
    return error(res, "Error fetching activity", 500, err.message);
  }
});

// ──────────────────────────────────────────────
// POST /users/verify-request  — Submit Verification
// ──────────────────────────────────────────────
router.post("/verify-request", verifyToken, async (req, res) => {
  try {
    const { documentUrl, documentType } = req.body;
    if (!documentUrl) return error(res, "Verification document URL is required", 400);

    const user = await User.findById(req.userId);
    if (user.isProfileVerified) return error(res, "Already verified", 400);

    user.verificationDocument = documentUrl;
    user.verificationStatus = "approved";
    user.isProfileVerified = true;
    user.canPostContent = true;
    user.verificationBadge = "gold";
    user.verificationSubmittedAt = new Date();
    await user.save();

    return success(res, { user }, "Verification request submitted and instantly approved! Gold Badge granted.");
  } catch (err) {
    return error(res, "Error submitting verification", 500, err.message);
  }
});

// ──────────────────────────────────────────────
// GET /users/saved-posts  — Get My Saved Posts
// ──────────────────────────────────────────────
router.get("/me/saved-posts", verifyToken, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const user = await User.findById(req.userId).select("savedPosts");
    const total = user.savedPosts.length;

    const posts = await Post.find({ _id: { $in: user.savedPosts } })
      .populate("author", "firstName lastName profilePicture verificationBadge")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    return paginated(res, posts, total, page, limit, "Saved posts retrieved");
  } catch (err) {
    return error(res, "Error fetching saved posts", 500, err.message);
  }
});

// ──────────────────────────────────────────────
// GET /users/me/followers  — My Followers
// ──────────────────────────────────────────────
router.get("/me/followers", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .populate("followers", "firstName lastName profilePicture verificationBadge city followerCount")
      .select("followers followerCount");
    return success(res, { followers: user.followers, count: user.followerCount }, "Followers retrieved");
  } catch (err) {
    return error(res, "Error fetching followers", 500, err.message);
  }
});

// ──────────────────────────────────────────────
// GET /users/me/following
// ──────────────────────────────────────────────
router.get("/me/following", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .populate("following", "firstName lastName profilePicture verificationBadge city followerCount")
      .select("following followingCount");
    return success(res, { following: user.following, count: user.followingCount }, "Following retrieved");
  } catch (err) {
    return error(res, "Error fetching following", 500, err.message);
  }
});

// ──────────────────────────────────────────────
// ADMIN — GET /users/admin/pending-verifications
// ──────────────────────────────────────────────
router.get("/admin/pending-verifications", verifyAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [users, total] = await Promise.all([
      User.find({ verificationStatus: "submitted" })
        .sort({ verificationSubmittedAt: 1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select("firstName lastName email phone verificationDocument verificationSubmittedAt city"),
      User.countDocuments({ verificationStatus: "submitted" }),
    ]);

    return paginated(res, users, total, page, limit, "Pending verifications retrieved");
  } catch (err) {
    return error(res, "Error fetching pending verifications", 500, err.message);
  }
});

// ──────────────────────────────────────────────
// ADMIN — PUT /users/admin/verify/:userId
// ──────────────────────────────────────────────
router.put("/admin/verify/:userId", verifyAdmin, async (req, res) => {
  try {
    const { action, rejectReason, badge = "bronze" } = req.body;
    if (!["approve", "reject"].includes(action)) return error(res, "Action must be approve or reject", 400);

    const user = await User.findById(req.params.userId);
    if (!user) return notFound(res, "User");

    if (action === "approve") {
      user.verificationStatus = "approved";
      user.isProfileVerified = true;
      user.canPostContent = true;
      user.verificationBadge = badge;
      user.verificationReviewedBy = req.userId;

      await Notification.create({
        recipient: user._id,
        sender: req.userId,
        type: "verification_approved",
        title: "Verification Approved! 🎉",
        message: "Your profile has been verified. You can now post content in the community!",
        link: "/community/create",
      });
    } else {
      user.verificationStatus = "rejected";
      user.verificationRejectReason = rejectReason;
      user.verificationReviewedBy = req.userId;

      await Notification.create({
        recipient: user._id,
        sender: req.userId,
        type: "verification_rejected",
        title: "Verification Update",
        message: `Your verification was not approved. Reason: ${rejectReason || "Does not meet requirements"}`,
        link: "/profile/verify",
      });
    }

    await user.save();
    return success(res, { user }, `User verification ${action}d successfully`);
  } catch (err) {
    return error(res, "Error processing verification", 500, err.message);
  }
});

// ──────────────────────────────────────────────
// ADMIN — GET /users/admin/all
// ──────────────────────────────────────────────
router.get("/admin/all", verifyAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, role, isBanned, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = {};
    if (role) filter.role = role;
    if (isBanned !== undefined) filter.isBanned = isBanned === "true";
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select("-password"),
      User.countDocuments(filter),
    ]);

    return paginated(res, users, total, page, limit, "Users retrieved");
  } catch (err) {
    return error(res, "Error fetching users", 500, err.message);
  }
});

module.exports = router;
