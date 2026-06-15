const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    // Basic Information
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, unique: true },
    password: { type: String, required: true, minlength: 6, select: false },

    // Role
    role: {
      type: String,
      enum: ["user", "moderator", "admin"],
      default: "user",
    },

    // Profile
    profilePicture: { type: String, default: null },
    coverImage: { type: String, default: null },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ["male", "female", "other"] },
    bio: { type: String, maxlength: 500, default: "" },
    city: { type: String },
    state: { type: String },
    country: { type: String, default: "India" },

    // Verification & Security
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String, select: false },
    emailVerificationExpire: { type: Date, select: false },
    isPhoneVerified: { type: Boolean, default: false },
    isProfileVerified: { type: Boolean, default: false },
    verificationBadge: {
      type: String,
      enum: ["none", "bronze", "silver", "gold"],
      default: "none",
    },
    verificationDocument: { type: String, default: null },
    verificationStatus: {
      type: String,
      enum: ["pending", "submitted", "approved", "rejected"],
      default: "pending",
    },
    verificationSubmittedAt: { type: Date },
    verificationReviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
    verificationRejectReason: { type: String },

    // Password Reset
    passwordResetToken: { type: String, select: false },
    passwordResetExpire: { type: Date, select: false },

    // Brute-force protection
    loginAttempts: { type: Number, default: 0, select: false },
    lockUntil: { type: Date, select: false },

    // Community
    canPostContent: { type: Boolean, default: false },
    totalPosts: { type: Number, default: 0 },
    totalComments: { type: Number, default: 0 },
    followers: [{ type: Schema.Types.ObjectId, ref: "User" }],
    following: [{ type: Schema.Types.ObjectId, ref: "User" }],
    followerCount: { type: Number, default: 0 },
    followingCount: { type: Number, default: 0 },
    savedPosts: [{ type: Schema.Types.ObjectId, ref: "Post" }],

    // Social Links
    socialLinks: {
      facebook: { type: String, default: "" },
      twitter: { type: String, default: "" },
      instagram: { type: String, default: "" },
      linkedin: { type: String, default: "" },
    },

    // Account Status
    isActive: { type: Boolean, default: true },
    isBanned: { type: Boolean, default: false },
    banReason: { type: String, default: null },
    bannedAt: { type: Date },

    // Preferences
    notifications: {
      emailNotifications: { type: Boolean, default: true },
      postNotifications: { type: Boolean, default: true },
      commentNotifications: { type: Boolean, default: true },
      followNotifications: { type: Boolean, default: true },
      bookingNotifications: { type: Boolean, default: true },
    },

    // Timestamps
    lastLogin: Date,
  },
  { timestamps: true }
);

// ──────────────────────────────────────────────
// Indexes
// ──────────────────────────────────────────────
userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ role: 1 });
userSchema.index({ verificationStatus: 1 });

// ──────────────────────────────────────────────
// Hooks
// ──────────────────────────────────────────────
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// ──────────────────────────────────────────────
// Methods
// ──────────────────────────────────────────────
userSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.isLocked = function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

userSchema.methods.incrementLoginAttempts = async function () {
  // Reset lock after it expires
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({ $set: { loginAttempts: 1 }, $unset: { lockUntil: 1 } });
  }
  const updates = { $inc: { loginAttempts: 1 } };
  if (this.loginAttempts + 1 >= 5 && !this.isLocked()) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // lock 2 hours
  }
  return this.updateOne(updates);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.loginAttempts;
  delete obj.lockUntil;
  delete obj.emailVerificationToken;
  delete obj.emailVerificationExpire;
  delete obj.passwordResetToken;
  delete obj.passwordResetExpire;
  return obj;
};

userSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

module.exports = mongoose.model("User", userSchema);