import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, TrendingUp, TrendingDown, BarChart2, Award, CalendarRange } from 'lucide-react';

interface Performance {
  id: string;
  staff_id: string;
  staff_name: string;
  rating: number;
  review_date: string;
  review_by: string;
  feedback: string;
  goals: string[];
  strengths: string[];
  areas_for_improvement: string[];
}

interface StaffPerformanceProps {
  performanceData: Performance[];
  onAddReview: (review: Omit<Performance, 'id'>) => Promise<void>;
  staffMembers: { id: string; full_name: string }[];
}

export default function StaffPerformance({
  performanceData,
  onAddReview,
  staffMembers
}: StaffPerformanceProps) {
  const [showForm, setShowForm] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<string>('');
  const [timeRange, setTimeRange] = useState<string>('last6months');
  const [sortBy, setSortBy] = useState<string>('recent');

  // Filter performance data by selected time range
  const filterByTimeRange = (data: Performance[]) => {
    const now = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(now.getMonth() - 6);
    
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(now.getMonth() - 3);
    
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(now.getFullYear() - 1);
    
    switch (timeRange) {
      case 'last3months':
        return data.filter(item => new Date(item.review_date) >= threeMonthsAgo);
      case 'last6months':
        return data.filter(item => new Date(item.review_date) >= sixMonthsAgo);
      case 'lastyear':
        return data.filter(item => new Date(item.review_date) >= oneYearAgo);
      default:
        return data;
    }
  };

  // Sort performance data by selected criteria
  const sortData = (data: Performance[]) => {
    switch (sortBy) {
      case 'recent':
        return [...data].sort((a, b) => 
          new Date(b.review_date).getTime() - new Date(a.review_date).getTime()
        );
      case 'rating-high':
        return [...data].sort((a, b) => b.rating - a.rating);
      case 'rating-low':
        return [...data].sort((a, b) => a.rating - b.rating);
      default:
        return data;
    }
  };

  // Filter by selected staff member
  const filterByStaff = (data: Performance[]) => {
    if (!selectedStaff) return data;
    return data.filter(item => item.staff_id === selectedStaff);
  };

  // Apply all filters and sorting
  const processedData = sortData(filterByTimeRange(filterByStaff(performanceData)));

  // Calculate average rating for each staff member
  const calculateAverageRatings = () => {
    const ratingsByStaff: { [key: string]: number[] } = {};
    performanceData.forEach(item => {
      if (!ratingsByStaff[item.staff_id]) {
        ratingsByStaff[item.staff_id] = [];
      }
      ratingsByStaff[item.staff_id].push(item.rating);
    });
    
    return Object.keys(ratingsByStaff).map(staffId => {
      const ratings = ratingsByStaff[staffId];
      const avg = ratings.reduce((sum, curr) => sum + curr, 0) / ratings.length;
      const staffMember = staffMembers.find(s => s.id === staffId);
      return {
        staff_id: staffId,
        staff_name: staffMember?.full_name || 'Unknown',
        average_rating: avg,
        reviews_count: ratings.length
      };
    }).sort((a, b) => b.average_rating - a.average_rating);
  };

  // Top performers based on average rating
  const topPerformers = calculateAverageRatings().slice(0, 5);

  // Function to render star ratings
  const renderStarRating = (rating: number) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-2 text-gray-700">{rating.toFixed(1)}</span>
      </div>
    );
  };

  // Format review date
  const formatReviewDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  return (
    <div className="bg-white shadow-sm rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold">Staff Performance Reviews</h2>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
        >
          Add New Review
        </button>
      </div>
      
      {/* Performance Overview */}
      <div className="mb-6">
        <h3 className="text-sm uppercase text-gray-500 font-medium mb-3">Top Performers</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {topPerformers.map((performer, index) => (
            <motion.div
              key={performer.staff_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-4 rounded-lg ${
                index === 0 
                  ? 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-200' 
                  : 'bg-gray-50'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="font-medium truncate">{performer.staff_name}</div>
                {index === 0 && <Award className="w-4 h-4 text-yellow-500" />}
              </div>
              {renderStarRating(performer.average_rating)}
              <div className="text-xs text-gray-500 mt-2">
                {performer.reviews_count} {performer.reviews_count === 1 ? 'review' : 'reviews'}
              </div>
            </motion.div>
          ))}
          
          {topPerformers.length === 0 && (
            <div className="col-span-5 text-center py-8 text-gray-500">
              No performance data available
            </div>
          )}
        </div>
      </div>
      
      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6 items-center">
        <div className="flex items-center">
          <CalendarRange className="w-4 h-4 text-gray-400 mr-2" />
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="border rounded-md px-3 py-1 text-sm"
          >
            <option value="last3months">Last 3 Months</option>
            <option value="last6months">Last 6 Months</option>
            <option value="lastyear">Last Year</option>
            <option value="all">All Time</option>
          </select>
        </div>
        
        <div className="flex items-center">
          <BarChart2 className="w-4 h-4 text-gray-400 mr-2" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border rounded-md px-3 py-1 text-sm"
          >
            <option value="recent">Most Recent</option>
            <option value="rating-high">Highest Rating</option>
            <option value="rating-low">Lowest Rating</option>
          </select>
        </div>
        
        <div className="flex items-center ml-auto">
          <select
            value={selectedStaff}
            onChange={(e) => setSelectedStaff(e.target.value)}
            className="border rounded-md px-3 py-1 text-sm"
          >
            <option value="">All Staff Members</option>
            {staffMembers.map(staff => (
              <option key={staff.id} value={staff.id}>
                {staff.full_name}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Performance Reviews */}
      <div className="space-y-4">
        {processedData.map((performance) => (
          <motion.div
            key={performance.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="border rounded-lg p-4"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium">{performance.staff_name}</h3>
                <p className="text-xs text-gray-500">Reviewed by {performance.review_by} on {formatReviewDate(performance.review_date)}</p>
              </div>
              <div className="flex items-center">
                {renderStarRating(performance.rating)}
                {performance.rating > 3.5 ? (
                  <TrendingUp className="w-4 h-4 text-green-500 ml-2" />
                ) : performance.rating < 2.5 ? (
                  <TrendingDown className="w-4 h-4 text-red-500 ml-2" />
                ) : null}
              </div>
            </div>
            
            <div className="mt-4">
              <p className="text-sm text-gray-700">{performance.feedback}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div>
                <h4 className="text-xs font-medium uppercase text-gray-500 mb-2">Strengths</h4>
                <ul className="list-disc list-inside text-sm pl-2">
                  {performance.strengths.map((strength, index) => (
                    <li key={index} className="text-gray-700">{strength}</li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h4 className="text-xs font-medium uppercase text-gray-500 mb-2">Areas for Improvement</h4>
                <ul className="list-disc list-inside text-sm pl-2">
                  {performance.areas_for_improvement.map((area, index) => (
                    <li key={index} className="text-gray-700">{area}</li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h4 className="text-xs font-medium uppercase text-gray-500 mb-2">Goals</h4>
                <ul className="list-disc list-inside text-sm pl-2">
                  {performance.goals.map((goal, index) => (
                    <li key={index} className="text-gray-700">{goal}</li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        ))}
        
        {processedData.length === 0 && (
          <div className="text-center py-12">
            <Award className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No performance reviews found</p>
          </div>
        )}
      </div>
      
      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-3xl p-6">
            <h3 className="text-lg font-semibold mb-4">Add Performance Review</h3>
            {/* Form fields would go here */}
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
              >
                Save Review
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
