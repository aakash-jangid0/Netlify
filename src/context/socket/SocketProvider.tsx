import React, { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../auth/AuthContext';
import { SocketContext } from './SocketContext';
import { SOCKET_URL, SOCKET_OPTIONS } from '../../config/socket';

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuth();

  const connect = useCallback(() => {
    if (socket?.connected) return;

    const newSocket = io(SOCKET_URL, {
      ...SOCKET_OPTIONS,
      auth: user ? { token: user.id } : undefined,
    });

    setSocket(newSocket);
  }, [socket, user]);

  const disconnect = useCallback(() => {
    if (!socket) return;
    socket.disconnect();
    setSocket(null);
    setIsConnected(false);
  }, [socket]);

  // Connect socket when user is authenticated
  useEffect(() => {
    if (user) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [user, connect, disconnect]);

  // Update connection status
  useEffect(() => {
    if (!socket) return;

    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
    };
  }, [socket]);

  return (
    <SocketContext.Provider value={{ socket, isConnected, connect, disconnect }}>
      {children}
    </SocketContext.Provider>
  );
}