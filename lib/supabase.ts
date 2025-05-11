import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper function to check if a user is authenticated before operations
// This can be used to debug auth-related issues
export async function checkAuthentication() {
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) {
    console.warn('Not authenticated: This might cause RLS policy violations');
    return false;
  }
  return true;
}
