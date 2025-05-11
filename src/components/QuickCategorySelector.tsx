import React from 'react';
import { motion } from 'framer-motion';
import DynamicIcon from './ui/DynamicIcon';

interface QuickCategorySelectorProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  categories?: Array<{ id: string; name: string; icon?: string }>;
}

// Default categories as fallback
const defaultCategories = [
  { id: 'all', name: 'All', icon: 'Grid' },
  { id: 'main', name: 'Mains', icon: 'Pizza' },
  { id: 'appetizer', name: 'Starters', icon: 'Soup' },
  { id: 'dessert', name: 'Desserts', icon: 'IceCream' },
  { id: 'beverage', name: 'Drinks', icon: 'Coffee' },
];

function QuickCategorySelector({ selectedCategory, onSelectCategory, categories = defaultCategories }: QuickCategorySelectorProps) {
  return (
    <div className="overflow-x-auto -mx-4 px-4">
      <div className="flex gap-4 min-w-max pb-2">
        {categories.map(({ id, name, icon }) => (
          <motion.button
            key={id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelectCategory(id)}
            className={`flex items-center space-x-2 px-6 py-3 rounded-full transition-colors ${
              selectedCategory === id
                ? 'bg-orange-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50 shadow-sm'
            }`}
          >
            <DynamicIcon icon={icon || 'Grid'} className="w-5 h-5" />
            <span className="text-sm font-medium">{name}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

export default QuickCategorySelector;