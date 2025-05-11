import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, User, Mail, Phone, MapPin, Calendar, Building, 
  DollarSign, CreditCard, Shield, Clock, FileText, Award, 
  Activity, Heart, Briefcase, GraduationCap, Moon, Check,
  AlertTriangle, Users, Edit, Plus, Star
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Staff } from '../../types/staff';
import { toast } from 'react-hot-toast';
import DocumentManagement from '../../components/admin/staff/DocumentManagement';
import PerformanceReview from '../../components/admin/staff/PerformanceReview';

// Import the CSS using the correct path
import './StaffProfile.css';

// Define interfaces for documents and performance reviews
interface StaffDocument {
  id: string;
  staff_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  upload_date: string;
  category: string;
  expiry_date?: string;
  status: 'active' | 'expired' | 'pending';
  file_url: string;
  is_verified: boolean;
}

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

const StaffProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [staff, setStaff] = useState<Staff | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [documents, setDocuments] = useState<StaffDocument[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState<boolean>(false);
  const [reviewsLoading, setReviewsLoading] = useState<boolean>(false);
  
  // Define fetchStaffDocuments function first
  const fetchStaffDocuments = async () => {
    try {
      setDocumentsLoading(true);
      
      // Try to fetch a single document to check if table exists
      // This approach avoids querying information_schema which might have permission issues
      const { data: testData, error: testError } = await supabase
        .from('staff_documents')
        .select('id')
        .limit(1)
        .maybeSingle();
      
      // If we get a specific error about the table not existing, handle it
      if (testError && testError.code === '42P01') { // PostgreSQL code for "relation does not exist"
        console.error('staff_documents table does not exist:', testError);
        toast.error('Document system is not set up');
        setDocuments([]);
        setDocumentsLoading(false);
        return;
      }
      
      // If table exists, query documents for this staff member
      const { data, error } = await supabase
        .from('staff_documents')
        .select('*')
        .eq('staff_id', id)
        .order('upload_date', { ascending: false });

      if (error) {
        // Special handling for different error cases
        if (error.code === '42P01') { // relation does not exist
          console.error('staff_documents table does not exist:', error);
          toast.error('Document system is not set up correctly');
        } else {
          console.error('Error fetching staff documents:', error);
          toast.error('Failed to load staff documents');
        }
        setDocuments([]);
      } else {
        setDocuments(data || []);
      }
    } catch (error) {
      console.error('Error fetching staff documents:', error);
      toast.error('Failed to load staff documents');
      setDocuments([]);
    } finally {
      setDocumentsLoading(false);    }
  };
    const fetchPerformanceReviews = async () => {
    try {
      setReviewsLoading(true);
      
      // Try to fetch a single review to check if table exists
      // This approach avoids querying information_schema which might have permission issues
      const { data: testData, error: testError } = await supabase
        .from('staff_performance_reviews')
        .select('id')
        .limit(1)
        .maybeSingle();
      
      // If we get a specific error about the table not existing, handle it
      if (testError && testError.code === '42P01') { // PostgreSQL code for "relation does not exist"
        console.error('staff_performance_reviews table does not exist:', testError);
        toast.error('Performance review system is not set up');
        setReviews([]);
        setReviewsLoading(false);
        return;
      }
      
      // If table exists, proceed with querying data
      const { data, error } = await supabase
        .from('staff_performance_reviews')
        .select('*, reviewer:reviewer_id(full_name)')
        .eq('staff_id', id)
        .order('review_date', { ascending: false });

      if (error) {
        // Special handling for different error cases
        if (error.code === '42P01') { // relation does not exist
          console.error('staff_performance_reviews table does not exist:', error);
          toast.error('Performance review system is not set up correctly');
        } else if (error.code === '23503') { // foreign key violation
          console.error('Foreign key violation:', error);
          toast.error('Unable to load reviews: Staff ID not found in database');
        } else {
          console.error('Error fetching performance reviews:', error);
          toast.error('Failed to load performance reviews');
        }
        setReviews([]);
      } else {
        // Transform data to match our interface
        const formattedReviews = data?.map(review => ({
          ...review,
          goals_achieved: review.goals_achieved || [],
          areas_of_improvement: review.areas_of_improvement || [],
          reviewer_name: review.reviewer?.full_name || 'Unknown'
        })) || [];
        
        setReviews(formattedReviews);
      }
    } catch (error) {
      console.error('Error fetching performance reviews:', error);
      toast.error('Failed to load performance reviews');
      setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  };

  // Function declarations are above, now add the useEffect hooks
  
  useEffect(() => {
    const fetchStaffMember = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('staff')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        
        setStaff(data as Staff);
      } catch (error) {
        console.error('Error fetching staff member:', error);
        toast.error('Failed to load staff member details');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchStaffMember();
    }
  }, [id]);
  
  // Fetch documents when documents tab is activated
  useEffect(() => {
    if (activeTab === 'documents' && id) {
      fetchStaffDocuments();
    }
  }, [activeTab, id]);
  
  // Fetch performance reviews when performance tab is activated
  useEffect(() => {
    if (activeTab === 'performance' && id) {
      fetchPerformanceReviews();
    }
  }, [activeTab, id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!staff) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <AlertTriangle className="w-16 h-16 text-amber-500 mb-4" />
        <h1 className="text-2xl font-bold text-gray-800">Staff member not found</h1>
        <button 
          onClick={() => navigate('/admin/staff')}
          className="mt-4 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition"
        >
          Back to Staff List
        </button>
      </div>
    );
  }
  // Format date from ISO string to readable format
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };  
  // Document management handlers
  const handleDocumentUpload = async (document: Omit<StaffDocument, 'id' | 'upload_date' | 'status'>) => {
    try {
      // Try to fetch a single document to check if table exists
      // This approach avoids querying information_schema which might have permission issues
      const { data: testData, error: testError } = await supabase
        .from('staff_documents')
        .select('id')
        .limit(1)
        .maybeSingle();
      
      // If we get a specific error about the table not existing, handle it
      if (testError && testError.code === '42P01') { // PostgreSQL code for "relation does not exist"
        console.error('staff_documents table does not exist:', testError);
        toast.error('Document system is not set up');
        return;
      }
      
      const { data, error } = await supabase
        .from('staff_documents')
        .insert([{
          ...document,
          staff_id: id,
          upload_date: new Date().toISOString(),
          status: 'active'
        }])
        .select();

      if (error) {
        // Special handling for different error cases
        if (error.code === '42P01') { // relation does not exist
          console.error('staff_documents table does not exist:', error);
          toast.error('Document system is not set up correctly');
        } else if (error.code === '23503') { // foreign key violation
          console.error('Foreign key violation:', error);
          toast.error('Error: Staff member not found in database');
        } else {
          console.error('Error uploading document:', error);
          toast.error(`Failed to upload document: ${error.message || 'Unknown error'}`);
        }
        return;
      }
      toast.success('Document uploaded successfully');
      fetchStaffDocuments();
    } catch (error: any) {
      console.error('Error uploading document:', error);      toast.error(`Failed to upload document: ${error.message || 'Unknown error'}`);
    }
  };
  
  const handleDocumentDelete = async (documentId: string) => {
    try {
      // Try to fetch a single document to check if table exists
      // This approach avoids querying information_schema which might have permission issues
      const { data: testData, error: testError } = await supabase
        .from('staff_documents')
        .select('id')
        .limit(1)
        .maybeSingle();
      
      // If we get a specific error about the table not existing, handle it
      if (testError && testError.code === '42P01') { // PostgreSQL code for "relation does not exist"
        console.error('staff_documents table does not exist:', testError);
        toast.error('Document system is not set up');
        return;
      }
      
      const { error } = await supabase
        .from('staff_documents')
        .delete()
        .eq('id', documentId);

      if (error) {
        // Special handling for different error cases
        if (error.code === '42P01') { // relation does not exist
          console.error('staff_documents table does not exist:', error);
          toast.error('Document system is not set up correctly');
        } else {
          console.error('Error deleting document:', error);
          toast.error(`Failed to delete document: ${error.message || 'Unknown error'}`);
        }
        return;
      }
      toast.success('Document deleted successfully');
      fetchStaffDocuments();
    } catch (error: any) {
      console.error('Error deleting document:', error);      toast.error(`Failed to delete document: ${error.message || 'Unknown error'}`);
    }
  };
  
  const handleDocumentVerify = async (documentId: string, isVerified: boolean) => {
    try {
      // Try to fetch a single document to check if table exists
      // This approach avoids querying information_schema which might have permission issues
      const { data: testData, error: testError } = await supabase
        .from('staff_documents')
        .select('id')
        .limit(1)
        .maybeSingle();
      
      // If we get a specific error about the table not existing, handle it
      if (testError && testError.code === '42P01') { // PostgreSQL code for "relation does not exist"
        console.error('staff_documents table does not exist:', testError);
        toast.error('Document system is not set up');
        return;
      }
      
      const { error } = await supabase
        .from('staff_documents')
        .update({ is_verified: isVerified })
        .eq('id', documentId);

      if (error) {
        // Special handling for different error cases
        if (error.code === '42P01') { // relation does not exist
          console.error('staff_documents table does not exist:', error);
          toast.error('Document system is not set up correctly');
        } else {
          console.error('Error verifying document:', error);
          toast.error(`Failed to update document verification status: ${error.message || 'Unknown error'}`);
        }
        return;
      }
      toast.success(`Document ${isVerified ? 'verified' : 'unverified'} successfully`);
      fetchStaffDocuments();
    } catch (error: any) {
      console.error('Error verifying document:', error);      toast.error(`Failed to update document verification status: ${error.message || 'Unknown error'}`);
    }
  };
  
  // Performance review handlers
  const handleAddReview = async (review: Omit<Review, 'id'>) => {
    try {
      // Try to fetch a single review to check if table exists
      // This approach avoids querying information_schema which might have permission issues
      const { data: testData, error: testError } = await supabase
        .from('staff_performance_reviews')
        .select('id')
        .limit(1)
        .maybeSingle();
      
      // If we get a specific error about the table not existing, handle it
      if (testError && testError.code === '42P01') { // PostgreSQL code for "relation does not exist"
        console.error('staff_performance_reviews table does not exist:', testError);
        toast.error('Performance review system is not set up');
        return;
      }
      
      // Get current user info from supabase auth
      const { data: { user } } = await supabase.auth.getUser();
      
      // Prepare the review data
      const reviewData = {
        ...review,
        staff_id: id,
        reviewer_id: user?.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Insert the review
      const { data, error } = await supabase
        .from('staff_performance_reviews')
        .insert([reviewData])
        .select();

      if (error) {
        console.error('Error adding review:', error);
        
        // Handle specific error cases
        if (error.code === '42P01') { // relation does not exist
          toast.error('Performance review system is not set up correctly');
        } else if (error.code === '23503') { // foreign key violation
          toast.error('Error: Staff member not found in database');
        } else {
          toast.error(`Failed to add review: ${error.message || 'Unknown error'}`);
        }
        return;
      }
      
      // Refresh the performance reviews
      toast.success('Review added successfully');
      fetchPerformanceReviews();
      return;
    } catch (error: any) {
      console.error('Error adding review:', error);
      toast.error(`Failed to add review: ${error.message || 'Unknown error'}`);    }
  };
  
  const handleEditReview = async (reviewId: string, reviewUpdates: Partial<Review>): Promise<void> => {
    try {
      // Try to fetch a single review to check if table exists
      // This approach avoids querying information_schema which might have permission issues
      const { data: testData, error: testError } = await supabase
        .from('staff_performance_reviews')
        .select('id')
        .limit(1)
        .maybeSingle();
      
      // If we get a specific error about the table not existing, handle it
      if (testError && testError.code === '42P01') { // PostgreSQL code for "relation does not exist"
        console.error('staff_performance_reviews table does not exist:', testError);
        toast.error('Performance review system is not set up');
        return;
      }
      
      const updates = {
        ...reviewUpdates,
        updated_at: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from('staff_performance_reviews')
        .update(updates)
        .eq('id', reviewId);

      if (error) {
        // Handle specific error cases
        if (error.code === '42P01') { // relation does not exist
          console.error('staff_performance_reviews table does not exist:', error);
          toast.error('Performance review system is not set up correctly');
        } else if (error.code === '23503') { // foreign key violation
          console.error('Foreign key violation:', error);
          toast.error('Error: Staff member or reviewer not found in database');
        } else {
          console.error('Error updating review:', error);
          toast.error(`Failed to update review: ${error.message || 'Unknown error'}`);
        }
        return;
      }
      
      // Refresh the performance reviews
      toast.success('Review updated successfully');
      fetchPerformanceReviews();
      return;
    } catch (error: any) {
      console.error('Error updating review:', error);
      toast.error(`Failed to update review: ${error.message || 'Unknown error'}`);      throw error; // Re-throw so the component can handle it
    }
  };
  
  const handleDeleteReview = async (reviewId: string): Promise<void> => {
    try {
      // Try to fetch a single review to check if table exists
      // This approach avoids querying information_schema which might have permission issues
      const { data: testData, error: testError } = await supabase
        .from('staff_performance_reviews')
        .select('id')
        .limit(1)
        .maybeSingle();
      
      // If we get a specific error about the table not existing, handle it
      if (testError && testError.code === '42P01') { // PostgreSQL code for "relation does not exist"
        console.error('staff_performance_reviews table does not exist:', testError);
        toast.error('Performance review system is not set up');
        return;
      }
      
      const { error } = await supabase
        .from('staff_performance_reviews')
        .delete()
        .eq('id', reviewId);

      if (error) {
        if (error.code === '42P01') { // relation does not exist
          toast.error('Performance review system is not set up correctly');
        } else {
          toast.error(`Failed to delete review: ${error.message || 'Unknown error'}`);
        }
        return;
      }
      
      toast.success('Review deleted successfully');
      fetchPerformanceReviews();
    } catch (error: any) {
      console.error('Error deleting review:', error);
      toast.error(`Failed to delete review: ${error.message || 'Unknown error'}`);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'employment', label: 'Employment', icon: Briefcase },
    { id: 'compensation', label: 'Compensation', icon: DollarSign },
    { id: 'performance', label: 'Performance', icon: Activity },
    { id: 'documents', label: 'Documents', icon: FileText }
  ];

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center">
            <button 
              onClick={() => navigate('/admin/staff')}
              className="mr-4 p-2 rounded-full hover:bg-gray-100"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Staff Profile</h1>
              <p className="text-sm text-gray-500 mt-1">View and manage staff member details</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Profile header */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
          <div className="md:flex">
            <div className="md:flex-shrink-0 bg-gradient-to-br from-emerald-500 to-emerald-700 p-6 flex items-center justify-center">
              {staff.profile_photo_url ? (
                <img 
                  src={staff.profile_photo_url} 
                  alt={staff.full_name} 
                  className="h-36 w-36 rounded-full object-cover border-4 border-white shadow-md"
                />
              ) : (
                <div className="h-36 w-36 rounded-full bg-emerald-300 flex items-center justify-center border-4 border-white shadow-md">
                  <span className="text-emerald-800 text-5xl font-bold">
                    {staff.full_name.charAt(0)}
                  </span>
                </div>
              )}
            </div>
            <div className="p-6 md:p-8 flex-1">
              <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">{staff.full_name}</h2>
                  <div className="flex items-center mt-2 text-gray-600">
                    <Briefcase className="h-4 w-4 mr-2" />
                    <span className="capitalize">{staff.role}</span>
                    <span className="mx-2 text-gray-300">|</span>
                    <Building className="h-4 w-4 mr-2" />
                    <span className="capitalize">{staff.department}</span>
                  </div>
                </div>
                
                <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center ${
                    staff.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    <span className={`w-2 h-2 rounded-full mr-1 ${staff.is_active ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    {staff.is_active ? 'Active' : 'Inactive'}
                  </span>
                  
                  <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm font-medium">
                    {staff.contract_type || 'Permanent'}
                  </span>
                  
                  <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-sm font-medium">
                    ID: {staff.employee_id || 'N/A'}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="flex items-center">
                  <Mail className="h-5 w-5 text-gray-400 mr-2" />
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-sm font-medium text-gray-900">{staff.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Phone className="h-5 w-5 text-gray-400 mr-2" />
                  <div>
                    <p className="text-xs text-gray-500">Phone</p>
                    <p className="text-sm font-medium text-gray-900">{staff.phone || 'Not provided'}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                  <div>
                    <p className="text-xs text-gray-500">Start Date</p>
                    <p className="text-sm font-medium text-gray-900">{formatDate(staff.start_date)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-sm mb-6 overflow-hidden">
          <div className="border-b border-gray-200">
            <div className="flex overflow-x-auto hide-scrollbar">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-4 flex items-center text-sm font-medium whitespace-nowrap ${
                    activeTab === tab.id 
                      ? 'border-b-2 border-emerald-500 text-emerald-600'
                      : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                  <div className="grid grid-cols-1 gap-y-4">
                    <div className="flex items-start">
                      <User className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Full Name</p>
                        <p className="text-sm font-medium text-gray-900">{staff.full_name}</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <Calendar className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Date of Birth</p>
                        <p className="text-sm font-medium text-gray-900">
                          {staff.date_of_birth ? formatDate(staff.date_of_birth) : 'Not provided'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <FileText className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">National ID</p>
                        <p className="text-sm font-medium text-gray-900">
                          {staff.national_id || 'Not provided'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <Mail className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Gender</p>
                        <p className="text-sm font-medium text-gray-900 capitalize">
                          {staff.gender || 'Not specified'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <Heart className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Marital Status</p>
                        <p className="text-sm font-medium text-gray-900 capitalize">
                          {staff.marital_status || 'Not specified'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <Users className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Nationality</p>
                        <p className="text-sm font-medium text-gray-900">
                          {staff.nationality || 'Not specified'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact & Emergency</h3>
                  
                  <div className="grid grid-cols-1 gap-y-4 mb-6">
                    <div className="flex items-start">
                      <Mail className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Email</p>
                        <p className="text-sm font-medium text-gray-900">{staff.email}</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <Phone className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Phone</p>
                        <p className="text-sm font-medium text-gray-900">{staff.phone || 'Not provided'}</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <MapPin className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Address</p>
                        <p className="text-sm font-medium text-gray-900">{staff.address || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>

                  <h4 className="text-md font-semibold text-gray-700 mb-3">Emergency Contact</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-1 gap-y-2">
                      <div className="flex items-start">
                        <User className="h-5 w-5 text-gray-400 mr-2" />
                        <div>
                          <p className="text-xs text-gray-500">Name</p>
                          <p className="text-sm font-medium text-gray-900">
                            {staff.emergency_contact_name || 'Not provided'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <Phone className="h-5 w-5 text-gray-400 mr-2" />
                        <div>
                          <p className="text-xs text-gray-500">Phone</p>
                          <p className="text-sm font-medium text-gray-900">
                            {staff.emergency_contact_phone || 'Not provided'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <Users className="h-5 w-5 text-gray-400 mr-2" />
                        <div>
                          <p className="text-xs text-gray-500">Relationship</p>
                          <p className="text-sm font-medium text-gray-900">
                            {staff.emergency_contact_relation || 'Not provided'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Employment Tab */}
          {activeTab === 'employment' && (
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Employment Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-500">Employee ID</span>
                      <span className="text-sm font-medium text-gray-900">{staff.employee_id || 'N/A'}</span>
                    </div>
                    
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-500">Contract Type</span>
                      <span className="text-sm font-medium text-gray-900 capitalize">{staff.contract_type || 'Permanent'}</span>
                    </div>
                    
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-500">Role</span>
                      <span className="text-sm font-medium text-gray-900 capitalize">{staff.role}</span>
                    </div>
                    
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-500">Department</span>
                      <span className="text-sm font-medium text-gray-900 capitalize">{staff.department}</span>
                    </div>
                    
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-500">Start Date</span>
                      <span className="text-sm font-medium text-gray-900">{formatDate(staff.start_date)}</span>
                    </div>
                    
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-500">Status</span>
                      <span className={`text-sm font-medium flex items-center ${
                        staff.hire_status === 'active' ? 'text-green-600' : 
                        staff.hire_status === 'on-leave' ? 'text-amber-600' : 'text-red-600'
                      }`}>
                        <span className={`w-2 h-2 rounded-full mr-1 ${
                          staff.hire_status === 'active' ? 'bg-green-500' : 
                          staff.hire_status === 'on-leave' ? 'bg-amber-500' : 'bg-red-500'
                        }`}></span>
                        {staff.hire_status || 'Active'}
                      </span>
                    </div>
                    
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-500">Probation End Date</span>
                      <span className="text-sm font-medium text-gray-900">
                        {staff.probation_end_date ? formatDate(staff.probation_end_date) : 'N/A'}
                      </span>
                    </div>
                    
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-500">Notice Period</span>
                      <span className="text-sm font-medium text-gray-900">{staff.notice_period || '30 days'}</span>
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-4">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {staff.skills && staff.skills.length > 0 ? (
                      staff.skills.map((skill, index) => (
                        <span key={index} className="px-3 py-1 rounded-full bg-gray-100 text-gray-800 text-sm">
                          {skill}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-gray-500">No skills listed</span>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Working Hours</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-500">Hours per Week</span>
                      <span className="text-sm font-medium text-gray-900">
                        {staff.working_hours_per_week || '40'} hours
                      </span>
                    </div>
                    
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-500">Default Shift</span>
                      <span className="text-sm font-medium text-gray-900 capitalize">{staff.default_shift || 'Day'}</span>
                    </div>
                    
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-500">Weekend Availability</span>
                      <span className="text-sm font-medium text-gray-900">
                        {staff.weekend_availability ? 'Available' : 'Not Available'}
                      </span>
                    </div>
                    
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-500">Overtime Eligible</span>
                      <span className="text-sm font-medium text-gray-900">
                        {staff.overtime_eligible ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Leave Management</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-500">Annual Leave Balance</span>
                      <span className="text-sm font-medium text-gray-900">
                        {staff.annual_leave_balance || '0'} days
                      </span>
                    </div>
                    
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-500">Sick Leave Balance</span>
                      <span className="text-sm font-medium text-gray-900">
                        {staff.sick_leave_balance || '0'} days
                      </span>
                    </div>
                    
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-500">Time Off Accrual Rate</span>
                      <span className="text-sm font-medium text-gray-900">
                        {staff.time_off_accrual_rate || '1.5'} days/month
                      </span>
                    </div>
                  </div>
                  
                  {(staff.leave_start_date || staff.leave_end_date) && (
                    <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <h4 className="font-medium text-amber-800 mb-2">Current Leave Period</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-amber-700">Start Date</p>
                          <p className="text-sm font-medium text-amber-900">
                            {staff.leave_start_date ? formatDate(staff.leave_start_date) : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-amber-700">End Date</p>
                          <p className="text-sm font-medium text-amber-900">
                            {staff.leave_end_date ? formatDate(staff.leave_end_date) : 'N/A'}
                          </p>
                        </div>
                      </div>
                      {staff.leave_reason && (
                        <div className="mt-2">
                          <p className="text-xs text-amber-700">Reason</p>
                          <p className="text-sm text-amber-900">{staff.leave_reason}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Compensation Tab */}
          {activeTab === 'compensation' && (
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Salary Information</h3>
                  <div className="bg-gray-50 rounded-lg p-5 mb-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">Base Salary</p>
                        <p className="text-xl font-bold text-gray-900">
                          ${staff.base_salary?.toLocaleString() || '0'}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-xs text-gray-500">Net Salary</p>
                        <p className="text-xl font-bold text-gray-900">
                          ${staff.net_salary?.toLocaleString() || '0'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-500">Hourly Rate</span>
                      <span className="text-sm font-medium text-gray-900">
                        ${staff.hourly_rate || '0'}/hour
                      </span>
                    </div>
                    
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-500">Payment Schedule</span>
                      <span className="text-sm font-medium text-gray-900 capitalize">
                        {staff.payment_schedule || 'Monthly'}
                      </span>
                    </div>
                    
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-500">Bonus</span>
                      <span className="text-sm font-medium text-gray-900">
                        ${staff.bonus?.toLocaleString() || '0'}
                      </span>
                    </div>
                    
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-500">Deductions</span>
                      <span className="text-sm font-medium text-gray-900">
                        ${staff.deductions?.toLocaleString() || '0'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Details</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-500">Bank Name</span>
                      <span className="text-sm font-medium text-gray-900">
                        {staff.bank_name || 'Not provided'}
                      </span>
                    </div>
                    
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-500">Bank Account</span>
                      <span className="text-sm font-medium text-gray-900">
                        {staff.bank_account || 'Not provided'}
                      </span>
                    </div>
                    
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-500">Tax ID</span>
                      <span className="text-sm font-medium text-gray-900">
                        {staff.tax_id || 'Not provided'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Performance Tab */}
          {activeTab === 'performance' && (
            <div className="p-6">
              <div className="max-w-4xl mx-auto">
                {reviewsLoading ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent mb-4"></div>
                    <p className="text-gray-500">Loading performance reviews...</p>
                  </div>
                ) : (
                  <div>
                    {/* Performance summary card if staff has performance data */}
                    {(staff.performance_score || staff.last_evaluation_date) && (
                      <div className="mb-8 bg-white border rounded-lg p-6">
                        <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
                          <Star className="h-5 w-5 text-amber-500 mr-2" />
                          Performance Summary
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {/* Performance score */}
                          {staff.performance_score && (
                            <div className="flex flex-col items-center">
                              <div className="relative w-24 h-24 mb-3">
                                <svg className="w-full h-full" viewBox="0 0 36 36">
                                  <path
                                    d="M18 2.0845
                                      a 15.9155 15.9155 0 0 1 0 31.831
                                      a 15.9155 15.9155 0 0 1 0 -31.831"
                                    fill="none"
                                    stroke="#E5E7EB"
                                    strokeWidth="3"
                                  />
                                  <path
                                    d="M18 2.0845
                                      a 15.9155 15.9155 0 0 1 0 31.831
                                      a 15.9155 15.9155 0 0 1 0 -31.831"
                                    fill="none"
                                    stroke="#10B981"
                                    strokeWidth="3"
                                    strokeDasharray={`${(staff.performance_score / 100) * 100}, 100`}
                                  />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <span className="text-2xl font-bold">{staff.performance_score}</span>
                                </div>
                              </div>
                              <p className="text-sm text-gray-500">Overall Score</p>
                            </div>
                          )}

                          {/* Evaluation dates */}
                          <div className="flex flex-col">
                            <div className="mb-3">
                              <p className="text-xs text-gray-500">Last Evaluation</p>
                              <p className="font-medium text-gray-900">{formatDate(staff.last_evaluation_date)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Next Evaluation</p>
                              <p className="font-medium text-gray-900">{formatDate(staff.next_evaluation_date)}</p>
                            </div>
                          </div>

                          {/* Performance notes summary */}
                          {staff.performance_notes && (
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Performance Notes</p>
                              <p className="text-sm text-gray-700">
                                {staff.performance_notes.length > 150
                                  ? `${staff.performance_notes.substring(0, 150)}...`
                                  : staff.performance_notes}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Performance Review Component */}
                    <PerformanceReview
                      reviews={reviews}
                      onAddReview={handleAddReview}
                      onEditReview={handleEditReview}
                      onDeleteReview={handleDeleteReview}
                      isLoading={reviewsLoading}
                    />
                  </div>
                )}
              </div>
            </div>
          )}          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <div className="p-6">
              <div className="max-w-3xl mx-auto">
                {documentsLoading ? (
                  <div className="flex justify-center items-center py-10">
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-emerald-500 border-t-transparent"></div>
                  </div>
                ) : (
                  <DocumentManagement 
                    documents={documents}
                    onUploadDocument={handleDocumentUpload}
                    onDeleteDocument={handleDocumentDelete}
                    onVerifyDocument={handleDocumentVerify}
                    staffMember={{ id: id || '', full_name: staff.full_name }}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffProfile;

