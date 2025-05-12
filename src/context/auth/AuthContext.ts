import { useContext } from 'react';
import { User } from '@supabase/supabase-js';
import { AuthContext as MainAuthContext } from '../AuthContext';

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, phone?: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export function useAuth(): AuthContextType {
  const context = useContext(MainAuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
