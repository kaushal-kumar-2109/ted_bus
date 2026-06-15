const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const threadReplySchema = new Schema(
  {
    thread: {
      type: Schema.Types.ObjectId,
      ref: "Thread",
      required: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    authorName: String,

    // Content
    content: {
      type: String,
      required: true,
      maxlength: 3000,
    },

    // Media
    attachments: [
      {
        url: String,
        type: String, // image, document, etc.
      },
    ],

    // Engagement
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

threadReplySchema.index({ thread: 1, createdAt: 1 });
threadReplySchema.index({ author: 1 });

module.exports = mongoose.model("ThreadReply", threadReplySchema);
