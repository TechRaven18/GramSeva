const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const connectDB = require('./config/db');

// Connect to MongoDB Database
connectDB();

const app = express();

// Middleware
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static uploads route for uploaded images
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/uploads', express.static(path.join(__dirname, './uploads')));

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/locations', require('./routes/locationRoutes'));
app.use('/api/complaints', require('./routes/complaintRoutes'));
app.use('/api/rewards', require('./routes/rewardRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'Panchayat & Municipality Civic Issue Management System API',
    timestamp: new Date()
  });
});

// 404 Route Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'API Endpoint not found.' });
});

const http = require('http');
const { initSocket } = require('./config/socket');

const PORT = process.env.PORT || 5002;
const server = http.createServer(app);

// Initialize Socket.IO WebSocket Engine
const io = initSocket(server);

server.listen(PORT, () => {
  console.log(`[Panchayat Backend Server] Running on port ${PORT}`);
  console.log(`[Socket.IO Engine] Real-time WebSockets active on port ${PORT}`);
  console.log(`[Static Uploads Path] http://localhost:${PORT}/uploads`);
});
