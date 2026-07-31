const { Server } = require('socket.io');

let io = null;

/**
 * Initializes Socket.IO HTTP WebSocket Server.
 */
const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: ['http://localhost:5173', 'http://127.0.0.1:5173', process.env.CLIENT_URL || '*'],
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 [Socket.IO Connected] Client Socket ID: ${socket.id}`);

    // Join Citizen Room for targeted status updates & reward notifications
    socket.on('join:citizen', (citizenId) => {
      if (citizenId) {
        const room = `citizen_${citizenId}`;
        socket.join(room);
        console.log(`👤 [Socket.IO Room] Socket ${socket.id} joined ${room}`);
      }
    });

    // Join Staff Jurisdiction Room for local queue complaints
    socket.on('join:jurisdiction', (jurisdictionId) => {
      if (jurisdictionId) {
        const room = `jurisdiction_${jurisdictionId}`;
        socket.join(room);
        console.log(`🏛️ [Socket.IO Room] Socket ${socket.id} joined ${room}`);
      }
    });

    // Join Complaint Room for real-time comment feed & details timeline
    socket.on('join:complaint', (complaintId) => {
      if (complaintId) {
        const room = `complaint_${complaintId}`;
        socket.join(room);
        console.log(`📋 [Socket.IO Room] Socket ${socket.id} joined ${room}`);
      }
    });

    // Join Admin Global Channel
    socket.on('join:admin', () => {
      socket.join('admin_global');
      console.log(`🛡️ [Socket.IO Room] Socket ${socket.id} joined admin_global`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 [Socket.IO Disconnected] Client Socket ID: ${socket.id}`);
    });
  });

  return io;
};

/**
 * Helper to retrieve initialized Socket.IO instance.
 */
const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO is not initialized!');
  }
  return io;
};

module.exports = { initSocket, getIO };
