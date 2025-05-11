import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, Download, FileText, Trash2, CheckCircle, XCircle, Clock } from 'lucide-react';

interface BulkActionProps {
  selectedStaff: string[];
  onClearSelection: () => void;
  onBulkAction: (action: string, selectedIds: string[]) => void;
}

export default function BulkActionBar({
  selectedStaff,
  onClearSelection,
  onBulkAction
}: BulkActionProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  if (selectedStaff.length === 0) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg px-6 py-3 flex items-center z-30"
    >
      <div className="bg-emerald-100 text-emerald-800 rounded-full px-3 py-1 text-sm font-medium mr-4">
        {selectedStaff.length} selected
      </div>
      
      <div className="flex items-center gap-2">
        <button
          onClick={() => onBulkAction('activate', selectedStaff)}
          className="flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 rounded-lg hover:bg-green-100"
        >
          <CheckCircle className="w-4 h-4" />
          <span>Activate</span>
        </button>
        
        <button
          onClick={() => onBulkAction('deactivate', selectedStaff)}
          className="flex items-center gap-1 px-3 py-1 bg-red-50 text-red-700 rounded-lg hover:bg-red-100"
        >
          <XCircle className="w-4 h-4" />
          <span>Deactivate</span>
        </button>
        
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100"
          >
            <FileText className="w-4 h-4" />
            <span>More Actions</span>
            <ChevronDown className="w-4 h-4" />
          </button>
          
          {isOpen && (
            <div className="absolute right-0 mt-2 bg-white rounded-lg shadow-lg z-30 py-2 w-48">
              <button
                onClick={() => {
                  onBulkAction('export', selectedStaff);
                  setIsOpen(false);
                }}
                className="flex items-center w-full px-4 py-2 text-sm text-left hover:bg-gray-100"
              >
                <Download className="w-4 h-4 mr-2" />
                <span>Export Data</span>
              </button>
              <button
                onClick={() => {
                  onBulkAction('assign-training', selectedStaff);
                  setIsOpen(false);
                }}
                className="flex items-center w-full px-4 py-2 text-sm text-left hover:bg-gray-100"
              >
                <FileText className="w-4 h-4 mr-2" />
                <span>Assign Training</span>
              </button>
              <button
                onClick={() => {
                  onBulkAction('schedule-shift', selectedStaff);
                  setIsOpen(false);
                }}
                className="flex items-center w-full px-4 py-2 text-sm text-left hover:bg-gray-100"
              >
                <Clock className="w-4 h-4 mr-2" />
                <span>Schedule Shift</span>
              </button>
              <div className="border-t my-1"></div>
              <button
                onClick={() => {
                  if (confirm(`Are you sure you want to delete ${selectedStaff.length} staff members?`)) {
                    onBulkAction('delete', selectedStaff);
                  }
                  setIsOpen(false);
                }}
                className="flex items-center w-full px-4 py-2 text-sm text-left text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                <span>Delete Selected</span>
              </button>
            </div>
          )}
        </div>
        
        <button
          onClick={onClearSelection}
          className="ml-4 px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
        >
          Clear Selection
        </button>
      </div>
    </motion.div>
  );
}
