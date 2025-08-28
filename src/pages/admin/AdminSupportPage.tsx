import React from 'react';
import { AdminChatDashboard } from '../../components/admin/AdminChatDashboard';

const AdminSupportPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 bg-white shadow-sm mb-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-semibold">Customer Support Dashboard</h1>
          <div className="text-sm text-gray-500">
            Admin Dashboard
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto">
        <AdminChatDashboard />
      </div>
    </div>
  );
};

export default AdminSupportPage;
