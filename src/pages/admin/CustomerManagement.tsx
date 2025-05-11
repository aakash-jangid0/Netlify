import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, User, Mail, Calendar, Phone, MapPin, Download, ChevronDown, Edit, Save, X, Plus, Filter, List, Grid, Tag, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { ENV } from '../../utils/environment';
import CustomerCard from '../../components/admin/admin/CustomerCard';
import CustomerTable from '../../components/admin/admin/CustomerTable';
import CustomerStats from '../../components/admin/admin/CustomerStats';
import CustomerAnalytics from '../../components/admin/admin/CustomerAnalytics';
import CustomerModal from '../../components/admin/admin/CustomerModal';
import { Customer, CustomerStats as CustomerStatsType } from '../../types/Customer';

export default function CustomerManagement() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [view, setView] = useState<'table' | 'cards'>('table');
  const [tagFilter, setTagFilter] = useState<string[]>([]);
  const [spentRange, setSpentRange] = useState({ min: 0, max: 10000 });
  const [dateRange, setDateRange] = useState({ 
    start: null as Date | null, 
    end: null as Date | null 
  });
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
    status: 'active'
  });
    const [stats, setStats] = useState<CustomerStatsType>({
    totalCustomers: 0,
    activeCustomers: 0,
    inactiveCustomers: 0,
    averageSpend: 0,
    newThisMonth: 0
  });
  
  useEffect(() => {
    fetchCustomers();
    setupRealtimeSubscription();
  }, []);
  
  const setupRealtimeSubscription = () => {
    const subscription = supabase
      .channel('customers_channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'customers'
        },
        () => {
          fetchCustomers();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // First check if the customers table exists and has data
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error details:', error);
        throw error;
      }
      
      // If no data was returned, try creating the table with sample data
      if (!data || data.length === 0) {
        await createCustomersTable();
        const { data: newData, error: newError } = await supabase
          .from('customers')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (newError) throw newError;
        
        if (newData && newData.length > 0) {
          const customersWithTags = newData.map(customer => ({
            ...customer,
            tags: generateRandomTags(customer)
          }));
          
          setCustomers(customersWithTags);
          calculateStats(customersWithTags);
        } else {
          setError("Could not create customer data. Please check your database connection.");
          setCustomers([]);
        }
      } else {
        const customersWithTags = data.map(customer => ({
          ...customer,
          tags: customer.tags || generateRandomTags(customer)
        }));
        
        setCustomers(customersWithTags);
        calculateStats(customersWithTags);
      }
    } catch (error: any) {
      console.error('Error in customer handling:', error);
      setError(`Failed to load customers: ${error.message || 'Unknown error'}`);
      setCustomers([]);
      
      // Set empty stats
      setStats({
        totalCustomers: 0,
        activeCustomers: 0,
        inactiveCustomers: 0,
        averageSpend: 0,
        newThisMonth: 0
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Function to create the customers table if it doesn't exist
  const createCustomersTable = async () => {
    try {
      // Add some sample data
      const { error } = await supabase
        .from('customers')
        .insert([
          {
            name: 'John Doe',
            email: 'john@example.com',
            phone: '1234567890',
            address: '123 Main St',
            created_at: new Date().toISOString(),
            last_visit: new Date().toISOString(),
            total_orders: 5,
            total_spent: 2500,
            status: 'active'
          },
          {
            name: 'Jane Smith',
            email: 'jane@example.com',
            phone: '9876543210',
            address: '456 Oak St',
            created_at: new Date().toISOString(),
            last_visit: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            total_orders: 3,
            total_spent: 1800,
            status: 'active'
          },
          {
            name: 'Michael Johnson',
            email: 'michael@example.com',
            phone: '5551234567',
            address: '789 Pine St',
            created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            last_visit: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
            total_orders: 8,
            total_spent: 4200,
            status: 'active'
          }
        ]);

      if (error) {
        console.error('Error inserting sample customer data:', error);
        throw error;
      }
      toast.success('Sample customers created successfully!');
    } catch (err: any) {
      console.error('Error creating customers table:', err);
      // If error is because table already exists, that's fine
      if (!err.message?.includes('already exists')) {
        throw err;
      }
    }
  };
    // Generate random tags for demo purposes (in a real app, these would come from the database)
  const generateRandomTags = (customer: Customer): string[] => {
    const allTags = ['VIP', 'Regular', 'New', 'Vegetarian', 'Vegan', 'Discount', 'Birthday', 'Corporate', 'Event'];
    const customerTags: string[] = [];
    
    // Base tag on status
    if (customer.status === 'active') {
      customerTags.push(customer.total_orders > 10 ? 'Regular' : 'New');
    }
    
    // Add random additional tag
    const randomTag = allTags[Math.floor(Math.random() * (allTags.length - 2)) + 2];
    if (!customerTags.includes(randomTag)) {
      customerTags.push(randomTag);
    }
    
    return customerTags;
  };
  
  const calculateStats = (customersData: Customer[]) => {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const totalCustomers = customersData.length;
    const activeCustomers = customersData.filter(c => c.status === 'active').length;
    const inactiveCustomers = customersData.filter(c => c.status === 'inactive' || c.status === 'blocked').length;
    const totalSpent = customersData.reduce((sum, customer) => sum + customer.total_spent, 0);
    const averageSpend = totalCustomers > 0 ? totalSpent / totalCustomers : 0;
    const newThisMonth = customersData.filter(c => 
      new Date(c.created_at) >= firstDayOfMonth
    ).length;
    
    setStats({
      totalCustomers,
      activeCustomers,
      inactiveCustomers,
      averageSpend,
      newThisMonth
    });
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address || '',
      notes: customer.notes || '',
      status: customer.status
    });
    setShowAddModal(true);
  };
  
  const handleSubmitCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCustomer) {
        const { error } = await supabase
          .from('customers')
          .update({
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            notes: formData.notes,
            status: formData.status
          })
          .eq('id', editingCustomer.id);
          
        if (error) throw error;
        toast.success('Customer updated successfully');
      } else {
        const { error } = await supabase
          .from('customers')
          .insert([{
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            notes: formData.notes,
            status: formData.status,
            total_orders: 0,
            total_spent: 0
          }]);
          
        if (error) throw error;
        toast.success('Customer added successfully');
      }
      
      setShowAddModal(false);
      setEditingCustomer(null);
      resetForm();
      await fetchCustomers();
    } catch (error: any) {
      console.error('Error saving customer:', error);
      toast.error(error.message || 'Failed to save customer');
    }
  };
  
  const handleStatusChange = async (id: string, status: Customer['status']) => {
    try {
      const { error } = await supabase
        .from('customers')
        .update({ status })
        .eq('id', id);
        
      if (error) throw error;
      toast.success(`Customer status updated to ${status}`);
      await fetchCustomers();
    } catch (error: any) {
      console.error('Error updating customer status:', error);
      toast.error(error.message || 'Failed to update customer status');
    }
  };
  
  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      notes: '',
      status: 'active'
    });
  };
  
  const handleSelectCustomers = (ids: string[]) => {
    setSelectedCustomers(ids);
  };
  
  const toggleTagFilter = (tag: string) => {
    if (tagFilter.includes(tag)) {
      setTagFilter(tagFilter.filter(t => t !== tag));
    } else {
      setTagFilter([...tagFilter, tag]);
    }
  };
  
  const exportCustomers = () => {
    // Create a CSV string from the filtered customers
    const csvContent = 'data:text/csv;charset=utf-8,' + 
      'Name,Email,Phone,Status,Total Spent,Orders\n' + 
      filteredCustomers.map(customer => 
        `"${customer.name}","${customer.email}","${customer.phone}","${customer.status}","${customer.total_spent}","${customer.total_orders}"`
      ).join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `customers-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Customer list exported successfully');
  };
  
  const availableTags = Array.from(
    new Set(customers.flatMap(customer => customer.tags || []))
  ).sort();
  
  const filteredCustomers = customers.filter(customer => {
    // Filter by search query
    const matchesSearch = 
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone.includes(searchQuery);
    
    // Filter by status
    const matchesStatus = selectedStatus === 'all' || customer.status === selectedStatus;
    
    // Filter by tags
    const matchesTags = tagFilter.length === 0 || 
      tagFilter.every(tag => customer.tags?.includes(tag));
    
    // Filter by spent amount
    const matchesSpent = customer.total_spent >= spentRange.min && 
      customer.total_spent <= spentRange.max;
    
    // Filter by date range
    let matchesDate = true;
    if (dateRange.start) {
      matchesDate = matchesDate && new Date(customer.created_at) >= dateRange.start;
    }
    if (dateRange.end) {
      matchesDate = matchesDate && new Date(customer.created_at) <= dateRange.end;
    }
    
    return matchesSearch && matchesStatus && matchesTags && matchesSpent && matchesDate;
  });

  return (
    <div className="p-6">
      {/* Header section */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Customer Management</h1>
          <p className="text-gray-600">Manage your restaurant's customers</p>
        </div>
        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={exportCustomers}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
          >
            <Download className="w-5 h-5" />
            Export
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setEditingCustomer(null);
              resetForm();
              setShowAddModal(true);
            }}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Customer
          </motion.button>
        </div>
      </div>

      {/* Stats and analytics sections */}
      <CustomerStats stats={stats} />
      <CustomerAnalytics customers={customers} />

      {/* Filters section */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
            />
          </div>
          
          <div className="flex gap-2">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
            >
              <option value="all">All Customers</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="blocked">Blocked</option>
            </select>
            
            <div className="relative">
              <button
                onClick={() => document.getElementById('tagFilterDropdown')?.classList.toggle('hidden')}
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 flex items-center gap-2"
              >
                <Tag className="w-4 h-4" />
                Tags
                <ChevronDown className="w-4 h-4" />
              </button>
              
              <div id="tagFilterDropdown" className="absolute z-10 mt-1 right-0 w-48 bg-white shadow-lg rounded-lg border hidden">
                <div className="p-2 max-h-64 overflow-y-auto">
                  {availableTags.map(tag => (
                    <div key={tag} className="flex items-center p-2 hover:bg-gray-50 rounded">
                      <input
                        type="checkbox"
                        id={`tag-${tag}`}
                        checked={tagFilter.includes(tag)}
                        onChange={() => toggleTagFilter(tag)}
                        className="mr-2"
                      />
                      <label htmlFor={`tag-${tag}`} className="text-sm">{tag}</label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex items-center">
              <button 
                onClick={() => setView('table')}
                className={`p-2 rounded-l-lg border ${view === 'table' ? 'bg-orange-500 text-white' : 'bg-white'}`}
                aria-label="Table view"
              >
                <List className="w-5 h-5" />
              </button>
              <button
                onClick={() => setView('cards')}
                className={`p-2 rounded-r-lg border-t border-r border-b ${view === 'cards' ? 'bg-orange-500 text-white' : 'bg-white'}`}
                aria-label="Card view"
              >
                <Grid className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Active tag filters */}
        {tagFilter.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {tagFilter.map(tag => (
              <div key={tag} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm flex items-center">
                {tag}
                <button
                  onClick={() => toggleTagFilter(tag)}
                  className="ml-2 text-blue-500 hover:text-blue-700"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            <button
              onClick={() => setTagFilter([])}
              className="text-gray-600 text-sm hover:text-gray-800"
            >
              Clear all
            </button>
          </div>
        )}
        
        {/* Advanced filters */}
        <div className="flex flex-wrap gap-x-6 gap-y-2 mb-4">
          <div className="flex items-center">
            <DollarSign className="w-4 h-4 text-gray-400 mr-1" />
            <span className="text-sm text-gray-600 mr-2">Spent Range:</span>
            <input
              type="number"
              placeholder="Min"
              value={spentRange.min}
              onChange={(e) => setSpentRange({...spentRange, min: Number(e.target.value)})}
              className="w-24 px-2 py-1 border rounded-lg text-sm"
            />
            <span className="mx-2">-</span>
            <input
              type="number"
              placeholder="Max"
              value={spentRange.max}
              onChange={(e) => setSpentRange({...spentRange, max: Number(e.target.value)})}
              className="w-24 px-2 py-1 border rounded-lg text-sm"
            />
          </div>
          
          <div className="flex items-center">
            <Calendar className="w-4 h-4 text-gray-400 mr-1" />
            <span className="text-sm text-gray-600 mr-2">Date Range:</span>
            <input
              type="date"
              value={dateRange.start ? dateRange.start.toISOString().split('T')[0] : ''}
              onChange={(e) => setDateRange({
                ...dateRange, 
                start: e.target.value ? new Date(e.target.value) : null
              })}
              className="px-2 py-1 border rounded-lg text-sm"
            />
            <span className="mx-2">-</span>
            <input
              type="date"
              value={dateRange.end ? dateRange.end.toISOString().split('T')[0] : ''}
              onChange={(e) => setDateRange({
                ...dateRange, 
                end: e.target.value ? new Date(e.target.value) : null
              })}
              className="px-2 py-1 border rounded-lg text-sm"
            />
          </div>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <X className="h-5 w-5 text-red-500" />
            </div>
            <div className="ml-3">
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Loading state or results */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading customers...</p>
        </div>
      ) : (
        view === 'table' ? (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <CustomerTable
              customers={filteredCustomers}
              selectedCustomers={selectedCustomers}
              onSelect={handleSelectCustomers}
              onEdit={handleEditCustomer}
              onStatusChange={handleStatusChange}
              filters={{
                search: searchQuery,
                status: selectedStatus,
                sortBy: 'name',
                tags: tagFilter,
                spentRange,
                dateRange
              }}
              view="table"
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCustomers.length > 0 ? (
              filteredCustomers.map((customer) => (
                <CustomerCard
                  key={customer.id}
                  customer={customer}
                  onEdit={handleEditCustomer}
                  onStatusChange={handleStatusChange}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-12 bg-white rounded-lg shadow-sm">
                <User className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">
                  {searchQuery || tagFilter.length > 0 || selectedStatus !== 'all' 
                    ? 'No customers found matching your filters' 
                    : 'No customers found'}
                </p>
              </div>
            )}
          </div>
        )
      )}

      {/* Add/Edit Customer Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-lg shadow-lg w-full max-w-xl p-6"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                  {editingCustomer ? 'Edit Customer' : 'Add Customer'}
                </h2>
                <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-gray-700">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitCustomer}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                      rows={2}
                    ></textarea>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as Customer['status'] })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="blocked">Blocked</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                  >
                    {editingCustomer ? 'Update Customer' : 'Add Customer'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}