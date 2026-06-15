const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const busSchema = new Schema(
  {
    // Bus Information
    busName: {
      type: String,
      required: true,
    },
    busNumber: {
      type: String,
      required: true,
      unique: true,
    },
    operatorId: {
      type: Schema.Types.ObjectId,
      ref: "BusOperator",
      required: true,
    },
    operatorName: {
      type: String,
      required: true,
    },

    // Bus Type & Configuration
    busType: {
      type: String,
      enum: ["AC", "Non-AC", "Sleeper", "Semi-Sleeper", "Luxury", "Premium"],
      required: true,
    },
    seatingCapacity: {
      type: Number,
      required: true,
      default: 50,
    },
    availableSeats: {
      type: Number,
      required: true,
    },
    seatLayout: {
      type: {
        rows: Number,
        columns: Number,
      },
      required: true,
    },

    // Route Information
    source: {
      city: String,
      state: String,
      coordinates: {
        latitude: Number,
        longitude: Number,
      },
    },
    destination: {
      city: String,
      state: String,
      coordinates: {
        latitude: Number,
        longitude: Number,
      },
    },
    intermediateStops: [
      {
        stopName: String,
        city: String,
        arrivalTime: String,
        departureTime: String,
        coordinates: {
          latitude: Number,
          longitude: Number,
        },
      },
    ],

    // Journey Details
    departureTime: {
      type: String, // Format: "14:30"
      required: true,
    },
    arrivalTime: {
      type: String, // Format: "22:30"
      required: true,
    },
    duration: {
      type: String, // Format: "8h 30m"
      required: true,
    },
    distance: {
      type: Number, // in kilometers
      required: true,
    },

    // Schedule
    operatesOn: {
      type: [String], // ["Monday", "Tuesday", "Wednesday", ...]
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },

    // Pricing
    baseFare: {
      type: Number,
      required: true,
    },
    taxes: {
      type: Number,
      default: 0,
    },
    totalFare: {
      type: Number,
      required: true,
    },
    discountPercentage: {
      type: Number,
      default: 0,
    },
    farePercentageChange: {
      type: Number,
      default: 0,
    },

    // Amenities
    amenities: {
      wifi: { type: Boolean, default: false },
      charging: { type: Boolean, default: false },
      blanket: { type: Boolean, default: false },
      pillow: { type: Boolean, default: false },
      monitor: { type: Boolean, default: false },
      waterBottle: { type: Boolean, default: false },
      readingLight: { type: Boolean, default: false },
      powerPlug: { type: Boolean, default: false },
      ac: { type: Boolean, default: true },
      microphone: { type: Boolean, default: false },
      sleeper: { type: Boolean, default: false },
    },

    // Features
    features: {
      liveTracking: { type: Boolean, default: true },
      reschedulable: { type: Boolean, default: true },
      cancellable: { type: Boolean, default: true },
    },

    // Ratings & Reviews
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    reviews: [
      {
        type: Schema.Types.ObjectId,
        ref: "Review",
      },
    ],

    // Media
    images: [
      {
        url: String,
        caption: String,
      },
    ],

    // Seat Management
    seatMatrix: {
      type: Map,
      of: {
        status: {
          type: String,
          enum: ["available", "booked", "blocked"],
          default: "available",
        },
        booking: {
          type: Schema.Types.ObjectId,
          ref: "Booking",
          default: null,
        },
      },
    },

    // Booking Restrictions
    minAge: {
      type: Number,
      default: 0,
    },
    maxAge: {
      type: Number,
      default: 100,
    },

    // Status
    isActive: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
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

// Index for better query performance
busSchema.index({ source: 1, destination: 1, departureTime: 1 });
busSchema.index({ operatorId: 1 });
busSchema.index({ startDate: 1, endDate: 1 });

module.exports = mongoose.model("Bus", busSchema);


