import React from 'react';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  cost_price: number;
  category?: string;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    dataKey: string;
  }>;
  label?: string;
}

interface ValueTrackerProps {
  items: InventoryItem[];
}

function ValueTracker({ items }: ValueTrackerProps) {
  const stats = React.useMemo(() => {
    const totalValue = items.reduce((sum, item) => sum + (item.quantity * item.cost_price), 0);
    
    // Group items by category
    const categoryValues = items.reduce((acc, item) => {
      const category = item.category || 'Uncategorized';
      acc[category] = (acc[category] || 0) + (item.quantity * item.cost_price);
      return acc;
    }, {});

    // Find highest and lowest value categories
    const categories = Object.entries(categoryValues).sort((a, b) => Number(b[1]) - Number(a[1]));
    const highestCategory = categories[0] || ['None', 0];
    const lowestCategory = categories[categories.length - 1] || ['None', 0];

    // Create trend data
    const trendData = categories.map(([category, value]) => ({
      name: category.charAt(0).toUpperCase() + category.slice(1),
      value: value
    }));

    return {
      totalValue,
      categoryValues,
      highestCategory,
      lowestCategory,
      trendData
    };
  }, [items]);

  const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <p className="font-medium">{label}</p>
          <p className="text-green-600 font-medium mt-1">
            ₹{payload[0].value.toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-lg font-semibold mb-6">Inventory Value Analysis</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between p-4 bg-green-50 rounded-lg"
          >
            <div>
              <p className="text-sm text-gray-600">Total Value</p>
              <p className="text-2xl font-bold text-green-600">₹{stats.totalValue.toLocaleString()}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center justify-between p-4 bg-blue-50 rounded-lg"
          >
            <div>
              <p className="text-sm text-gray-600">Highest Value Category</p>
              <p className="text-lg font-semibold text-blue-600 capitalize">{stats.highestCategory[0]}</p>
              <p className="text-sm text-blue-600">₹{stats.highestCategory[1].toLocaleString()}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
          >
            <div>
              <p className="text-sm text-gray-600">Lowest Value Category</p>
              <p className="text-lg font-semibold text-gray-600 capitalize">{stats.lowestCategory[0]}</p>
              <p className="text-sm text-gray-600">₹{stats.lowestCategory[1].toLocaleString()}</p>
            </div>
            <div className="bg-gray-200 p-3 rounded-full">
              <TrendingDown className="w-6 h-6 text-gray-600" />
            </div>
          </motion.div>
        </div>

        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats.trendData}>
              <defs>
                <linearGradient id="valueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12 }}
              />
              <YAxis
                tickFormatter={(value) => `₹${value.toLocaleString()}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#10B981"
                fillOpacity={1}
                fill="url(#valueGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default ValueTracker;