import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Category } from '../types/category';

export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .order('display_order', { ascending: true })
          .order('name', { ascending: true });
        
        if (error) throw error;
        
        setCategories(data || []);
      } catch (err: unknown) {
        console.error('Error fetching categories:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch categories';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();

    // Set up real-time subscription for categories
    const subscription = supabase
      .channel('categories_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'categories' 
      }, fetchCategories)
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { categories, isLoading, error };
};
