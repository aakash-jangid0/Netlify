import { useState, useCallback } from 'react';
import { sortMenuItems } from '../utils/menuUtils';
import { MenuItem } from '../../../types/menu';

export function useMenuSort() {
  const [sortBy, setSortBy] = useState('popular');

  const handleSort = useCallback((items: MenuItem[]) => {
    return sortMenuItems(items, sortBy);
  }, [sortBy]);

  return {
    sortBy,
    setSortBy,
    handleSort
  };
}