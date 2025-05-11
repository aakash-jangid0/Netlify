import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MenuItem } from '../../../types/menu';
import MenuCard from '../../../components/MenuCard';

interface MenuGridProps {
  items: MenuItem[];
}

const MenuGrid: React.FC<MenuGridProps> = ({ items }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
      <AnimatePresence>
        {items.map((item) => (
          <motion.div
            key={item.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            <MenuCard {...item} />
          </motion.div>
        ))}

        {items.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="col-span-full text-center py-12"
          >
            <p className="text-gray-500">No menu items found.</p>
            <p className="text-gray-400 text-sm mt-2">Try adjusting your filters or search query.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MenuGrid;
