import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Archive, Trash2, AlertTriangle } from 'lucide-react';

interface BatchOperationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (operation: string) => void;
  selectedCount: number;
  isLoading: boolean;
}

function BatchOperationsModal({
  isOpen,
  onClose,
  onSubmit,
  selectedCount,
  isLoading
}: BatchOperationsModalProps) {
  const [selectedOperation, setSelectedOperation] = React.useState<string>('');
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  const handleSubmit = () => {
    if (selectedOperation === 'delete' && !confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    onSubmit(selectedOperation);
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        className="bg-white rounded-lg w-full max-w-md p-6"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Batch Operations</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {selectedCount === 0 ? (
          <div className="text-center py-6">
            <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <p className="text-gray-600">Please select items to perform batch operations</p>
          </div>
        ) : (
          <>
            <p className="text-gray-600 mb-6">
              Selected {selectedCount} item{selectedCount !== 1 ? 's' : ''}
            </p>

            <div className="space-y-4 mb-6">
              <button
                onClick={() => setSelectedOperation('archive')}
                className={`w-full flex items-center gap-3 p-4 rounded-lg border-2 transition-colors ${
                  selectedOperation === 'archive'
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-purple-200'
                }`}
              >
                <Archive className={`w-5 h-5 ${
                  selectedOperation === 'archive' ? 'text-purple-500' : 'text-gray-500'
                }`} />
                <div className="text-left">
                  <h3 className="font-medium">Archive Items</h3>
                  <p className="text-sm text-gray-500">
                    Move items to archive for future reference
                  </p>
                </div>
              </button>

              <button
                onClick={() => setSelectedOperation('delete')}
                className={`w-full flex items-center gap-3 p-4 rounded-lg border-2 transition-colors ${
                  selectedOperation === 'delete'
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200 hover:border-red-200'
                }`}
              >
                <Trash2 className={`w-5 h-5 ${
                  selectedOperation === 'delete' ? 'text-red-500' : 'text-gray-500'
                }`} />
                <div className="text-left">
                  <h3 className="font-medium">Delete Items</h3>
                  <p className="text-sm text-gray-500">
                    Permanently remove items from inventory
                  </p>
                </div>
              </button>
            </div>

            {confirmDelete && selectedOperation === 'delete' && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-3 text-red-700">
                  <AlertTriangle className="w-5 h-5" />
                  <p className="font-medium">Confirm Deletion</p>
                </div>
                <p className="mt-2 text-sm text-red-600">
                  This action cannot be undone. Are you sure you want to delete {selectedCount} item{selectedCount !== 1 ? 's' : ''}?
                </p>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!selectedOperation || isLoading}
                className={`px-4 py-2 rounded-lg text-white ${
                  selectedOperation === 'delete'
                    ? 'bg-red-500 hover:bg-red-600'
                    : 'bg-purple-500 hover:bg-purple-600'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isLoading ? 'Processing...' : confirmDelete ? 'Confirm Delete' : 'Continue'}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

export default BatchOperationsModal;