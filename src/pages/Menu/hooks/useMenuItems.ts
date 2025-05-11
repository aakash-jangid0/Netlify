import { useState, useEffect } from 'react';
import { MenuItem } from '../../../types/menu';
import { supabase } from '../../../lib/supabase';

export function useMenuItems() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        // Fetch from Supabase
        const { data, error } = await supabase
          .from('menu_items')
          .select('*');
        
        if (error) {
          throw error;
        }
        
        if (data && data.length > 0) {
          // Map snake_case column names to camelCase for frontend
          const formattedData = data.map(item => ({
            id: item.id,
            name: item.name,
            description: item.description,
            price: item.price,
            image: item.image,
            category: item.category,
            preparationTime: item.preparation_time,
            isAvailable: item.is_available
          }));
          
          setMenuItems(formattedData);
        } else {
          // Instead of showing mock data, just show an empty array
          setMenuItems([]);
          console.log('No menu items found in database');
        }
        setError(null);
      } catch (err: any) {
        console.error('Error fetching menu items:', err);
        setError(err.message || 'Failed to fetch menu items');
        // Instead of showing mock data on error, just show an empty array
        setMenuItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMenuItems();
  }, []);

  return { menuItems, isLoading, error };
}