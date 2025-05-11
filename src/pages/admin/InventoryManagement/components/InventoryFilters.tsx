import React from 'react';
import { motion } from 'framer-motion';
import { Filter } from 'lucide-react';

interface InventoryFiltersProps {
  filters: {
    status: string;
    location: string;
    supplier: string;
    stockLevel: string;
  };
  onFilterChange: (filters: any) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

export default function InventoryFilters({
  filters,
  onFilterChange,
  selectedCategory,
  onCategoryChange
}: InventoryFiltersProps) {
  const categories = ['all', 'raw', 'packaging', 'finished', 'equipment'];
  const locations = ['all', 'main', 'cold', 'dry', 'equipment'];
  const stockLevels = [
    { value: 'all', label: 'All Levels' },
    { value: 'low', label: 'Low Stock' },
    { value: 'out', label: 'Out of Stock' },
    { value: 'normal', label: 'Normal' },
    { value: 'overstock', label: 'Overstock' }
  ];

  return (
    <div className="flex flex-wrap gap-4">
      <select
        value={selectedCategory}
        onChange={(e) => onCategoryChange(e.target.value)}
        className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
      >
        {categories.map((category) => (
          <option key={category} value={category}>
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </option>
        ))}
      </select>

      <select
        value={filters.location}
        onChange={(e) => onFilterChange({ ...filters, location: e.target.value })}
        className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
      >
        {locations.map((location) => (
          <option key={location} value={location}>
            {location === 'all' ? 'All Locations' : location.charAt(0).toUpperCase() + location.slice(1)}
          </option>
        ))}
      </select>

      <select
        value={filters.stockLevel}
        onChange={(e) => onFilterChange({ ...filters, stockLevel: e.target.value })}
        className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
      >
        {stockLevels.map((level) => (
          <option key={level.value} value={level.value}>
            {level.label}
          </option>
        ))}
      </select>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => onFilterChange({
          status: 'all',
          location: 'all',
          supplier: 'all',
          stockLevel: 'all'
        })}
        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
      >
        <Filter className="w-5 h-5" />
        Reset Filters
      </motion.button>
    </div>
  );
}