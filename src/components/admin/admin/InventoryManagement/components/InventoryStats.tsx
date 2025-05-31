import React from 'react';
import { motion } from 'framer-motion';
import { Package, AlertTriangle, DollarSign, TrendingDown, Clock, Archive } from 'lucide-react';

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  min_quantity: number;
  max_quantity: number;
  cost_price: number;
  expiry_date?: string;
  status: string;
}

interface InventoryStatsProps {
  items: InventoryItem[];
}

export default function InventoryStats({ items }: InventoryStatsProps) {
  const stats = React.useMemo(() => {
    const totalItems = items.length;
    const lowStock = items.filter(item => item.quantity <= item.min_quantity).length;
    const outOfStock = items.filter(item => item.quantity === 0).length;
    const totalValue = items.reduce((sum, item) => sum + (item.quantity * item.cost_price), 0);
    const expiringItems = items.filter(item => {
      if (!item.expiry_date) return false;
      const daysUntilExpiry = Math.ceil(
        (new Date(item.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
    }).length;

    const overstockedItems = items.filter(item => 
      item.quantity > item.max_quantity
    ).length;

    return {
      totalItems,
      lowStock,
      outOfStock,
      totalValue,
      expiringItems,
      overstockedItems
    };
  }, [items]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm p-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Total Items</p>
            <p className="text-2xl font-bold">{stats.totalItems}</p>
          </div>
          <div className="bg-blue-100 p-3 rounded-lg">
            <Package className="w-6 h-6 text-blue-600" />
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl shadow-sm p-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Low Stock Items</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.lowStock}</p>
          </div>
          <div className="bg-yellow-100 p-3 rounded-lg">
            <AlertTriangle className="w-6 h-6 text-yellow-600" />
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl shadow-sm p-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Out of Stock</p>
            <p className="text-2xl font-bold text-red-600">{stats.outOfStock}</p>
          </div>
          <div className="bg-red-100 p-3 rounded-lg">
            <TrendingDown className="w-6 h-6 text-red-600" />
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-xl shadow-sm p-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Total Value</p>
            <p className="text-2xl font-bold text-green-600">
              Rs{stats.totalValue.toLocaleString()}
            </p>
          </div>
          <div className="bg-green-100 p-3 rounded-lg">
            <DollarSign className="w-6 h-6 text-green-600" />
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-xl shadow-sm p-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Expiring Soon</p>
            <p className="text-2xl font-bold text-orange-600">{stats.expiringItems}</p>
          </div>
          <div className="bg-orange-100 p-3 rounded-lg">
            <Clock className="w-6 h-6 text-orange-600" />
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-xl shadow-sm p-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Overstock</p>
            <p className="text-2xl font-bold text-purple-600">{stats.overstockedItems}</p>
          </div>
          <div className="bg-purple-100 p-3 rounded-lg">
            <Archive className="w-6 h-6 text-purple-600" />
          </div>
        </div>
      </motion.div>
    </div>
  );
}