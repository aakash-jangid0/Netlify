import React from 'react';
import { motion } from 'framer-motion';
import { Filter, Search } from 'lucide-react';

interface MenuHeaderProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onFilterClick: () => void;
  style?: any;
}

const MenuHeader: React.FC<MenuHeaderProps> = ({ 
  searchQuery, 
  onSearchChange, 
  onFilterClick,
  style 
}) => {
  return (
    <motion.div
      className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm shadow-sm"
      style={style}
    >
      <div className="container mx-auto px-4 py-4">
        <h1 className="text-2xl font-bold mb-4">Menu Management</h1>
        
        <div className="relative">
          <div className="flex items-center border rounded-lg overflow-hidden bg-white shadow-sm">
            <div className="pl-4 pr-2">
              <Search size={20} className="text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search menu items..."
              className="flex-1 py-3 px-2 outline-none text-sm"
            />
            <button
              onClick={onFilterClick}
              className="p-3 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <Filter size={20} className="text-gray-600" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MenuHeader;
