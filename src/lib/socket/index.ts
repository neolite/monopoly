import { io, Socket } from 'socket.io-client';
import { ClientToServerEvents, ServerToClientEvents } from '@/types/socket';

// Socket.IO client instance
let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

// Initialize Socket.IO client
export const initializeSocket = (): Socket<ServerToClientEvents, ClientToServerEvents> => {
  if (!socket) {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
    socket = io(socketUrl);
    
    // Setup default event handlers
    socket.on('connect', () => {
      console.log('Connected to Socket.IO server');
    });
    
    socket.on('disconnect', () => {
      console.log('Disconnected from Socket.IO server');
    });
    
    socket.on('error', (message) => {
      console.error('Socket.IO error:', message);
    });
  }
  
  return socket;
};

// Get Socket.IO client instance
export const getSocket = (): Socket<ServerToClientEvents, ClientToServerEvents> => {
  if (!socket) {
    return initializeSocket();
  }
  return socket;
};

// Disconnect Socket.IO client
export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
