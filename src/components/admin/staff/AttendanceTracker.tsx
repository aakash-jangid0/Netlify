import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Check, X, User, Filter } from 'lucide-react';
import { format, subDays, isSameDay } from 'date-fns';

interface Attendance {
  id: string;
  staff_id: string;
  staff_name: string;
  check_in: string;
  check_out: string | null;
  status: 'present' | 'absent' | 'late' | 'half-day';
  total_hours?: number;
  notes?: string;
}

interface AttendanceTrackerProps {
  attendanceRecords: Attendance[];
  onMarkAttendance: (staffId: string, status: string) => Promise<void>;
  staffMembers: { id: string; full_name: string }[];
}

export default function AttendanceTracker({
  attendanceRecords,
  onMarkAttendance,
  staffMembers
}: AttendanceTrackerProps) {
  const [filterDate, setFilterDate] = useState<Date>(new Date());
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedStaff, setSelectedStaff] = useState<string>('all');

  // Filtered attendance records
  const filteredRecords = attendanceRecords.filter(record => {
    const matchesDate = filterDate ? isSameDay(new Date(record.check_in), filterDate) : true;
    const matchesStatus = filterStatus === 'all' ? true : record.status === filterStatus;
    const matchesStaff = selectedStaff === 'all' ? true : record.staff_id === selectedStaff;
    
    return matchesDate && matchesStatus && matchesStaff;
  });

  // Attendance statistics
  const calculateStats = () => {
    const todayRecords = attendanceRecords.filter(record => 
      isSameDay(new Date(record.check_in), new Date())
    );
    
    const presentCount = todayRecords.filter(r => r.status === 'present').length;
    const absentCount = todayRecords.filter(r => r.status === 'absent').length;
    const lateCount = todayRecords.filter(r => r.status === 'late').length;
    
    return {
      present: presentCount,
      absent: absentCount,
      late: lateCount,
      total: todayRecords.length
    };
  };

  const stats = calculateStats();

  // Function to get color based on attendance status
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'present':
        return 'bg-green-100 text-green-800';
      case 'absent':
        return 'bg-red-100 text-red-800';
      case 'late':
        return 'bg-yellow-100 text-yellow-800';
      case 'half-day':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Function to handle quick date selection
  const handleQuickDateSelect = (days: number) => {
    setFilterDate(subDays(new Date(), days));
  };

  return (
    <div className="bg-white shadow-sm rounded-lg p-6">
      <h2 className="text-lg font-semibold mb-6">Attendance Tracker</h2>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-emerald-50 p-4 rounded-lg">
          <h3 className="text-sm text-gray-500 mb-1">Present</h3>
          <div className="flex items-center">
            <Check className="h-5 w-5 text-emerald-600 mr-2" />
            <span className="text-xl font-semibold">{stats.present}</span>
          </div>
        </div>
        
        <div className="bg-red-50 p-4 rounded-lg">
          <h3 className="text-sm text-gray-500 mb-1">Absent</h3>
          <div className="flex items-center">
            <X className="h-5 w-5 text-red-600 mr-2" />
            <span className="text-xl font-semibold">{stats.absent}</span>
          </div>
        </div>
        
        <div className="bg-yellow-50 p-4 rounded-lg">
          <h3 className="text-sm text-gray-500 mb-1">Late</h3>
          <div className="flex items-center">
            <Clock className="h-5 w-5 text-yellow-600 mr-2" />
            <span className="text-xl font-semibold">{stats.late}</span>
          </div>
        </div>
        
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-sm text-gray-500 mb-1">Total Staff</h3>
          <div className="flex items-center">
            <User className="h-5 w-5 text-blue-600 mr-2" />
            <span className="text-xl font-semibold">{staffMembers.length}</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6 items-center">
        <div className="flex items-center">
          <span className="text-sm text-gray-500 mr-2">Date:</span>
          <input 
            type="date" 
            value={format(filterDate, 'yyyy-MM-dd')}
            onChange={(e) => setFilterDate(new Date(e.target.value))}
            className="border rounded-md px-3 py-1 text-sm"
          />
        </div>

        <div className="flex gap-2">
          <button 
            onClick={() => handleQuickDateSelect(0)} 
            className={`px-3 py-1 text-xs rounded-full ${isSameDay(filterDate, new Date()) ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100'}`}
          >
            Today
          </button>
          <button 
            onClick={() => handleQuickDateSelect(1)} 
            className={`px-3 py-1 text-xs rounded-full ${isSameDay(filterDate, subDays(new Date(), 1)) ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100'}`}
          >
            Yesterday
          </button>
        </div>

        <div className="flex items-center ml-auto">
          <Filter className="h-4 w-4 text-gray-400 mr-2" />
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border rounded-md px-3 py-1 text-sm mr-2"
          >
            <option value="all">All Status</option>
            <option value="present">Present</option>
            <option value="absent">Absent</option>
            <option value="late">Late</option>
            <option value="half-day">Half Day</option>
          </select>
          
          <select 
            value={selectedStaff}
            onChange={(e) => setSelectedStaff(e.target.value)}
            className="border rounded-md px-3 py-1 text-sm"
          >
            <option value="all">All Staff</option>
            {staffMembers.map(staff => (
              <option key={staff.id} value={staff.id}>
                {staff.full_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Staff Member
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Check In
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Check Out
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Hours
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Notes
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredRecords.length > 0 ? (
              filteredRecords.map(record => (
                <motion.tr 
                  key={record.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium">{record.staff_name}</div>
                    <div className="text-sm text-gray-500">ID: {record.staff_id.substring(0, 8)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {record.check_in ? (
                      <div className="text-sm">
                        <div>{format(new Date(record.check_in), 'MMM dd, yyyy')}</div>
                        <div className="text-gray-500">{format(new Date(record.check_in), 'hh:mm a')}</div>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {record.check_out ? (
                      <div className="text-sm">
                        <div>{format(new Date(record.check_out), 'MMM dd, yyyy')}</div>
                        <div className="text-gray-500">{format(new Date(record.check_out), 'hh:mm a')}</div>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(record.status)}`}>
                      {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {record.total_hours !== undefined ? `${record.total_hours} hrs` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {record.notes || '-'}
                  </td>
                </motion.tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <Calendar className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                  <p className="text-gray-500">No attendance records found for the selected filters</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Mark Attendance Section (Quick Actions) */}
      <div className="mt-8 border-t pt-6">
        <h3 className="text-base font-medium mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-4">
          {staffMembers.slice(0, 5).map(staff => (
            <div key={staff.id} className="flex flex-col items-center">
              <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center mb-2">
                <span className="font-medium text-gray-700">{staff.full_name.charAt(0)}</span>
              </div>
              <span className="text-sm mb-2">{staff.full_name.split(' ')[0]}</span>
              <div className="flex gap-1">
                <button 
                  onClick={() => onMarkAttendance(staff.id, 'present')}
                  className="p-1 bg-green-100 text-green-700 rounded-full"
                  title="Mark Present"
                >
                  <Check className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => onMarkAttendance(staff.id, 'absent')}
                  className="p-1 bg-red-100 text-red-700 rounded-full"
                  title="Mark Absent"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
          
          {staffMembers.length > 5 && (
            <div className="flex items-center justify-center">
              <button className="text-sm text-blue-600">View All Staff</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
