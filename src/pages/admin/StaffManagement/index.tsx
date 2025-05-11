import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, UserPlus, Download, FileText, Calendar, UserCog, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase, diagnoseSupabaseConnection } from '../../../utils/supabaseClient';
import { diagnoseStaffTableIssues, runStaffDiagnostics } from '../../../utils/staffDiagnostics';
import StaffTable from '../../../components/admin/staff/StaffTable';
import StaffForm from '../../../components/admin/staff/StaffForm';
import StaffStats from '../../../components/admin/staff/StaffStats';
import BulkActionBar from '../../../components/admin/staff/BulkActionBar';
import { Staff } from '../../../types/staff';

// Define a proper error state type for better TypeScript support
interface ErrorState {
  type: 'network' | 'database' | 'authentication' | 'permission' | 'structure' | 'parsing' | 'timeout' | 'unknown';
  message: string;
  details: string;
  code?: string;
  hint?: string;
  stack?: string;
}

export default function StaffManagement() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stats, setStats] = useState({
    totalStaff: 0,
    activeStaff: 0,
    averageHours: 40,
    totalSalaries: 250000,
    departmentBreakdown: {
      kitchen: 5,
      service: 8,
      management: 3,
      accounts: 2
    },
    roleDistribution: {
      admin: 2,
      manager: 3,
      chef: 4,
      server: 6,
      cashier: 3
    }
  });

  useEffect(() => {
    async function initializeStaffManagement() {
      // First check Supabase connection
      const diagnosticResult = await diagnoseSupabaseConnection();
      if (!diagnosticResult.connected) {
        toast.error('Failed to connect to database. Please check your connection.');
        console.error('Connection diagnostic failed:', diagnosticResult.error);
        
        // Set error state for connection failure
        setErrorState({
          type: 'network',
          message: 'Failed to connect to database. Please check your connection.',
          details: diagnosticResult.error?.message || 'Connection diagnostic failed',
          stack: diagnosticResult.error?.stack
        });
        
        setLoading(false);
        return;
      }

      if (!diagnosticResult.authenticated) {
        console.warn('User not authenticated. This might affect data access.');
        // Proceed anyway - the fetch will handle auth errors
      }
      
      // If connection is good, fetch staff data
      fetchStaff();
    }
    
    initializeStaffManagement();
  }, []);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      // Clear any previous error state when starting a new fetch
      setErrorState(null);
      
      // Check if we're authenticated first to avoid RLS policy issues
      const { data: authData } = await supabase.auth.getSession();
      
      if (!authData.session) {
        console.log('No active session found - checking if authentication is required');
      }

      // First check if we can connect to Supabase
      console.log('Verifying Supabase connection...');
      const connectionResult = await diagnoseSupabaseConnection();
      if (!connectionResult.connected) {
        console.error('Connection diagnostic failed:', connectionResult.error);
        toast.error(`Database connection failed: ${connectionResult.error?.message || 'Unknown network issue'}`);
        
        // Set consistent error state
        setErrorState({
          type: 'network',
          message: 'Database connection failed. Please check your network connection.',
          details: connectionResult.error?.message || 'Unknown network issue',
          stack: connectionResult.error?.stack
        });
        
        setLoading(false);
        return;
      }

      // Add debug logging for the request
      console.log('Fetching staff data from Supabase...');
      
      // Test table existence first to avoid cryptic errors
      try {
        const { data: tableInfo, error: tableError } = await supabase
          .from('information_schema.tables')
          .select('table_name')
          .eq('table_schema', 'public')
          .eq('table_name', 'staff')
          .single();
        
        if (tableError) {
          console.error('Error checking for staff table:', tableError);
          // Continue to the main query as this may fail due to permissions
        } else if (!tableInfo) {
          toast.error('Staff table does not exist in the database. Please run migrations.');
          
          // Set error state for table not found
          setErrorState({
            type: 'structure',
            message: 'Staff table does not exist in the database.',
            details: 'The database schema may be missing required tables. Please run migrations.',
            code: '42P01'
          });
          
          setLoading(false);
          return;
        }
      } catch (tableCheckError) {
        console.warn('Table existence check failed, continuing anyway:', tableCheckError);
        // Continue to main query as this may fail due to permissions
      }
      
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        
        // Enhanced error handling with more specific error messages
        let errorType: ErrorState['type'] = 'unknown';
        let errorMessage = '';
        
        if (error.code === '42P01') {
          errorType = 'structure';
          errorMessage = 'Staff table not found. Database schema issue: Please run migrations.';
        } else if (error.code === 'PGRST301') {
          errorType = 'authentication';
          errorMessage = 'Authentication required: You need to log in to access staff data.';
        } else if (error.code === '42501') {
          errorType = 'permission';
          errorMessage = 'Permission denied: Your account lacks access to staff data.';
        } else if (error.code?.startsWith('22')) {
          errorType = 'database';
          errorMessage = `Data format error: ${error.message || 'Invalid data format'}`;
        } else if (error.code?.startsWith('23')) {
          errorType = 'database';
          errorMessage = `Database constraint error: ${error.message || 'Data integrity issue'}`;
        } else if (error.code?.startsWith('28')) {
          errorType = 'authentication';
          errorMessage = 'Authentication error: Invalid credentials or session expired.';
        } else if (error.message?.includes('network')) {
          errorType = 'network';
          errorMessage = 'Network error: Check your internet connection.';
        } else {
          errorType = 'database';
          errorMessage = `Database error: ${error.message || 'Unknown error'}`;
        }
        
        toast.error(errorMessage);
        
        // Set error state consistently
        setErrorState({
          type: errorType,
          message: errorMessage,
          details: error.message || 'No details available',
          code: error.code || '',
          hint: error.hint || ''
        });
        
        setLoading(false);
        return;
      }

      console.log('Staff data fetched:', data ? `${data.length} records` : 'No records');
      
      if (data && data.length > 0) {
        setStaff(data);
        
        // Update the stats based on actual data
        const activeStaff = data.filter(member => member.is_active).length;
        const totalSalary = data.reduce((sum, member) => sum + (member.base_salary || 0), 0);
        
        // Create department and role breakdowns with default values
        const departmentCounts = {
          kitchen: 0,
          service: 0,
          management: 0,
          accounts: 0
        };
        
        const roleCounts = {
          admin: 0,
          manager: 0,
          chef: 0,
          server: 0,
          cashier: 0
        };
        
        // Count staff by department and role
        data.forEach(member => {
          // Count by department
          if (member.department && departmentCounts.hasOwnProperty(member.department)) {
            departmentCounts[member.department]++;
          }
          
          // Count by role
          if (member.role && roleCounts.hasOwnProperty(member.role)) {
            roleCounts[member.role]++;
          }
        });
        
        setStats({
          totalStaff: data.length,
          activeStaff,
          averageHours: 40, // Default or calculate from data if available
          totalSalaries: totalSalary,
          departmentBreakdown: {
            kitchen: departmentCounts.kitchen,
            service: departmentCounts.service,
            management: departmentCounts.management,
            accounts: departmentCounts.accounts
          },
          roleDistribution: {
            admin: roleCounts.admin,
            manager: roleCounts.manager,
            chef: roleCounts.chef,
            server: roleCounts.server,
            cashier: roleCounts.cashier
          }
        });
      } else {
        setStaff([]);
        // If no data, we keep the default stats
      }
      
      // Clear error state on successful fetch
      setErrorState(null);
    } catch (error) {
      console.error('Error fetching staff:', error);
      
      let errorType: ErrorState['type'] = 'unknown';
      let errorMessage = '';
      
      // Categorize error types for better error messages
      if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
        errorType = 'network';
        errorMessage = 'Network error: Check your internet connection or Supabase service status';
      } else if (error.message?.includes('JSON.parse') || error.message?.includes('Unexpected token')) {
        errorType = 'parsing';
        errorMessage = 'Data parsing error: The server returned invalid data';
      } else if (error.message?.includes('timeout') || error.message?.includes('ETIMEDOUT')) {
        errorType = 'timeout';
        errorMessage = 'Request timed out: The database server is not responding';
      } else if (error.message?.includes('permission') || error.message?.includes('access')) {
        errorType = 'permission';
        errorMessage = 'Permission error: You don\'t have access to the staff data';
      } else if (error.message?.includes('auth') || error.message?.includes('credentials')) {
        errorType = 'authentication';
        errorMessage = 'Authentication error: Your session may have expired';
      } else if (error.message?.includes('table') || error.message?.includes('relation')) {
        errorType = 'structure';
        errorMessage = 'Database structure error: Staff table may not exist or has incorrect structure';
      } else {
        errorType = 'unknown';
        errorMessage = `Failed to load staff members: ${error.message || 'Unknown error'}`;
      }
      
      // Always set error state in the catch block
      setErrorState({
        type: errorType,
        message: errorMessage,
        details: error.message || 'No details available',
        stack: error.stack
      });
      
      // Show toast notification
      toast.error(errorMessage);

      // Log more details for debugging
      console.group('Detailed Error Information');
      console.log('Error name:', error.name);
      console.log('Error message:', error.message);
      console.log('Error stack:', error.stack);
      if (error.response) {
        console.log('Response status:', error.response.status);
        console.log('Response data:', error.response.data);
      }
      console.groupEnd();
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (formData) => {
    try {
      setIsSubmitting(true);
      
      if (editingStaff) {
        const { error } = await supabase
          .from('staff')
          .update(formData)
          .eq('id', editingStaff.id);

        if (error) throw error;
        toast.success('Staff member updated successfully');
      } else {
        const { error } = await supabase
          .from('staff')
          .insert([formData]);

        if (error) throw error;
        toast.success('Staff member added successfully');
      }

      setShowForm(false);
      setEditingStaff(null);
      await fetchStaff();
    } catch (error) {
      console.error('Error saving staff member:', error);
      toast.error(error.message || 'Failed to save staff member');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this staff member?')) return;

    try {
      const { error } = await supabase
        .from('staff')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Staff member deleted successfully');
      await fetchStaff();
    } catch (error) {
      console.error('Error deleting staff member:', error);
      toast.error(error.message || 'Failed to delete staff member');
    }
  };

  const handleToggleStatus = async (id, status) => {
    try {
      const { error } = await supabase
        .from('staff')
        .update({ is_active: status })
        .eq('id', id);

      if (error) throw error;
      toast.success(`Staff member ${status ? 'activated' : 'deactivated'}`);
      await fetchStaff();
    } catch (error) {
      console.error('Error updating staff status:', error);
      toast.error(error.message || 'Failed to update status');
    }
  };

  const [selectedStaff, setSelectedStaff] = useState([]);
  const [sortField, setSortField] = useState('full_name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDate, setFilterDate] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Handle bulk actions
  const handleBulkAction = async (action, ids) => {
    try {
      switch (action) {
        case 'activate':
          const { error: activateError } = await supabase
            .from('staff')
            .update({ is_active: true })
            .in('id', ids);
          
          if (activateError) throw activateError;
          toast.success(`${ids.length} staff members activated`);
          break;
          
        case 'deactivate':
          const { error: deactivateError } = await supabase
            .from('staff')
            .update({ is_active: false })
            .in('id', ids);
          
          if (deactivateError) throw deactivateError;
          toast.success(`${ids.length} staff members deactivated`);
          break;
          
        case 'delete':
          const { error: deleteError } = await supabase
            .from('staff')
            .delete()
            .in('id', ids);
          
          if (deleteError) throw deleteError;
          toast.success(`${ids.length} staff members deleted`);
          break;
          
        case 'export':
          // Example export functionality
          const staffToExport = staff.filter(member => ids.includes(member.id));
          const csv = convertToCSV(staffToExport);
          downloadCSV(csv, 'staff_export.csv');
          toast.success(`Exported ${ids.length} staff records`);
          break;
          
        case 'assign-training':
          // Would implement assignment flow here
          toast.success('Training assignment initiated');
          break;
          
        case 'schedule-shift':
          // Would implement shift scheduling flow here
          toast.success('Shift scheduling initiated');
          break;
      }
      
      await fetchStaff();
      setSelectedStaff([]);
    } catch (error) {
      console.error(`Error performing bulk action ${action}:`, error);
      toast.error(`Failed to perform ${action}`);
    }
  };

  // Helper function to convert data to CSV
  const convertToCSV = (data) => {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(item => 
      Object.values(item).map(value => 
        typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
      ).join(',')
    ).join('\n');
    
    return `${headers}\n${rows}`;
  };

  // Helper function to download CSV
  const downloadCSV = (csv, filename) => {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Sort staff members based on current sort field and direction
  const sortedStaff = [...staff].sort((a, b) => {
    let aValue = a[sortField];
    let bValue = b[sortField];
    
    if (typeof aValue === 'string') aValue = aValue.toLowerCase();
    if (typeof bValue === 'string') bValue = bValue.toLowerCase();
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Filter staff members based on all filters
  const filteredStaff = sortedStaff.filter(member => {
    const matchesSearch = 
      member.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.phone?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesDepartment = selectedDepartment === 'all' || 
      member.department === selectedDepartment;
      
    const matchesRole = filterRole === 'all' || 
      member.role === filterRole;
      
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' && member.is_active) || 
      (filterStatus === 'inactive' && !member.is_active);
    
    return matchesSearch && matchesDepartment && matchesRole && matchesStatus;
  });

  // Handle sort toggle
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const [errorState, setErrorState] = useState<ErrorState | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [diagnosticResults, setDiagnosticResults] = useState(null);
  const [isDiagnosing, setIsDiagnosing] = useState(false);

  const retryFetchStaff = () => {
    setErrorState(null);
    setDiagnosticResults(null);
    setRetryCount(prev => prev + 1);
    fetchStaff();
  };
  
  const runDiagnostics = async () => {
    setIsDiagnosing(true);
    try {
      toast.loading('Running diagnostics...');
      const results = await diagnoseStaffTableIssues();
      setDiagnosticResults(results);
      toast.dismiss();
      toast.success('Diagnostics complete');
    } catch (error) {
      toast.error('Failed to run diagnostics');
      console.error('Diagnostic error:', error);
    } finally {
      setIsDiagnosing(false);
    }
  };

  // Reset error state when component unmounts or department changes
  useEffect(() => {
    return () => setErrorState(null);
  }, [selectedDepartment]);
  
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Staff Management</h1>
          <p className="text-gray-600">
            Manage your restaurant staff and their roles
          </p>
        </div>
        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              const csv = convertToCSV(staff);
              downloadCSV(csv, 'all_staff.csv');
              toast.success('Staff list exported successfully');
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
          >
            <Download className="w-5 h-5" />
            Export
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 flex items-center gap-2"
          >
            <UserPlus className="w-5 h-5" />
            Add Staff
          </motion.button>
        </div>
      </div>

      <StaffStats stats={stats} />

      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search staff members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex gap-3">
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Departments</option>
              <option value="kitchen">Kitchen</option>
              <option value="service">Service</option>
              <option value="management">Management</option>
              <option value="accounts">Accounts</option>
            </select>
            
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="px-4 py-2 border rounded-lg flex items-center gap-2 hover:bg-gray-50"
            >
              <Filter className="w-5 h-5 text-gray-500" />
              Filters {showAdvancedFilters ? '▲' : '▼'}
            </button>
          </div>
        </div>
        
        {showAdvancedFilters && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t"
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Role</label>
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="all">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="chef">Chef</option>
                  <option value="server">Server</option>
                  <option value="cashier">Cashier</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm text-gray-600 mb-1">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm text-gray-600 mb-1">Sort By</label>
                <select
                  value={sortField}
                  onChange={(e) => handleSort(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="full_name">Name</option>
                  <option value="role">Role</option>
                  <option value="department">Department</option>
                  <option value="email">Email</option>
                  <option value="hire_date">Hire Date</option>
                  <option value="performance_score">Performance</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">View Mode</label>
                <div className="flex rounded-lg border overflow-hidden">
                  <button
                    onClick={() => setViewMode('table')}
                    className={`flex-1 py-2 px-3 ${viewMode === 'table' ? 'bg-emerald-500 text-white' : 'bg-white text-gray-700'}`}
                  >
                    Table
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`flex-1 py-2 px-3 ${viewMode === 'grid' ? 'bg-emerald-500 text-white' : 'bg-white text-gray-700'}`}
                  >
                    Grid
                  </button>
                </div>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-600 mb-1">Hire Date Filter</label>
                <div className="flex gap-2">
                  <select
                    value={filterDate}
                    onChange={(e) => {
                      setFilterDate(e.target.value);
                      if (e.target.value !== 'custom') {
                        setStartDate('');
                        setEndDate('');
                      }
                    }}
                    className="flex-1 px-3 py-2 border rounded-lg"
                  >
                    <option value="all">All Time</option>
                    <option value="this-month">This Month</option>
                    <option value="this-year">This Year</option>
                    <option value="last-month">Last Month</option>
                    <option value="last-year">Last Year</option>
                    <option value="custom">Custom Range</option>
                  </select>
                </div>
              </div>
              
              {filterDate === 'custom' && (
                <div className="md:col-span-2 flex gap-2">
                  <div className="flex-1">
                    <label className="block text-sm text-gray-600 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm text-gray-600 mb-1">End Date</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {errorState && !loading ? (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-8">
          <div className="p-8 flex flex-col items-center">
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-6 w-full">
              <div className="flex items-center mb-2">
                <AlertCircle className="w-5 h-5 mr-2 text-red-600" />
                <h3 className="text-lg font-medium">Failed to load staff data</h3>
              </div>
              
              <p className="mb-3">{errorState.message}</p>
              
              <div className="mb-4">
                <div className="font-medium mb-1">Error details:</div>
                <div className="bg-white p-3 rounded border border-red-100 text-sm font-mono whitespace-pre-wrap text-red-700 max-h-40 overflow-y-auto">
                  {errorState.details}
                  {errorState.code ? `\nError code: ${errorState.code}` : ''}
                  {errorState.hint ? `\nHint: ${errorState.hint}` : ''}
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={retryFetchStaff}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center justify-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                  </svg>
                  Try Again
                </button>
                
                <button
                  onClick={runDiagnostics}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 flex items-center justify-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 21h7a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v11m0 5l4.879-4.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242z"></path>
                  </svg>
                  Run Diagnostics
                </button>
              </div>
              
              <div className="mt-4 text-sm text-gray-600">
                <p>Need help? Check out the <a href="#" className="text-blue-600 hover:underline">troubleshooting guide</a> or contact your system administrator.</p>
              </div>
            </div>
            
            {/* Suggestions based on error type */}
            <div className="w-full">
              <h4 className="font-medium mb-2">Suggested solutions:</h4>
              <ul className="list-disc pl-5 space-y-1">
                {errorState.type === 'network' && (
                  <>
                    <li>Check your internet connection</li>
                    <li>Verify that the Supabase URL in your environment variables is correct</li>
                    <li>Check the Supabase status page for any service outages</li>
                  </>
                )}
                {errorState.type === 'authentication' && (
                  <>
                    <li>Your session may have expired - try logging out and back in</li>
                    <li>Verify that your Supabase anon key is correct</li>
                    <li>Check if your account has the required permissions</li>
                  </>
                )}
                {errorState.type === 'structure' && (
                  <>
                    <li>Run the database migrations to create the staff table</li>
                    <li>Check your database schema for any errors</li>
                    <li>Verify the table name in the query matches your database structure</li>
                  </>
                )}
                {(errorState.type === 'permission' || errorState.type === 'database') && (
                  <>
                    <li>Check your Row Level Security policies in Supabase</li>
                    <li>Verify you have the correct role and permissions</li>
                    <li>Review the database logs for more detailed errors</li>
                  </>
                )}
                {errorState.type === 'unknown' && (
                  <>
                    <li>Check the browser console for more detailed error information</li>
                    <li>Try refreshing the page</li>
                    <li>Review recent changes to the code that might have caused this issue</li>
                  </>
                )}
              </ul>
            </div>
            
            {/* Show diagnostic results if available */}
            {diagnosticResults && (
              <div className="mt-6 w-full bg-gray-50 p-4 rounded-lg border">
                <h4 className="font-medium mb-2">Diagnostic Results:</h4>
                <pre className="text-xs overflow-auto max-h-60 bg-white p-3 rounded border">
                  {JSON.stringify(diagnosticResults, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-8">
          <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
            <h3 className="font-medium">
              {filteredStaff.length} {filteredStaff.length === 1 ? 'staff member' : 'staff members'} found
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">
                {selectedStaff.length} selected
              </span>
              {selectedStaff.length > 0 && (
                <button 
                  onClick={() => setSelectedStaff([])}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
          <StaffTable
            staff={filteredStaff}
            onEdit={setEditingStaff}
            onDelete={handleDelete}
            onToggleStatus={handleToggleStatus}
            onSelectStaff={(id, isSelected) => {
              if (isSelected) {
                setSelectedStaff([...selectedStaff, id]);
              } else {
                setSelectedStaff(selectedStaff.filter(staffId => staffId !== id));
              }
            }}
            onSelectAll={(isSelected) => {
              if (isSelected) {
                setSelectedStaff(filteredStaff.map(staff => staff.id));
              } else {
                setSelectedStaff([]);
              }
            }}
            selectedStaff={selectedStaff}
            selectedDepartment={selectedDepartment}
            loading={loading}
          />
        </div>
      )}

      <AnimatePresence>
        {selectedStaff.length > 0 && (
          <BulkActionBar
            selectedStaff={selectedStaff}
            onClearSelection={() => setSelectedStaff([])}
            onBulkAction={handleBulkAction}
          />
        )}
      </AnimatePresence>

      <StaffForm
        isOpen={showForm || !!editingStaff}
        onClose={() => {
          setShowForm(false);
          setEditingStaff(null);
        }}
        onSubmit={handleSubmit}
        initialData={editingStaff}
        isLoading={isSubmitting}
      />
    </div>
  );
}