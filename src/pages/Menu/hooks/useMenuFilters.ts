import { useState, useMemo } from 'react';
import { MenuItem } from '../../../types/menu';
import { useMenuItems } from './useMenuItems';

export interface MenuFilters {
  priceRange: [number, number];
  selectedCategories: string[];
  sortBy: string;
  spiceLevels: string[];
  dietaryTags: string[];
}

export function useMenuFilters() {
  const [searchQuery, setSearchQuery] = useState('');
  const [quickCategory, setQuickCategory] = useState('all');
  const [filters, setFilters] = useState<MenuFilters>({
    priceRange: [0, 2000],
    selectedCategories: [],
    sortBy: 'popular',
    spiceLevels: [],
    dietaryTags: [],
  });

  // Get menu items from Supabase
  const { menuItems, isLoading } = useMenuItems();
  
  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      // Basic filters
      const matchesSearch = !searchQuery || 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = quickCategory === 'all' || item.category === quickCategory;
      const matchesPrice = item.price >= filters.priceRange[0] && item.price <= filters.priceRange[1];

      // Category filter
      const matchesSelectedCategories = filters.selectedCategories.length === 0 ||
                                      filters.selectedCategories.includes(item.category);
      
      // We'll show all items (available and unavailable) but handle their display differently in UI
      return matchesSearch && matchesCategory && matchesPrice && matchesSelectedCategories;
    });
  }, [searchQuery, quickCategory, filters]);

  return {
    searchQuery,
    setSearchQuery,
    quickCategory,
    setQuickCategory,
    filters,
    setFilters,
    filteredItems,
    isLoading
  };
}