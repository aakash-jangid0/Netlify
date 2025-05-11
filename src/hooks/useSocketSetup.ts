import { useEffect, useCallback } from 'react';
import { useSocket } from './useSocket';
import { toast } from 'react-hot-toast';

export const useSocketSetup = () => {
  const { socket, connect, disconnect } = useSocket();

  const handleConnect = useCallback(() => {
    console.log('Socket connected successfully');
  }, []);

  const handleDisconnect = useCallback((reason: string) => {
    console.log('Socket disconnected:', reason);
    if (reason === 'io server disconnect') {
      // Server disconnected us, try to reconnect
      connect();
    }
  }, [connect]);

  const handleConnectError = useCallback((error: Error) => {
    console.error('Socket connection error:', error);
    // Only show error toast once
    toast.error('Unable to connect to server. Retrying...', {
      id: 'socket-connection-error',
    });
  }, []);

  const handleReconnectAttempt = useCallback((attemptNumber: number) => {
    console.log(`Attempting to reconnect... (${attemptNumber})`);
  }, []);

  const handleReconnectError = useCallback((error: Error) => {
    console.error('Socket reconnection error:', error);
  }, []);

  const handleReconnectFailed = useCallback(() => {
    console.error('Socket reconnection failed');
    toast.error('Unable to reconnect to server. Please refresh the page.', {
      id: 'socket-reconnection-failed',
    });
  }, []);

  useEffect(() => {
    if (!socket) return;

    // Socket event listeners
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);
    socket.on('reconnect_attempt', handleReconnectAttempt);
    socket.on('reconnect_error', handleReconnectError);
    socket.on('reconnect_failed', handleReconnectFailed);

    // Cleanup
    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      socket.off('reconnect_attempt', handleReconnectAttempt);
      socket.off('reconnect_error', handleReconnectError);
      socket.off('reconnect_failed', handleReconnectFailed);
    };
  }, [
    socket,
    handleConnect,
    handleDisconnect,
    handleConnectError,
    handleReconnectAttempt,
    handleReconnectError,
    handleReconnectFailed,
  ]);

  return { socket };
};