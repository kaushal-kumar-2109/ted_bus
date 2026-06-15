const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const busOperatorSchema = new Schema(
  {
    // Operator Information
    operatorName: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    phone: {
      type: String,
      required: true,
    },
    website: String,

    // Address
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
    },

    // Registration
    registrationNumber: {
      type: String,
      required: true,
      unique: true,
    },
    licenseNumber: {
      type: String,
      required: true,
    },
    gstNumber: String,
    panNumber: String,

    // Business Information
    establishedDate: Date,
    operatorType: {
      type: String,
      enum: ["individual", "company", "franchise"],
      required: true,
    },
    totalFleet: {
      type: Number,
      default: 0,
    },

    // Logo & Branding
    logo: String,
    bannerImage: String,
    description: String,

    // Contact Information
    contactPerson: String,
    designatedEmail: String,

    // Verification
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    verificationDocuments: [String],

    // Statistics
    totalBuses: {
      type: Number,
      default: 0,
    },
    totalBookings: {
      type: Number,
      default: 0,
    },
    averageRating: {
      type: Number,
      default: 0,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },

    // Buses
    buses: [
      {
        type: Schema.Types.ObjectId,
        ref: "Bus",
      },
    ],

    // Status
    isActive: {
      type: Boolean,
      default: true,
    },
    isBanned: {
      type: Boolean,
      default: false,
    },
    banReason: String,

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

busOperatorSchema.index({ operatorName: 1 });
busOperatorSchema.index({ isVerified: 1 });
busOperatorSchema.index({ averageRating: -1 });

module.exports = mongoose.model("BusOperator", busOperatorSchema);
