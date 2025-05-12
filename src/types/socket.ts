import { Socket } from 'socket.io-client';

export interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
  connecting?: boolean;
  lastPing?: number | null;
  reconnectAttempts?: number;
}

export interface SocketProviderProps {
  children: React.ReactNode;
}