import React from 'react';
import { motion } from 'framer-motion';
import { Filter, X } from 'lucide-react';

interface MenuFiltersProps {
  isOpen: boolean;
  onClose: () => void;
  filters: {
    dietary: string[];
    availability: boolean;
  };
  onFilterChange: (filters: { dietary: string[]; availability: boolean }) => void;
}

export default function MenuFilters({
  isOpen,
  onClose,
  filters,
  onFilterChange,
}: MenuFiltersProps) {
  const dietaryOptions = ['Vegetarian', 'Non-Vegetarian', 'Vegan', 'Gluten-Free'];

  const handleDietaryChange = (option: string) => {
    const newDietary = filters.dietary.includes(option)
      ? filters.dietary.filter(item => item !== option)
      : [...filters.dietary, option];
    
    onFilterChange({
      ...filters,
      dietary: newDietary,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: isOpen ? 1 : 0, y: isOpen ? 0 : 20 }}
      exit={{ opacity: 0, y: 20 }}
      className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${
        isOpen ? '' : 'hidden'
      }`}
    >
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold">Menu Filters</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <h4 className="font-medium mb-3">Dietary Preferences</h4>
            <div className="flex flex-wrap gap-2">
              {dietaryOptions.map(option => (
                <button
                  key={option}
                  onClick={() => handleDietaryChange(option)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    filters.dietary.includes(option)
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={filters.availability}
                onChange={(e) =>
                  onFilterChange({
                    ...filters,
                    availability: e.target.checked,
                  })
                }
                className="rounded text-orange-500 focus:ring-orange-500"
              />
              <span>Show only available items</span>
            </label>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </motion.div>
  );
}