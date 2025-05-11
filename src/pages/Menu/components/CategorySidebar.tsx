import React, { useEffect, useState } from 'react';
import { useCategories } from '../../../hooks/useCategories';
import DynamicIcon from '../../../components/ui/DynamicIcon';

interface CategorySidebarProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

const CategorySidebar: React.FC<CategorySidebarProps> = ({ 
  selectedCategory,
  onSelectCategory
}) => {
  const { categories, isLoading } = useCategories();
  
  // Create a combined list with "All Items" at the top
  const allCategories = [
    { id: 'all', name: 'All Items', icon: 'Grid' },
    ...categories.map(cat => ({
      id: cat.slug,
      name: cat.name,
      icon: cat.icon || 'Tag'
    }))
  ];

  return (
    <aside className="w-64 bg-white shadow-md p-4 hidden md:block sticky top-20 h-fit">
      <h3 className="font-medium text-lg mb-4 text-gray-800">Categories</h3>
      
      <nav>
        {isLoading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500" />
          </div>
        ) : (
          <ul className="space-y-1">
            {allCategories.map(category => (
              <li key={category.id}>
                <button
                  onClick={() => onSelectCategory(category.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                    selectedCategory === category.id
                      ? 'bg-orange-100 text-orange-600 font-medium'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <DynamicIcon icon={category.icon} className="w-4 h-4" />
                  {category.name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </nav>
    </aside>
  );
};

export default CategorySidebar;
