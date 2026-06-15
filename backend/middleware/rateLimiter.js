const rateLimit = require("express-rate-limit");

const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW || "15") * 60 * 1000;

/** General API rate limit */
const generalLimiter = rateLimit({
  windowMs,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "200"),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});

/** Strict limiter for auth endpoints */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many login attempts. Please try again in 15 minutes.",
  },
});

/** Post creation limiter */
const postLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Post limit reached. You can create at most 10 posts per hour.",
  },
});

/** Search limiter */
const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many search requests. Please slow down.",
  },
});

module.exports = { generalLimiter, authLimiter, postLimiter, searchLimiter };
