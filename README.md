# 🧪 Virtual-Lab: Real-Time Multiplayer Physics Engine

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

Virtual-Lab is a full-stack, high-frequency physics simulation environment that allows multiple users to interact within the same kinetic workspace in real-time. Built to handle the complexities of multi-client state synchronization, this engine supports rigid body dynamics, multi-segment flexible constraints (ropes/springs), and real-time kinematic data charting.

## ✨ Key Technical Features

* **Bi-Directional State Authority:** Implements a Host/Guest authority model. The Host calculates the core physics loop at 60fps and broadcasts coordinates via `socket.volatile`, while Guests smoothly interpolate the data. If a Guest drags an object, local authority is temporarily hijacked and override coordinates are transmitted back to the Host.
* **Fault-Tolerant Host Migration:** If the session Host disconnects, the backend server automatically detects the dropped socket, promotes the next available Guest to Host status, and hands over physics computation authority without dropping the simulation frame rate.
* **Complex Multi-Segment Constraints:** Upgraded from standard rigid constraints to dynamically generated, multi-segment physical ropes utilizing Matter.js composite bodies and pivot joints for hyper-realistic flexibility.
* **Cloud Experiment Serialization:** Complete serialization of the Matter.js physics world (bodies, coordinates, and constraints) into MongoDB, allowing users to save complex laboratory setups and load them across any shared network room.
* **Live Kinematic Analytics:** Tracks targeted bodies and calculates real-time velocity and kinetic energy, streaming the data into a throttling state manager for smooth Recharts visualization.

## 🛠️ Tech Stack

**Frontend:**
* React (Vite)
* Tailwind CSS (Styling & UI)
* Matter.js (2D Physics Engine)
* Recharts (Data Visualization)
* Socket.io-client (WebSockets)

**Backend:**
* Node.js & Express (REST API & Server)
* Socket.io (High-frequency data relay)
* MongoDB & Mongoose (Database & Schemas)

## 🚀 Getting Started

Follow these instructions to run a local instance of the Virtual-Lab.

### 1. Clone the repository
```bash
git clone [https://github.com/](https://github.com/)vaib-pod/Virtual-Lab.git
cd Virtual-Lab
```

### 2. Setup the backend

```bash
cd backend
npm install
```
Create a .env file in the backend directory and add your MongoDB connection string:
```bash
PORT=5000
MONGO_URI=your_mongodb_connection_string_here
```
Start the backend server:
```bash
npm run dev
```

### 3. Setup the frontend
```bash
cd frontend
npm install
npm run dev
```

### 4. Test the Multiplayer Engine

- Open http://localhost:5173 in your browser.
- Click Local Mode, enter a username, and click Create New Shared Lab. Note the generated 6-character room code.
- Open a completely separate browser or an Incognito window and navigate to http://localhost:5173.
- Enter a different username, paste the room code, and click Join.
- Start spawning and throwing blocks on one screen, and watch the physics synchronize flawlessly on the other!

### Architecture Highlights: The Agent Middleware
Synchronizing a physics engine across multiple browsers requires strict state management to prevent "rubber-banding" (where objects snap back and forth).

To solve this, Virtual-Lab uses an Agent Middleware pattern. Instead of every client calculating their own gravity and colliding with each other, the room assigns one client as the "Host". The backend acts purely as an ultra-fast relay router. The Host computes the physics and pushes the results to the Guests. If the Host leaves, the Node.js server intercepts the disconnect event, queries the room's socket pool, and instantly promotes a new Host to keep the simulation alive.


