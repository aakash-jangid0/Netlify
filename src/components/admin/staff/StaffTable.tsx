import React from 'react';
import { motion } from 'framer-motion';
import { Edit, Trash2, CheckCircle, XCircle, Mail, Phone, MapPin, MoreHorizontal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface StaffMember {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  is_active: boolean;
  profile_photo_url?: string;
}

interface StaffTableProps {
  staff: StaffMember[];
  onEdit: (member: StaffMember) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string, status: boolean) => void;
  selectedDepartment: string;
  loading?: boolean;
  onSelectStaff?: (id: string, isSelected: boolean) => void;
  onSelectAll?: (isSelected: boolean) => void;
  selectedStaff?: string[];
}

function StaffTable({
  staff,
  onEdit,
  onDelete,
  onToggleStatus,
  selectedDepartment,
  loading,
  onSelectStaff,
  onSelectAll,
  selectedStaff = []
}: StaffTableProps) {
  const navigate = useNavigate();
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
            {onSelectAll && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500"
                  onChange={(e) => onSelectAll(e.target.checked)}
                  checked={staff.length > 0 && selectedStaff?.length === staff.length}
                />
              </th>
            )}
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Staff Member
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Contact
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Role
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Department
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {staff.map((member) => (
            <motion.tr
              key={member.id}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`${selectedStaff?.includes(member.id) ? 'bg-emerald-50' : ''} hover:bg-gray-50 cursor-pointer`}
              onClick={() => navigate(`/admin/staff/${member.id}`)}
            >
              {onSelectStaff && (
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-emerald-600 focus:ring-emerald-500"
                    checked={selectedStaff?.includes(member.id)}
                    onChange={(e) => onSelectStaff(member.id, e.target.checked)}
                  />
                </td>
              )}
              <td className="px-6 py-4 whitespace-nowrap cursor-pointer" onClick={() => navigate(`/admin/staff/${member.id}`)}>
                <div className="flex items-center">
                  {member.profile_photo_url ? (
                    <img
                      src={member.profile_photo_url}
                      alt={member.full_name}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                      <span className="text-emerald-600 font-medium text-lg">
                        {member.full_name.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">
                      {member.full_name}
                    </div>
                    <div className="text-xs text-emerald-500 hover:text-emerald-600">
                      View profile
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-gray-900 space-y-1">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span>{member.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{member.phone}</span>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-emerald-100 text-emerald-800">
                  {member.role}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 cursor-pointer" onClick={() => navigate(`/admin/staff/${member.id}`)}>
                {member.department}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <button
                  onClick={(e) => {
                    e.stopPropagation(); 
                    onToggleStatus(member.id, !member.is_active);
                  }}
                  className={`inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium ${
                    member.is_active
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {member.is_active ? (
                    <CheckCircle className="w-4 h-4 mr-1" />
                  ) : (
                    <XCircle className="w-4 h-4 mr-1" />
                  )}
                  {member.is_active ? 'Active' : 'Inactive'}
                </button>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex items-center space-x-3">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/admin/staff/${member.id}`);
                    }}
                    className="text-emerald-600 hover:text-emerald-900"
                    title="View Profile"
                  >
                    <MoreHorizontal className="w-5 h-5" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(member);
                    }}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    <Edit className="w-5 h-5" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(member.id);
                    }}
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

      {staff.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No staff members found</p>
        </div>
      )}
    </div>
  );
}

export default StaffTable;