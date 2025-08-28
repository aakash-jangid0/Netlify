import { createContext } from 'react';
import { SocketContextType } from '../../types/socket';

// Create the context with a default undefined value
export const SocketContext = createContext<SocketContextType | undefined>(undefined);