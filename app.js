require('dotenv').config();
const express = require('express');
const http = require('http');
const socketiO = require('socket.io');
const path = require('path');
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const { protect, adminOnly } = require("./middleware/authMiddleware");

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

const app = express();
const server = http.createServer(app);
const io = socketiO(server);

const PORT = process.env.PORT || 8000;

// ----------------------
// MIDDLEWARES
// ----------------------
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

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



// ----------------------
// SOCKET.IO
// ----------------------
const users = {};
function getRandomColor() {
  const colors = ["red", "blue", "green", "purple", "orange", "teal", "brown"];
  return colors[Math.floor(Math.random() * colors.length)];
}

io.on("connection", (socket) => {

  socket.on("join", (data) => {
    users[socket.id] = { name: data.name, color: getRandomColor() };
  });

  socket.on("send-location", (data) => {
    const user = users[socket.id];
    if (!user) return;

    io.emit("receive-location", {
      id: socket.id,
      name: user.name,
      color: user.color,
      latitude: data.latitude,
      longitude: data.longitude,
    });
  });

  socket.on("disconnect", () => {
    io.emit("user-disconnected", socket.id);
    delete users[socket.id];
  });

});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
