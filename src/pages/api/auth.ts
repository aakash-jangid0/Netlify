import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../lib/supabase';

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  // Get the user's session
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error) {
    return res.status(500).json({ 
      error: error.message,
      details: 'Failed to get auth session'
    });
  }

  if (!session) {
    return res.status(401).json({ 
      authenticated: false,
      message: 'Not authenticated. This will cause RLS policy violations.' 
    });
  }

  // Check if we can access the customers table
  const { data: testData, error: testError } = await supabase
    .from('customers')
    .select('count(*)')
    .limit(1);

  return res.status(200).json({
    authenticated: true,
    user: session.user,
    testAccess: {
      success: !testError,
      error: testError ? testError.message : null,
      data: testData
    }
  });
}
