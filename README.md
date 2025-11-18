# 🚀 VNIT Campus Navigation & Live Tracking App  
**Real-time location sharing • Campus-level shortest path routing • Secure authentication**

A full-stack real-time navigation system built specifically for **VNIT Nagpur students**, especially freshers who struggle to find places inside the campus.  
The app provides:

- Live GPS tracking  
- Smart campus routing  
- Shortest path using A*  
- Step-by-step directions  
- JWT-secured login system  
- Real-time updates via Socket.IO  

---

## 📌 Table of Contents
- [About the Project](#about-the-project)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [Sequence Flow](#sequence-flow)
- [ER Diagram](#er-diagram)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [How Routing Works (A*)](#how-routing-works-a)
- [Future Improvements](#future-improvements)
- [Author](#author)

---

# 📖 About the Project

When new students join VNIT, they often struggle to find departments, lecture halls, hostels, labs, and event venues.  
I faced the same issue in my first year.

So I built a **VNIT-only navigation system** — a campus map where students can:

- See their live location  
- Search any building/hostel/lab  
- Get shortest walking paths  
- See other students moving on the map  

This is not a Google Maps clone — it's a **custom campus navigation engine**.

---

# ⭐ Features

### 🔐 Authentication
- JWT cookie-based login  
- Protected homepage  
- Cannot access map without login  

### 🗺️ Live Tracking
- Real-time GPS updates with Socket.IO  
- Each user has a unique marker  
- Trails showing movement history  

### 📍 Smart Campus Navigation
- Search bar for campus places  
- Shortest route using A\* algorithm  
- Turn-by-turn instructions  
- Automatic map focusing  

### 🎨 User-Friendly UI
- LeafletJS map  
- Beautiful search bar & directions UI  
- Fully responsive  

---

# 🛠️ Tech Stack

### **Frontend**
- HTML, CSS
- Leaflet.js
- JavaScript
- Socket.IO client

### **Backend**
- Node.js
- Express.js
- JWT Authentication
- Socket.IO

### **Database**
- MongoDB Atlas

### **Algorithms**
- A\* (A-Star) for shortest path  
- Haversine distance  
- Compass-based direction generation  

---

# 🧱 System Architecture
```
Browser (Leaflet + JS + Socket.IO)
│
│ Websocket + REST
▼
Express.js Backend
(Auth + Routing + Socket server)
│
│ Login + User data
▼
MongoDB Atlas
```
---

# 🔄 Sequence Flow

1. User visits site → Redirected to /login
2. User logs in → JWT cookie created
3. protect() checks cookie → Loads map
4. Script gets GPS → Sends location via Socket.IO
5. Server broadcasts locations to all clients
6. User searches a place → A* computes route
7. Route + directions shown on map

---

# 🗄️ ER Diagram (MongoDB)
```
┌───────────────────────────┐
│ User │
├───────────────────────────┤
│ _id: ObjectId │
│ name: String │
│ email: String (unique) │
│ password: String │
│ role: "admin" | "user" │
└───────────────────────────┘
```
---

# 📂 Project Structure
```
.
|-- app.js
|-- package.json
|-- models/
| └── user.js
|-- middleware/
| └── authMiddleware.js
|-- routes/
| └── authRoutes.js
|-- public/
| |-- css/style.css
| |-- js/script.js
| └── data/campus_graph.json
|-- views/
| ├── login.ejs
| └── index.ejs
|-- .env

```
---

# ⚙️ Installation

### 1. Clone Repo
```bash
git clone https://github.com/<username>/<repo>
cd repo
```
2. Install Dependencies
```
 npm install
```
3. Configure .env
```
MONGO_URI=your_mongo_url
JWT_SECRET=your_secret
PORT=8000
```
4. Start Server
```
node app.js 
```
# 🔐 Environment Variables
| Variable     | Description                     |
| ------------ | ------------------------------- |
| `MONGO_URI`  | MongoDB Atlas connection string |
| `JWT_SECRET` | Secret key for JWT token        |
| `PORT`       | Server port                     |

## 🧭 How Routing Works (A*)
* Campus is converted into graph nodes
* Each node has connections (edges)
* Haversine formula calculates distances
* A* algorithm finds the optimal path
* Route drawn on Leaflet map
* Directions generated using bearing angles

## 🚀 Future Improvements
* Voice navigation
* Indoor building navigation
* Friend visibility control
* Push notifications
* Mobile app (React Native)

## 👤 Author
* Rajiv Indoliya
* Email: rajiv1jan21@gmail.com
* LinkedIn: https://www.linkedin.com/in/rajiv-indoliya-2203a3259/
* GitHub: https://github.com/vagueman57