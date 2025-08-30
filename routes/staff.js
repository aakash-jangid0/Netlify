import express from 'express';
import { supabase } from '../lib/supabase.js';
import { auth as authMiddleware, requireAdmin as adminMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Get all staff members (admins only)
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'staff')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    res.json(data);
  } catch (error) {
    console.error('Error fetching staff:', error.message);
    res.status(500).json({ error: 'Failed to fetch staff members' });
  }
});

// Get staff member by ID (admins only)
router.get('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.params.id)
      .eq('role', 'staff')
      .single();
    
    if (error) throw error;
    
    if (!data) {
      return res.status(404).json({ error: 'Staff member not found' });
    }
    
    res.json(data);
  } catch (error) {
    console.error(`Error fetching staff member with ID ${req.params.id}:`, error.message);
    res.status(500).json({ error: 'Failed to fetch staff member' });
  }
});

export default router;
