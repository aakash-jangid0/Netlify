import { createClient } from '@supabase/supabase-js';

// Create an anonymous supabase client that doesn't require authentication
// for performance review operations
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if environment variables are available
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables for performance review client');
}

export const performanceReviewClient = createClient(supabaseUrl || '', supabaseAnonKey || '');

/**
 * Adds a performance review without requiring authentication
 */
export const addPerformanceReview = async (review: any) => {
  const { data, error } = await performanceReviewClient
    .from('staff_performance_reviews')
    .insert([review])
    .select();
    
  if (error) {
    console.error('Error inserting performance review:', error);
    throw error;
  }
  
  return data;
};

/**
 * Updates a performance review without requiring authentication
 */
export const updatePerformanceReview = async (id: string, updates: any) => {
  const { data, error } = await performanceReviewClient
    .from('staff_performance_reviews')
    .update(updates)
    .eq('id', id)
    .select();
    
  if (error) {
    console.error('Error updating performance review:', error);
    throw error;
  }
  
  return data;
};

/**
 * Deletes a performance review without requiring authentication
 */
export const deletePerformanceReview = async (id: string) => {
  const { error } = await performanceReviewClient
    .from('staff_performance_reviews')
    .delete()
    .eq('id', id);
    
  if (error) {
    console.error('Error deleting performance review:', error);
    throw error;
  }
};

/**
 * Gets all performance reviews for a staff member without requiring authentication
 */
export const getStaffPerformanceReviews = async (staffId: string) => {
  const { data, error } = await performanceReviewClient
    .from('staff_performance_reviews')
    .select('*')
    .eq('staff_id', staffId)
    .order('review_date', { ascending: false });
    
  if (error) {
    console.error('Error fetching performance reviews:', error);
    throw error;
  }
  
  return data;
};
