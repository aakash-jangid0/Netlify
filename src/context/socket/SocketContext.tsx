import { createContext } from 'react';
import { SocketContextType } from '../../types/socket';

export const SocketContext = createContext<SocketContextType | undefined>(undefined);