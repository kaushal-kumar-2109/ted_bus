const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const postSchema = new Schema(
  {
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    authorName: { type: String, required: true },
    authorAvatar: String,

    // Content
    title: { type: String, required: true, maxlength: 200, trim: true },
    content: { type: String, required: true, maxlength: 10000 },
    excerpt: { type: String, maxlength: 300 }, // auto-generated
    readTime: { type: Number, default: 1 }, // minutes
    category: {
      type: String,
      enum: ["travel-story", "travel-tips", "destination-review", "route-review", "general", "announcement"],
      required: true,
      get: function(val) {
        const categoryMap = {
          "travel-story": "Journey Story",
          "travel-tips": "Travel Tip",
          "route-review": "Route Advice",
          "destination-review": "Destination Guide"
        };
        return categoryMap[val] || val;
      },
      set: function(val) {
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
        return categoryMap[val] || val;
      }
    },

    // Media
    coverImage: { url: String, caption: String },
    images: [{ url: String, caption: String }],
    videos: [{ url: String, caption: String }],

    // Tags & Associations
    tags: [{ type: String, lowercase: true, trim: true }],
    destinations: [String],
    routes: [String],
    mentionedBuses: [{ type: Schema.Types.ObjectId, ref: "Bus" }],

    // Engagement
    likes: [{ type: Schema.Types.ObjectId, ref: "User" }],
    likesCount: { type: Number, default: 0, index: true },
    comments: [{ type: Schema.Types.ObjectId, ref: "Comment" }],
    commentsCount: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    savedBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
    savedCount: { type: Number, default: 0 },
    trendingScore: { type: Number, default: 0, index: true },

    // Social share links (generated on creation)
    socialShareLinks: {
      twitter: String,
      facebook: String,
      whatsapp: String,
      linkedin: String,
    },

    // Status
    isPublished: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    isReported: { type: Boolean, default: false },
    reportCount: { type: Number, default: 0 },
    isApproved: { type: Boolean, default: true },
    moderationStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "approved",
    },
    rejectionReason: String,
  },
  { timestamps: true, toJSON: { getters: true }, toObject: { getters: true } }
);

// Indexes
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ category: 1 });
postSchema.index({ isFeatured: 1, isPublished: 1, createdAt: -1 });
postSchema.index({ trendingScore: -1 });
postSchema.index({ tags: 1 });
postSchema.index({ destinations: 1 });

// Compute excerpt and readTime before save
postSchema.pre("save", function (next) {
  if (this.isModified("content")) {
    this.excerpt = this.content.replace(/<[^>]*>/g, "").slice(0, 280) + "...";
    const wordCount = this.content.split(/\s+/).length;
    this.readTime = Math.max(1, Math.ceil(wordCount / 200));
  }
  // Update trending score
  this.trendingScore =
    this.likesCount * 1 +
    this.commentsCount * 2 +
    this.shares * 3 +
    Math.floor(this.views * 0.1);
  next();
});

module.exports = mongoose.model("Post", postSchema);
