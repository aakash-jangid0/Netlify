import React, { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../auth/AuthContext';
import { SocketContext } from './SocketContext';
import { SOCKET_OPTIONS } from '../../config/socket';

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const { user } = useAuth();

  // Connect socket function - moved inside useEffect to avoid dependency issues
  useEffect(() => {
    let currentSocket: Socket | null = null;
    
    const connect = async () => {
      if (currentSocket?.connected) return;
      
      setConnecting(true);
      
      try {
        // First try to get the socket port from the API
        console.log('Fetching socket port from API...');
        const portResponse = await fetch('http://localhost:5000/api/socket-port')
          .then(res => res.json())
          .catch(() => ({ port: null }));
        
        const port = portResponse.port || 5000;
        console.log(`Connecting to WebSocket server on port ${port}`, { portResponse });
        
        const newSocket = io(`http://localhost:${port}`, {
          ...SOCKET_OPTIONS,
          auth: user ? { token: user.id, user } : { token: 'guest', user: null },
        });
        
        // Manually connect since autoConnect is false
        newSocket.connect();
        
        currentSocket = newSocket;
        setSocket(newSocket);
        
        console.log('Socket instance created and connecting...');
      } catch (error) {
        console.error('Error connecting to socket:', error);
      } finally {
        setConnecting(false);
      }
    };

    const disconnect = () => {
      if (currentSocket) {
        currentSocket.disconnect();
        currentSocket = null;
        setSocket(null);
        setIsConnected(false);
      }
    };

    // Connect on mount or when user changes
    connect();

    return () => {
      disconnect();
    };
  }, [user]); // Only depend on user changes

  // Update connection status
  useEffect(() => {
    if (!socket) return;

    const handleConnect = () => {
      console.log('Socket connected successfully');
      setIsConnected(true);
    };
    const handleDisconnect = () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    };
    
    const handleConnectError = (error: Error) => {
      console.error('Socket connection error:', error);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
    };
  }, [socket]);

  return (
    <SocketContext.Provider value={{ 
      socket, 
      isConnected, 
      connecting,
      connect: () => {}, // Empty function - connection is managed internally
      disconnect: () => {} // Empty function - disconnection is managed internally
    }}>
      {children}
    </SocketContext.Provider>
  );
}