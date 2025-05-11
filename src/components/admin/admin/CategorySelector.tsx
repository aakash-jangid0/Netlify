import React from 'react';
import { motion } from 'framer-motion';
import { Pizza, Coffee, IceCream, Soup, Grid } from 'lucide-react';

interface CategorySelectorProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

const categories = [
  { id: 'all', name: 'All Items', icon: Grid },
  { id: 'main', name: 'Main Course', icon: Pizza },
  { id: 'appetizer', name: 'Appetizers', icon: Soup },
  { id: 'dessert', name: 'Desserts', icon: IceCream },
  { id: 'beverage', name: 'Beverages', icon: Coffee },
];

function CategorySelector({ selectedCategory, onSelectCategory }: CategorySelectorProps) {
  return (
    <div className="flex gap-4 mb-6 overflow-x-auto pb-2 scrollbar-hide">
      {categories.map(({ id, name, icon: Icon }) => (
        <motion.button
          key={id}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSelectCategory(id)}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
            selectedCategory === id
              ? 'bg-orange-500 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Icon className="w-5 h-5" />
          <span>{name}</span>
        </motion.button>
      ))}
    </div>
  );
}

export default CategorySelector;