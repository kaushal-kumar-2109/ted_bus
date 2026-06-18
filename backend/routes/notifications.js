const express = require("express");
const router = express.Router();
const Notification = require("../models/notification");
const { verifyToken } = require("../middleware/auth");
const { success, error, paginated } = require("../utils/apiResponse");

// ──────────────────────────────────────────────
// GET /notifications  — My Notifications
// ──────────────────────────────────────────────
router.get("/", verifyToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = { recipient: req.userId };
    if (unreadOnly === "true") filter.isRead = false;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter)
        .populate("sender", "firstName lastName profilePicture")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Notification.countDocuments(filter),
      Notification.countDocuments({ recipient: req.userId, isRead: false }),
    ]);

    return res.status(200).json({
      success: true,
      message: "Notifications retrieved",
      data: notifications,
      unreadCount,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    return error(res, "Error fetching notifications", 500, err.message);
  }
});

// ──────────────────────────────────────────────
// GET /notifications/unread-count
// ──────────────────────────────────────────────
router.get("/unread-count", verifyToken, async (req, res) => {
  try {
    const count = await Notification.countDocuments({ recipient: req.userId, isRead: false });
    return success(res, { unreadCount: count }, "Unread count retrieved");
  } catch (err) {
    return error(res, "Error fetching unread count", 500, err.message);
  }
});

// ──────────────────────────────────────────────
// PUT /notifications/read-all
// ──────────────────────────────────────────────
router.put("/read-all", verifyToken, async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { recipient: req.userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );
    return success(res, { updated: result.modifiedCount }, "All notifications marked as read");
  } catch (err) {
    return error(res, "Error marking notifications read", 500, err.message);
  }
});

// ──────────────────────────────────────────────
// PUT /notifications/:id/read
// ──────────────────────────────────────────────
router.put("/:id/read", verifyToken, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.userId },
      { isRead: true, readAt: new Date() },
      { new: true }
    );
    if (!notification) return error(res, "Notification not found", 404);
    return success(res, { notification }, "Notification marked as read");
  } catch (err) {
    return error(res, "Error updating notification", 500, err.message);
  }
});

// ──────────────────────────────────────────────
// DELETE /notifications/clear-all
// ──────────────────────────────────────────────
router.delete("/clear-all", verifyToken, async (req, res) => {
  try {
    const result = await Notification.deleteMany({ recipient: req.userId });
    return success(res, { deleted: result.deletedCount }, "All notifications cleared");
  } catch (err) {
    return error(res, "Error clearing notifications", 500, err.message);
  }
});

// ──────────────────────────────────────────────
// DELETE /notifications/:id
// ──────────────────────────────────────────────
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    await Notification.findOneAndDelete({ _id: req.params.id, recipient: req.userId });
    return success(res, {}, "Notification deleted");
  } catch (err) {
    return error(res, "Error deleting notification", 500, err.message);
  }
});

module.exports = router;
