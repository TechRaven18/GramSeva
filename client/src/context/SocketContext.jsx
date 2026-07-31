import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const { user, isAuthenticated, role } = useAuth();

  useEffect(() => {
    // Dynamic Socket URL Resolution for Local Development & Cloud Deployment (Render)
    const backendUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || 
      (window.location.hostname === 'localhost' ? 'http://localhost:5002' : 
      (window.location.hostname.includes('onrender.com') ? `https://${window.location.hostname.replace('frontend', 'backend')}` : ''));

    const socketInstance = io(backendUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });

    socketInstance.on('connect', () => {
      console.log('⚡ [Socket.IO Client Connected] ID:', socketInstance.id);
      setConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('🔌 [Socket.IO Client Disconnected]');
      setConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  // Join User Rooms based on role & authenticated identity
  useEffect(() => {
    if (socket && connected && isAuthenticated && user) {
      if (role === 'CITIZEN' && user._id) {
        socket.emit('join:citizen', user._id);
      }

      if (role === 'STAFF') {
        if (user.assignedJurisdictions && user.assignedJurisdictions.length > 0) {
          user.assignedJurisdictions.forEach(j => {
            const jId = j._id || j;
            socket.emit('join:jurisdiction', jId);
          });
        } else if (user.jurisdiction?.jurisdictionId) {
          socket.emit('join:jurisdiction', user.jurisdiction.jurisdictionId);
        }
      }

      if (role === 'ADMIN') {
        socket.emit('join:admin');
      }
    }
  }, [socket, connected, isAuthenticated, user, role]);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  return useContext(SocketContext) || { socket: null, connected: false };
};
