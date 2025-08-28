import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

// Use hardcoded values since .env file is not deployed
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://xeetynafcpofbzpgrsvn.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhlZXR5bmFmY3BvZmJ6cGdyc3ZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU2OTA4NzEsImV4cCI6MjA2MTI2Njg3MX0.CBFoP91g402Gag7FvnH7Q0ODYHx-WvolbKB5mVrc40E';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  db: {
    schema: 'public'
  }
});

export type { Database };