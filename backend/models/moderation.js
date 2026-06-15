const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const contentModerationSchema = new Schema(
  {
    // Content Information
    contentType: {
      type: String,
      enum: ["post", "comment", "thread", "threadReply", "user"],
      required: true,
    },
    contentId: {
      type: Schema.Types.ObjectId,
      required: true,
    },

    // Reporter
    reportedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Report Details
    reason: {
      type: String,
      enum: [
        "inappropriate-content",
        "harassment",
        "spam",
        "offensive-language",
        "misinformation",
        "copyright-violation",
        "other",
      ],
      required: true,
    },
    description: {
      type: String,
      maxlength: 1000,
    },
    reportedAt: {
      type: Date,
      default: Date.now,
    },

    // Moderation Action
    status: {
      type: String,
      enum: ["pending", "reviewed", "approved", "rejected"],
      default: "pending",
    },
    moderationAction: {
      type: String,
      enum: ["none", "warning", "remove-content", "suspend-user", "ban-user"],
      default: "none",
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    reviewedAt: Date,
    reviewNotes: String,

    // User Action
    userNotified: {
      type: Boolean,
      default: false,
    },
    userNotificationMessage: String,

    // Timestamps
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

contentModerationSchema.index({ status: 1, createdAt: -1 });
contentModerationSchema.index({ reportedBy: 1 });
contentModerationSchema.index({ contentType: 1, contentId: 1 });

module.exports = mongoose.model("ContentModeration", contentModerationSchema);
