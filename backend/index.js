require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http'); 
const { Server } = require('socket.io'); 
const Experiment = require('./models/Experiment');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", 
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json()); 

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected Successfully'))
  .catch((err) => console.error('❌ MongoDB Connection Error:', err));

// --- REST API ENDPOINTS ---
app.get('/api/experiments', async (req, res) => {
  try {
    const experiments = await Experiment.find().sort({ createdAt: -1 });
    res.json(experiments);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch experiments' });
  }
});

app.post('/api/experiments', async (req, res) => {
  try {
    const { name, data } = req.body;
    if (!name || !data) return res.status(400).json({ error: 'Name and data are required' });
    const newExperiment = new Experiment({ name, data });
    const savedExperiment = await newExperiment.save();
    res.status(201).json(savedExperiment);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save experiment' });
  }
});

app.delete('/api/experiments/:id', async (req, res) => {
  try {
    await Experiment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Experiment deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete experiment' });
  }
});

// ==========================================
// --- MULTIPLAYER ENGINE + HOST MIGRATION ---
// ==========================================
io.on('connection', (socket) => {
  console.log(`⚡ A user connected: ${socket.id}`);

  // 1. Join Room & Tag Socket Data
  socket.on('join-room', ({ name, code }) => {
    socket.join(code);
    
    // Save metadata on this specific socket instance for lifecycle management
    socket.roomCode = code;
    socket.userName = name;

    const room = io.sockets.adapter.rooms.get(code);
    const numUsers = room ? room.size : 0;
    
    // First user is Host, subsequent users are Guests
    const isHost = numUsers === 1;
    socket.isHost = isHost;

    console.log(`👤 ${name} joined ${code}. Host status: ${isHost}`);
    socket.emit('room-joined', { isHost, code });

    // Streamlined: Emit generic room notification instead of separate custom triggers
    socket.to(code).emit('room-notification', { 
      message: `${name} has entered the laboratory.`,
      type: 'info'
    });
  });

  // 2. High-frequency Volatile Physics Sync
  socket.on('sync-physics', (data) => {
    socket.volatile.to(data.roomCode).emit('physics-updated', data.bodies);
  });

  // 3. Discrete Simulation Triggers
  socket.on('action-spawn', (data) => {
    socket.to(data.roomCode).emit('remote-spawn', data);
  });

  socket.on('action-clear', (roomCode) => {
    socket.to(roomCode).emit('remote-clear');
  });

  socket.on('action-link', (data) => {
    socket.to(data.roomCode).emit('remote-link', data);
  });

  socket.on('guest-dragging', (data) => {
    socket.to(data.roomCode).emit('host-override-drag', data);
  });

  // 4. Lifecycle Disconnect & Authority Migration
  socket.on('disconnect', async () => {
    console.log(`🛑 User disconnected: ${socket.id} (${socket.userName || 'Unknown'})`);
    
    const roomCode = socket.roomCode;
    if (!roomCode) return;

    // Check if the user who dropped out was holding the physics authority
    if (socket.isHost) {
      console.log(`👑 Host (${socket.userName}) left room ${roomCode}. Fetching backup hosts...`);
      
      // Look up remaining connections inside this specific room channel
      const remainingSockets = await io.in(roomCode).fetchSockets();

      if (remainingSockets.length > 0) {
        // Elect the next available player in line
        const newHostSocket = remainingSockets[0];
        newHostSocket.isHost = true;

        // Command that specific client to activate its physics computation engine
        newHostSocket.emit('host-promoted');

        // Broadcast the change of authority to everyone left in the room
        io.to(roomCode).emit('room-notification', {
          message: `${newHostSocket.userName || 'A guest user'} has been promoted to Host. Simulation resumed! 👑`,
          type: 'success'
        });
      } else {
        console.log(`🏠 Room ${roomCode} is now empty. Deleting runtime instance context.`);
      }
    } else {
      // Just a normal guest left, send standard warning toast
      if (socket.userName) {
        socket.to(roomCode).emit('room-notification', {
          message: `${socket.userName} has left the laboratory.`,
          type: 'warning'
        });
      }
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});