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

console.log('Categories route - SUPABASE_URL:', supabaseUrl ? 'Set ✓' : 'Not set ✗');
console.log('Categories route - SUPABASE_ANON_KEY:', supabaseKey ? 'Set ✓' : 'Not set ✗');

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Supabase environment variables missing in categories route!');
}

const supabase = createClient(supabaseUrl, supabaseKey);

const router = express.Router();

// Get all categories
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('display_order', { ascending: true })
      .order('name', { ascending: true });
    
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add a new category
router.post('/', async (req, res) => {
  const { name, slug, icon } = req.body;
  
  // If slug is not provided, create one from the name
  const categorySlug = slug || name.toLowerCase().replace(/\s+/g, '-');
  
  try {
    // Check if category with this slug already exists
    const { data: existingCategory, error: checkError } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', categorySlug)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found" error
      throw checkError;
    }
    
    if (existingCategory) {
      return res.status(400).json({ message: 'A category with this name already exists' });
    }
    
    // Insert new category
    const { data: newCategory, error: insertError } = await supabase
      .from('categories')
      .insert([{
        name,
        slug: categorySlug,
        display_order: req.body.display_order || 0,
        icon // Include the icon field
      }])
      .select()
      .single();
    
    if (insertError) throw insertError;
    
    res.status(201).json(newCategory);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update an existing category
router.put('/:id', async (req, res) => {
  try {
    const { name, slug, display_order, icon } = req.body;
    
    // If slug is being changed, check it doesn't conflict
    if (slug) {
      const { data: existingCategory, error: checkError } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', slug)
        .neq('id', req.params.id)
        .single();
      
      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }
      
      if (existingCategory) {
        return res.status(400).json({ message: 'A category with this name already exists' });
      }
    }
    
    // Update category
    const { data: updatedCategory, error: updateError } = await supabase
      .from('categories')
      .update({
        name,
        slug,
        display_order,
        icon // Include the icon field
      })
      .eq('id', req.params.id)
      .select()
      .single();
    
    if (updateError) throw updateError;
    
    if (!updatedCategory) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    res.json(updatedCategory);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a category
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', req.params.id);
    
    if (error) throw error;
    
    res.json({ message: 'Category deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
