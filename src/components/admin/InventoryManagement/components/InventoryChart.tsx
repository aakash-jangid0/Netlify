import React from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';

interface InventoryChartProps {
  data: any[];
  type: 'stock' | 'value';
  title: string;
}

function InventoryChart({ data, type, title }: InventoryChartProps) {
  const chartData = React.useMemo(() => {
    if (type === 'stock') {
      const categoryData = data.reduce((acc, item) => {
        if (!acc[item.category]) {
          acc[item.category] = {
            name: item.category,
            inStock: 0,
            lowStock: 0,
            outOfStock: 0,
            total: 0
          };
        }
        acc[item.category].total++;
        if (item.quantity === 0) {
          acc[item.category].outOfStock++;
        } else if (item.quantity <= item.min_quantity) {
          acc[item.category].lowStock++;
        } else {
          acc[item.category].inStock++;
        }
        return acc;
      }, {});
      return Object.values(categoryData);
    }
    return [];
  }, [data, type]);

  const colors = {
    inStock: '#10B981',
    lowStock: '#F59E0B',
    outOfStock: '#EF4444'
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const total = payload[0].payload.total;
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <p className="font-medium capitalize mb-2">{label}</p>
          {payload.map((entry: any) => (
            <div key={entry.name} className="flex items-center justify-between gap-4">
              <span className="capitalize">{entry.name}:</span>
              <span className="font-medium">
                {entry.value} ({((entry.value / total) * 100).toFixed(1)}%)
              </span>
            </div>
          ))}
          <div className="mt-2 pt-2 border-t">
            <div className="flex items-center justify-between gap-4">
              <span>Total Items:</span>
              <span className="font-medium">{total}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-sm p-6"
    >
      <h2 className="text-lg font-semibold mb-6">{title}</h2>
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => value.charAt(0).toUpperCase() + value.slice(1)}
            />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar
              dataKey="inStock"
              name="In Stock"
              stackId="a"
              radius={[4, 4, 0, 0]}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors.inStock} />
              ))}
            </Bar>
            <Bar
              dataKey="lowStock"
              name="Low Stock"
              stackId="a"
              radius={[4, 4, 0, 0]}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors.lowStock} />
              ))}
            </Bar>
            <Bar
              dataKey="outOfStock"
              name="Out of Stock"
              stackId="a"
              radius={[4, 4, 0, 0]}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors.outOfStock} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}

export default InventoryChart;