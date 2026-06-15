/**
 * Community Seeder — Seeds forums, threads, verified users, and sample posts
 */
const mongoose = require("mongoose");
require("dotenv").config();
const User = require("../models/customer");
const Post = require("../models/post");
const Forum = require("../models/forum");
const Thread = require("../models/thread");

const FORUMS = [
  { name: "Routes & Travel", description: "Discuss bus routes, timings, and travel experiences across India", category: "routes", icon: "🗺️" },
  { name: "Destination Reviews", description: "Share reviews of cities, towns, and travel destinations", category: "destinations", icon: "📍" },
  { name: "Travel Tips & Hacks", description: "Pro tips, packing advice, and budget travel strategies", category: "tips", icon: "💡" },
  { name: "Bus Reviews & Ratings", description: "Honest reviews about bus operators, comfort, and service", category: "travel-advice", icon: "⭐" },
  { name: "General Discussion", description: "Anything and everything about travel in India", category: "general", icon: "💬" },
];

const SAMPLE_USERS = [
  { firstName: "Arjun",   lastName: "Sharma",   email: "arjun@traveller.in",   city: "Delhi",     phone: "9876543201" },
  { firstName: "Priya",   lastName: "Patel",    email: "priya@traveller.in",    city: "Mumbai",    phone: "9876543202" },
  { firstName: "Rahul",   lastName: "Gupta",    email: "rahul@traveller.in",    city: "Bangalore", phone: "9876543203" },
  { firstName: "Sneha",   lastName: "Reddy",    email: "sneha@traveller.in",    city: "Hyderabad", phone: "9876543204" },
  { firstName: "Vikram",  lastName: "Singh",    email: "vikram@traveller.in",   city: "Jaipur",    phone: "9876543205" },
];

const POST_TEMPLATES = [
  {
    title: "My overnight journey from Delhi to Jaipur — Absolutely worth it!",
    content: "I recently took the overnight Sleeper bus from Delhi to Jaipur and I must say the experience was fantastic. The bus departed exactly on time at 10:30 PM and we reached Jaipur by 6 AM. The seats were comfortable, the AC was working perfectly, and the driver was professional. The highway condition was smooth throughout. I saved on hotel costs and woke up fresh in the Pink City. Highly recommend this route for weekend travelers!",
    category: "travel-story",
    tags: ["delhi", "jaipur", "overnight", "sleeper", "rajasthan"],
    destinations: ["Jaipur"],
  },
  {
    title: "Top 5 Tips for Your First Long-Distance Bus Journey in India",
    content: "After taking more than 50 long-distance bus journeys across India, I've compiled my best tips:\n\n1. Always book window seats on the left side for morning departures to avoid direct sunlight\n2. Carry a neck pillow — even premium buses can get bumpy\n3. Download your OTP and booking confirmation offline before boarding\n4. Board 15 minutes early to secure your overhead luggage space\n5. Keep a light snack handy — roadside dhabas can be hit or miss\n\nHappy travels! 🚌",
    category: "travel-tips",
    tags: ["tips", "beginners", "bus-travel", "india", "hacks"],
    destinations: [],
  },
  {
    title: "Bangalore to Coimbatore route review — Best buses to take in 2026",
    content: "Traveled this route 4 times this year and here's my comprehensive review.\n\nThe Bangalore to Coimbatore route offers some great options. VRL Travels and SRS Travels are the two best operators. The journey takes around 5.5 hours and costs between ₹450-₹900 depending on the bus type. The road passes through Krishnagiri which has nice food stops. Night buses are more comfortable as there's less traffic. The AC Sleeper is worth the extra cost for longer journeys.",
    category: "route-review",
    tags: ["bangalore", "coimbatore", "karnataka", "tamil-nadu", "review"],
    destinations: ["Coimbatore", "Bangalore"],
  },
  {
    title: "Hidden gem: The Mumbai to Pune express bus at dawn",
    content: "Most people take the Pune to Mumbai Expressway but I discovered the 5 AM Shivneri bus which is government operated and absolutely incredible. The bus is clean, punctual, and costs only ₹280. You reach Pune by 9 AM just in time for morning meetings. The expressway at dawn with the mist over the Sahyadri mountains is breathtaking. No traffic, cool morning air, and you arrive feeling refreshed.",
    category: "travel-story",
    tags: ["mumbai", "pune", "shivneri", "expressway", "dawn", "government"],
    destinations: ["Pune", "Mumbai"],
  },
  {
    title: "Chennai to Madurai overnight journey — A detailed breakdown",
    content: "The Chennai to Madurai route is one of the most popular bus routes in Tamil Nadu. Distance is about 460 km and takes 7-8 hours by sleeper bus. I recommend the 9:30 PM departure from CMBT which gets you to Madurai by 5 AM. The highway is excellent, the buses are modern, and the service is professional. Fare ranges from ₹600 to ₹1,100. Best operators: KPN Travels, Patel Tours. Always carry your e-ticket screenshot!",
    category: "destination-review",
    tags: ["chennai", "madurai", "tamil-nadu", "overnight", "cmbt"],
    destinations: ["Madurai", "Chennai"],
  },
];

async function seedCommunity() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.DB_NAME || "redbus_clone",
    });
    console.log("✅ Connected");

    // Clear community data
    await Promise.all([
      User.deleteMany({ email: { $in: SAMPLE_USERS.map(u => u.email) } }),
      Forum.deleteMany({}),
      Thread.deleteMany({}),
      Post.deleteMany({}),
    ]);
    console.log("🗑️  Cleared existing community data");

    // ── Create Verified Users ─────────────────
    const createdUsers = [];
    for (const u of SAMPLE_USERS) {
      const user = await User.create({
        ...u,
        password: "Travel@123",
        role: "user",
        isEmailVerified: true,
        isProfileVerified: true,
        verificationStatus: "approved",
        canPostContent: true,
        verificationBadge: "gold",
        bio: `Passionate traveler from ${u.city}. Love exploring India by bus! 🚌`,
        profilePicture: `https://ui-avatars.com/api/?name=${u.firstName}+${u.lastName}&size=200&background=d02b2b&color=fff`,
      });
      createdUsers.push(user);
    }
    console.log(`✅ Created ${createdUsers.length} verified community users`);

    // ── Create Forums ─────────────────────────
    const createdForums = [];
    for (const f of FORUMS) {
      const slug = f.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const forum = await Forum.create({
        title: f.name,
        slug: slug,
        description: f.description,
        category: f.category,
        icon: f.icon,
        isActive: true,
        createdBy: createdUsers[0]._id,
        threadsCount: 0,
        postsCount: 0,
      });
      createdForums.push(forum);
    }
    console.log(`✅ Created ${createdForums.length} forums`);

    // ── Create Threads in Forums ──────────────
    let threadCount = 0;
    for (const forum of createdForums) {
      const threadTitles = [
        `Best buses for ${forum.category} category travelers`,
        `Your favorite experiences related to ${forum.title}`,
        `Tips and tricks for ${forum.title}`,
        `Weekly discussion: ${forum.title}`,
        `New routes and updates — ${forum.title}`,
      ];

      for (const title of threadTitles) {
        const author = createdUsers[threadCount % createdUsers.length];
        await Thread.create({
          forum: forum._id,
          title,
          content: `Welcome to this thread about "${title}". Share your experiences, ask questions, and help fellow travelers!`,
          author: author._id,
          authorName: `${author.firstName} ${author.lastName}`,
          isActive: true,
          isPinned: threadCount % 5 === 0,
          views: Math.floor(Math.random() * 500) + 10,
          repliesCount: 0,
        });
        threadCount++;
      }

      await Forum.findByIdAndUpdate(forum._id, { threadsCount: threadTitles.length });
    }
    console.log(`✅ Created ${threadCount} threads across ${createdForums.length} forums`);

    // ── Create Posts ──────────────────────────
    for (let i = 0; i < POST_TEMPLATES.length; i++) {
      const tpl = POST_TEMPLATES[i];
      const author = createdUsers[i % createdUsers.length];
      const APP_URL = process.env.APP_URL || "http://localhost:4200";

      const post = await Post.create({
        author: author._id,
        authorName: `${author.firstName} ${author.lastName}`,
        authorAvatar: author.profilePicture,
        title: tpl.title,
        content: tpl.content,
        category: tpl.category,
        tags: tpl.tags,
        destinations: tpl.destinations,
        coverImage: {
          url: `https://picsum.photos/seed/post${i + 1}/800/450`,
          caption: tpl.title,
        },
        isPublished: true,
        isApproved: true,
        isFeatured: i < 2,
        moderationStatus: "approved",
        likesCount: Math.floor(Math.random() * 80) + 10,
        commentsCount: Math.floor(Math.random() * 30),
        views: Math.floor(Math.random() * 2000) + 200,
        socialShareLinks: {
          twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(tpl.title)}&url=${APP_URL}/community/posts/placeholder`,
          facebook: `https://www.facebook.com/sharer/sharer.php?u=${APP_URL}/community/posts/placeholder`,
          whatsapp: `https://wa.me/?text=${encodeURIComponent(tpl.title)}`,
          linkedin: `https://www.linkedin.com/shareArticle?mini=true&title=${encodeURIComponent(tpl.title)}`,
        },
      });

      await User.findByIdAndUpdate(author._id, { $inc: { totalPosts: 1 } });
    }
    console.log(`✅ Created ${POST_TEMPLATES.length} sample posts`);

    console.log(`
╔════════════════════════════════════════╗
║    Community Seeding Complete! 🎉      ║
╠════════════════════════════════════════╣
║  Verified Users:   ${String(SAMPLE_USERS.length).padEnd(19)}║
║  Forums:           ${String(FORUMS.length).padEnd(19)}║
║  Threads:          ${String(threadCount).padEnd(19)}║
║  Sample Posts:     ${String(POST_TEMPLATES.length).padEnd(19)}║
║                                        ║
║  Test Login:                           ║
║  Email: arjun@traveller.in             ║
║  Pass:  Travel@123                     ║
╚════════════════════════════════════════╝
    `);

    process.exit(0);
  } catch (err) {
    console.error("❌ Community seeding failed:", err.message);
    process.exit(1);
  }
}

seedCommunity();
