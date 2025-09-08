import { useState, useEffect, useRef } from 'react';
import { MenuItem } from '../types/menu';
import { supabase } from '../lib/supabase';

// Cache mechanism to avoid refetching data
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes
let cachedMenuItems: MenuItem[] | null = null;
let lastFetchTime = 0;

export function useMenuItems(pageSize = 10) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMoreItems, setHasMoreItems] = useState(true);
  const [page, setPage] = useState(0);
  
  // To prevent redundant fetches during rapid scrolling
  const fetchInProgress = useRef(false);

  // Initial fetch
  useEffect(() => {
    const fetchInitialMenuItems = async () => {
      try {
        // Check if we have valid cached data
        const currentTime = Date.now();
        if (cachedMenuItems && currentTime - lastFetchTime < CACHE_EXPIRY) {
          setMenuItems(cachedMenuItems);
          setIsLoading(false);
          return;
        }
        
        setIsLoading(true);
        const { data, error } = await supabase
          .from('menu_items')
          .select('*')
          .range(0, pageSize - 1)
          .order('id', { ascending: true });
          
        if (error) throw error;
        
        if (data) {
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
          cachedMenuItems = formattedData;
          lastFetchTime = currentTime;
          
          // Check if we have more items to load
          setHasMoreItems(data.length === pageSize);
        }
        setError(null);
      } catch (err: unknown) {
        console.error('Error fetching menu items:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch menu items';
        setError(errorMessage);
        setMenuItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialMenuItems();
  }, [pageSize]);

  // Function to load more items
  const loadMore = async () => {
    // Prevent multiple simultaneous fetches
    if (fetchInProgress.current || !hasMoreItems) return;
    
    fetchInProgress.current = true;
    try {
      const nextPage = page + 1;
      const start = nextPage * pageSize;
      const end = start + pageSize - 1;
      
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .range(start, end)
        .order('id', { ascending: true });
        
      if (error) throw error;
      
      if (data && data.length > 0) {
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
        
        setMenuItems(prevItems => [...prevItems, ...formattedData]);
        setPage(nextPage);
        
        // Update cached data
        if (cachedMenuItems) {
          cachedMenuItems = [...cachedMenuItems, ...formattedData];
          lastFetchTime = Date.now();
        }
        
        // Check if we have more items to load
        setHasMoreItems(data.length === pageSize);
      } else {
        setHasMoreItems(false);
      }
    } catch (err: unknown) {
      console.error('Error loading more menu items:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load more menu items';
      setError(errorMessage);
    } finally {
      fetchInProgress.current = false;
    }
  };

  return { menuItems, isLoading, error, hasMoreItems, loadMore };
}