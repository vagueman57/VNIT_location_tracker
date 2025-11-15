# 🌍 Real-Time Location Tracker App

A **real-time, multi-user location tracking web application** built using **Node.js, Express, Socket.io, and Leaflet.js**.  
Each user can share their live location, see others move in real-time on a map, and view movement trails with personalized markers and names.

---

## 🚀 Features

### 🧭 Real-Time Tracking
- Continuously tracks each user's live position using **Geolocation API**.
- Updates all connected clients instantly via **WebSockets (Socket.io)**.

### 👤 Custom User Names & Colored Markers
- Users can enter their display name before joining the map.
- Each user is assigned a **unique color** marker for easy identification.
- Markers display the user's name directly above their position.

### 🗺️ Movement Trails
- Each user’s travel path is drawn as a **colored polyline**.
- Trails update dynamically as the user moves.
- Trails automatically match the user’s assigned marker color.

### 🔄 Real-Time Multi-User Sync
- When a user moves, all other connected users see their updated position and trail instantly.
- When a user disconnects, their marker and trail are automatically removed.

### 🧩 Built with Simplicity
- No authentication or database required (can be added later).
- Clean UI with responsive design.
- Perfect for demonstrations, IoT tracking, delivery systems, or team coordination projects.

---

## 🏗️ Project Structure

