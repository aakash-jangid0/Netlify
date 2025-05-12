import React from 'react';
import { motion } from 'framer-motion';
import { Edit, Trash2, ArrowUpDown, AlertTriangle, Package, Clock } from 'lucide-react';

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  min_quantity: number;
  max_quantity: number;
  cost_price: number;
  supplier: string;
  last_restocked: string;
  expiry_date?: string;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  storage_location: string;
}

interface InventoryTableProps {
  items: InventoryItem[];
  sortConfig: {
    field: string;
    direction: string;
  };
  onSort: (field: string) => void;
  onEdit: (item: InventoryItem) => void;
  onDelete: (id: string) => void;
  loading: boolean;
  selectedItems?: string[];
  onSelectItems?: React.Dispatch<React.SetStateAction<string[]>>;
}

export default function InventoryTable({
  items,
  sortConfig,
  onSort,
  onEdit,
  onDelete,
  loading
}: InventoryTableProps) {
  const getSortIcon = (field: string) => {
    if (sortConfig.field !== field) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    }
    return (
      <ArrowUpDown
        className={`w-4 h-4 ${
          sortConfig.direction === 'asc' ? 'text-emerald-500' : 'text-emerald-500 rotate-180'
        }`}
      />
    );
  };

  const getStatusColor = (status: string, quantity: number, min_quantity: number) => {
    if (quantity === 0) return 'bg-red-100 text-red-800';
    if (quantity <= min_quantity) return 'bg-yellow-100 text-yellow-800';
    return 'bg-emerald-100 text-emerald-800';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isExpiringSoon = (expiryDate?: string) => {
    if (!expiryDate) return false;
    const daysUntilExpiry = Math.ceil(
      (new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  };

  const isExpired = (expiryDate?: string) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              onClick={() => onSort('name')}
            >
              <div className="flex items-center gap-1">
                Name
                {getSortIcon('name')}
              </div>
            </th>
            <th
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              onClick={() => onSort('category')}
            >
              <div className="flex items-center gap-1">
                Category
                {getSortIcon('category')}
              </div>
            </th>
            <th
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              onClick={() => onSort('quantity')}
            >
              <div className="flex items-center gap-1">
                Stock Level
                {getSortIcon('quantity')}
              </div>
            </th>
            <th
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              onClick={() => onSort('supplier')}
            >
              <div className="flex items-center gap-1">
                Supplier
                {getSortIcon('supplier')}
              </div>
            </th>
            <th
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              onClick={() => onSort('last_restocked')}
            >
              <div className="flex items-center gap-1">
                Last Restocked
                {getSortIcon('last_restocked')}
              </div>
            </th>
            <th
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              onClick={() => onSort('storage_location')}
            >
              <div className="flex items-center gap-1">
                Location
                {getSortIcon('storage_location')}
              </div>
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {items.map((item) => (
            <motion.tr
              key={item.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="hover:bg-gray-50"
            >
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Package className="h-5 w-5 text-gray-400" />
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">{item.name}</div>
                    {item.expiry_date && (
                      <div className="flex items-center mt-1">
                        {isExpired(item.expiry_date) ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Expired
                          </span>
                        ) : isExpiringSoon(item.expiry_date) ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                            <Clock className="w-3 h-3 mr-1" />
                            Expires {formatDate(item.expiry_date)}
                          </span>
                        ) : null}
                      </div>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                  {item.category}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex flex-col">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                      item.status,
                      item.quantity,
                      item.min_quantity
                    )}`}
                  >
                    {item.quantity} {item.unit}
                  </span>
                  <span className="text-xs text-gray-500 mt-1">
                    Min: {item.min_quantity} | Max: {item.max_quantity}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {item.supplier}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {item.last_restocked ? formatDate(item.last_restocked) : 'Never'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {item.storage_location}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex items-center space-x-3">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => onEdit(item)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    <Edit className="w-5 h-5" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => onDelete(item.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="w-5 h-5" />
                  </motion.button>
                </div>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>

      {items.length === 0 && (
        <div className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No inventory items</h3>
          <p className="mt-1 text-sm text-gray-500">Add items to start managing your inventory.</p>
        </div>
      )}
    </div>
  );
}