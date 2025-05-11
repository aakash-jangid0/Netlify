import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, TrendingUp, BarChart2 } from 'lucide-react';

interface ReportSelectorProps {
  selectedPeriod: string;
  onPeriodChange: (period: string) => void;
}

function ReportSelector({ selectedPeriod, onPeriodChange }: ReportSelectorProps) {
  const periods = [
    { id: 'daily', label: 'Daily', icon: Calendar },
    { id: 'weekly', label: 'Weekly', icon: TrendingUp },
    { id: 'monthly', label: 'Monthly', icon: BarChart2 },
  ];

  return (
    <div className="flex space-x-4 mb-6">
      {periods.map(({ id, label, icon: Icon }) => (
        <motion.button
          key={id}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onPeriodChange(id)}
          className={`flex items-center px-4 py-2 rounded-lg ${
            selectedPeriod === id
              ? 'bg-orange-500 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Icon className="w-4 h-4 mr-2" />
          {label}
        </motion.button>
      ))}
    </div>
  );
}

export default ReportSelector;