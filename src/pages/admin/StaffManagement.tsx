import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, UserPlus, Download, Users, Calendar, Clock, Award, FileText, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import StaffTable from '../../components/admin/staff/StaffTable';
import StaffForm from '../../components/admin/staff/StaffForm';
import StaffStats from '../../components/admin/staff/StaffStats';
import AttendanceTracker from '../../components/admin/staff/AttendanceTracker';
import ShiftScheduler from '../../components/admin/staff/ShiftScheduler';
import PerformanceReview from '../../components/admin/staff/PerformanceReview';
import DocumentManagement from '../../components/admin/staff/DocumentManagement';

// Import custom styles
import './StaffManagement.css';

export default function StaffManagement() {
  const [activeTab, setActiveTab] = useState('staff');
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [tableErrors, setTableErrors] = useState({ attendance: false, shifts: false });
  const [stats, setStats] = useState({
    totalStaff: 0,
    activeStaff: 0,
    averageHours: 0,
    totalSalaries: 0,
    departmentBreakdown: {},
    roleDistribution: {}
  });
    // Define tab configuration
  const tabs = [
    { id: 'staff', label: 'Staff List', icon: Users },
    { id: 'attendance', label: 'Attendance', icon: Calendar },
    { id: 'shifts', label: 'Shift Scheduler', icon: Clock }
    // Performance and Documents moved to staff profile
  ];

  useEffect(() => {
    fetchStaff();
    
    // Reset table errors when changing tabs
    setTableErrors({ attendance: false, shifts: false });
    
    // Fetch additional data when specific tabs are active
    if (activeTab === 'attendance') {
      fetchAttendanceRecords();
    } else if (activeTab === 'shifts') {
      fetchShifts();
    }
  }, [activeTab]);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setStaff(data || []);
      calculateStats(data);
    } catch (error) {
      console.error('Error fetching staff:', error);
      toast.error('Failed to load staff members');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (staffData) => {
    const totalStaff = staffData.length;
    const activeStaff = staffData.filter(s => s.is_active).length;
    
    // Calculate department breakdown
    const departmentBreakdown = staffData.reduce((acc, staff) => {
      acc[staff.department] = (acc[staff.department] || 0) + 1;
      return acc;
    }, {});

    // Calculate role distribution
    const roleDistribution = staffData.reduce((acc, staff) => {
      acc[staff.role] = (acc[staff.role] || 0) + 1;
      return acc;
    }, {});

    setStats({
      totalStaff,
      activeStaff,
      averageHours: 40, // Mock data
      totalSalaries: 250000, // Mock data
      departmentBreakdown,
      roleDistribution
    });
  };
  // Functions to create necessary tables if they don't exist
  const createStaffAttendanceTable = async () => {
    try {
      toast.loading('Setting up attendance system...');
      
      // Run the SQL to create the staff_attendance table using our migration file
      const { error } = await supabase.rpc('run_sql', {
        sql: `
          -- Create staff_attendance table with proper schema
          CREATE TABLE IF NOT EXISTS public.staff_attendance (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
            staff_name TEXT, -- Denormalized for performance
            check_in TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            check_out TIMESTAMP WITH TIME ZONE,
            status TEXT DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late', 'half-day')),
            total_hours NUMERIC,
            notes TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
          );
          
          -- Create indexes for performance
          CREATE INDEX IF NOT EXISTS idx_staff_attendance_staff_id ON public.staff_attendance(staff_id);
          CREATE INDEX IF NOT EXISTS idx_staff_attendance_check_in ON public.staff_attendance(check_in);
          CREATE INDEX IF NOT EXISTS idx_staff_attendance_status ON public.staff_attendance(status);

          -- Enable RLS
          ALTER TABLE public.staff_attendance ENABLE ROW LEVEL SECURITY;
          
          -- Add policies
          DO $$
          BEGIN
            -- Admins can perform all actions
            IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'staff_attendance' AND policyname = 'Admin can manage all attendance') THEN
              CREATE POLICY "Admin can manage all attendance" 
              ON public.staff_attendance FOR ALL 
              TO authenticated
              USING (
                EXISTS (
                  SELECT 1 FROM public.staff
                  WHERE 
                    user_id = auth.uid() AND 
                    (role = 'admin' OR role = 'manager')
                )
              )
              WITH CHECK (
                EXISTS (
                  SELECT 1 FROM public.staff
                  WHERE 
                    user_id = auth.uid() AND 
                    (role = 'admin' OR role = 'manager')
                )
              );
            END IF;

            -- Staff can view their own attendance records
            IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'staff_attendance' AND policyname = 'Staff can view their own attendance') THEN
              CREATE POLICY "Staff can view their own attendance" 
              ON public.staff_attendance FOR SELECT 
              TO authenticated
              USING (
                staff_id IN (
                  SELECT id FROM public.staff WHERE user_id = auth.uid()
                )
              );
            END IF;
          END
          $$;
        `
      });

      if (error) {
        throw error;
      }

      // Add some sample data
      const { data: staffData } = await supabase.from('staff').select('id').limit(3);
      
      if (staffData && staffData.length > 0) {
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);
        
        const sampleRecords = staffData.map(staff => [
          {
            staff_id: staff.id,
            date: today.toISOString().split('T')[0],
            check_in: new Date(today.setHours(9, 0, 0)).toISOString(),
            check_out: new Date(today.setHours(17, 0, 0)).toISOString(),
            hours_worked: 8,
            status: 'present'
          },
          {
            staff_id: staff.id,
            date: yesterday.toISOString().split('T')[0],
            check_in: new Date(yesterday.setHours(9, 0, 0)).toISOString(),
            check_out: new Date(yesterday.setHours(17, 0, 0)).toISOString(),
            hours_worked: 8,
            status: Math.random() > 0.7 ? 'absent' : 'present'
          }
        ]).flat();
        
        const { error: insertError } = await supabase
          .from('staff_attendance')
          .insert(sampleRecords);
          
        if (insertError) {
          console.error('Error inserting sample attendance:', insertError);
        }
      }
      
      toast.dismiss();
      toast.success('Attendance system is ready');
      
      // Clear the error state
      setTableErrors(prev => ({ ...prev, attendance: false }));
      
      // Refresh attendance records
      await fetchAttendanceRecords();
      
    } catch (error) {
      console.error('Failed to create attendance table:', error);
      toast.dismiss();
      toast.error('Failed to set up attendance system');
      setTableErrors(prev => ({ ...prev, attendance: true }));
      setLoading(false);
    }
  };
  const createStaffShiftsTable = async () => {
    try {
      toast.loading('Setting up shift scheduler...');
      
      // Run the SQL to create the staff_shifts table
      const { error } = await supabase.rpc('run_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS public.staff_shifts (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
            shift_date DATE NOT NULL,
            start_time TIME NOT NULL,
            end_time TIME NOT NULL,
            break_duration INTEGER DEFAULT 30,
            total_hours NUMERIC,
            status TEXT DEFAULT 'scheduled',
            notes TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
          );
          
          -- Enable RLS
          ALTER TABLE public.staff_shifts ENABLE ROW LEVEL SECURITY;
          
          -- Add policies
          DO $$
          BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'staff_shifts' AND policyname = 'staff_shifts_select_policy') THEN
              CREATE POLICY staff_shifts_select_policy ON public.staff_shifts
                FOR SELECT USING (true);
            END IF;
          END
          $$;
        `
      });

      if (error) {
        throw error;
      }

      // Add some sample data
      const { data: staffData } = await supabase.from('staff').select('id').limit(3);
      
      if (staffData && staffData.length > 0) {
        const today = new Date();
        const tomorrow = new Date();
        tomorrow.setDate(today.getDate() + 1);
        
        const shiftTypes = ['morning', 'afternoon', 'evening'];
        const shiftTimes = {
          morning: { start: '08:00', end: '16:00' },
          afternoon: { start: '12:00', end: '20:00' },
          evening: { start: '16:00', end: '00:00' }
        };
        
        const sampleShifts = staffData.map((staff, index) => {
          const shiftType = shiftTypes[index % shiftTypes.length];
          return {
            staff_id: staff.id,
            shift_date: tomorrow.toISOString().split('T')[0],
            start_time: shiftTimes[shiftType].start,
            end_time: shiftTimes[shiftType].end,
            break_duration: 30,
            total_hours: shiftType === 'evening' ? 8 : 7.5,
            status: 'scheduled',
            notes: `Sample ${shiftType} shift`
          };
        });
        
        const { error: insertError } = await supabase
          .from('staff_shifts')
          .insert(sampleShifts);
          
        if (insertError) {
          console.error('Error inserting sample shifts:', insertError);
        }
      }
      
      toast.dismiss();
      toast.success('Shift scheduler is ready');
      
      // Clear the error state
      setTableErrors(prev => ({ ...prev, shifts: false }));
      
      // Refresh shifts
      await fetchShifts();
      
    } catch (error) {
      console.error('Failed to create shifts table:', error);
      toast.dismiss();
      toast.error('Failed to set up shift scheduler');
      setTableErrors(prev => ({ ...prev, shifts: true }));
      setLoading(false);
    }
  };
  const fetchAttendanceRecords = async () => {
    try {
      console.log('Fetching attendance records...');
      setLoading(true);
      
      // Check if the table exists
      try {
        const { error: tableCheckError } = await supabase
          .from('staff_attendance')
          .select('id')
          .limit(1);
          
        if (tableCheckError) {
          console.error('Table check error:', tableCheckError);
          setTableErrors(prev => ({ ...prev, attendance: true }));
          // If you want to automatically create the table, uncomment:
          // await createStaffAttendanceTable();
          setLoading(false);
          return;
        }
      } catch (tableError) {
        console.error('Error checking staff_attendance table:', tableError);
        setTableErrors(prev => ({ ...prev, attendance: true }));
        toast.error('Staff attendance system not properly configured');
        setLoading(false);
        return;
      }
      
      // If table exists, proceed with fetching data
      const { data, error } = await supabase
        .from('staff_attendance')
        .select(`
          id, 
          staff_id,
          date,
          check_in,
          check_out,
          hours_worked,
          status,
          notes
        `)
        .order('date', { ascending: false });

      if (error) {
        console.error('Error in staff_attendance query:', error);
        throw error;
      }
      
      console.log('Attendance data received:', data);
      
      // Get staff data to map names
      const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select('id, full_name');
        
      if (staffError) throw staffError;
      
      // Create a mapping of staff IDs to names
      const staffMap = {};
      staffData?.forEach(staff => {
        staffMap[staff.id] = staff.full_name;
      });
      
      // Transform the data to match AttendanceTracker component's expected format
      const formattedRecords = data?.map(record => ({
        id: record.id,
        staff_id: record.staff_id,
        staff_name: staffMap[record.staff_id] || 'Unknown',
        check_in: record.check_in,
        check_out: record.check_out,
        status: record.status || 'present',
        total_hours: record.hours_worked,
        notes: record.notes
      })) || [];
      
      setAttendanceRecords(formattedRecords);
    } catch (error) {
      console.error('Error fetching attendance records:', error);
      toast.error('Failed to load attendance records');
      setTableErrors(prev => ({ ...prev, attendance: true }));
    } finally {
      setLoading(false);
    }
  };
    const fetchShifts = async () => {
    try {
      console.log('Fetching shifts...');
      setLoading(true);
      
      // Check if the table exists
      try {
        const { error: tableCheckError } = await supabase
          .from('staff_shifts')
          .select('id')
          .limit(1);
          
        if (tableCheckError) {
          console.error('Table check error:', tableCheckError);
          setTableErrors(prev => ({ ...prev, shifts: true }));
          // If you want to automatically create the table, uncomment:
          // await createStaffShiftsTable();
          setLoading(false);
          return;
        }
      } catch (tableError) {
        console.error('Error checking staff_shifts table:', tableError);
        setTableErrors(prev => ({ ...prev, shifts: true }));
        toast.error('Staff shift system not properly configured');
        setLoading(false);
        return;
      }
      
      // If table exists, proceed with fetching data
      const { data, error } = await supabase
        .from('staff_shifts')
        .select(`
          id, 
          staff_id,
          shift_date,
          start_time,
          end_time,
          break_duration,
          total_hours,
          status,
          notes
        `)
        .order('shift_date', { ascending: false });

      if (error) {
        console.error('Error in staff_shifts query:', error);
        throw error;
      }
      
      console.log('Shifts data received:', data);
      
      // Transform the data to match ShiftScheduler component's expected format
      const formattedShifts = data?.map(shift => ({
        id: shift.id,
        staff_id: shift.staff_id,
        shift_type: determineShiftType(shift.start_time),
        start_time: shift.start_time,
        end_time: shift.end_time,
        break_duration: String(shift.break_duration || '30'),
        notes: shift.notes
      })) || [];
      
      setShifts(formattedShifts);
    } catch (error) {
      console.error('Error fetching shifts:', error);
      toast.error('Failed to load shift schedules');
      setTableErrors(prev => ({ ...prev, shifts: true }));
    } finally {
      setLoading(false);
    }
  };
  
  // Helper function to determine shift type based on start time
  const determineShiftType = (timeString) => {
    if (!timeString) return 'morning';
    
    try {
      const hour = parseInt(timeString.split(':')[0]);
      if (hour >= 5 && hour < 12) return 'morning';
      if (hour >= 12 && hour < 17) return 'afternoon';
      if (hour >= 17 && hour < 22) return 'evening';
      return 'night';
    } catch (e) {
      return 'morning';
    }
  };
  
  // Attendance tracker functions
  const handleMarkAttendance = async (staffId, status) => {
    try {
      const now = new Date();
      const { data, error } = await supabase
        .from('staff_attendance')
        .insert([{
          staff_id: staffId,
          date: now.toISOString().split('T')[0],
          check_in: now.toISOString(),
          status: status
        }]);

      if (error) throw error;
      
      toast.success('Attendance marked successfully');
      fetchAttendanceRecords();
    } catch (error) {
      console.error('Error marking attendance:', error);
      toast.error('Failed to mark attendance');
    }
  };
  
  // Shift scheduler functions
  const handleAddShift = async (shift) => {
    try {
      const { data, error } = await supabase
        .from('staff_shifts')
        .insert([{
          staff_id: shift.staff_id,
          shift_date: new Date().toISOString().split('T')[0],
          start_time: shift.start_time,
          end_time: shift.end_time,
          break_duration: shift.break_duration,
          notes: shift.notes,
          status: 'scheduled'
        }]);

      if (error) throw error;
      
      toast.success('Shift added successfully');
      fetchShifts();
    } catch (error) {
      console.error('Error adding shift:', error);
      toast.error('Failed to add shift');
    }
  };
  
  const handleEditShift = async (id, shiftUpdates) => {
    try {
      const { error } = await supabase
        .from('staff_shifts')
        .update({
          start_time: shiftUpdates.start_time,
          end_time: shiftUpdates.end_time,
          break_duration: shiftUpdates.break_duration,
          notes: shiftUpdates.notes
        })
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Shift updated successfully');
      fetchShifts();
    } catch (error) {
      console.error('Error updating shift:', error);
      toast.error('Failed to update shift');
    }
  };
  
  const handleDeleteShift = async (id) => {
    try {
      const { error } = await supabase
        .from('staff_shifts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Shift deleted successfully');
      fetchShifts();
    } catch (error) {
      console.error('Error deleting shift:', error);
      toast.error('Failed to delete shift');
    }
  };
  const handleSubmit = async (formData, photoFile) => {
    try {
      setIsSubmitting(true);
      
      // Handle photo upload if a new file is provided
      let photoUrl = formData.profile_photo_url;
      
      if (photoFile) {
        const fileName = `${Date.now()}-${photoFile.name}`;
        const folderPath = editingStaff ? editingStaff.id : 'temp';
        const filePath = `staff-photos/${folderPath}/${fileName}`;
        
        const { error: uploadError, data } = await supabase.storage
          .from('staff-photos')
          .upload(filePath, photoFile);
          
        if (uploadError) {
          throw new Error(`Error uploading photo: ${uploadError.message}`);
        }
        
        // Get the public URL for the uploaded file
        const { data: { publicUrl } } = supabase.storage
          .from('staff-photos')
          .getPublicUrl(filePath);
          
        photoUrl = publicUrl;
        formData.profile_photo_url = photoUrl;
      }
      
      if (editingStaff) {
        const { error } = await supabase
          .from('staff')
          .update(formData)
          .eq('id', editingStaff.id);

        if (error) throw error;
        toast.success('Staff member updated successfully');
      } else {
        const { data, error } = await supabase
          .from('staff')
          .insert([formData])
          .select();

        if (error) throw error;
        
        // If we uploaded a photo with a temporary path, move it to the proper staff ID folder
        if (photoFile && photoUrl && photoUrl.includes('staff-photos/temp/')) {
          const newStaffId = data[0].id;
          const oldPath = photoUrl.split('staff-photos/')[1];
          const newFileName = oldPath.split('/').pop();
          const newPath = `staff-photos/${newStaffId}/${newFileName}`;
          
          // Copy to new location
          await supabase.storage
            .from('staff-photos')
            .copy(oldPath, newPath);
            
          // Get the new public URL
          const { data: { publicUrl } } = supabase.storage
            .from('staff-photos')
            .getPublicUrl(newPath);
            
          // Update the staff record with the new URL
          await supabase
            .from('staff')
            .update({ profile_photo_url: publicUrl })
            .eq('id', newStaffId);
            
          // Remove the temp file
          await supabase.storage
            .from('staff-photos')
            .remove([oldPath]);
        }
        
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
  const filteredStaff = staff.filter(member => {
    const matchesSearch = 
      member.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesDepartment = selectedDepartment === 'all' || 
      member.department === selectedDepartment;

    return matchesSearch && matchesDepartment;
  });

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
          {activeTab === 'staff' && (
            <>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  // Handle export
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
            </>
          )}
          
          {activeTab === 'attendance' && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => fetchAttendanceRecords()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
            >
              <Calendar className="w-5 h-5" />
              Refresh Attendance
            </motion.button>
          )}
          
          {activeTab === 'shifts' && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => fetchShifts()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
            >
              <Clock className="w-5 h-5" />
              Refresh Shifts
            </motion.button>
          )}
        </div>
      </div>
      
      {/* Tabs Navigation */}
      <div className="flex border-b mb-6 overflow-x-auto hide-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center px-6 py-3 border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-emerald-500 text-emerald-600"
                : "border-transparent hover:text-emerald-500"
            }`}
          >
            <tab.icon className="w-5 h-5 mr-2" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Display stats only on staff tab */}
      {activeTab === 'staff' && <StaffStats stats={stats} />}

      {/* Staff List Tab */}
      {activeTab === 'staff' && (
        <>
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
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <StaffTable
              staff={filteredStaff}
              onEdit={setEditingStaff}
              onDelete={handleDelete}
              onToggleStatus={handleToggleStatus}
              selectedDepartment={selectedDepartment}
              loading={loading}
            />
          </div>
        </>
      )}
      
      {/* Attendance Tracker Tab */}
      {activeTab === 'attendance' && (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-6 text-center">
              <div className="animate-spin w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p>Loading attendance records...</p>
            </div>
          ) : tableErrors.attendance ? (
            <div className="p-6 text-center">
              <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
              <h3 className="text-lg font-medium mb-2">Database Configuration Required</h3>
              <p className="text-gray-600 mb-4">The attendance tracking system needs to be configured.</p>
              <button 
                onClick={createStaffAttendanceTable}
                className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
              >
                Set Up Attendance System
              </button>
            </div>
          ) : (
            <AttendanceTracker
              attendanceRecords={attendanceRecords}
              onMarkAttendance={handleMarkAttendance}
              staffMembers={staff.map(member => ({ id: member.id, full_name: member.full_name }))}
            />
          )}
        </div>
      )}
      
      {/* Shift Scheduler Tab */}
      {activeTab === 'shifts' && (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-6 text-center">
              <div className="animate-spin w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p>Loading shift schedules...</p>
            </div>
          ) : tableErrors.shifts ? (
            <div className="p-6 text-center">
              <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
              <h3 className="text-lg font-medium mb-2">Database Configuration Required</h3>
              <p className="text-gray-600 mb-4">The shift scheduling system needs to be configured.</p>
              <button 
                onClick={createStaffShiftsTable}
                className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
              >
                Set Up Shift Scheduler
              </button>
            </div>
          ) : (
            <ShiftScheduler
              shifts={shifts}
              onAddShift={handleAddShift}
              onEditShift={handleEditShift}
              onDeleteShift={handleDeleteShift}
            />
          )}
        </div>
      )}      {/* Performance Review and Document Management removed - now in staff profiles */}

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
