const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const forumSchema = new Schema(
  {
    // Forum Information
    title: {
      type: String,
      required: true,
      unique: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
      maxlength: 1000,
    },
    icon: String,
    category: {
      type: String,
      enum: ["routes", "destinations", "travel-advice", "tips", "general"],
      required: true,
    },

    // Moderators
    moderators: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // Content
    threads: [
      {
        type: Schema.Types.ObjectId,
        ref: "Thread",
      },
    ],
    threadsCount: {
      type: Number,
      default: 0,
    },
    postsCount: {
      type: Number,
      default: 0,
    },

    // Statistics
    subscribers: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    subscribersCount: {
      type: Number,
      default: 0,
    },
    lastActivity: Date,

    // Rules
    rules: [String],

    // Status
    isActive: {
      type: Boolean,
      default: true,
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

forumSchema.index({ category: 1 });
forumSchema.index({ slug: 1 });

module.exports = mongoose.model("Forum", forumSchema);
