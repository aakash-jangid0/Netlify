import React from 'react';

interface CategorySelectorProps {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
}) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow mb-4">
      <h3 className="text-lg font-medium mb-2">Categories</h3>
      <div className="flex flex-wrap gap-2">
        <button
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
            selectedCategory === 'all'
              ? 'bg-amber-500 text-white'
              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
          }`}
          onClick={() => onSelectCategory('all')}
        >
          All
        </button>
        {categories.map((category) => (
          <button
            key={category}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === category
                ? 'bg-amber-500 text-white'
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
            onClick={() => onSelectCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategorySelector;
