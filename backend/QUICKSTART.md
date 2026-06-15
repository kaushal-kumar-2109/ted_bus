# RedBus Clone - Quick Start Guide

## 🚀 Server Setup (5 Minutes)

### Step 1: Install Dependencies
```bash
cd server
npm install
```

### Step 2: Configure Environment
```bash
# Copy example .env file
cp .env.example .env

# Edit .env with your MongoDB connection
# MONGODB_URI=your_connection_string_here
```

### Step 3: Generate Bus Data (1000+ buses)
```bash
npm run seed
```

### Step 4: Start Development Server
```bash
npm run dev
```

### ✅ Server is Running!
- **API URL**: http://localhost:5000
- **Health Check**: http://localhost:5000/health
- **API Docs**: Check [README.md](./README.md)

---

## 📚 First API Calls

### 1. Register a User
```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "9876543210",
    "password": "password123"
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### 3. Search Buses
```bash
curl -X POST http://localhost:5000/api/v1/buses/search \
  -H "Content-Type: application/json" \
  -d '{
    "source": "Delhi",
    "destination": "Mumbai",
    "passengerCount": 2
  }'
```

### 4. Get All Posts
```bash
curl http://localhost:5000/api/v1/posts
```

### 5. Get Operators
```bash
curl http://localhost:5000/api/v1/operators
```

---

## 🔑 Key Features Ready

✅ **Bus Booking System**
- 1000+ buses across 15 cities
- Real-time seat availability
- Dynamic pricing

✅ **Community Features**
- User posts & stories
- Comments & discussions
- Forums by category
- Threaded conversations

✅ **Moderation System**
- Report content
- Admin reviews
- User management
- Content approval

✅ **User Management**
- Authentication
- Profile management
- Verification system
- Followers/Following

✅ **Reviews & Ratings**
- Multi-dimensional ratings
- Rich media support
- Rating breakdown

---

## 📁 Project Structure

```
server/
├── models/              # Database schemas
├── routes/              # API endpoints
├── seeds/               # Data generation
├── .env.example         # Environment template
├── package.json         # Dependencies
├── index.js            # Main server
└── README.md           # Full documentation
```

---

## 🔗 Frontend Integration

### Authentication Header
```javascript
const token = localStorage.getItem('jwtToken');
const config = {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
};
```

### Example: Create Post (Angular)
```typescript
createPost(postData: any) {
  return this.http.post(
    'http://localhost:5000/api/v1/posts',
    postData,
    this.getHeaders()
  );
}

getHeaders() {
  return {
    headers: new HttpHeaders({
      'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
    })
  };
}
```

---

## 🚨 Troubleshooting

### MongoDB Connection Error
- ✅ Check MongoDB URI in .env
- ✅ Verify MongoDB is running
- ✅ Check network access in MongoDB Atlas

### Port 5000 Already in Use
```bash
# Change PORT in .env to 5001 or higher
# Or kill the process using port 5000
```

### Seed Data Not Generated
```bash
# Make sure MongoDB is connected first
npm run seed
```

---

## 📊 API Statistics

- **Total Endpoints**: 82+
- **Bus Records**: 1000+
- **Operators**: 15
- **Models**: 11
- **Routes**: 11 files
- **Authentication**: JWT-based
- **Database**: MongoDB

---

## 🎯 Next Steps

1. **Frontend Setup**: Update Angular app to use new API
2. **Add Posts Page**: Create post creation interface
3. **Add Forums**: Build forum discussion UI
4. **Add Reviews**: Implement review system
5. **Setup Admin Dashboard**: Moderation interface
6. **Configure Payment**: Add payment gateway

---

## 💡 Tips

- Use Postman to test APIs
- Check MongoDB for data
- Monitor server logs for errors
- Use JWT tokens in Authorization header
- Refer to README.md for detailed API docs

---

## 🆘 Support

**Issues?**
- Check server logs
- Verify environment variables
- Ensure MongoDB is connected
- Review API documentation

---

**Happy Coding! 🚀**
