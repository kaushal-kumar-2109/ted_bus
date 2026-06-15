const express = require("express");
const router = express.Router();
const Bus = require("../models/bus");
const { success, error, notFound, paginated } = require("../utils/apiResponse");
const { searchLimiter } = require("../middleware/rateLimiter");

// ──────────────────────────────────────────────
// GET /buses/cities  — all unique cities
// IMPORTANT: must be defined before /:busId
// ──────────────────────────────────────────────
router.get("/cities", async (req, res) => {
  try {
    const sources = await Bus.distinct("source.city");
    const destinations = await Bus.distinct("destination.city");
    const allCities = [...new Set([...sources, ...destinations])].sort();
    return success(res, { cities: allCities, total: allCities.length }, "Cities retrieved");
  } catch (err) {
    return error(res, "Error fetching cities", 500, err.message);
  }
});

// ──────────────────────────────────────────────
// GET /buses/autocomplete?q=del
// ──────────────────────────────────────────────
router.get("/autocomplete", async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return success(res, { suggestions: [] }, "No query");

    const regex = new RegExp(q, "i");
    const [sources, dests] = await Promise.all([
      Bus.distinct("source.city", { "source.city": regex }),
      Bus.distinct("destination.city", { "destination.city": regex }),
    ]);

    const suggestions = [...new Set([...sources, ...dests])].slice(0, 10);
    return success(res, { suggestions }, "Autocomplete results");
  } catch (err) {
    return error(res, "Autocomplete failed", 500, err.message);
  }
});

// ──────────────────────────────────────────────
// GET /buses/routes/popular
// IMPORTANT: must be before /:busId
// ──────────────────────────────────────────────
router.get("/routes/popular", async (req, res) => {
  try {
    const popularRoutes = await Bus.aggregate([
      { $match: { isActive: true, isDeleted: false } },
      {
        $group: {
          _id: { source: "$source.city", destination: "$destination.city" },
          count: { $sum: 1 },
          avgFare: { $avg: "$totalFare" },
          avgRating: { $avg: "$averageRating" },
          minFare: { $min: "$totalFare" },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 20 },
      {
        $project: {
          _id: 0,
          source: "$_id.source",
          destination: "$_id.destination",
          busCount: "$count",
          avgFare: { $round: ["$avgFare", 0] },
          minFare: { $round: ["$minFare", 0] },
          avgRating: { $round: ["$avgRating", 1] },
        },
      },
    ]);
    return success(res, { routes: popularRoutes }, "Popular routes retrieved");
  } catch (err) {
    return error(res, "Error fetching popular routes", 500, err.message);
  }
});

// ──────────────────────────────────────────────
// GET /buses?source=&destination=&busType=&page=&limit=&sortBy=
// ──────────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const {
      source,
      destination,
      date,
      busType,
      page = 1,
      limit = 20,
      sortBy = "totalFare",
      order = "asc",
      minFare,
      maxFare,
      wifi,
      ac,
      sleeper,
    } = req.query;

    const filter = { isActive: true, isDeleted: false };

    if (source) filter["source.city"] = { $regex: source, $options: "i" };
    if (destination) filter["destination.city"] = { $regex: destination, $options: "i" };
    if (busType) filter.busType = busType;
    if (minFare || maxFare) {
      filter.totalFare = {};
      if (minFare) filter.totalFare.$gte = Number(minFare);
      if (maxFare) filter.totalFare.$lte = Number(maxFare);
    }
    if (wifi === "true") filter["amenities.wifi"] = true;
    if (ac === "true") filter["amenities.ac"] = true;
    if (sleeper === "true") filter["amenities.sleeper"] = true;

    // Day-of-week filter
    if (date) {
      const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const dayOfWeek = dayNames[new Date(date).getDay()];
      filter.operatesOn = { $in: [dayOfWeek] };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortObj = { [sortBy]: order === "desc" ? -1 : 1 };

    const [buses, total] = await Promise.all([
      Bus.find(filter)
        .sort(sortObj)
        .skip(skip)
        .limit(parseInt(limit))
        .populate("operatorId", "operatorName logo isVerified"),
      Bus.countDocuments(filter),
    ]);

    return paginated(res, buses, total, page, limit, "Buses retrieved successfully");
  } catch (err) {
    return error(res, "Error fetching buses", 500, err.message);
  }
});

// ──────────────────────────────────────────────
// POST /buses/search  (full search with all filters)
// ──────────────────────────────────────────────
router.post("/search", searchLimiter, async (req, res) => {
  try {
    const {
      source,
      destination,
      departureDate,
      passengerCount,
      busType,
      minFare,
      maxFare,
      amenities = [],
      page = 1,
      limit = 20,
      sortBy = "totalFare",
      order = "asc",
    } = req.body;

    if (!source || !destination || !departureDate) {
      return error(res, "Source, destination, and date are required", 400);
    }

    const filter = {
      "source.city": { $regex: source, $options: "i" },
      "destination.city": { $regex: destination, $options: "i" },
      isActive: true,
      isDeleted: false,
    };

    // Day-of-week filter
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dayOfWeek = dayNames[new Date(departureDate).getDay()];
    filter.operatesOn = { $in: [dayOfWeek] };

    if (busType) filter.busType = busType;
    if (minFare || maxFare) {
      filter.totalFare = {};
      if (minFare) filter.totalFare.$gte = Number(minFare);
      if (maxFare) filter.totalFare.$lte = Number(maxFare);
    }
    if (passengerCount) filter.availableSeats = { $gte: Number(passengerCount) };

    amenities.forEach((amenity) => {
      filter[`amenities.${amenity}`] = true;
    });

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortObj = { [sortBy]: order === "desc" ? -1 : 1 };

    const [buses, total] = await Promise.all([
      Bus.find(filter)
        .populate("operatorId", "operatorName logo isVerified averageRating")
        .skip(skip)
        .limit(parseInt(limit))
        .sort(sortObj),
      Bus.countDocuments(filter),
    ]);

    return paginated(res, buses, total, page, limit, "Search results");
  } catch (err) {
    return error(res, "Search failed", 500, err.message);
  }
});

// ──────────────────────────────────────────────
// GET /buses/:busId/seats
// ──────────────────────────────────────────────
router.get("/:busId/seats", async (req, res) => {
  try {
    const bus = await Bus.findById(req.params.busId).select(
      "seatingCapacity availableSeats seatMatrix seatLayout"
    );
    if (!bus) return notFound(res, "Bus");

    const seatMatrix = Array.from(bus.seatMatrix || new Map());
    const available = seatMatrix.filter(([, s]) => s.status === "available").map(([n]) => n);
    const booked = seatMatrix.filter(([, s]) => s.status === "booked").map(([n]) => n);
    const blocked = seatMatrix.filter(([, s]) => s.status === "blocked").map(([n]) => n);

    return success(res, {
      busId: bus._id,
      totalSeats: bus.seatingCapacity,
      availableSeats: bus.availableSeats,
      seatLayout: bus.seatLayout,
      seats: { available, booked, blocked },
    }, "Seat availability retrieved");
  } catch (err) {
    return error(res, "Error fetching seats", 500, err.message);
  }
});

// ──────────────────────────────────────────────
// GET /buses/:busId  — single bus detail
// ──────────────────────────────────────────────
router.get("/:busId", async (req, res) => {
  try {
    const bus = await Bus.findById(req.params.busId)
      .populate("operatorId")
      .populate({ path: "reviews", populate: { path: "reviewer", select: "firstName lastName profilePicture" } });

    if (!bus) return notFound(res, "Bus");
    return success(res, { bus }, "Bus details retrieved");
  } catch (err) {
    return error(res, "Error fetching bus", 500, err.message);
  }
});

module.exports = router;
