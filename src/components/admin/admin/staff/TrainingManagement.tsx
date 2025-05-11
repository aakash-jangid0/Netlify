import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, Plus, Edit2, Trash2, FileText, Calendar, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Training {
  id: string;
  staff_id: string;
  training_name: string;
  description: string;
  completion_date: string;
  expiry_date: string;
  certificate_url: string;
  training_provider: string;
  status: string;
  score: number;
  is_mandatory: boolean;
}

interface TrainingManagementProps {
  trainings: Training[];
  onAddTraining: (training: Omit<Training, 'id'>) => void;
  onEditTraining: (id: string, training: Partial<Training>) => void;
  onDeleteTraining: (id: string) => void;
}

export default function TrainingManagement({
  trainings,
  onAddTraining,
  onEditTraining,
  onDeleteTraining
}: TrainingManagementProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingTraining, setEditingTraining] = useState<Training | null>(null);
  const [formData, setFormData] = useState({
    training_name: '',
    description: '',
    completion_date: '',
    expiry_date: '',
    certificate_url: '',
    training_provider: '',
    status: 'pending',
    score: 0,
    is_mandatory: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTraining) {
        await onEditTraining(editingTraining.id, formData);
        toast.success('Training updated successfully');
      } else {
        await onAddTraining(formData);
        toast.success('Training added successfully');
      }
      setShowForm(false);
      setEditingTraining(null);
      setFormData({
        training_name: '',
        description: '',
        completion_date: '',
        expiry_date: '',
        certificate_url: '',
        training_provider: '',
        status: 'pending',
        score: 0,
        is_mandatory: false
      });
    } catch (error) {
      toast.error('Failed to save training');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold">Training & Certifications</h2>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowForm(true)}
          className="flex items-center px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Training
        </motion.button>
      </div>

      <div className="space-y-4">
        {trainings.map((training) => (
          <motion.div
            key={training.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="border rounded-lg p-4"
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-emerald-500" />
                  <h3 className="font-medium">{training.training_name}</h3>
                </div>
                <p className="text-sm text-gray-500 mt-1">{training.description}</p>
                <div className="flex items-center gap-4 mt-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(training.status)}`}>
                    {training.status}
                  </span>
                  {training.is_mandatory && (
                    <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                      Mandatory
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    setEditingTraining(training);
                    setFormData({
                      training_name: training.training_name,
                      description: training.description,
                      completion_date: training.completion_date,
                      expiry_date: training.expiry_date,
                      certificate_url: training.certificate_url,
                      training_provider: training.training_provider,
                      status: training.status,
                      score: training.score,
                      is_mandatory: training.is_mandatory
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
                  onClick={() => onDeleteTraining(training.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </motion.button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Completion Date
                </p>
                <p className="text-sm font-medium">
                  {new Date(training.completion_date).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Expiry Date
                </p>
                <p className="text-sm font-medium">
                  {new Date(training.expiry_date).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Award className="w-3 h-3" />
                  Score
                </p>
                <p className="text-sm font-medium">{training.score}%</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  Provider
                </p>
                <p className="text-sm font-medium">{training.training_provider}</p>
              </div>
            </div>

            {training.certificate_url && (
              <div className="mt-4">
                <a
                  href={training.certificate_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                >
                  <FileText className="w-4 h-4" />
                  View Certificate
                </a>
              </div>
            )}
          </motion.div>
        ))}

        {trainings.length === 0 && (
          <div className="text-center py-12">
            <Award className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No trainings found</p>
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
                {editingTraining ? 'Edit Training' : 'Add New Training'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Training Name
                  </label>
                  <input
                    type="text"
                    value={formData.training_name}
                    onChange={(e) => setFormData({ ...formData, training_name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Completion Date
                    </label>
                    <input
                      type="date"
                      value={formData.completion_date}
                      onChange={(e) => setFormData({ ...formData, completion_date: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expiry Date
                    </label>
                    <input
                      type="date"
                      value={formData.expiry_date}
                      onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Training Provider
                  </label>
                  <input
                    type="text"
                    value={formData.training_provider}
                    onChange={(e) => setFormData({ ...formData, training_provider: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Certificate URL
                  </label>
                  <input
                    type="url"
                    value={formData.certificate_url}
                    onChange={(e) => setFormData({ ...formData, certificate_url: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Score
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.score}
                    onChange={(e) => setFormData({ ...formData, score: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_mandatory"
                    checked={formData.is_mandatory}
                    onChange={(e) => setFormData({ ...formData, is_mandatory: e.target.checked })}
                    className="h-4 w-4 text-emerald-500 focus:ring-emerald-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_mandatory" className="ml-2 text-sm text-gray-700">
                    Mandatory Training
                  </label>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingTraining(null);
                    }}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
                  >
                    {editingTraining ? 'Update' : 'Add'} Training
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