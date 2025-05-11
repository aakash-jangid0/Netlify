import { createContext } from 'react';
import { Socket } from 'socket.io-client';
import { SocketContextType } from '../../types/socket';

export const SocketContext = createContext<SocketContextType | null>(null);