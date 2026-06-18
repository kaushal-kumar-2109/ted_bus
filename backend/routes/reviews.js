const express = require("express");
const router = express.Router();
const Review = require("../models/review");
const Booking = require("../models/booking");
const Bus = require("../models/bus");
const User = require("../models/customer");
const { verifyToken } = require("../middleware/auth");

// Create Review
router.post("/", verifyToken, async (req, res) => {
  try {
    // Auto-verify user if not already verified (since they must have a valid booking to reach here)
    if (!req.user.isProfileVerified) {
      req.user.isProfileVerified = true;
      req.user.canPostContent = true;
      req.user.verificationStatus = "approved";
      req.user.verificationBadge = "gold";
      await User.findByIdAndUpdate(req.userId, {
        isProfileVerified: true,
        canPostContent: true,
        verificationStatus: "approved",
        verificationBadge: "gold",
      });
    }

    const {
      busId,
      bookingId,
      title,
      description,
      overallRating,
      driverRating,
      comfortRating,
      cleanlinessRating,
      safetyRating,
      aspects,
      images,
    } = req.body;

    if (!busId || !bookingId || !overallRating) {
      return res.status(400).json({
        message: "Bus ID, booking ID, and overall rating are required",
      });
    }

    // Verify booking exists and belongs to user
    const booking = await Booking.findById(bookingId);
    if (!booking || booking.user.toString() !== req.userId) {
      return res.status(403).json({
        message: "Invalid booking for review",
      });
    }

    // Check if already reviewed
    const existingReview = await Review.findOne({ booking: bookingId });
    if (existingReview) {
      return res.status(400).json({
        message: "You have already reviewed this booking",
      });
    }

    const user = await User.findById(req.userId);
    const bus = await Bus.findById(busId);

    const review = new Review({
      bus: busId,
      booking: bookingId,
      user: req.userId,
      userName: `${user.firstName} ${user.lastName}`,
      title: title || `Review for ${bus.busName}`,
      description,
      overallRating,
      driverRating,
      comfortRating,
      cleanlinessRating,
      safetyRating,
      aspects,
      images: images || [],
      isVerified: true,
      isApproved: true,
    });

    await review.save();

    // Update bus rating
    const allReviews = await Review.find({ bus: busId });
    const avgRating =
      allReviews.reduce((sum, r) => sum + r.overallRating, 0) / allReviews.length;

    await Bus.findByIdAndUpdate(busId, {
      averageRating: avgRating,
      totalReviews: allReviews.length,
      $push: { reviews: review._id },
    });

    // Update booking
    booking.hasReviewed = true;
    booking.reviewRating = overallRating;
    booking.review = review._id;
    await booking.save();

    res.status(201).json({
      message: "Review created successfully",
      review,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error creating review",
      error: error.message,
    });
  }
});

// Get Bus Reviews
router.get("/bus/:busId", async (req, res) => {
  try {
    const { page = 1, limit = 20, sortBy = "createdAt" } = req.query;
    const skip = (page - 1) * limit;

    const sortObj = {};
    sortObj[sortBy] = -1;

    const reviews = await Review.find({
      bus: req.params.busId,
      isApproved: true,
    })
      .populate("user", "firstName lastName profilePicture")
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Review.countDocuments({
      bus: req.params.busId,
      isApproved: true,
    });

    // Get rating breakdown
    const allReviews = await Review.find({ bus: req.params.busId });
    const ratingBreakdown = {
      1: allReviews.filter((r) => r.overallRating === 1).length,
      2: allReviews.filter((r) => r.overallRating === 2).length,
      3: allReviews.filter((r) => r.overallRating === 3).length,
      4: allReviews.filter((r) => r.overallRating === 4).length,
      5: allReviews.filter((r) => r.overallRating === 5).length,
    };

    res.status(200).json({
      message: "Reviews retrieved successfully",
      reviews,
      ratingBreakdown,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching reviews",
      error: error.message,
    });
  }
});

// Get User Reviews
router.get("/user/:userId", async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const reviews = await Review.find({ user: req.params.userId })
      .populate("bus", "busName busNumber operatorName")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Review.countDocuments({ user: req.params.userId });

    res.status(200).json({
      message: "User reviews retrieved",
      reviews,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching user reviews",
      error: error.message,
    });
  }
});

// Mark Review as Helpful
router.post("/:reviewId/helpful", async (req, res) => {
  try {
    const review = await Review.findByIdAndUpdate(
      req.params.reviewId,
      { $inc: { helpful: 1 } },
      { new: true }
    );

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    res.status(200).json({
      message: "Review marked as helpful",
      helpful: review.helpful,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating review",
      error: error.message,
    });
  }
});

// Mark Review as Unhelpful
router.post("/:reviewId/unhelpful", async (req, res) => {
  try {
    const review = await Review.findByIdAndUpdate(
      req.params.reviewId,
      { $inc: { unhelpful: 1 } },
      { new: true }
    );

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    res.status(200).json({
      message: "Review marked as unhelpful",
      unhelpful: review.unhelpful,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating review",
      error: error.message,
    });
  }
});

// Get Top Rated Buses
router.get("/top-rated/all", async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const topBuses = await Bus.find({ totalReviews: { $gt: 0 } })
      .sort({ averageRating: -1, totalReviews: -1 })
      .limit(parseInt(limit));

    res.status(200).json({
      message: "Top rated buses retrieved",
      buses: topBuses,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching top rated buses",
      error: error.message,
    });
  }
});

// Delete Review (Owner only)
router.delete("/:reviewId", verifyToken, async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    if (review.user.toString() !== req.userId) {
      return res.status(403).json({
        message: "You can only delete your own reviews",
      });
    }

    await Review.findByIdAndDelete(req.params.reviewId);

    // Update bus
    const allReviews = await Review.find({ bus: review.bus });
    const avgRating =
      allReviews.length > 0
        ? allReviews.reduce((sum, r) => sum + r.overallRating, 0) / allReviews.length
        : 0;

    await Bus.findByIdAndUpdate(review.bus, {
      averageRating: avgRating,
      totalReviews: allReviews.length,
      $pull: { reviews: review._id },
    });

    res.status(200).json({
      message: "Review deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting review",
      error: error.message,
    });
  }
});

// Edit Review (Owner only, within 24 hours, locking overall star rating)
router.put("/:reviewId", verifyToken, async (req, res) => {
  try {
    const { title, description } = req.body;
    const review = await Review.findById(req.params.reviewId);

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    if (review.user.toString() !== req.userId) {
      return res.status(403).json({ message: "You can only edit your own reviews" });
    }

    // Check 24 hours constraint
    const diffTime = Math.abs(new Date().getTime() - new Date(review.createdAt).getTime());
    const diffHours = diffTime / (1000 * 60 * 60);
    if (diffHours > 24) {
      return res.status(400).json({ message: "Reviews can only be edited within 24 hours of submission" });
    }

    // Update allowable text details (ratings locked!)
    if (title !== undefined) review.title = title;
    if (description !== undefined) review.description = description;
    review.updatedAt = new Date();

    await review.save();

    res.status(200).json({
      message: "Review updated successfully (rating was locked)",
      review
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating review",
      error: error.message
    });
  }
});

// Report Review
router.post("/:reviewId/report", verifyToken, async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    review.isReported = true;
    
    // Increment report counter and hide if reported 3 or more times
    review.unhelpful = (review.unhelpful || 0) + 1;
    if (review.unhelpful >= 3) {
      review.isApproved = false;
    }

    await review.save();

    // If hidden, update average bus rating calculation!
    if (!review.isApproved) {
      const allApprovedReviews = await Review.find({ bus: review.bus, isApproved: true });
      const avgRating = allApprovedReviews.length > 0
        ? allApprovedReviews.reduce((sum, r) => sum + r.overallRating, 0) / allApprovedReviews.length
        : 0;

      await Bus.findByIdAndUpdate(review.bus, {
        averageRating: avgRating,
        totalReviews: allApprovedReviews.length,
        $pull: { reviews: review._id }
      });
    }

    res.status(200).json({
      message: review.isApproved ? "Review reported" : "Review hidden due to multiple reports",
      isApproved: review.isApproved
    });
  } catch (error) {
    res.status(500).json({
      message: "Error reporting review",
      error: error.message
    });
  }
});

module.exports = router;
