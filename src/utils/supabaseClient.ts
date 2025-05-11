// This file creates a unified Supabase client to ensure all components use the same instance
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

// Environment variables can be accessed differently depending on the framework
const getSupabaseUrl = () => {
  if (import.meta && import.meta.env) {
    // Vite-style environment variables
    return import.meta.env.VITE_SUPABASE_URL;
  } else if (typeof process !== 'undefined' && process.env) {
    // Node.js or Next.js environment variables
    return process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  }
  return '';
};

const getSupabaseAnonKey = () => {
  if (import.meta && import.meta.env) {
    // Vite-style environment variables
    return import.meta.env.VITE_SUPABASE_ANON_KEY;
  } else if (typeof process !== 'undefined' && process.env) {
    // Node.js or Next.js environment variables
    return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  }
  return '';
};

const supabaseUrl = getSupabaseUrl();
const supabaseAnonKey = getSupabaseAnonKey();

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
}

// Create a single supabase client for interacting with your database
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

// Helper function to check authentication status
export async function checkAuthentication() {
  const { data } = await supabase.auth.getSession();
  return {
    isAuthenticated: !!data.session,
    session: data.session
  };
}

// Helper to fix common Supabase issues
export async function diagnoseSupabaseConnection() {
  try {
    // Test basic connection
    const { error: healthError } = await supabase.rpc('version');
    if (healthError) {
      console.error('❌ Failed to connect to Supabase:', healthError);
      return {
        connected: false,
        error: healthError
      };
    }
    
    // Check authentication
    const { data: authData } = await supabase.auth.getSession();
    
    return {
      connected: true,
      authenticated: !!authData.session,
      userId: authData.session?.user.id
    };
  } catch (error) {
    console.error('Failed to diagnose Supabase connection:', error);
    return {
      connected: false,
      error
    };
  }
}
