import React from 'react';
import { motion } from 'framer-motion';
import { Grid } from 'lucide-react';
import DynamicIcon from './ui/DynamicIcon';

interface CategoryFilterProps {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  categoryIcons?: Record<string, string>; // Map of category slugs to icon names
}

function CategoryFilter({ 
  categories, 
  selectedCategory, 
  onSelectCategory,
  categoryIcons = {} 
}: CategoryFilterProps) {
  // Get icon name for a category
  const getCategoryIconName = (category: string): string => {
    // First check if we have a specific icon assigned to this category
    if (categoryIcons[category]) {
      return categoryIcons[category];
    }
    
    // Map category name to icon name
    switch (category.toLowerCase()) {
      case 'main':
        return 'Pizza';
      case 'beverage':
        return 'Coffee';
      case 'dessert':
        return 'IceCream';
      case 'appetizer':
        return 'Soup';
      default:
        return 'Grid';
    }
  };

  return (
    <div className="flex flex-col space-y-2 w-20 bg-white shadow-lg rounded-r-xl py-6">
      <button
        onClick={() => onSelectCategory('all')}
        className={`w-full flex flex-col items-center justify-center p-4 transition-colors ${
          selectedCategory === 'all'
            ? 'bg-orange-500 text-white'
            : 'text-gray-700 hover:bg-gray-50'
        }`}
      >
        <DynamicIcon icon="Grid" className="w-6 h-6 mb-1" />
        <span className="text-xs">All</span>
      </button>
      {categories.map((category) => {
        const iconName = getCategoryIconName(category);
        return (
          <motion.button
            key={category}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelectCategory(category)}
            className={`w-full flex flex-col items-center justify-center p-4 transition-colors ${
              selectedCategory === category
                ? 'bg-orange-500 text-white'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <DynamicIcon icon={iconName} className="w-6 h-6 mb-1" />
            <span className="text-xs capitalize">{category}</span>
          </motion.button>
        );
      })}
    </div>
  );
}

export default CategoryFilter;