require('dotenv').config();
const express = require('express');
const http = require('http');
const socketiO = require('socket.io');
const path = require('path');
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const { protect, adminOnly } = require("./middleware/authMiddleware");
const fs = require("fs");
const redisClient = require("./redis");


const app = express();
const server = http.createServer(app);
const io = socketiO(server);

const PORT = process.env.PORT || 8000;


app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());


// ----------------------
// MONGODB CONNECTION
// ----------------------
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

// ----------------------
// CAMPUS GRAPH CACHING (REDIS)
// ----------------------
async function loadCampusGraph() {
  try {
    // 1. Check Redis cache
    const cachedGraph = await redisClient.get("campus_graph");
    if (cachedGraph) {
      console.log("📌 Loaded campus graph from Redis (cache)");
      return JSON.parse(cachedGraph);
    }

    // 2. If not cached → read from file
    const filePath = path.join(__dirname, "data", "campus_graph.json");
    const jsonData = fs.readFileSync(filePath, "utf-8");
    const graph = JSON.parse(jsonData);

    // 3. Save in Redis for future use
    await redisClient.set("campus_graph", JSON.stringify(graph));

    console.log("📌 Loaded campus graph from file → cached in Redis");

    return graph;

  } catch (error) {
    console.log("Graph Load Error:", error);
    return null;
  }
}

// ----------------------
// ROUTES
// ----------------------
// PUBLIC LOGIN ROUTE
app.get("/login", (req, res) => {
  res.render("login");
});

// AUTH ROUTES
app.use("/auth", require("./routes/authRoutes"));

// PROTECTED HOME PAGE (ONLY THIS ONE)
app.get("/", protect, (req, res) => {
  res.render("index", { user: req.user });
});

// ADMIN
app.get("/admin", protect, adminOnly, (req, res) => {
  res.send("Admin Dashboard");
});

// LOGOUT
app.get("/logout", (req, res) => {
  res.clearCookie("token");
  res.redirect("/login");
});

// Return all active locations (small scale). For large scale replace KEYS with SCAN.
app.get("/active-users", async (req, res) => {
  try {
    // WARNING: KEYS is OK for small datasets; for production use SCAN.
    const keys = await redisClient.keys("location:*");

    const locations = [];
    for (const key of keys) {
      const data = await redisClient.get(key);
      if (data) {
        try {
          locations.push(JSON.parse(data));
        } catch (e) {
          // skip malformed entry
        }
      }
    }

    return res.json({ users: locations });
  } catch (err) {
    console.error("Error fetching active users from Redis:", err);
    return res.status(500).json({ error: "Failed to fetch active users" });
  }
});


// ----------------------
// SOCKET.IO
// ----------------------
const users = {};

function getRandomColor() {
  const colors = ["red", "blue", "green", "purple", "orange", "teal", "brown"];
  return colors[Math.floor(Math.random() * colors.length)];
}

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // store in-memory map for quick access (still useful for emitting)
  // keys are socket.id -> { id: userIdOrSocketId, name, color }
  users[socket.id] = users[socket.id] || {};

  // When user joins: frontend should send { name, userId? }
  socket.on("join", (data = {}) => {
    // choose identifier: prefer persistent userId if provided
    const userKey = data.userId || socket.id;
    const color = users[socket.id]?.color || getRandomColor();
    const name = data.name || `User-${userKey}`;

    users[socket.id] = { id: userKey, name, color };

    // Optional: write a basic presence entry in Redis so other services can see them
    const presenceKey = `presence:${userKey}`;
    redisClient.set(presenceKey, JSON.stringify({
      id: userKey,
      name,
      color,
      socketId: socket.id,
      ts: Date.now()
    }));
    // short TTL for presence (will expire if user disconnects unexpectedly)
    redisClient.expire(presenceKey, 60 * 5).catch(()=>{});

    console.log(`${name} joined with ID ${userKey} (socket ${socket.id})`);
  });

  // When user sends location; frontend should send { userId?, latitude, longitude }
  socket.on("send-location", async (data = {}) => {
    try {
      // Use provided userId or fallback to socket.id
      const userId = data.userId || (users[socket.id] && users[socket.id].id) || socket.id;
      const userMeta = users[socket.id] || { name: data.name || "Unknown", color: getRandomColor() };

      const key = `location:${userId}`;

      const payload = {
        id: userId,
        socketId: socket.id,
        name: userMeta.name,
        color: userMeta.color,
        latitude: data.latitude,
        longitude: data.longitude,
        ts: Date.now()
      };

      // Save location JSON in Redis
      await redisClient.set(key, JSON.stringify(payload));
      // Auto-expire after 5 minutes of inactivity (adjust TTL as needed)
      await redisClient.expire(key, 60 * 5);

      // Emit to everyone the live location (you may want to emit only to nearby clients)
      io.emit("receive-location", payload);

      console.log(`📍 Updated location of ${userId}`);
    } catch (err) {
      console.error("Error saving location to Redis:", err);
    }
  });

  // When user disconnects
  socket.on("disconnect", async () => {
    try {
      const meta = users[socket.id];
      if (meta && meta.id) {
        const userKey = meta.id;
        // remove location and presence from Redis immediately
        await redisClient.del(`location:${userKey}`).catch(()=>{});
        await redisClient.del(`presence:${userKey}`).catch(()=>{});
      }

      io.emit("user-disconnected", socket.id);
      delete users[socket.id];
      console.log(`User disconnected: ${socket.id}`);
    } catch (err) {
      console.error("Error during disconnect cleanup:", err);
    }
  });
});

// ----------------------
// START SERVER
// ----------------------
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
