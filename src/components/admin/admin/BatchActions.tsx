import React from 'react';
import { Trash2, Tag, Download } from 'lucide-react';
import { motion } from 'framer-motion';

interface BatchActionsProps {
  selectedCount: number;
  onAction: (action: string) => void;
}

export default function BatchActions({ selectedCount, onAction }: BatchActionsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between"
    >
      <div className="text-blue-800">
        <span className="font-medium">{selectedCount}</span> customers selected
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onAction('export')}
          className="px-3 py-1 bg-blue-500 text-white rounded-lg flex items-center gap-1 hover:bg-blue-600"
        >
          <Download size={16} />
          Export
        </button>
        <button
          onClick={() => onAction('tag')}
          className="px-3 py-1 bg-gray-500 text-white rounded-lg flex items-center gap-1 hover:bg-gray-600"
        >
          <Tag size={16} />
          Add Tag
        </button>
        <button
          onClick={() => {
            if (confirm(`Are you sure you want to delete ${selectedCount} customers?`)) {
              onAction('delete');
            }
          }}
          className="px-3 py-1 bg-red-500 text-white rounded-lg flex items-center gap-1 hover:bg-red-600"
        >
          <Trash2 size={16} />
          Delete
        </button>
      </div>
    </motion.div>
  );
}