import React from 'react';
import { motion } from 'framer-motion';
import { Grid } from 'lucide-react';
import { Category } from '../../types/category';
import DynamicIcon from '../../components/ui/DynamicIcon';

// Using Category type from the types file

interface CategorySelectorProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  categories?: Category[];
}

function CategorySelector({ selectedCategory, onSelectCategory, categories = [] }: CategorySelectorProps) {
  // Combine "All Items" with dynamic categories
  const allCategories = [
    { id: 'all', name: 'All Items', iconName: 'Grid' },
    ...(categories.length > 0 
      ? categories.map(cat => ({
          id: cat.slug,
          name: cat.name,
          iconName: cat.icon || 'Grid'
        }))
      : [])
  ];

  return (
    <div className="flex gap-4 mb-6 overflow-x-auto pb-2 scrollbar-hide">
      {allCategories.map(({ id, name, iconName }) => (
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
          <DynamicIcon icon={iconName} className="w-5 h-5" />
          <span>{name}</span>
        </motion.button>
      ))}
    </div>
  );
}

export default CategorySelector;