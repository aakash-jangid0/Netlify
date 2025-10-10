import React from 'react';
import { X } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCategories } from '../../hooks/useCategories';

// Dynamic icon component that renders Lucide icons by name
const DynamicIcon = ({ icon, className }: { icon: string; className?: string }) => {
  // Use type assertion to tell TypeScript this is a valid React component
  const LucideIcon = (LucideIcons[icon as keyof typeof LucideIcons] || LucideIcons.Tag) as React.ElementType;
  return <LucideIcon className={className} />;
};

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  priceRange: [number, number];
  setPriceRange: (range: [number, number]) => void;
  selectedCategories: string[];
  setSelectedCategories: (categories: string[]) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  spiceLevels: string[];
  setSpiceLevels: (levels: string[]) => void;
  dietaryTags: string[];
  setDietaryTags: (tags: string[]) => void;
}

// Sort options only - spice level and dietary preferences removed
const sortOptions = [
  { value: 'popular', label: 'Most Popular' },
  { value: 'priceAsc', label: 'Price: Low to High' },
  { value: 'priceDesc', label: 'Price: High to Low' },
  { value: 'nameAsc', label: 'Name: A to Z' },
  { value: 'nameDesc', label: 'Name: Z to A' },
];

function FilterModal({
  isOpen,
  onClose,
  priceRange,
  setPriceRange,
  selectedCategories,
  setSelectedCategories,
  sortBy,
  setSortBy,
}: FilterModalProps) {
  // Use the categories hook to get dynamic categories from the database
  const { categories } = useCategories();
  
  const handleCategoryToggle = (categorySlug: string) => {
    if (selectedCategories.includes(categorySlug)) {
      setSelectedCategories(selectedCategories.filter(c => c !== categorySlug));
    } else {
      setSelectedCategories([...selectedCategories, categorySlug]);
    }
  };

  // Handlers for spice level and dietary preferences removed

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-semibold">Filters</h2>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-6">
              {/* Sort By */}
              <div>
                <h3 className="font-medium mb-3">Sort By</h3>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                >
                  {sortOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Range */}
              <div>
                <h3 className="font-medium mb-3">Price Range</h3>
                <div className="flex gap-4 items-center">
                  <input
                    type="range"
                    min="0"
                    max="2000"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                    className="w-full"
                  />
                  <span className="text-sm">₹{priceRange[1]}</span>
                </div>
              </div>

              {/* Categories */}
              <div>
                <h3 className="font-medium mb-3">Categories</h3>
                <div className="flex flex-wrap gap-2">
                  {categories.map(category => (
                    <button
                      key={category.slug}
                      onClick={() => handleCategoryToggle(category.slug)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
                        selectedCategories.includes(category.slug)
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <DynamicIcon icon={category.icon || 'Tag'} className="w-4 h-4" />
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Spice Level and Dietary Preferences sections removed */}
            </div>

            <div className="sticky bottom-0 bg-white p-4 border-t">
              <button
                onClick={onClose}
                className="w-full bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default FilterModal;