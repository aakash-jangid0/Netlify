import express from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory name properly in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the server directory
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

console.log('Menu route - SUPABASE_URL:', supabaseUrl ? 'Set ✓' : 'Not set ✗');
console.log('Menu route - SUPABASE_ANON_KEY:', supabaseKey ? 'Set ✓' : 'Not set ✗');

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Supabase environment variables missing in menu route!');
}

const supabase = createClient(supabaseUrl, supabaseKey);

const router = express.Router();

// Get all menu items
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*');
    
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add a new menu item
router.post('/', async (req, res) => {
  const { name, description, price, category } = req.body;
  
  try {
    const { data: newItem, error } = await supabase
      .from('menu_items')
      .insert([{
        name,
        description,
        price,
        category,
      }])
      .select()
      .single();
    
    if (error) throw error;
    res.status(201).json(newItem);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update an existing menu item
router.put('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('menu_items')
      .update(req.body)
      .eq('id', req.params.id)
      .select()
      .single();
    
    if (error) throw error;
    if (!data) return res.status(404).json({ message: 'Menu item not found' });
    res.json(data);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a menu item
router.delete('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('menu_items')
      .delete()
      .eq('id', req.params.id)
      .select()
      .single();
    
    if (error) throw error;
    if (!data) return res.status(404).json({ message: 'Menu item not found' });
    res.json({ message: 'Menu item deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
