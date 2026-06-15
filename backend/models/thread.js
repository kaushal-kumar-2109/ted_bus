const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const threadSchema = new Schema(
  {
    forum: {
      type: Schema.Types.ObjectId,
      ref: "Forum",
      required: true,
    },

    // Thread Information
    title: {
      type: String,
      required: true,
      maxlength: 300,
    },
    content: {
      type: String,
      required: true,
    },

    // Author
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    authorName: String,

    // Tags & Categorization
    tags: [String],
    isPinned: {
      type: Boolean,
      default: false,
    },
    isLocked: {
      type: Boolean,
      default: false,
    },

    // Engagement
    replies: [
      {
        type: Schema.Types.ObjectId,
        ref: "ThreadReply",
      },
    ],
    repliesCount: {
      type: Number,
      default: 0,
    },
    views: {
      type: Number,
      default: 0,
    },
    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    likesCount: {
      type: Number,
      default: 0,
    },

    // Moderation
    isApproved: {
      type: Boolean,
      default: true,
    },
    isReported: {
      type: Boolean,
      default: false,
    },

    // Activity
    lastReplyAt: Date,
    lastReplyBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

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

threadSchema.index({ forum: 1, isPinned: -1, createdAt: -1 });
threadSchema.index({ author: 1 });
threadSchema.index({ views: -1 });

module.exports = mongoose.model("Thread", threadSchema);
