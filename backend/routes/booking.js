const express = require("express");
const router = express.Router();
const Booking = require("../models/booking");
const Bus = require("../models/bus");
const User = require("../models/customer");

// Middleware
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token provided" });
  try {
    const jwt = require("jsonwebtoken");
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your_jwt_secret"
    );
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};

// Create Booking
router.post("/", verifyToken, async (req, res) => {
  try {
    const {
      busId,
      journeyDate,
      passengers,
      seats,
      paymentMethod,
      businessDetails,
      insurance,
      meals,
    } = req.body;

    if (!busId || !journeyDate || !passengers || !seats) {
      return res.status(400).json({
        message: "Bus, date, passengers, and seats are required",
      });
    }

    const bus = await Bus.findById(busId);
    if (!bus) {
      return res.status(404).json({ message: "Bus not found" });
    }

    const user = await User.findById(req.userId);

    // Generate booking ID
    const bookingId = `RB${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    // Calculate fare
    let totalFare = bus.totalFare * seats.length;
    if (insurance) totalFare += insurance.amount || 0;

    const booking = new Booking({
      bookingId,
      user: req.userId,
      bus: busId,
      operator: bus.operatorId,
      source: bus.source,
      destination: bus.destination,
      journeyDate,
      departureTime: bus.departureTime,
      arrivalTime: bus.arrivalTime,
      passengers,
      seats,
      seatsCount: seats.length,
      baseFare: bus.baseFare,
      taxes: bus.taxes,
      totalFare,
      paymentMethod,
      paymentStatus: "pending",
      bookingStatus: "pending",
      businessDetails: businessDetails || null,
      insurance: insurance || null,
      meals: meals || null,
      primaryContact: {
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        phone: user.phone,
      },
    });

    await booking.save();

    // Update bus availability
    bus.availableSeats -= seats.length;
    await bus.save();

    res.status(201).json({
      message: "Booking created successfully",
      booking,
      bookingId,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error creating booking",
      error: error.message,
    });
  }
});

// Get User Bookings
router.get("/user/my-bookings", verifyToken, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const bookings = await Booking.find({ user: req.userId })
      .populate("bus")
      .populate("operator")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Booking.countDocuments({ user: req.userId });

    res.status(200).json({
      message: "User bookings retrieved",
      bookings,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching bookings",
      error: error.message,
    });
  }
});

// Get Booking by ID
router.get("/:bookingId", async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId)
      .populate("user")
      .populate("bus")
      .populate("operator")
      .populate("review");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.status(200).json({
      message: "Booking retrieved successfully",
      booking,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching booking",
      error: error.message,
    });
  }
});

// Update Booking Status
router.put("/:bookingId/status", async (req, res) => {
  try {
    const { status } = req.body;

    if (!status || !["confirmed", "pending", "cancelled", "completed"].includes(status)) {
      return res.status(400).json({ message: "Valid status is required" });
    }

    const booking = await Booking.findByIdAndUpdate(
      req.params.bookingId,
      { bookingStatus: status, updatedAt: new Date() },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.status(200).json({
      message: "Booking status updated",
      booking,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating booking",
      error: error.message,
    });
  }
});

// Cancel Booking
router.post("/:bookingId/cancel", verifyToken, async (req, res) => {
  try {
    const { reason } = req.body;
    const booking = await Booking.findById(req.params.bookingId);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.user.toString() !== req.userId) {
      return res.status(403).json({
        message: "You can only cancel your own bookings",
      });
    }

    if (booking.bookingStatus === "cancelled") {
      return res.status(400).json({
        message: "Booking is already cancelled",
      });
    }

    booking.bookingStatus = "cancelled";
    booking.cancellationReason = reason;
    booking.cancellationDate = new Date();

    // Calculate refund
    const refundPercentage = 100; // Full refund for now
    booking.refundAmount = (booking.totalFare * refundPercentage) / 100;
    booking.refundStatus = "pending";

    await booking.save();

    // Release seats
    const bus = await Bus.findById(booking.bus);
    bus.availableSeats += booking.seats.length;
    await bus.save();

    res.status(200).json({
      message: "Booking cancelled successfully",
      booking,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error cancelling booking",
      error: error.message,
    });
  }
});

// Get Booking Statistics
router.get("/stats/all", async (req, res) => {
  try {
    const totalBookings = await Booking.countDocuments();
    const confirmedBookings = await Booking.countDocuments({
      bookingStatus: "confirmed",
    });
    const cancelledBookings = await Booking.countDocuments({
      bookingStatus: "cancelled",
    });

    const totalRevenue = await Booking.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: "$totalFare" },
        },
      },
    ]);

    res.status(200).json({
      message: "Booking statistics",
      stats: {
        totalBookings,
        confirmedBookings,
        cancelledBookings,
        totalRevenue: totalRevenue[0]?.total || 0,
        cancellationRate:
          totalBookings > 0 ? ((cancelledBookings / totalBookings) * 100).toFixed(2) : 0,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching statistics",
      error: error.message,
    });
  }
});

module.exports = router;