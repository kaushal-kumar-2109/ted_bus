const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const bookingSchema = new Schema(
  {
    // Booking Reference
    bookingId: {
      type: String,
      unique: true,
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Bus & Route Information
    bus: {
      type: Schema.Types.ObjectId,
      ref: "Bus",
      required: true,
    },
    operator: {
      type: Schema.Types.ObjectId,
      ref: "BusOperator",
      required: true,
    },

    // Journey Details
    source: {
      city: String,
      state: String,
    },
    destination: {
      city: String,
      state: String,
    },
    journeyDate: {
      type: Date,
      required: true,
    },
    departureTime: String,
    arrivalTime: String,

    // Passenger Details
    passengers: [
      {
        name: { type: String, required: true },
        email: { type: String, required: true },
        phone: { type: String, required: true },
        gender: { type: String, required: true },
        age: { type: Number, required: true },
        idType: String,
        idNumber: String,
        emergencyContact: String,
      },
    ],

    // Seat Information
    seats: {
      type: [String], // Seat numbers like ["1A", "1B"]
      required: true,
    },
    seatsCount: {
      type: Number,
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
    discount: {
      type: Number,
      default: 0,
    },
    couponCode: String,
    totalFare: {
      type: Number,
      required: true,
    },

    // Additional Services
    insurance: {
      included: Boolean,
      amount: Number,
    },
    meals: {
      included: Boolean,
      type: String,
    },
    cancellationProtection: {
      included: Boolean,
      amount: Number,
    },

    // Business Travel
    isBusinessTravel: {
      type: Boolean,
      default: false,
    },
    businessDetails: {
      companyName: String,
      gstNumber: String,
      address: String,
      email: String,
    },

    // Contact Information
    primaryContact: {
      name: String,
      email: String,
      phone: String,
    },

    // Payment Information
    paymentMethod: {
      type: String,
      enum: ["credit-card", "debit-card", "upi", "net-banking", "wallet"],
      required: true,
    },
    transactionId: String,
    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending",
    },

    // Booking Status
    bookingStatus: {
      type: String,
      enum: ["confirmed", "pending", "cancelled", "completed"],
      default: "pending",
    },
    cancellationReason: String,
    cancellationDate: Date,
    refundAmount: Number,
    refundStatus: {
      type: String,
      enum: ["pending", "processed", "rejected"],
    },

    // Boarding Pass
    boardingPass: {
      generated: Boolean,
      generatedAt: Date,
      scanned: Boolean,
      scannedAt: Date,
    },

    // Communication
    confirmationSent: Boolean,
    remindersSet: [
      {
        type: String,
        enum: ["24-hours", "12-hours", "2-hours"],
      },
    ],

    // Review & Rating
    review: {
      type: Schema.Types.ObjectId,
      ref: "Review",
    },
    hasReviewed: {
      type: Boolean,
      default: false,
    },
    reviewRating: Number,

    // Cancellation Policy
    cancellationPolicy: {
      canCancel: Boolean,
      cancellationDeadline: Date,
      refundPercentage: Number,
    },

    // Tracking
    liveLocationSharing: {
      type: Boolean,
      default: false,
    },
    gpsTracking: {
      enabled: Boolean,
      currentLocation: {
        type: {
          type: String,
          enum: ["Point"],
          default: "Point",
        },
        coordinates: {
          type: [Number], // [longitude, latitude]
        },
      },
    },

    // Metadata
    metadata: {
      type: {
        type: String,
        default: "bus"
      },
      isCovidDonated: Boolean,
      duration: String
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
bookingSchema.index({ user: 1, createdAt: -1 });
bookingSchema.index({ bus: 1, journeyDate: 1 });
bookingSchema.index({ bookingStatus: 1 });
bookingSchema.index({ bookingId: 1 });

module.exports = mongoose.model("Booking", bookingSchema);