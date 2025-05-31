import React, { useState } from 'react';
import { Trash, Calendar, EyeOff, FileUp, FileDown, MoreHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { supabase } from '../../../lib/supabase';

interface BatchActionsProps {
  selectedCoupons: number[];
  onClearSelection: () => void;
  onCouponsUpdated: () => void;
}

function BatchActions({ selectedCoupons, onClearSelection, onCouponsUpdated }: BatchActionsProps) {
  const [showMenu, setShowMenu] = useState(false);

  if (selectedCoupons.length === 0) return null;

  const handleDeactivate = async () => {
    try {
      const { error } = await supabase
        .from('coupons')
        .update({ is_active: false })
        .in('id', selectedCoupons);

      if (error) throw error;
      toast.success(`${selectedCoupons.length} coupons deactivated`);
      onCouponsUpdated();
      onClearSelection();
    } catch (error) {
      console.error('Error deactivating coupons:', error);
      toast.error('Failed to deactivate coupons');
    }
  };

  const handleActivate = async () => {
    try {
      const { error } = await supabase
        .from('coupons')
        .update({ is_active: true })
        .in('id', selectedCoupons);

      if (error) throw error;
      toast.success(`${selectedCoupons.length} coupons activated`);
      onCouponsUpdated();
      onClearSelection();
    } catch (error) {
      console.error('Error activating coupons:', error);
      toast.error('Failed to activate coupons');
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedCoupons.length} coupons?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('coupons')
        .delete()
        .in('id', selectedCoupons);

      if (error) throw error;
      toast.success(`${selectedCoupons.length} coupons deleted`);
      onCouponsUpdated();
      onClearSelection();
    } catch (error) {
      console.error('Error deleting coupons:', error);
      toast.error('Failed to delete coupons');
    }
  };

  const handleExport = () => {
    // In a real implementation, this would export selected coupons to CSV/Excel
    toast.success('Export feature to be implemented');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-5 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
    >
      <div className="flex items-center p-3">
        <span className="text-gray-700 font-medium mr-4">
          {selectedCoupons.length} coupon{selectedCoupons.length > 1 ? 's' : ''} selected
        </span>

        <div className="flex items-center space-x-2">
          <button 
            onClick={() => handleActivate()}
            className="p-2 rounded-lg hover:bg-green-50 text-green-600"
            title="Activate selected"
          >
            <Calendar className="w-5 h-5" />
          </button>

          <button 
            onClick={() => handleDeactivate()}
            className="p-2 rounded-lg hover:bg-gray-50 text-gray-600"
            title="Deactivate selected"
          >
            <EyeOff className="w-5 h-5" />
          </button>

          <button 
            onClick={() => handleDelete()}
            className="p-2 rounded-lg hover:bg-red-50 text-red-600"
            title="Delete selected"
          >
            <Trash className="w-5 h-5" />
          </button>

          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 rounded-lg hover:bg-gray-50 text-gray-600"
              title="More actions"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>

            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute bottom-full right-0 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 w-48"
                >
                  <div className="p-1">
                    <button
                      onClick={() => {
                        handleExport();
                        setShowMenu(false);
                      }}
                      className="flex items-center w-full px-3 py-2 text-sm text-left rounded-md hover:bg-gray-100"
                    >
                      <FileDown className="w-4 h-4 mr-2" />
                      <span>Export selected</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button 
            onClick={onClearSelection}
            className="p-2 rounded-lg hover:bg-gray-50 text-gray-600 ml-2"
            title="Clear selection"
          >
            <span className="text-sm">Clear</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default BatchActions;
