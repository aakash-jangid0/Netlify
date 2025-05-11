import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Clock, RefreshCcw } from 'lucide-react';

interface StockAlertsProps {
  lowStockItems: any[];
  expiringItems: any[];
  onReorder: (items: any[]) => void;
}

function StockAlerts({ lowStockItems, expiringItems, onReorder }: StockAlertsProps) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className="space-y-4"
      >
        {lowStockItems.length > 0 && (
          <motion.div
            initial={{ x: -20 }}
            animate={{ x: 0 }}
            className="bg-amber-50 border border-amber-200 rounded-lg p-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-amber-100 p-2 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-medium text-amber-900">
                    Low Stock Alert
                  </h3>
                  <p className="text-sm text-amber-700">
                    {lowStockItems.length} items need to be reordered
                  </p>
                </div>
              </div>
              <button
                onClick={() => onReorder(lowStockItems)}
                className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 flex items-center gap-2"
              >
                <RefreshCcw className="w-4 h-4" />
                Reorder Now
              </button>
            </div>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {lowStockItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-lg p-3 border border-amber-100"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-amber-600">
                        {item.quantity} {item.unit} remaining
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Minimum required: {item.min_quantity} {item.unit}
                      </p>
                    </div>
                    <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
                      Reorder
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {expiringItems.length > 0 && (
          <motion.div
            initial={{ x: -20 }}
            animate={{ x: 0 }}
            className="bg-red-50 border border-red-200 rounded-lg p-4"
          >
            <div className="flex items-center gap-3">
              <div className="bg-red-100 p-2 rounded-lg">
                <Clock className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-medium text-red-900">
                  Expiring Items Alert
                </h3>
                <p className="text-sm text-red-700">
                  {expiringItems.length} items are expiring within 30 days
                </p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {expiringItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-lg p-3 border border-red-100"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-red-600">
                        Expires: {new Date(item.expiry_date).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Quantity: {item.quantity} {item.unit}
                      </p>
                    </div>
                    <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                      {Math.ceil((new Date(item.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days left
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

export default StockAlerts;