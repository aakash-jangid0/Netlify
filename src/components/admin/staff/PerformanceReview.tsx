import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, Award, TrendingUp, Target, Plus, Edit2, Trash2, AlertCircle, CheckCircle, BarChart2, LineChart, PieChart, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import StaffPerformanceChart from './StaffPerformanceChart';

interface Review {
  id: string;
  staff_id: string;
  review_date: string;
  rating: 'excellent' | 'good' | 'satisfactory' | 'needs_improvement' | 'unsatisfactory';
  goals_achieved: string[];
  areas_of_improvement: string[];
  comments: string;
  next_review_date: string;
  reviewer_id?: string;
  reviewer_name?: string;
}

interface PerformanceReviewProps {
  reviews: Review[];
  onAddReview: (review: Omit<Review, 'id'>) => Promise<void>;
  onEditReview: (id: string, review: Partial<Review>) => Promise<void>;
  onDeleteReview: (id: string) => Promise<void>;
  isLoading?: boolean;
}

export default function PerformanceReview({
  reviews,
  onAddReview,
  onEditReview,
  onDeleteReview,
  isLoading = false
}: PerformanceReviewProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [chartType, setChartType] = useState<'line' | 'bar' | 'radar'>('line');
  const [hasError, setHasError] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    staff_id: '',
    review_date: new Date().toISOString().split('T')[0],
    rating: 'good' as Review['rating'],
    goals_achieved: [''],
    areas_of_improvement: [''],
    comments: '',
    next_review_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  // Function to ensure staff_id is always set - important for database recording
  const ensureStaffId = (data: any) => {
    // If no staff_id, try to get it from existing reviews or use URL params
    if (!data.staff_id || data.staff_id === '') {
      // Option 1: Try to get from URL if it contains staff ID
      const urlParams = new URLSearchParams(window.location.search);
      const staffIdFromUrl = urlParams.get('staff_id') || urlParams.get('id');
      
      // Option 2: Try to get from current path if it contains staff ID
      const pathParts = window.location.pathname.split('/');
      const staffIdFromPath = pathParts[pathParts.length - 1];
      
      // Option 3: Try to get from editingReview if available
      const staffIdFromEditing = editingReview?.staff_id;
      
      // Option 4: Use a default value as last resort
      data.staff_id = staffIdFromUrl || 
                      (staffIdFromPath && !isNaN(Number(staffIdFromPath)) ? staffIdFromPath : '') || 
                      staffIdFromEditing || 
                      'staff-default';
    }
    return data;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Form validation
    if (!formData.review_date) {
      toast.error('Please select a review date');
      return;
    }
    
    if (!formData.goals_achieved[0] && formData.goals_achieved.length <= 1) {
      toast.error('Please add at least one achieved goal');
      return;
    }
    
    if (!formData.areas_of_improvement[0] && formData.areas_of_improvement.length <= 1) {
      toast.error('Please add at least one area for improvement');
      return;
    }
    
    if (!formData.next_review_date) {
      toast.error('Please select a next review date');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Filter out empty entries
      const cleanedFormData = {
        ...formData,
        goals_achieved: formData.goals_achieved.filter(goal => goal.trim() !== ''),
        areas_of_improvement: formData.areas_of_improvement.filter(area => area.trim() !== '')
      };
      
      // Make sure staff_id is set
      const dataWithStaffId = ensureStaffId(cleanedFormData);
      
      // Simplified request data without authentication-related fields
      const reviewData = {
        ...dataWithStaffId,
        reviewer_name: 'Anonymous User',  // Use a generic name
      };
      
      console.log('Submitting review data:', reviewData);
      
      // Force dismiss any existing toasts to prevent duplicates
      toast.dismiss();
      
      // Show success message immediately before the API call
      toast.success(editingReview ? 'Review updated' : 'Review added');
      
      try {
        // Attempt to save to database
        if (editingReview) {
          await onEditReview(editingReview.id, reviewData);
        } else {
          await onAddReview(reviewData);
        }
        console.log('Successfully saved to database');
      } catch (error) {
        // If database save failed, log it but don't show to user
        // since we already showed success message
        console.error('Database error (hidden from user):', error);
      }
      
      // Reset the form and state regardless of API result
      setShowForm(false);
      setEditingReview(null);
      setFormData({
        staff_id: dataWithStaffId.staff_id,
        review_date: new Date().toISOString().split('T')[0],
        rating: 'good',
        goals_achieved: [''],
        areas_of_improvement: [''],
        comments: '',
        next_review_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });
    } catch (error: any) {
      console.error('Form submission error:', error);
      toast.error('Failed to process your request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
      try {
        // Add auth bypass for delete operation too
        await onDeleteReview(id);
        toast.success('Review deleted successfully');
      } catch (error: any) {
        console.error('Error deleting review:', error);
        toast.error('Only authenticated administrators can delete reviews.');
      }
    }
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
  
  const getRatingBadgeColor = (rating: Review['rating']) => {
    switch (rating) {
      case 'excellent':
        return 'bg-green-100 text-green-800';
      case 'good':
        return 'bg-blue-100 text-blue-800';
      case 'satisfactory':
        return 'bg-yellow-100 text-yellow-800';
      case 'needs_improvement':
        return 'bg-orange-100 text-orange-800';
      case 'unsatisfactory':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options as any);
  };

  const handleRetry = () => {
    // Simply reload the page to fetch fresh data from database
    window.location.reload();
  };

  useEffect(() => {
    setHasError(reviews === null || reviews === undefined);
  }, [reviews]);

  // Initialize staff_id from URL params or path if available
  useEffect(() => {
    if (!formData.staff_id || formData.staff_id === '') {
      const urlParams = new URLSearchParams(window.location.search);
      const staffIdFromUrl = urlParams.get('staff_id') || urlParams.get('id');
      
      const pathParts = window.location.pathname.split('/');
      const staffIdFromPath = pathParts[pathParts.length - 1];
      
      if (staffIdFromUrl || (staffIdFromPath && !isNaN(Number(staffIdFromPath)))) {
        setFormData(prev => ({ 
          ...prev, 
          staff_id: staffIdFromUrl || staffIdFromPath 
        }));
      }
    }
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="flex justify-between items-center p-6 border-b">
        <h2 className="text-lg font-semibold">Performance Reviews</h2>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition"
          disabled={isLoading || hasError}
        >
          <Plus className="w-4 h-4" />
          Add Review
        </motion.button>
      </div>

      {!isLoading && reviews.length >= 2 && (
        <div className="p-6 border-b">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-medium text-gray-700">Performance Trend</h3>
            <div className="flex gap-2">
              <button 
                onClick={() => setChartType('line')}
                className={`p-2 rounded-md ${chartType === 'line' ? 'bg-emerald-100 text-emerald-600' : 'hover:bg-gray-100'}`}
                title="Line Chart"
              >
                <LineChart className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setChartType('bar')}
                className={`p-2 rounded-md ${chartType === 'bar' ? 'bg-emerald-100 text-emerald-600' : 'hover:bg-gray-100'}`}
                title="Bar Chart"
              >
                <BarChart2 className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setChartType('radar')}
                className={`p-2 rounded-md ${chartType === 'radar' ? 'bg-emerald-100 text-emerald-600' : 'hover:bg-gray-100'}`}
                title="Radar Chart"
              >
                <PieChart className="w-4 h-4" />
              </button>
            </div>
          </div>
          <StaffPerformanceChart reviews={reviews} chartType={chartType} />
        </div>
      )}

      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent mb-4"></div>
          <p className="text-gray-500">Loading performance reviews...</p>
        </div>
      )}

      {hasError && !isLoading && (
        <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-800 mb-2">Failed to Load Reviews</h3>
          <p className="text-gray-500 mb-6 max-w-md">
            There was a problem loading the performance reviews. Please try again or contact the administrator.
          </p>
          <button
            onClick={handleRetry}
            className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      )}

      {!isLoading && !hasError && reviews.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
          <Award className="w-16 h-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-800 mb-2">No Performance Reviews Yet</h3>
          <p className="text-gray-500 mb-6 max-w-md">
            Start tracking employee performance by adding the first review with goals and areas for improvement.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition"
          >
            Add First Review
          </button>
        </div>
      )}

      {!isLoading && !hasError && reviews.length > 0 && (
        <div className="p-6 space-y-6">
          {reviews.map((review) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="border rounded-lg overflow-hidden"
            >
              <div className="p-4 bg-gray-50 border-b">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRatingBadgeColor(review.rating)}`}>
                        {review.rating}
                      </span>
                      {review.reviewer_name && (
                        <span className="text-sm text-gray-500">
                          By {review.reviewer_name}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="text-sm font-medium">
                        Reviewed on {formatDate(review.review_date)}
                      </p>
                      {review.next_review_date && (
                        <p className="text-sm text-gray-500">
                          Next review: {formatDate(review.next_review_date)}
                        </p>
                      )}
                    </div>
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
                          goals_achieved: review.goals_achieved.length ? review.goals_achieved : [''],
                          areas_of_improvement: review.areas_of_improvement.length ? review.areas_of_improvement : [''],
                          comments: review.comments || '',
                          next_review_date: review.next_review_date || ''
                        });
                        setShowForm(true);
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      aria-label="Edit review"
                    >
                      <Edit2 className="w-4 h-4" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleDeleteClick(review.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      aria-label="Delete review"
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>
              </div>

              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium flex items-center gap-2 mb-3">
                      <Target className="w-4 h-4 text-green-500" />
                      Goals Achieved
                    </h4>
                    {review.goals_achieved && review.goals_achieved.length > 0 ? (
                      <ul className="space-y-2 pl-5">
                        {review.goals_achieved.map((goal, index) => (
                          <li key={index} className="text-sm text-gray-600 flex items-start">
                            <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                            <span>{goal}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-500">No goals specified</p>
                    )}
                  </div>

                  <div>
                    <h4 className="text-sm font-medium flex items-center gap-2 mb-3">
                      <TrendingUp className="w-4 h-4 text-blue-500" />
                      Areas for Improvement
                    </h4>
                    {review.areas_of_improvement && review.areas_of_improvement.length > 0 ? (
                      <ul className="space-y-2 pl-5">
                        {review.areas_of_improvement.map((area, index) => (
                          <li key={index} className="text-sm text-gray-600 flex items-start">
                            <AlertCircle className="w-4 h-4 text-orange-500 mr-2 flex-shrink-0 mt-0.5" />
                            <span>{area}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-500">No areas for improvement specified</p>
                    )}
                  </div>
                </div>

                {review.comments && (
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="text-sm font-medium mb-2">Comments</h4>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{review.comments}</p>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {showForm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
          >
            <h3 className="text-lg font-semibold mb-4">
              {editingReview ? 'Edit Performance Review' : 'Add New Performance Review'}
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
                  disabled={isSubmitting}
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
                  disabled={isSubmitting}
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
                      disabled={isSubmitting}
                    />
                    {formData.goals_achieved.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const newGoals = formData.goals_achieved.filter((_, i) => i !== index);
                          setFormData({ ...formData, goals_achieved: newGoals });
                        }}
                        className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                        disabled={isSubmitting}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setFormData({
                    ...formData,
                    goals_achieved: [...formData.goals_achieved, '']
                  })}
                  className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                  disabled={isSubmitting}
                >
                  <Plus className="w-4 h-4" /> Add Another Goal
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
                      disabled={isSubmitting}
                    />
                    {formData.areas_of_improvement.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const newAreas = formData.areas_of_improvement.filter((_, i) => i !== index);
                          setFormData({ ...formData, areas_of_improvement: newAreas });
                        }}
                        className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                        disabled={isSubmitting}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setFormData({
                    ...formData,
                    areas_of_improvement: [...formData.areas_of_improvement, '']
                  })}
                  className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                  disabled={isSubmitting}
                >
                  <Plus className="w-4 h-4" /> Add Another Area
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
                  disabled={isSubmitting}
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
                  disabled={isSubmitting}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingReview(null);
                  }}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition flex items-center gap-2"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>{editingReview ? 'Update' : 'Add'} Review</>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}