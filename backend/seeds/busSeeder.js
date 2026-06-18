/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║         RedBus Clone — Professional Bus Seeder           ║
 * ║   Seeds 1,200+ buses across 30 Indian cities             ║
 * ║   No external faker dependency — pure algorithmic data   ║
 * ╚══════════════════════════════════════════════════════════╝
 */

const mongoose = require("mongoose");
require("dotenv").config();
const Bus = require("../models/bus");
const BusOperator = require("../models/busOperator");

// ─────────────────────────────────────────────
// 30 Major Indian Cities with Coordinates
// ─────────────────────────────────────────────
const CITIES = [
  { name: "Delhi",        state: "Delhi",              lat: 28.7041, lng: 77.1025 },
  { name: "Mumbai",       state: "Maharashtra",         lat: 19.0760, lng: 72.8777 },
  { name: "Bangalore",    state: "Karnataka",           lat: 12.9716, lng: 77.5946 },
  { name: "Banglore",     state: "Karnataka",           lat: 12.9716, lng: 77.5946 },
  { name: "Kolkata",      state: "West Bengal",         lat: 22.5726, lng: 88.3639 },
  { name: "Chennai",      state: "Tamil Nadu",          lat: 13.0827, lng: 80.2707 },
  { name: "Jaipur",       state: "Rajasthan",           lat: 26.9124, lng: 75.7873 },
  { name: "Goa",          state: "Goa",                 lat: 15.2993, lng: 74.1240 },
  { name: "Mysore",       state: "Karnataka",           lat: 12.2958, lng: 76.6394 },
  { name: "Mysuru",       state: "Karnataka",           lat: 12.2958, lng: 76.6394 },
  { name: "Darjeeling",   state: "West Bengal",         lat: 27.0410, lng: 88.2627 },
  { name: "Pondicherry",  state: "Puducherry",          lat: 11.9416, lng: 79.8083 },
  { name: "Hyderabad",    state: "Telangana",           lat: 17.3850, lng: 78.4867 },
  { name: "Pune",         state: "Maharashtra",         lat: 18.5204, lng: 73.8567 },
  { name: "Lucknow",      state: "Uttar Pradesh",       lat: 26.8467, lng: 80.9462 },
  { name: "Ahmedabad",    state: "Gujarat",             lat: 23.0225, lng: 72.5714 },
  { name: "Kochi",        state: "Kerala",              lat: 9.9312,  lng: 76.2673 },
  { name: "Indore",       state: "Madhya Pradesh",      lat: 22.7196, lng: 75.8577 },
  { name: "Surat",        state: "Gujarat",             lat: 21.1702, lng: 72.8311 },
  { name: "Chandigarh",   state: "Chandigarh",          lat: 30.7333, lng: 76.7794 },
  { name: "Bhopal",       state: "Madhya Pradesh",      lat: 23.2599, lng: 77.4126 },
  { name: "Nagpur",       state: "Maharashtra",         lat: 21.1458, lng: 79.0882 },
  { name: "Patna",        state: "Bihar",               lat: 25.5941, lng: 85.1376 },
  { name: "Visakhapatnam",state: "Andhra Pradesh",      lat: 17.6868, lng: 83.2185 },
  { name: "Vadodara",     state: "Gujarat",             lat: 22.3072, lng: 73.1812 },
  { name: "Agra",         state: "Uttar Pradesh",       lat: 27.1767, lng: 78.0081 },
  { name: "Coimbatore",   state: "Tamil Nadu",          lat: 11.0168, lng: 76.9558 },
  { name: "Madurai",      state: "Tamil Nadu",          lat: 9.9252,  lng: 78.1198 },
  { name: "Thiruvananthapuram", state: "Kerala",        lat: 8.5241,  lng: 76.9366 },
  { name: "Ranchi",       state: "Jharkhand",           lat: 23.3441, lng: 85.3096 },
  { name: "Guwahati",     state: "Assam",               lat: 26.1445, lng: 91.7362 },
  { name: "Jodhpur",      state: "Rajasthan",           lat: 26.2389, lng: 73.0243 },
  { name: "Amritsar",     state: "Punjab",              lat: 31.6340, lng: 74.8723 },
  { name: "Varanasi",     state: "Uttar Pradesh",       lat: 25.3176, lng: 82.9739 },
  { name: "Raipur",       state: "Chhattisgarh",        lat: 21.2514, lng: 81.6296 },
];

// ─────────────────────────────────────────────
// 15 Bus Operators
// ─────────────────────────────────────────────
const OPERATORS = [
  { name: "RedBus Premium",      rating: 4.7, tier: "premium" },
  { name: "IntrCity SmartBus",   rating: 4.5, tier: "premium" },
  { name: "Zingbus",             rating: 4.4, tier: "standard" },
  { name: "SRS Travels",         rating: 4.3, tier: "standard" },
  { name: "KSRTC",               rating: 4.2, tier: "government" },
  { name: "VRL Travels",         rating: 4.5, tier: "premium" },
  { name: "Orange Travels",      rating: 4.3, tier: "standard" },
  { name: "Patel Travels",       rating: 4.1, tier: "standard" },
  { name: "Neeta Travels",       rating: 4.4, tier: "premium" },
  { name: "Shah Travels",        rating: 4.0, tier: "standard" },
  { name: "Paulo Travels",       rating: 4.2, tier: "standard" },
  { name: "Kesari Tours",        rating: 4.6, tier: "premium" },
  { name: "Raj National Express",rating: 3.9, tier: "budget"   },
  { name: "Kallada Travels",     rating: 4.3, tier: "standard" },
  { name: "National Travels",    rating: 3.8, tier: "budget"   },
];

const BUS_TYPES = ["AC", "Non-AC", "Sleeper", "Semi-Sleeper", "Luxury", "Premium"];

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// Departure slots: 5 slots per route pair
const DEPARTURE_SLOTS = [
  { dep: "06:00", label: "Early Morning" },
  { dep: "10:00", label: "Morning"       },
  { dep: "14:00", label: "Afternoon"     },
  { dep: "19:00", label: "Evening"       },
  { dep: "22:30", label: "Night"         },
];

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function addMinutesToTime(time, minutes) {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const nh = Math.floor(total / 60) % 24;
  const nm = total % 60;
  return `${String(nh).padStart(2, "0")}:${String(nm).padStart(2, "0")}`;
}

function durationString(minutes) {
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

function seededRandom(seed) {
  let s = seed;
  return function () {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function pickFrom(arr, rng) {
  return arr[Math.floor(rng() * arr.length)];
}

function operatesOnDays(seed) {
  const rng = seededRandom(seed);
  // Always operates at least 5 days per week
  return DAYS.filter(() => rng() > 0.28);
}

function buildAmenities(busType, operatorTier, seed) {
  const rng = seededRandom(seed);
  const isPremium = ["Luxury", "Premium", "Sleeper"].includes(busType) || operatorTier === "premium";
  return {
    wifi:         isPremium ? rng() > 0.3 : rng() > 0.7,
    charging:     rng() > 0.2,
    blanket:      busType === "Sleeper" || busType === "Semi-Sleeper",
    pillow:       busType === "Sleeper",
    monitor:      isPremium ? rng() > 0.4 : rng() > 0.8,
    waterBottle:  rng() > 0.3,
    readingLight: rng() > 0.4,
    powerPlug:    isPremium ? rng() > 0.2 : rng() > 0.6,
    ac:           busType !== "Non-AC",
    microphone:   rng() > 0.7,
    sleeper:      busType === "Sleeper" || busType === "Semi-Sleeper",
  };
}

function buildSeatLayout(busType) {
  const cap = busType === "Sleeper" ? 36 : busType === "Semi-Sleeper" ? 42 : busType === "Luxury" || busType === "Premium" ? 32 : 50;
  return { capacity: cap, rows: Math.ceil(cap / 4), columns: 4 };
}

function calcFare(distanceKm, busType, operatorTier) {
  const ratePerKm = {
    "Non-AC": 1.2,
    "AC": 2.0,
    "Semi-Sleeper": 2.2,
    "Sleeper": 2.8,
    "Premium": 3.5,
    "Luxury": 4.5,
  };
  const tierMult = { budget: 0.85, government: 0.90, standard: 1.0, premium: 1.3 };
  const base = Math.round(distanceKm * (ratePerKm[busType] || 2.0) * (tierMult[operatorTier] || 1.0));
  // Add small random jitter ±10%
  return Math.max(200, base);
}

// ─────────────────────────────────────────────
// Main Seeder Function
// ─────────────────────────────────────────────
async function seedBuses() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    const mongoUri = process.env.MONGODB_URI_SRV || process.env.MONGODB_URI;
    await mongoose.connect(mongoUri, {
      dbName: process.env.DB_NAME || "redbus_clone",
    });
    console.log("✅ Connected to MongoDB");

    // Clear existing
    await Promise.all([Bus.deleteMany({}), BusOperator.deleteMany({})]);
    console.log("🗑️  Cleared existing bus and operator data");

    // ── Create Operators ──────────────────────
    const operatorDocs = [];
    for (let i = 0; i < OPERATORS.length; i++) {
      const op = OPERATORS[i];
      const slug = op.name.toLowerCase().replace(/\s+/g, "");
      const doc = await BusOperator.create({
        operatorName: op.name,
        email: `contact@${slug}.in`,
        phone: `9${String(8000000000 + i * 11111111).slice(0, 9)}`,
        registrationNumber: `REG${String(i + 1001).padStart(6, "0")}`,
        licenseNumber: `LIC${String(i + 2001).padStart(6, "0")}`,
        gstNumber: `GST${String(i + 3001).padStart(10, "0")}`,
        panNumber: `PAN${String(i + 4001).padStart(8, "0")}`,
        operatorType: "company",
        establishedDate: new Date(2000 + i, 0, 1),
        totalFleet: 20 + i * 5,
        logo: `https://ui-avatars.com/api/?name=${encodeURIComponent(op.name)}&size=200&background=d02b2b&color=fff`,
        isVerified: true,
        verificationStatus: "approved",
        averageRating: op.rating,
        tier: op.tier,
      });
      operatorDocs.push(doc);
    }
    console.log(`✅ Created ${operatorDocs.length} operators`);

    // ── Build Bus Records ─────────────────────
    const buses = [];
    let busCount = 1;

    // For each (source, destination) pair, add multiple departure slots
    for (let si = 0; si < CITIES.length; si++) {
      for (let di = 0; di < CITIES.length; di++) {
        if (si === di) continue;

        const src  = CITIES[si];
        const dest = CITIES[di];
        const distKm = haversineKm(src.lat, src.lng, dest.lat, dest.lng);

        // Skip very short routes (< 10km) and very long non-sensical ones
        if (distKm < 10) continue;

        // Speed: ~60 km/h average, minimum 3h
        const travelMinutes = Math.max(180, Math.round((distKm / 60) * 60));

        // Seed exactly 10 buses for each route
        for (let bIndex = 0; bIndex < 10; bIndex++) {
          const seed = si * 10000 + di * 100 + bIndex;
          const rng  = seededRandom(seed);

          // Spread departure times out through the day
          const hour = String(Math.floor(5 + (bIndex * 1.8)) % 24).padStart(2, "0");
          const minute = String((bIndex * 15) % 60).padStart(2, "0");
          const depTime = `${hour}:${minute}`;

          const operator = operatorDocs[Math.floor(rng() * operatorDocs.length)];
          const busType  = BUS_TYPES[Math.floor(rng() * BUS_TYPES.length)];
          const layout   = buildSeatLayout(busType);
          const fare     = calcFare(distKm, busType, OPERATORS.find(o => o.name === operator.operatorName)?.tier || "standard");
          const taxes    = Math.round(fare * 0.05);
          const totalFare = fare + taxes;
          const discount  = rng() > 0.7 ? Math.floor(rng() * 20) : 0;
          const arrivalTime = addMinutesToTime(depTime, travelMinutes);

          buses.push({
            busName: `${operator.operatorName} ${busType} — ${src.name} → ${dest.name}`,
            busNumber: `RB${String(busCount).padStart(5, "0")}`,
            operatorId: operator._id,
            operatorName: operator.operatorName,
            busType,
            seatingCapacity: layout.capacity,
            availableSeats: layout.capacity,
            seatLayout: { rows: layout.rows, columns: layout.columns },
            source: {
              city: src.name,
              state: src.state,
              coordinates: { latitude: src.lat, longitude: src.lng },
            },
            destination: {
              city: dest.name,
              state: dest.state,
              coordinates: { latitude: dest.lat, longitude: dest.lng },
            },
            intermediateStops: [],
            departureTime: depTime,
            arrivalTime,
            duration: durationString(travelMinutes),
            distance: distKm,
            operatesOn: DAYS, // operate on all days
            startDate: new Date(),
            endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 6 months
            baseFare: fare,
            taxes,
            totalFare,
            discountPercentage: discount,
            farePercentageChange: 0,
            amenities: buildAmenities(busType, OPERATORS.find(o => o.name === operator.operatorName)?.tier || "standard", seed),
            features: {
              liveTracking: rng() > 0.2,
              reschedulable: rng() > 0.3,
              cancellable: true,
            },
            averageRating: parseFloat((3.5 + rng() * 1.5).toFixed(1)),
            totalReviews: Math.floor(rng() * 800),
            images: [
              { url: `https://picsum.photos/seed/bus${busCount}a/400/300`, caption: "Bus exterior" },
              { url: `https://picsum.photos/seed/bus${busCount}b/400/300`, caption: "Bus interior" },
            ],
            isActive: true,
            isDeleted: false,
          });

          busCount++;
        }
      }
    }

    console.log(`📦 Total bus records prepared: ${buses.length}`);

    // ── Batch insert ──────────────────────────
    const BATCH = 100;
    for (let i = 0; i < buses.length; i += BATCH) {
      await Bus.insertMany(buses.slice(i, i + BATCH), { ordered: false });
      process.stdout.write(`\r   Inserting... ${Math.min(i + BATCH, buses.length)}/${buses.length}`);
    }
    console.log("\n✅ All buses inserted");

    // ── Update operator bus counts ────────────
    for (const op of operatorDocs) {
      const count = await Bus.countDocuments({ operatorId: op._id });
      await BusOperator.findByIdAndUpdate(op._id, { totalBuses: count });
    }
    console.log("✅ Operator bus counts updated");

    // ── Summary ───────────────────────────────
    const finalCount = await Bus.countDocuments();
    console.log(`
╔══════════════════════════════════════╗
║       Bus Seeding Complete! 🎉       ║
╠══════════════════════════════════════╣
║  Total Buses:     ${String(finalCount).padEnd(17)}║
║  Total Operators: ${String(operatorDocs.length).padEnd(17)}║
║  Cities Covered:  ${String(CITIES.length).padEnd(17)}║
╚══════════════════════════════════════╝
    `);

    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding failed:", err.message);
    if (err.writeErrors) {
      console.error(`   Write errors: ${err.writeErrors.length} (likely duplicates, skipped)`);
    }
    process.exit(1);
  }
}

seedBuses();
