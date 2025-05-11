import { useState, useCallback } from 'react';
import { searchMenuItems } from '../utils/menuUtils';
import { MenuItem } from '../../../types/menu';

export function useMenuSearch() {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = useCallback((items: MenuItem[]) => {
    return searchMenuItems(items, searchQuery);
  }, [searchQuery]);

  return {
    searchQuery,
    setSearchQuery,
    handleSearch
  };
}