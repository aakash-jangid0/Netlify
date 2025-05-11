import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Award, TrendingUp, Target, Plus, Edit2, Trash2 } from 'lucide-react';

interface Review {
  id: string;
  staff_id: string;
  review_date: string;
  rating: 'excellent' | 'good' | 'satisfactory' | 'needs_improvement' | 'unsatisfactory';
  goals_achieved: string[];
  areas_of_improvement: string[];
  comments: string;
  next_review_date: string;
}

interface PerformanceReviewProps {
  reviews: Review[];
  onAddReview: (review: Omit<Review, 'id'>) => void;
  onEditReview: (id: string, review: Partial<Review>) => void;
  onDeleteReview: (id: string) => void;
}

export default function PerformanceReview({
  reviews,
  onAddReview,
  onEditReview,
  onDeleteReview
}: PerformanceReviewProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [formData, setFormData] = useState({
    staff_id: '',
    review_date: '',
    rating: 'good' as const,
    goals_achieved: [''],
    areas_of_improvement: [''],
    comments: '',
    next_review_date: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingReview) {
      onEditReview(editingReview.id, formData);
    } else {
      onAddReview(formData);
    }
    setShowForm(false);
    setEditingReview(null);
    setFormData({
      staff_id: '',
      review_date: '',
      rating: 'good',
      goals_achieved: [''],
      areas_of_improvement: [''],
      comments: '',
      next_review_date: ''
    });
  };

  const getRatingColor = (rating: Review['rating']) => {
    switch (rating) {
      case 'excellent':
        return 'text-green-500';
      case 'good':
        return 'text-blue-500';
      case 'satisfactory':
        return 'text-yellow-500';
      case 'needs_improvement':
        return 'text-orange-500';
      case 'unsatisfactory':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold">Performance Reviews</h2>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
        >
          <Plus className="w-4 h-4" />
          Add Review
        </motion.button>
      </div>

      <div className="space-y-4">
        {reviews.map((review) => (
          <motion.div
            key={review.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="border rounded-lg p-4"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Award className={`w-5 h-5 ${getRatingColor(review.rating)}`} />
                  <h3 className="font-medium capitalize">{review.rating}</h3>
                </div>
                <p className="text-sm text-gray-500">
                  Review Date: {new Date(review.review_date).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    setEditingReview(review);
                    setFormData({
                      staff_id: review.staff_id,
                      review_date: review.review_date,
                      rating: review.rating,
                      goals_achieved: review.goals_achieved,
                      areas_of_improvement: review.areas_of_improvement,
                      comments: review.comments,
                      next_review_date: review.next_review_date
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
                  onClick={() => onDeleteReview(review.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </motion.button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-green-500" />
                  Goals Achieved
                </h4>
                <ul className="list-disc list-inside space-y-1">
                  {review.goals_achieved.map((goal, index) => (
                    <li key={index} className="text-sm text-gray-600">{goal}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                  Areas for Improvement
                </h4>
                <ul className="list-disc list-inside space-y-1">
                  {review.areas_of_improvement.map((area, index) => (
                    <li key={index} className="text-sm text-gray-600">{area}</li>
                  ))}
                </ul>
              </div>

              {review.comments && (
                <div className="text-sm text-gray-600">
                  <strong>Comments:</strong> {review.comments}
                </div>
              )}

              <div className="text-sm text-gray-500">
                Next Review: {new Date(review.next_review_date).toLocaleDateString()}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {showForm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
          >
            <h3 className="text-lg font-semibold mb-4">
              {editingReview ? 'Edit Review' : 'Add New Review'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rating
                </label>
                <select
                  value={formData.rating}
                  onChange={(e) => setFormData({ ...formData, rating: e.target.value as any })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="excellent">Excellent</option>
                  <option value="good">Good</option>
                  <option value="satisfactory">Satisfactory</option>
                  <option value="needs_improvement">Needs Improvement</option>
                  <option value="unsatisfactory">Unsatisfactory</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Review Date
                </label>
                <input
                  type="date"
                  value={formData.review_date}
                  onChange={(e) => setFormData({ ...formData, review_date: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Goals Achieved
                </label>
                {formData.goals_achieved.map((goal, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={goal}
                      onChange={(e) => {
                        const newGoals = [...formData.goals_achieved];
                        newGoals[index] = e.target.value;
                        setFormData({ ...formData, goals_achieved: newGoals });
                      }}
                      className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                      placeholder="Enter a goal"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newGoals = formData.goals_achieved.filter((_, i) => i !== index);
                        setFormData({ ...formData, goals_achieved: newGoals });
                      }}
                      className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setFormData({
                    ...formData,
                    goals_achieved: [...formData.goals_achieved, '']
                  })}
                  className="text-sm text-emerald-600 hover:text-emerald-700"
                >
                  + Add Goal
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Areas for Improvement
                </label>
                {formData.areas_of_improvement.map((area, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={area}
                      onChange={(e) => {
                        const newAreas = [...formData.areas_of_improvement];
                        newAreas[index] = e.target.value;
                        setFormData({ ...formData, areas_of_improvement: newAreas });
                      }}
                      className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                      placeholder="Enter an area for improvement"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newAreas = formData.areas_of_improvement.filter((_, i) => i !== index);
                        setFormData({ ...formData, areas_of_improvement: newAreas });
                      }}
                      className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setFormData({
                    ...formData,
                    areas_of_improvement: [...formData.areas_of_improvement, '']
                  })}
                  className="text-sm text-emerald-600 hover:text-emerald-700"
                >
                  + Add Area
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Comments
                </label>
                <textarea
                  value={formData.comments}
                  onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Next Review Date
                </label>
                <input
                  type="date"
                  value={formData.next_review_date}
                  onChange={(e) => setFormData({ ...formData, next_review_date: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingReview(null);
                  }}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
                >
                  {editingReview ? 'Update' :  'Add'} Review
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}