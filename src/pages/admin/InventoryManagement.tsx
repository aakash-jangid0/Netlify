import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Search, Filter, Download, Upload, AlertTriangle,
  RefreshCcw, Archive, Trash2, ChevronDown, Clock, Box,
  Package, TrendingUp
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import InventoryTable from './InventoryManagement/components/InventoryTable';
import InventoryForm from './InventoryManagement/components/InventoryForm';
import InventoryChart from '../../components/admin/InventoryManagement/components/InventoryChart';
import BatchOperationsModal from '../../components/admin/InventoryManagement/components/BatchOperationsModal';
import StockAlerts from '../../components/admin/InventoryManagement/components/StockAlerts';
import InventoryStats from '../../components/admin/InventoryManagement/components/InventoryStats';
import ValueTracker from '../../components/admin/InventoryManagement/components/ValueTracker';
import InventorySuggestions from '../../components/admin/InventoryManagement/components/InventorySuggestions';

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
  storage_location: string;
  expiry_date?: string;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  notes?: string;
}

export default function InventoryManagement() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    status: 'all',
    supplier: 'all',
    expiryRange: [null, null] as [Date | null, Date | null],
    stockLevel: 'all'
  });
  const [sortConfig, setSortConfig] = useState({
    field: 'name',
    direction: 'asc'
  });
  const [activeView, setActiveView] = useState<'list' | 'analytics'>('list');

  useEffect(() => {
    fetchInventory();
    setupRealtimeSubscription();
  }, []);

  const setupRealtimeSubscription = () => {
    const subscription = supabase
      .channel('inventory_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inventory'
        },
        () => {
          fetchInventory();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .order(sortConfig.field, { ascending: sortConfig.direction === 'asc' });

      if (error) throw error;
      setItems(data || []);
    } catch (error: any) {
      console.error('Error fetching inventory:', error);
      toast.error('Failed to load inventory items');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: string) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleSubmit = async (formData: any) => {
    try {
      setIsSubmitting(true);
      
      if (editingItem) {
        const { error } = await supabase
          .from('inventory')
          .update(formData)
          .eq('id', editingItem.id);

        if (error) throw error;
        toast.success('Item updated successfully');
      } else {
        const { error } = await supabase
          .from('inventory')
          .insert([formData]);

        if (error) throw error;
        toast.success('Item added successfully');
      }

      setShowAddModal(false);
      setEditingItem(null);
      await fetchInventory();
    } catch (error: any) {
      console.error('Error saving inventory item:', error);
      toast.error(error.message || 'Failed to save item');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBatchOperation = async (operation: string) => {
    if (selectedItems.length === 0) {
      toast.error('Please select items to perform batch operation');
      return;
    }

    try {
      setIsSubmitting(true);
      switch (operation) {
        case 'delete':
          const { error: deleteError } = await supabase
            .from('inventory')
            .delete()
            .in('id', selectedItems);
          if (deleteError) throw deleteError;
          toast.success(`${selectedItems.length} items deleted`);
          break;

        case 'archive':
          const { error: archiveError } = await supabase
            .from('inventory')
            .update({ status: 'archived' })
            .in('id', selectedItems);
          if (archiveError) throw archiveError;
          toast.success(`${selectedItems.length} items archived`);
          break;

        default:
          throw new Error('Invalid operation');
      }

      setSelectedItems([]);
      await fetchInventory();
    } catch (error: any) {
      console.error('Error performing batch operation:', error);
      toast.error(error.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
      setShowBatchModal(false);
    }
  };

  const handleExport = async () => {
    try {
      const csv = await generateCSV(items);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inventory-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Inventory exported successfully');
    } catch (error) {
      console.error('Error exporting inventory:', error);
      toast.error('Failed to export inventory');
    }
  };

  const generateCSV = (data: InventoryItem[]): string => {
    const headers = ['Name', 'Category', 'Quantity', 'Unit', 'Cost Price', 'Status'];
    const rows = data.map(item => [
      item.name,
      item.category,
      item.quantity,
      item.unit,
      item.cost_price,
      item.status
    ]);
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  const handleReorder = async (itemIds: string[]) => {
    try {
      toast.success(`Reorder initiated for ${itemIds.length} items`);
    } catch (error) {
      console.error('Error reordering items:', error);
      toast.error('Failed to reorder items');
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.supplier?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesStatus = filters.status === 'all' || item.status === filters.status;
    const matchesSupplier = filters.supplier === 'all' || item.supplier === filters.supplier;
    const matchesStockLevel = filters.stockLevel === 'all' || 
      (filters.stockLevel === 'low' && item.quantity <= item.min_quantity) ||
      (filters.stockLevel === 'out' && item.quantity === 0);

    return matchesSearch && matchesCategory && matchesStatus && matchesSupplier && matchesStockLevel;
  });

  const lowStockItems = items.filter(item => item.quantity <= item.min_quantity);
  const expiringItems = items.filter(item => 
    item.expiry_date && new Date(item.expiry_date) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  );

  const categories = [
    { id: 'all', name: 'All Categories', icon: Box },
    { id: 'dry_goods', name: 'Dry Goods', icon: Package },
    { id: 'spices', name: 'Spices', icon: Package },
    { id: 'dairy', name: 'Dairy', icon: Package },
    { id: 'vegetables', name: 'Vegetables', icon: Package },
    { id: 'meat', name: 'Meat', icon: Package },
    { id: 'packaging', name: 'Packaging', icon: Package },
    { id: 'beverages', name: 'Beverages', icon: Package },
    { id: 'cleaning', name: 'Cleaning', icon: Package }
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Inventory Management</h1>
          <p className="text-gray-600">
            Manage and track your inventory items
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleExport}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
          >
            <Download className="w-5 h-5" />
            Export
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowBatchModal(true)}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 flex items-center gap-2"
          >
            <Archive className="w-5 h-5" />
            Batch Operations
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Item
          </motion.button>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveView('list')}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
            activeView === 'list'
              ? 'bg-orange-500 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Package className="w-5 h-5" />
          Inventory List
        </button>
        <button
          onClick={() => setActiveView('analytics')}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
            activeView === 'analytics'
              ? 'bg-orange-500 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          <TrendingUp className="w-5 h-5" />
          Analytics
        </button>
      </div>

      {/* Alerts Section */}
      {(lowStockItems.length > 0 || expiringItems.length > 0) && (
        <div className="mb-6">
          <StockAlerts
            lowStockItems={lowStockItems}
            expiringItems={expiringItems}
            onReorder={(items) => {
              console.log('Reordering items:', items);
              toast.success('Reorder request sent');
            }}
          />
        </div>
      )}

      {/* Add Inventory Suggestions component after stats */}
      <div className="mb-6">
        <InventorySuggestions
          items={items}
          onReorder={handleReorder}
        />
      </div>

      {activeView === 'analytics' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <InventoryChart
            data={items}
            type="stock"
            title="Stock Levels by Category"
          />
          <ValueTracker items={items} />
        </div>
      ) : (
        <>
          {/* Filters and Search */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search inventory..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
              >
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>

              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
              >
                <option value="all">All Status</option>
                <option value="in_stock">In Stock</option>
                <option value="low_stock">Low Stock</option>
                <option value="out_of_stock">Out of Stock</option>
              </select>

              <select
                value={filters.stockLevel}
                onChange={(e) => setFilters({ ...filters, stockLevel: e.target.value })}
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
              >
                <option value="all">All Stock Levels</option>
                <option value="normal">Normal</option>
                <option value="low">Low Stock</option>
                <option value="out">Out of Stock</option>
              </select>
            </div>
          </div>

          {/* Inventory Table */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <InventoryTable
              items={filteredItems}
              sortConfig={sortConfig}
              onSort={handleSort}
              onEdit={setEditingItem}
              onDelete={async (id) => {
                try {
                  const { error } = await supabase
                    .from('inventory')
                    .delete()
                    .eq('id', id);

                  if (error) throw error;
                  toast.success('Item deleted successfully');
                  await fetchInventory();
                } catch (error: any) {
                  console.error('Error deleting item:', error);
                  toast.error(error.message || 'Failed to delete item');
                }
              }}
              selectedItems={selectedItems}
              onSelectItems={setSelectedItems}
              loading={loading}
            />
          </div>
        </>
      )}

      {/* Modals */}
      <InventoryForm
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingItem(null);
        }}
        onSubmit={handleSubmit}
        initialData={editingItem}
        isLoading={isSubmitting}
      />

      <BatchOperationsModal
        isOpen={showBatchModal}
        onClose={() => setShowBatchModal(false)}
        onSubmit={handleBatchOperation}
        selectedCount={selectedItems.length}
        isLoading={isSubmitting}
      />
    </div>
  );
}