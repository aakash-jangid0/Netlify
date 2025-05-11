import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    let newSocket: Socket | null = null;
    let isAborted = false;

    const initializeSocket = async () => {
      try {
        // First, try to get the dynamic WebSocket port from the server
        const portResponse = await fetch('http://localhost:5000/api/socket-port')
          .then(res => {
            if (!res.ok) throw new Error('Failed to fetch socket port');
            return res.json();
          })
          .catch(() => ({ port: null }));

        if (isAborted) return;
        
        // If we got a port, use it; otherwise, try the potential ports one by one
        if (portResponse.port) {
          connectToSocket(portResponse.port);
        } else {
          // Try different ports sequentially
          const ports = [5000, 5001, 5002, 5003, 5004, 5005];
          tryNextPort(ports, 0);
        }
      } catch (error) {
        console.error('Error initializing socket:', error);
        // Try connecting directly to default ports if API fails
        const ports = [5000, 5001, 5002, 5003, 5004, 5005];
        tryNextPort(ports, 0);
      }
    };

    const tryNextPort = (ports: number[], index: number) => {
      if (isAborted) return;
      
      if (index >= ports.length) {
        console.error('Could not connect to any WebSocket server port');
        return;
      }

      console.log(`Attempting to connect to WebSocket on port ${ports[index]}...`);
      connectToSocket(ports[index], () => {
        // If connection fails, try the next port
        setTimeout(() => tryNextPort(ports, index + 1), 1000);
      });
    };

    const connectToSocket = (port: number, onError?: () => void) => {
      if (isAborted) return;

      if (newSocket) {
        newSocket.close();
      }

      newSocket = io(`http://localhost:${port}`, {
        transports: ['websocket', 'polling'],
        autoConnect: true,
        reconnectionAttempts: 3,
        reconnectionDelay: 1000,
        timeout: 5000, // Reduced timeout for faster fallback
        auth: user ? { token: user.id } : { token: null }
      });

      let connectionTimeout: NodeJS.Timeout | null = setTimeout(() => {
        console.log(`Connection to port ${port} timed out`);
        if (onError) onError();
      }, 3000);

      newSocket.on('connect', () => {
        if (connectionTimeout) {
          clearTimeout(connectionTimeout);
          connectionTimeout = null;
        }
        
        console.log(`Connected to Socket.IO server on port ${port} with ID:`, newSocket?.id);
        setIsConnected(true);
        setSocket(newSocket);
      });

      newSocket.on('connect_error', (error) => {
        console.error(`Socket.IO connection error on port ${port}:`, error.message);
        if (connectionTimeout) {
          clearTimeout(connectionTimeout);
          connectionTimeout = null;
        }
        
        if (onError) onError();
      });

      newSocket.on('disconnect', (reason) => {
        console.log(`Disconnected from Socket.IO server on port ${port}:`, reason);
        setIsConnected(false);
      });
    };

    initializeSocket();

    // Cleanup function
    return () => {
      isAborted = true;
      if (newSocket) {
        newSocket.close();
      }
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}