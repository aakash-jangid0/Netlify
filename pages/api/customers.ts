import { NextApiRequest, NextApiResponse } from 'next';
import { getAuthenticatedClient } from '../../utils/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const supabase = await getAuthenticatedClient();
    
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('customers')
        .select('*');
      
      if (error) throw error;
      return res.status(200).json(data);
    } 
    else if (req.method === 'POST') {
      const { data, error } = await supabase
        .from('customers')
        .insert([req.body])
        .select();
      
      if (error) throw error;
      return res.status(201).json(data);
    }
    // Handle other HTTP methods as needed
    
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
