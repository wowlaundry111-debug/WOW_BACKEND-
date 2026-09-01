import { io, Socket } from 'socket.io-client';
import { BASE_URL } from './api';

const socketUrl = BASE_URL.replace('/api', '');

export const socket: Socket = io(socketUrl, {
  autoConnect: false,
  transports: ['websocket', 'polling'],
});

export const connectSocket = () => {
  if (!socket.connected) {
    socket.connect();
  }
};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};
