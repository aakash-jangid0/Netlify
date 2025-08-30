import express from 'express';
import { supabase } from '../lib/supabase.js';
import { auth as authMiddleware, requireAdmin as adminMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Get all customers
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    res.json(data);
  } catch (error) {
    console.error('Error fetching customers:', error.message);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// Get customer by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', req.params.id)
      .single();
    
    if (error) throw error;
    
    if (!data) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    res.json(data);
  } catch (error) {
    console.error(`Error fetching customer with ID ${req.params.id}:`, error.message);
    res.status(500).json({ error: 'Failed to fetch customer' });
  }
});

export default router;
