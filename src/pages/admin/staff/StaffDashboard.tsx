import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Clock, Award, Coins, Calendar, FileText, MessageSquare } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { toast } from 'react-hot-toast';
import StaffStats from '../../../components/admin/staff/StaffStats';
import StaffTable from '../../../components/admin/staff/StaffTable';
import StaffForm from '../../../components/admin/staff/StaffForm';
import ShiftScheduler from '../../../components/admin/staff/ShiftScheduler';
import AttendanceTracker from '../../../components/admin/staff/AttendanceTracker';
import StaffPerformance from '../../../components/admin/staff/StaffPerformance';
import DocumentManagement from '../../../components/admin/staff/DocumentManagement';

export default function StaffDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [shifts, setShifts] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [performanceData, setPerformanceData] = useState([]);
  const [stats] = useState({
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
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('staff')
        .select(`
          *,
          staff_shifts (
            shift_type,
            start_time,
            end_time
          ),
          staff_performance (
            rating,
            review_date
          ),
          staff_training (
            training_name,
            completion_date,
            status
          ),
          staff_payroll (
            base_salary,
            payment_schedule
          ),
          staff_leave (
            leave_type,
            start_date,
            end_date,
            status
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStaff(data || []);
    } catch (error) {
      console.error('Error fetching staff:', error);
      toast.error('Failed to load staff data');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Users },
    { id: 'shifts', label: 'Shifts', icon: Clock },
    { id: 'performance', label: 'Performance', icon: Award },
    { id: 'payroll', label: 'Payroll', icon: Coins },
    { id: 'leave', label: 'Leave', icon: Calendar },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'communications', label: 'Communications', icon: MessageSquare }
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Staff Management</h1>
          <p className="text-gray-600">
            Manage your restaurant staff and their roles
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 flex items-center gap-2"
        >
          <Users className="w-5 h-5" />
          Add Staff
        </motion.button>
      </div>

      <div className="mb-6 bg-white rounded-lg shadow-sm p-4 overflow-x-auto">
        <div className="flex space-x-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-emerald-500 text-white'
                    : 'hover:bg-gray-100'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <StaffStats stats={stats} />

      {activeTab === 'overview' && (
        <div className="mt-6">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <StaffTable
              staff={staff}
              onEdit={setEditingStaff}
              onDelete={async (id) => {
                try {
                  const { error } = await supabase
                    .from('staff')
                    .delete()
                    .eq('id', id);

                  if (error) throw error;
                  toast.success('Staff member deleted');
                  fetchStaff();
                } catch (error) {
                  console.error('Error deleting staff:', error);
                  toast.error('Failed to delete staff member');
                }
              }}
              onToggleStatus={async (id, status) => {
                try {
                  const { error } = await supabase
                    .from('staff')
                    .update({ is_active: status })
                    .eq('id', id);

                  if (error) throw error;
                  toast.success(`Staff member ${status ? 'activated' : 'deactivated'}`);
                  fetchStaff();
                } catch (error) {
                  console.error('Error updating staff status:', error);
                  toast.error('Failed to update status');
                }
              }}
              selectedDepartment="all"
              loading={loading}
            />
          </div>
        </div>
      )}

      {activeTab === 'shifts' && (
        <div className="mt-6">
          <ShiftScheduler 
            shifts={shifts}
            onAddShift={async (shift) => {
              setShifts(prev => [...prev, shift]);
              toast.success('Shift added successfully');
            }}
            onEditShift={async (id, updatedShift) => {
              setShifts(prev => prev.map(s => s.id === id ? updatedShift : s));
              toast.success('Shift updated successfully');
            }}
            onDeleteShift={async (id) => {
              setShifts(prev => prev.filter(s => s.id !== id));
              toast.success('Shift deleted successfully');
            }}
          />
        </div>
      )}

      {activeTab === 'performance' && (
        <div className="mt-6">
          <StaffPerformance 
            performanceData={performanceData}
            staffMembers={staff}
            onAddReview={async (review) => {
              setPerformanceData(prev => [...prev, review]);
              toast.success('Performance review added');
            }}
          />
        </div>
      )}

      {activeTab === 'documents' && (
        <div className="mt-6">
          <DocumentManagement 
            documents={documents}
            onUploadDocument={async (document) => {
              setDocuments(prev => [...prev, document]);
              toast.success('Document uploaded successfully');
            }}
            onDeleteDocument={async (id) => {
              setDocuments(prev => prev.filter(d => d.id !== id));
              toast.success('Document deleted successfully');
            }}
            onVerifyDocument={async (id, isVerified) => {
              setDocuments(prev => prev.map(d => 
                d.id === id ? { ...d, verified: isVerified } : d
              ));
              toast.success('Document verification updated');
            }}
          />
        </div>
      )}

      {activeTab === 'leave' && (
        <div className="mt-6">
          <AttendanceTracker 
            attendanceRecords={attendanceRecords}
            staffMembers={staff}
            onMarkAttendance={async (staffId, status) => {
              const newRecord = { id: Date.now().toString(), staffId, status, date: new Date().toISOString() };
              setAttendanceRecords(prev => [...prev, newRecord]);
              toast.success('Attendance marked successfully');
            }}
          />
        </div>
      )}

      <StaffForm
        isOpen={showForm || !!editingStaff}
        onClose={() => {
          setShowForm(false);
          setEditingStaff(null);
        }}
        onSubmit={async (formData) => {
          try {
            if (editingStaff) {
              const { error } = await supabase
                .from('staff')
                .update(formData)
                .eq('id', editingStaff.id);

              if (error) throw error;
              toast.success('Staff member updated');
            } else {
              const { error } = await supabase
                .from('staff')
                .insert([formData]);

              if (error) throw error;
              toast.success('Staff member added');
            }

            setShowForm(false);
            setEditingStaff(null);
            fetchStaff();
          } catch (error) {
            console.error('Error saving staff:', error);
            toast.error('Failed to save staff member');
          }
        }}
        initialData={editingStaff}
      />
    </div>
  );
}