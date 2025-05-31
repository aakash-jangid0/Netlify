import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, Plus, Edit2, Trash2, Calendar, Clock, FileText, Download } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface PayrollRecord {
  id: string;
  staff_id: string;
  base_salary: number;
  hourly_rate: number;
  bank_account: string;
  tax_information: any;
  allowances: any;
  deductions: any;
  payment_schedule: string;
  last_payment_date: string;
}

interface PayrollManagementProps {
  payroll: PayrollRecord[];
  onAddPayroll: (payroll: Omit<PayrollRecord, 'id'>) => void;
  onEditPayroll: (id: string, payroll: Partial<PayrollRecord>) => void;
  onDeletePayroll: (id: string) => void;
  onGeneratePayslip: (id: string) => void;
}

export default function PayrollManagement({
  payroll,
  onAddPayroll,
  onEditPayroll,
  onDeletePayroll,
  onGeneratePayslip
}: PayrollManagementProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingPayroll, setEditingPayroll] = useState<PayrollRecord | null>(null);
  const [formData, setFormData] = useState({
    staff_id: '',
    base_salary: 0,
    hourly_rate: 0,
    bank_account: '',
    tax_information: {},
    allowances: {},
    deductions: {},
    payment_schedule: 'monthly',
    last_payment_date: new Date().toISOString().split('T')[0]
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPayroll) {
        await onEditPayroll(editingPayroll.id, formData);
        toast.success('Payroll record updated successfully');
      } else {
        await onAddPayroll(formData);
        toast.success('Payroll record added successfully');
      }
      setShowForm(false);
      setEditingPayroll(null);
      setFormData({
        staff_id: '',
        base_salary: 0,
        hourly_rate: 0,
        bank_account: '',
        tax_information: {},
        allowances: {},
        deductions: {},
        payment_schedule: 'monthly',
        last_payment_date: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      toast.error('Failed to save payroll record');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold">Payroll Management</h2>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowForm(true)}
          className="flex items-center px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Payroll Record
        </motion.button>
      </div>

      <div className="space-y-4">
        {payroll.map((record) => (
          <motion.div
            key={record.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="border rounded-lg p-4"
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-500" />
                  <h3 className="font-medium">Salary Details</h3>
                </div>
                <div className="mt-2 space-y-1">
                  <p className="text-sm">
                    Base Salary: Rs{record.base_salary.toLocaleString()}
                  </p>
                  <p className="text-sm">
                    Hourly Rate: Rs{record.hourly_rate.toLocaleString()}/hr
                  </p>
                  <p className="text-sm">
                    Payment Schedule: {record.payment_schedule}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => onGeneratePayslip(record.id)}
                  className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                >
                  <Download className="w-4 h-4" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    setEditingPayroll(record);
                    setFormData({
                      staff_id: record.staff_id,
                      base_salary: record.base_salary,
                      hourly_rate: record.hourly_rate,
                      bank_account: record.bank_account,
                      tax_information: record.tax_information,
                      allowances: record.allowances,
                      deductions: record.deductions,
                      payment_schedule: record.payment_schedule,
                      last_payment_date: record.last_payment_date
                    });
                    setShowForm(true);
                  }}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                >
                  <Edit2 className="w-4 h-4" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => onDeletePayroll(record.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </motion.button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Allowances</h4>
                {Object.entries(record.allowances).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-sm">
                    <span className="text-gray-600">{key}</span>
                    <span>Rs{(value as number).toLocaleString()}</span>
                  </div>
                ))}
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Deductions</h4>
                {Object.entries(record.deductions).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-sm">
                    <span className="text-gray-600">{key}</span>
                    <span>Rs{(value as number).toLocaleString()}</span>
                  </div>
                ))}
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Tax Information</h4>
                {Object.entries(record.tax_information).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-sm">
                    <span className="text-gray-600">{key}</span>
                    <span>{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="w-4 h-4" />
                  Last Payment: {new Date(record.last_payment_date).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span>Next Payment: {new Date(record.last_payment_date).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}

        {payroll.length === 0 && (
          <div className="text-center py-12">
            <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No payroll records found</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
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
              <h3 className="text-lg font-semibold mb-4">
                {editingPayroll ? 'Edit Payroll Record' : 'Add New Payroll Record'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Staff ID
                  </label>
                  <input
                    type="text"
                    value={formData.staff_id}
                    onChange={(e) => setFormData({ ...formData, staff_id: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Base Salary
                  </label>
                  <input
                    type="number"
                    value={formData.base_salary}
                    onChange={(e) => setFormData({ ...formData, base_salary: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hourly Rate
                  </label>
                  <input
                    type="number"
                    value={formData.hourly_rate}
                    onChange={(e) => setFormData({ ...formData, hourly_rate: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bank Account
                  </label>
                  <input
                    type="text"
                    value={formData.bank_account}
                    onChange={(e) => setFormData({ ...formData, bank_account: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Schedule
                  </label>
                  <select
                    value={formData.payment_schedule}
                    onChange={(e) => setFormData({ ...formData, payment_schedule: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Bi-weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingPayroll(null);
                    }}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
                  >
                    {editingPayroll ? 'Update' : 'Add'} Record
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}