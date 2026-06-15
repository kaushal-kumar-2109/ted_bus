const express = require("express");
const router = express.Router();
const BusOperator = require("../models/busOperator");
const Bus = require("../models/bus");

// Get All Operators
router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 20, isVerified, sortBy = "averageRating" } = req.query;
    const skip = (page - 1) * limit;

    const filter = { isActive: true };
    if (isVerified === "true") {
      filter.isVerified = true;
    }

    const sortObj = {};
    sortObj[sortBy] = -1;

    const operators = await BusOperator.find(filter)
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await BusOperator.countDocuments(filter);

    res.status(200).json({
      message: "Operators retrieved successfully",
      operators,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching operators",
      error: error.message,
    });
  }
});

// Get Operator by ID
router.get("/:operatorId", async (req, res) => {
  try {
    const operator = await BusOperator.findById(req.params.operatorId).populate(
      "buses"
    );

    if (!operator) {
      return res.status(404).json({ message: "Operator not found" });
    }

    res.status(200).json({
      message: "Operator retrieved successfully",
      operator,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching operator",
      error: error.message,
    });
  }
});

// Get Operator Buses
router.get("/:operatorId/buses", async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const buses = await Bus.find({ operatorId: req.params.operatorId })
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Bus.countDocuments({ operatorId: req.params.operatorId });

    res.status(200).json({
      message: "Operator buses retrieved",
      buses,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching operator buses",
      error: error.message,
    });
  }
});

// Get Top Operators
router.get("/stats/top", async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const topOperators = await BusOperator.find({ isVerified: true })
      .sort({ averageRating: -1, totalBookings: -1 })
      .limit(parseInt(limit));

    res.status(200).json({
      message: "Top operators retrieved",
      operators: topOperators,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching top operators",
      error: error.message,
    });
  }
});

// Search Operators
router.post("/search", async (req, res) => {
  try {
    const { query, page = 1, limit = 20 } = req.body;

    if (!query) {
      return res.status(400).json({ message: "Search query is required" });
    }

    const skip = (page - 1) * limit;

    const operators = await BusOperator.find({
      $or: [
        { operatorName: { $regex: query, $options: "i" } },
        { city: { $regex: query, $options: "i" } },
      ],
      isActive: true,
    })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await BusOperator.countDocuments({
      $or: [
        { operatorName: { $regex: query, $options: "i" } },
        { city: { $regex: query, $options: "i" } },
      ],
      isActive: true,
    });

    res.status(200).json({
      message: "Search results",
      operators,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Error searching operators",
      error: error.message,
    });
  }
});

// Get Operator Statistics
router.get("/:operatorId/stats", async (req, res) => {
  try {
    const operator = await BusOperator.findById(req.params.operatorId);

    if (!operator) {
      return res.status(404).json({ message: "Operator not found" });
    }

    const buses = await Bus.countDocuments({
      operatorId: req.params.operatorId,
    });

    res.status(200).json({
      message: "Operator statistics",
      stats: {
        operatorName: operator.operatorName,
        totalBuses: buses,
        totalBookings: operator.totalBookings,
        averageRating: operator.averageRating,
        totalReviews: operator.totalReviews,
        isVerified: operator.isVerified,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching operator statistics",
      error: error.message,
    });
  }
});

module.exports = router;
