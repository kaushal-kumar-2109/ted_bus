const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();

// ─────────────────────────────────────────────
// Security & Performance Middleware
// ─────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));
app.use(compression());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// ─────────────────────────────────────────────
// CORS
// ─────────────────────────────────────────────
const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:4200").split(",");
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
      callback(null, true);
    } else {
      callback(new Error(`CORS policy: ${origin} not allowed`));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// ─────────────────────────────────────────────
// Body Parser
// ─────────────────────────────────────────────
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// ─────────────────────────────────────────────
// General Rate Limiter
// ─────────────────────────────────────────────
const { generalLimiter } = require("./middleware/rateLimiter");
app.use("/api", generalLimiter);

// ─────────────────────────────────────────────
// MongoDB Connection
// ─────────────────────────────────────────────
const mongoUri = process.env.MONGODB_URI_SRV || process.env.MONGODB_URI;
mongoose
  .connect(mongoUri)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  });

// ─────────────────────────────────────────────
// API Routes
// ─────────────────────────────────────────────
const apiVersion = process.env.API_VERSION || "v1";
const base = `/api/${apiVersion}`;

// Auth & User Management
app.use(`${base}/auth`, require("./routes/auth"));
app.use(`${base}/users`, require("./routes/users"));

// Bus & Booking
app.use(`${base}/buses`, require("./routes/buses"));
app.use(`${base}/bookings`, require("./routes/booking"));
app.use(`${base}/operators`, require("./routes/operators"));

// Community
app.use(`${base}/posts`, require("./routes/posts"));
app.use(`${base}/comments`, require("./routes/comments"));
app.use(`${base}/forums`, require("./routes/forums"));
app.use(`${base}/threads`, require("./routes/threads"));
app.use(`${base}/reviews`, require("./routes/reviews"));

// Notifications & Social
app.use(`${base}/notifications`, require("./routes/notifications"));
app.use(`${base}/social`, require("./routes/social"));

// Moderation (Admin / Moderator)
app.use(`${base}/moderation`, require("./routes/moderation"));

// ─────────────────────────────────────────────
// Legacy Compatibility Routes (For Existing Frontend)
// ─────────────────────────────────────────────
app.use("/", require("./routes/route"));
app.use("/", require("./routes/customer"));
app.use("/booking", require("./routes/bookingLegacy"));

// ─────────────────────────────────────────────
// Health & Info Endpoints
// ─────────────────────────────────────────────
app.get("/health", (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const statusMap = { 0: "disconnected", 1: "connected", 2: "connecting", 3: "disconnecting" };
  res.status(200).json({
    success: true,
    message: "🚀 RedBus Clone API is running",
    status: "operational",
    version: "2.0.0",
    apiVersion,
    database: statusMap[dbStatus] || "unknown",
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())}s`,
  });
});

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to RedBus Clone — Professional Bus Booking Platform",
    version: "2.0.0",
    description: "A comprehensive bus booking platform with community features",
    endpoints: {
      auth: `${base}/auth`,
      users: `${base}/users`,
      buses: `${base}/buses`,
      bookings: `${base}/bookings`,
      posts: `${base}/posts`,
      forums: `${base}/forums`,
      threads: `${base}/threads`,
      comments: `${base}/comments`,
      reviews: `${base}/reviews`,
      notifications: `${base}/notifications`,
      social: `${base}/social`,
      moderation: `${base}/moderation`,
    },
    health: "/health",
    docs: "/api-docs",
  });
});

// ─────────────────────────────────────────────
// Global Error Handler
// ─────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("🔴 Unhandled error:", err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
    hint: "Check GET / for available endpoints",
  });
});

// ─────────────────────────────────────────────
// Server Startup
// ─────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || "0.0.0.0";

const server = app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║        RedBus Clone — Professional Bus Booking API       ║
║                       Version 2.0.0                      ║
╚══════════════════════════════════════════════════════════╝

🚀  Server  →  http://localhost:${PORT}
📊  Mode    →  ${process.env.NODE_ENV || "development"}
📅  Time    →  ${new Date().toLocaleString()}

Available API Endpoints (${base}):
  🔐  Auth         →  POST ${base}/auth/register
  🚌  Buses        →  GET  ${base}/buses
  🏙️  Cities       →  GET  ${base}/buses/cities
  🔍  Search       →  POST ${base}/buses/search
  🎫  Bookings     →  POST ${base}/bookings
  📝  Posts        →  GET  ${base}/posts
  💬  Forums       →  GET  ${base}/forums
  🔔  Notifications→  GET  ${base}/notifications
  📢  Social       →  GET  ${base}/social/share-links/:id
  🛡️  Moderation   →  POST ${base}/moderation/report
  🏥  Health       →  GET  /health
  `);
});

// ─────────────────────────────────────────────
// Graceful Shutdown
// ─────────────────────────────────────────────
const gracefulShutdown = (signal) => {
  console.log(`\n⚠️  ${signal} received. Shutting down gracefully...`);
  server.close(() => {
    mongoose.connection.close(false, () => {
      console.log("✅ MongoDB disconnected. Server closed.");
      process.exit(0);
    });
  });
  setTimeout(() => {
    console.error("❌ Forced shutdown after timeout.");
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("unhandledRejection", (reason) => {
  console.error("⚠️  Unhandled Rejection:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("💥 Uncaught Exception:", err.message);
  process.exit(1);
});

module.exports = app;
