import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper function to ensure user is authenticated before accessing customer data
export async function getAuthenticatedClient() {
  const session = await supabase.auth.getSession();
  
  if (!session.data.session) {
    throw new Error('Authentication required to access customer data');
  }
  
  return supabase;
}
