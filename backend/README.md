# RedBus Clone - Professional Bus Booking Platform v2.0

## 🎯 Project Overview

A comprehensive, enterprise-grade bus booking platform with integrated community features, real-time tracking, and advanced moderation systems. Built with Node.js, Express, and MongoDB.

### ✨ Key Features

#### 🚌 Bus Management
- **1000+ Bus Database**: Extensive bus inventory across major Indian cities
- **Dynamic Pricing**: Real-time fare calculation with discounts and taxes
- **Advanced Filtering**: Filter by bus type, amenities, departure time, price range
- **Real-time Seat Management**: Live seat availability tracking
- **Multiple Bus Types**: AC, Non-AC, Sleeper, Semi-Sleeper, Luxury, Premium

#### 📖 User Community Features
- **User-Generated Content**: Share travel stories, tips, and experiences
- **Post Management**: Create, edit, delete, and moderate posts
- **Comments & Replies**: Nested discussion threads
- **Like & Share**: Engagement metrics for content discovery
- **Profile System**: User profiles with followers/following
- **Verification System**: Only verified users can post content

#### 💬 Forums & Discussions
- **Organized Forums**: By routes, destinations, and travel advice
- **Discussion Threads**: Topic-based conversations
- **Thread Management**: Pin, lock, and moderation controls
- **Subscribers**: Track forum participation

#### ⭐ Review System
- **Multi-dimensional Ratings**: Driver, comfort, cleanliness, safety ratings
- **Rich Reviews**: Support for text, images, and videos
- **Helpful Voting**: Mark reviews as helpful/unhelpful
- **Rating Breakdown**: Visual rating distribution

#### 🛡️ Content Moderation
- **Report System**: Flag inappropriate content
- **Admin Dashboard**: Review and approve/reject reports
- **User Management**: Ban/unban users
- **Automated Moderation**: Pending content approval workflow
- **Moderation History**: Track all moderation actions

#### 📱 Booking Management
- **End-to-End Booking**: Complete booking workflow
- **Cancellation Policy**: Flexible refunds and rescheduling
- **Multiple Payment Methods**: Credit card, UPI, Net banking, Wallet
- **Booking Status Tracking**: Real-time status updates
- **Boarding Pass**: Digital boarding passes

---

## 🏗️ Architecture

### Technology Stack
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: bcryptjs, helmet
- **Validation**: Joi
- **File Upload**: Multer
- **Real-time**: Socket.io (ready for implementation)

### Project Structure
```
server/
├── models/              # Mongoose schemas
│   ├── customer.js      # Enhanced User model
│   ├── bus.js           # Bus model
│   ├── booking.js       # Booking model
│   ├── post.js          # Social posts
│   ├── comment.js       # Comments
│   ├── forum.js         # Forums
│   ├── thread.js        # Forum threads
│   ├── threadReply.js   # Thread replies
│   ├── review.js        # Bus reviews
│   ├── moderation.js    # Content moderation
│   └── busOperator.js   # Bus operators
├── routes/              # API endpoints
│   ├── auth.js          # Authentication
│   ├── users.js         # User profiles
│   ├── buses.js         # Bus search/listing
│   ├── bookings.js      # Booking management
│   ├── posts.js         # Social posts
│   ├── comments.js      # Comments
│   ├── forums.js        # Forums
│   ├── threads.js       # Threads
│   ├── reviews.js       # Reviews
│   ├── moderation.js    # Moderation
│   └── operators.js     # Operator management
├── seeds/               # Data seeding
│   └── busSeeder.js     # 1000+ buses generator
└── index.js            # Main server file
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB Atlas account or local MongoDB
- npm or yarn

### Installation

1. **Install Dependencies**
```bash
cd server
npm install
```

2. **Create `.env` File**
```bash
cp .env.example .env
```

3. **Configure Environment Variables**
```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=7d
PORT=5000
NODE_ENV=development
```

4. **Generate Bus Data**
```bash
npm run seed
```

5. **Start Server**
```bash
npm run dev        # Development
npm start          # Production
```

### Server will start on: `http://localhost:5000`

---

## 📚 API Documentation

### Authentication
```
POST   /api/v1/auth/register          - Register new user
POST   /api/v1/auth/login             - Login user
GET    /api/v1/auth/verify            - Verify token
POST   /api/v1/auth/refresh           - Refresh token
```

### Users
```
GET    /api/v1/users/:userId          - Get user profile
PUT    /api/v1/users/:userId          - Update profile
POST   /api/v1/users/:userId/follow   - Follow user
POST   /api/v1/users/:userId/unfollow - Unfollow user
GET    /api/v1/users/:userId/followers
GET    /api/v1/users/:userId/following
```

### Buses
```
GET    /api/v1/buses                  - List all buses
GET    /api/v1/buses/:busId           - Get bus details
POST   /api/v1/buses/search           - Search buses
GET    /api/v1/buses/:busId/seats     - Get seat availability
POST   /api/v1/buses/filter/amenities - Filter by amenities
GET    /api/v1/buses/routes/popular   - Popular routes
```

### Bookings
```
POST   /api/v1/bookings               - Create booking
GET    /api/v1/bookings/user/my-bookings - Get my bookings
GET    /api/v1/bookings/:bookingId    - Get booking details
PUT    /api/v1/bookings/:bookingId/status
POST   /api/v1/bookings/:bookingId/cancel
GET    /api/v1/bookings/stats/all     - Booking statistics
```

### Posts (Community)
```
POST   /api/v1/posts                  - Create post
GET    /api/v1/posts                  - Get all posts
GET    /api/v1/posts/:postId          - Get post details
POST   /api/v1/posts/:postId/like     - Like post
POST   /api/v1/posts/:postId/share    - Share post
DELETE /api/v1/posts/:postId          - Delete post
GET    /api/v1/posts/user/:userId     - Get user posts
POST   /api/v1/posts/search           - Search posts
GET    /api/v1/posts/trending/all     - Trending posts
```

### Comments
```
POST   /api/v1/comments               - Create comment
GET    /api/v1/comments/post/:postId  - Get post comments
POST   /api/v1/comments/:commentId/like
PUT    /api/v1/comments/:commentId    - Edit comment
DELETE /api/v1/comments/:commentId    - Delete comment
POST   /api/v1/comments/:commentId/report
```

### Forums
```
POST   /api/v1/forums                 - Create forum (Admin)
GET    /api/v1/forums                 - List forums
GET    /api/v1/forums/slug/:slug      - Get forum by slug
POST   /api/v1/forums/:forumId/subscribe
GET    /api/v1/forums/:forumId/stats  - Forum statistics
POST   /api/v1/forums/popular/all     - Popular forums
```

### Threads
```
POST   /api/v1/threads                - Create thread
GET    /api/v1/threads/forum/:forumId - Get forum threads
GET    /api/v1/threads/:threadId      - Get thread details
POST   /api/v1/threads/:threadId/like
POST   /api/v1/threads/:threadId/pin  - Pin thread (Moderator)
POST   /api/v1/threads/:threadId/lock - Lock thread (Moderator)
DELETE /api/v1/threads/:threadId      - Delete thread
POST   /api/v1/threads/search         - Search threads
```

### Reviews
```
POST   /api/v1/reviews                - Create review
GET    /api/v1/reviews/bus/:busId     - Get bus reviews
GET    /api/v1/reviews/user/:userId   - Get user reviews
POST   /api/v1/reviews/:reviewId/helpful
POST   /api/v1/reviews/:reviewId/unhelpful
DELETE /api/v1/reviews/:reviewId      - Delete review
GET    /api/v1/reviews/top-rated/all  - Top rated buses
```

### Moderation
```
POST   /api/v1/moderation/report      - Report content
GET    /api/v1/moderation/pending     - Get pending reports
POST   /api/v1/moderation/:reportId/review - Review report
GET    /api/v1/moderation/history     - Moderation history
GET    /api/v1/moderation/stats/all   - Moderation statistics
POST   /api/v1/moderation/users/:userId/ban
POST   /api/v1/moderation/users/:userId/unban
```

### Operators
```
GET    /api/v1/operators              - List operators
GET    /api/v1/operators/:operatorId  - Get operator details
GET    /api/v1/operators/:operatorId/buses
GET    /api/v1/operators/stats/top    - Top operators
POST   /api/v1/operators/search       - Search operators
```

---

## 📊 Database Models

### User Model
- Authentication & profile information
- Verification status (email, phone, profile)
- Community engagement metrics
- Follower/following system
- Notification preferences
- Account status & moderation

### Bus Model
- Complete bus information & specifications
- Seat management & availability
- Pricing & dynamic discounts
- Amenities tracking
- Rating & review system
- Schedule & route information

### Booking Model
- Complete booking information
- Passenger details
- Payment information
- Cancellation & refund management
- GPS tracking support
- Review integration

### Post Model
- User-generated content management
- Multi-format support (images, videos)
- Engagement metrics (likes, comments, shares)
- Moderation workflow
- Featured content support

### Comment Model
- Nested reply system
- Like functionality
- Moderation status
- Author information

### Forum & Thread Models
- Organized discussion spaces
- Pin & lock capabilities
- Subscriber tracking
- View counts & engagement

### ContentModeration Model
- Comprehensive moderation tracking
- Multiple content types support
- Report reasons & evidence
- Moderator actions & notes
- User notifications

---

## 🌱 Data Seeding

### Generate 1000+ Buses
```bash
npm run seed
```

**Generated Data:**
- ✅ 1,000 buses across 15 major cities
- ✅ 15 different bus operators
- ✅ Multiple bus types (AC, Non-AC, Sleeper, Semi-Sleeper, Luxury, Premium)
- ✅ Realistic routes, timings, and fares
- ✅ Complete amenities information
- ✅ 90-day schedule

**Major Cities Covered:**
Delhi, Mumbai, Bangalore, Hyderabad, Chennai, Kolkata, Pune, Jaipur, Lucknow, Ahmedabad, Kochi, Gurgaon, Indore, Surat, Chandigarh

---

## 🔐 Security Features

- JWT-based authentication
- Password hashing with bcryptjs
- CORS protection
- Input validation with Joi
- Rate limiting ready
- Helmet for HTTP headers
- XSS protection
- SQL injection prevention
- Token refresh mechanism

---

## 📈 Performance Optimizations

- Database indexing on frequently queried fields
- Pagination for large result sets
- Aggregation pipelines for statistics
- Connection pooling
- Query optimization
- Caching ready

---

## 🚧 Future Enhancements

- [ ] Real-time notifications (Socket.io)
- [ ] Payment gateway integration
- [ ] Email notifications
- [ ] SMS notifications
- [ ] Push notifications
- [ ] Admin dashboard
- [ ] Analytics & reporting
- [ ] Recommendation engine
- [ ] AI-powered moderation
- [ ] Mobile app backend optimization
- [ ] GraphQL support
- [ ] Microservices architecture

---

## 📝 Environment Configuration

Create `.env` file with:

```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
DB_NAME=redbus_clone

# Server
NODE_ENV=development
PORT=5000
HOST=localhost

# Authentication
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=your_refresh_secret_key

# CORS
CORS_ORIGIN=http://localhost:4200,http://localhost:3000

# API
API_VERSION=v1
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100

# Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password

# Community
MAX_POST_LENGTH=5000
MAX_COMMENT_LENGTH=2000
VERIFICATION_REQUIRED=true
```

---

## 🤝 Contributing

1. Create a feature branch
2. Commit your changes
3. Push to the branch
4. Create a Pull Request

---

## 📄 License

MIT License - feel free to use this project

---

## 👨‍💼 Support

For issues and questions:
- Create an issue on GitHub
- Contact development team
- Check documentation

---

## 🎉 Version History

### v2.0.0 (Current)
- Complete backend refactor
- Added community features
- Implemented moderation system
- Added 1000+ bus data
- Enhanced security
- Professional API structure

### v1.0.0
- Initial release
- Basic bus booking

---

**Made with ❤️ by RedBus Clone Team**
