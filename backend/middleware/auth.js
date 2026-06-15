const jwt = require("jsonwebtoken");
const User = require("../models/customer");

const JWT_SECRET = process.env.JWT_SECRET || "redbus_jwt_secret_change_in_production";

/**
 * Verify JWT token — attaches req.userId and req.user
 */
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await User.findById(decoded.userId).select(
      "-password -loginAttempts -lockUntil"
    );

    if (!user) {
      return res.status(401).json({ success: false, message: "User not found." });
    }

    if (user.isBanned) {
      return res.status(403).json({
        success: false,
        message: "Your account has been suspended.",
        reason: user.banReason,
      });
    }

    req.userId = decoded.userId;
    req.user = user;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Token expired. Please log in again." });
    }
    return res.status(401).json({ success: false, message: "Invalid token." });
  }
};

/**
 * Verify Admin role — must be used after verifyToken
 */
const verifyAdmin = [
  verifyToken,
  (req, res, next) => {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin privileges required.",
      });
    }
    next();
  },
];

/**
 * Verify Moderator or Admin role
 */
const verifyModerator = [
  verifyToken,
  (req, res, next) => {
    if (!["admin", "moderator"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Moderator privileges required.",
      });
    }
    next();
  },
];

/**
 * Verify that user is allowed to post (verified users only)
 */
const verifyCanPost = [
  verifyToken,
  (req, res, next) => {
    if (!req.user.canPostContent && req.user.role === "user") {
      return res.status(403).json({
        success: false,
        message: "Only verified users can post content.",
        verificationStatus: req.user.verificationStatus,
        hint: "Submit a verification request via POST /api/v1/users/verify-request",
      });
    }
    next();
  },
];

module.exports = { verifyToken, verifyAdmin, verifyModerator, verifyCanPost };
