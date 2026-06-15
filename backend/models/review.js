const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const reviewSchema = new Schema(
  {
    bus: {
      type: Schema.Types.ObjectId,
      ref: "Bus",
      required: true,
    },
    booking: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userName: String,

    // Review Content
    title: {
      type: String,
      maxlength: 200,
    },
    description: {
      type: String,
      maxlength: 2000,
    },

    // Ratings
    overallRating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    driverRating: {
      type: Number,
      min: 1,
      max: 5,
    },
    comfortRating: {
      type: Number,
      min: 1,
      max: 5,
    },
    cleanlinessRating: {
      type: Number,
      min: 1,
      max: 5,
    },
    safetyRating: {
      type: Number,
      min: 1,
      max: 5,
    },

    // Aspects
    aspects: {
      driverBehavior: Boolean,
      busCondition: Boolean,
      comfort: Boolean,
      cleanliness: Boolean,
      safety: Boolean,
      amenities: Boolean,
      punctuality: Boolean,
    },

    // Media
    images: [String],
    videos: [String],

    // Engagement
    helpful: {
      type: Number,
      default: 0,
    },
    unhelpful: {
      type: Number,
      default: 0,
    },

    // Status
    isVerified: {
      type: Boolean,
      default: true,
    },
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

reviewSchema.index({ bus: 1, overallRating: -1 });
reviewSchema.index({ user: 1 });
reviewSchema.index({ booking: 1 });

module.exports = mongoose.model("Review", reviewSchema);
