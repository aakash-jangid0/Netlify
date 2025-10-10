import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, AlertTriangle, ShoppingCart, Calendar, ArrowRight, Package, RefreshCcw, TrendingDown, Clock } from 'lucide-react';

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  min_quantity: number;
  max_quantity: number;
  expiry_date?: string;
  category?: string;
  transactions?: Array<{ id: string; date: string; type: string; quantity: number }>;
}

interface InventorySuggestionsProps {
  items: InventoryItem[];
  onReorder: (items: string[]) => void;
}

export default function InventorySuggestions({ items, onReorder }: InventorySuggestionsProps) {
  // Calculate suggestions based on inventory data
  const suggestions = React.useMemo(() => {
    const lowStockItems = items.filter(item => item.quantity <= item.min_quantity);
    const expiringItems = items.filter(item => {
      if (!item.expiry_date) return false;
      const daysUntilExpiry = Math.ceil(
        (new Date(item.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      return daysUntilExpiry <= 30;
    });
    
    const highTurnoverItems = items.filter(item => {
      // Assuming we track usage in transactions
      const usage = item.transactions?.length || 0;
      return usage > 10 && item.quantity < item.max_quantity * 0.8;
    });

    const seasonalItems = items.filter(item => {
      // Example seasonal logic - can be customized
      const isSeasonalItem = item.category === 'vegetables' || item.category === 'fruits';
      return isSeasonalItem && item.quantity < item.max_quantity * 0.7;
    });

    const overstockedItems = items.filter(item => 
      item.quantity > item.max_quantity * 1.2
    );

    const nearExpiryItems = items.filter(item => {
      if (!item.expiry_date) return false;
      const daysUntilExpiry = Math.ceil(
        (new Date(item.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      return daysUntilExpiry <= 60 && daysUntilExpiry > 30;
    });

    return {
      lowStock: lowStockItems,
      expiring: expiringItems,
      highTurnover: highTurnoverItems,
      seasonal: seasonalItems,
      overstock: overstockedItems,
      nearExpiry: nearExpiryItems
    };
  }, [items]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Low Stock Alert */}
        {suggestions.lowStock.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-amber-50 rounded-lg p-4 border border-amber-200"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <h3 className="font-medium text-amber-700">Low Stock Alert</h3>
              </div>
              <span className="text-amber-600 text-sm font-medium">
                {suggestions.lowStock.length} items
              </span>
            </div>
            <p className="text-sm text-amber-600 mb-3">
              These items need immediate reordering to maintain optimal stock levels
            </p>
            <div className="space-y-2 mb-3">
              {suggestions.lowStock.slice(0, 3).map(item => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-amber-700">{item.name}</span>
                  <span className="text-amber-600 font-medium">
                    {item.quantity} {item.unit} left
                  </span>
                </div>
              ))}
            </div>
            <button
              onClick={() => onReorder(suggestions.lowStock.map(item => item.id))}
              className="flex items-center text-sm text-amber-700 hover:text-amber-800 font-medium"
            >
              <ShoppingCart className="w-4 h-4 mr-1" />
              Reorder Items
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </motion.div>
        )}

        {/* High Turnover Items */}
        {suggestions.highTurnover.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-blue-50 rounded-lg p-4 border border-blue-200"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-500" />
                <h3 className="font-medium text-blue-700">High Turnover Items</h3>
              </div>
              <span className="text-blue-600 text-sm font-medium">
                {suggestions.highTurnover.length} items
              </span>
            </div>
            <p className="text-sm text-blue-600 mb-3">
              Consider increasing stock levels for these frequently used items
            </p>
            <div className="space-y-2 mb-3">
              {suggestions.highTurnover.slice(0, 3).map(item => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-blue-700">{item.name}</span>
                  <span className="text-blue-600 font-medium">
                    {item.quantity} {item.unit} left
                  </span>
                </div>
              ))}
            </div>
            <button
              onClick={() => onReorder(suggestions.highTurnover.map(item => item.id))}
              className="flex items-center text-sm text-blue-700 hover:text-blue-800 font-medium"
            >
              <RefreshCcw className="w-4 h-4 mr-1" />
              Optimize Stock
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </motion.div>
        )}

        {/* Seasonal Items */}
        {suggestions.seasonal.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-50 rounded-lg p-4 border border-green-200"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-green-500" />
                <h3 className="font-medium text-green-700">Seasonal Items</h3>
              </div>
              <span className="text-green-600 text-sm font-medium">
                {suggestions.seasonal.length} items
              </span>
            </div>
            <p className="text-sm text-green-600 mb-3">
              Stock up on seasonal items before peak demand
            </p>
            <div className="space-y-2 mb-3">
              {suggestions.seasonal.slice(0, 3).map(item => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-green-700">{item.name}</span>
                  <span className="text-green-600 font-medium">
                    {item.quantity} {item.unit} left
                  </span>
                </div>
              ))}
            </div>
            <button
              onClick={() => onReorder(suggestions.seasonal.map(item => item.id))}
              className="flex items-center text-sm text-green-700 hover:text-green-800 font-medium"
            >
              <Package className="w-4 h-4 mr-1" />
              Plan Seasonal Stock
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </motion.div>
        )}

        {/* Overstock Alert */}
        {suggestions.overstock.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-purple-50 rounded-lg p-4 border border-purple-200"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-purple-500" />
                <h3 className="font-medium text-purple-700">Overstock Alert</h3>
              </div>
              <span className="text-purple-600 text-sm font-medium">
                {suggestions.overstock.length} items
              </span>
            </div>
            <p className="text-sm text-purple-600 mb-3">
              Consider adjusting order quantities for these overstocked items
            </p>
            <div className="space-y-2 mb-3">
              {suggestions.overstock.slice(0, 3).map(item => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-purple-700">{item.name}</span>
                  <span className="text-purple-600 font-medium">
                    {item.quantity} {item.unit} (Max: {item.max_quantity})
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Near Expiry Items */}
        {suggestions.nearExpiry.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-orange-50 rounded-lg p-4 border border-orange-200"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-500" />
                <h3 className="font-medium text-orange-700">Near Expiry</h3>
              </div>
              <span className="text-orange-600 text-sm font-medium">
                {suggestions.nearExpiry.length} items
              </span>
            </div>
            <p className="text-sm text-orange-600 mb-3">
              Monitor these items closely to prevent waste
            </p>
            <div className="space-y-2 mb-3">
              {suggestions.nearExpiry.slice(0, 3).map(item => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-orange-700">{item.name}</span>
                  <span className="text-orange-600 font-medium">
                    Expires in {Math.ceil(
                      (new Date(item.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                    )} days
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Expiring Items */}
        {suggestions.expiring.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 rounded-lg p-4 border border-red-200"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <h3 className="font-medium text-red-700">Expiring Soon</h3>
              </div>
              <span className="text-red-600 text-sm font-medium">
                {suggestions.expiring.length} items
              </span>
            </div>
            <p className="text-sm text-red-600 mb-3">
              Use these items soon to minimize waste
            </p>
            <div className="space-y-2">
              {suggestions.expiring.slice(0, 3).map(item => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-red-700">{item.name}</span>
                  <span className="text-red-600 font-medium">
                    Expires in {Math.ceil(
                      (new Date(item.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                    )} days
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}