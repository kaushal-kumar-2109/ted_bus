const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const notificationSchema = new Schema(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    type: {
      type: String,
      enum: [
        "like_post",
        "comment_post",
        "reply_comment",
        "follow",
        "mention",
        "verification_approved",
        "verification_rejected",
        "post_featured",
        "content_moderated",
        "booking_confirmed",
        "booking_cancelled",
        "system",
      ],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: { type: String }, // e.g. /posts/:id
    entityType: {
      type: String,
      enum: ["post", "comment", "user", "booking", "thread", "forum", null],
    },
    entityId: { type: Schema.Types.ObjectId },
    isRead: { type: Boolean, default: false, index: true },
    readAt: { type: Date },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

// Compound index for user's unread notifications
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

// Auto-expire notifications after 90 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

module.exports = mongoose.model("Notification", notificationSchema);
