import { MenuItem } from '../../../types/menu';

export const sortMenuItems = (items: MenuItem[], sortBy: string) => {
  switch (sortBy) {
    case 'priceAsc':
      return [...items].sort((a, b) => a.price - b.price);
    case 'priceDesc':
      return [...items].sort((a, b) => b.price - a.price);
    case 'nameAsc':
      return [...items].sort((a, b) => a.name.localeCompare(b.name));
    case 'nameDesc':
      return [...items].sort((a, b) => b.name.localeCompare(a.name));
    default:
      return items;
  }
};

// Dietary preferences filter removed

export const filterByPriceRange = (items: MenuItem[], range: [number, number]) => {
  return items.filter(item => 
    item.price >= range[0] && item.price <= range[1]
  );
};

export const filterByCategory = (items: MenuItem[], category: string) => {
  if (category === 'all') return items;
  return items.filter(item => item.category === category);
};

export const searchMenuItems = (items: MenuItem[], query: string) => {
  if (!query) return items;
  const searchTerm = query.toLowerCase();
  return items.filter(item =>
    item.name.toLowerCase().includes(searchTerm) ||
    item.description.toLowerCase().includes(searchTerm)
  );
};