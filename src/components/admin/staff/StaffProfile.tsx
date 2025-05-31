import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { toast } from 'react-hot-toast';
import {
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Briefcase, 
  Building, 
  FileText, 
  ArrowLeft, 
  Award, 
  Clock, 
  Shield, 
  DollarSign,
  ChevronDown,
  ChevronUp, 
  Edit,
  Trash2,
  Star,
  CheckCircle
} from 'lucide-react';

// Import components
import DocumentManagement from './DocumentManagement';
import PerformanceReview from './PerformanceReview';
import StaffForm from './StaffForm';
import { Staff } from '../../../types/staff';

// Import styles
import './StaffProfile.css';

// Define interfaces
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

interface StaffMember {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  address?: string;
  role: string;
  department: string;
  is_active: boolean;
  profile_photo_url?: string;
  hire_date?: string;
  start_date?: string;
  employee_id?: string;
  date_of_birth?: string;
  gender?: string;
  base_salary?: number;
  hourly_rate?: number;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relation?: string;
  skills?: string[];
  // Add any additional fields we want to display
  // ...
}

export default function StaffProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [staff, setStaff] = useState<StaffMember | null>(null);
  const [documents, setDocuments] = useState<StaffDocument[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<'details' | 'documents' | 'performance'>('details');
  const [showEditForm, setShowEditForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Expanded sections
  const [expandedSections, setExpandedSections] = useState({
    personalInfo: true,
    contactInfo: true,
    employmentDetails: true,
    emergencyContact: true
  });

  useEffect(() => {
    if (id) {
      fetchStaffDetails();
      fetchStaffDocuments();
      fetchPerformanceReviews();
    }
  }, [id]);

  const fetchStaffDetails = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setStaff(data);
    } catch (error) {
      console.error('Error fetching staff details:', error);
      toast.error('Failed to load staff details');
    } finally {
      setLoading(false);
    }
  };

  const fetchStaffDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('staff_documents')
        .select('*')
        .eq('staff_id', id)
        .order('upload_date', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching staff documents:', error);
      toast.error('Failed to load staff documents');
    }
  };  const fetchPerformanceReviews = async () => {
    try {
      // Directly query the staff_performance_reviews table
      // If there's an error, we'll catch it in the catch block
      const { data, error } = await supabase
        .from('staff_performance_reviews')
        .select('*')
        .eq('staff_id', id)
        .order('review_date', { ascending: false });

      // If there's an error with a code 'PGRST116', it likely means the table doesn't exist
      if (error) {
        console.error('Error fetching performance reviews:', error);
        
        // Handle different types of errors gracefully
        if (error.code === 'PGRST116' || error.message?.includes('relation "staff_performance_reviews" does not exist')) {
          console.warn('Performance review table does not exist');
          toast.error('Performance review system is not set up');
          setReviews([]);
        } else {
          toast.error('Failed to load performance reviews');
        }
        return;
      }
      
      // Transform data to match our interface
      const formattedReviews = data?.map(review => ({
        ...review,
        reviewer_name: review.reviewer_name || 'Anonymous User'
      })) || [];
      
      setReviews(formattedReviews);
    } catch (error) {
      console.error('Error fetching performance reviews:', error);
      toast.error('Failed to load performance reviews');
      // Set empty array to avoid undefined errors elsewhere in the component
      setReviews([]);
    }
  };

  const handleDocumentUpload = async (document: Omit<StaffDocument, 'id' | 'upload_date' | 'status'>) => {
    try {
      const { data, error } = await supabase
        .from('staff_documents')
        .insert([{
          ...document,
          staff_id: id,
          upload_date: new Date().toISOString(),
          status: 'active'
        }])
        .select();

      if (error) throw error;
      toast.success('Document uploaded successfully');
      fetchStaffDocuments();
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error('Failed to upload document');
    }
  };

  const handleDocumentDelete = async (documentId: string) => {
    try {
      const { error } = await supabase
        .from('staff_documents')
        .delete()
        .eq('id', documentId);

      if (error) throw error;
      toast.success('Document deleted successfully');
      fetchStaffDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document');
    }
  };

  const handleDocumentVerify = async (documentId: string, isVerified: boolean) => {
    try {
      const { error } = await supabase
        .from('staff_documents')
        .update({ is_verified: isVerified })
        .eq('id', documentId);

      if (error) throw error;
      toast.success(`Document ${isVerified ? 'verified' : 'unverified'} successfully`);
      fetchStaffDocuments();
    } catch (error) {
      console.error('Error verifying document:', error);
      toast.error('Failed to update document verification status');
    }
  };
  const handleAddReview = async (review: Omit<Review, 'id'>) => {
    try {
      // Use the main supabase client directly instead of the helper function
      const { data, error } = await supabase
        .from('staff_performance_reviews')
        .insert([{
          ...review,
          staff_id: id,
        }])
        .select();
        
      if (error) throw error;
      
      toast.success('Review added successfully');
      fetchPerformanceReviews();
    } catch (error) {
      console.error('Error adding review:', error);
      toast.error('Failed to add review');
    }
  };

  const handleEditReview = async (reviewId: string, reviewUpdates: Partial<Review>) => {
    try {
      // Use the main supabase client directly
      const { data, error } = await supabase
        .from('staff_performance_reviews')
        .update(reviewUpdates)
        .eq('id', reviewId)
        .select();
        
      if (error) throw error;
      
      toast.success('Review updated successfully');
      fetchPerformanceReviews();
    } catch (error) {
      console.error('Error updating review:', error);
      toast.error('Failed to update review');
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    try {
      // Use the main supabase client directly
      const { error } = await supabase
        .from('staff_performance_reviews')
        .delete()
        .eq('id', reviewId);
        
      if (error) throw error;
      
      toast.success('Review deleted successfully');
      fetchPerformanceReviews();
    } catch (error) {
      console.error('Error deleting review:', error);
      toast.error('Failed to delete review');
    }
  };

  const handleSubmit = async (formData: any, photoFile: File | null) => {
    try {
      setIsSubmitting(true);
      
      // Handle photo upload if a new file is provided
      let photoUrl = formData.profile_photo_url;
      
      if (photoFile) {
        const fileName = `${Date.now()}-${photoFile.name}`;
        const filePath = `staff-photos/${id}/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('staff-photos')
          .upload(filePath, photoFile);
          
        if (uploadError) {
          throw new Error(`Error uploading photo: ${uploadError.message}`);
        }
        
        // Get the public URL for the uploaded file
        const { data: { publicUrl } } = supabase.storage
          .from('staff-photos')
          .getPublicUrl(filePath);
          
        photoUrl = publicUrl;
        formData.profile_photo_url = photoUrl;
      }
      
      const { error } = await supabase
        .from('staff')
        .update(formData)
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Staff profile updated successfully');
      setShowEditForm(false);
      fetchStaffDetails();
    } catch (error) {
      console.error('Error updating staff profile:', error);
      toast.error('Failed to update staff profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!staff) {
    return (
      <div className="p-6 text-center">
        <p className="text-lg text-gray-600">Staff member not found</p>
        <button 
          onClick={() => navigate('/admin/staff')}
          className="mt-4 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
        >
          Back to Staff List
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/admin/staff')}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold">Staff Profile</h1>
        </div>
        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowEditForm(true)}
            className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 flex items-center gap-2"
          >
            <Edit className="w-4 h-4" />
            Edit Profile
          </motion.button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b mb-6 overflow-x-auto hide-scrollbar">
        <button
          onClick={() => setActiveSection('details')}
          className={`flex items-center px-6 py-3 border-b-2 transition-colors ${
            activeSection === 'details'
              ? "border-emerald-500 text-emerald-600"
              : "border-transparent hover:text-emerald-500"
          }`}
        >
          <User className="w-5 h-5 mr-2" />
          <span>Details</span>
        </button>
        <button
          onClick={() => setActiveSection('documents')}
          className={`flex items-center px-6 py-3 border-b-2 transition-colors ${
            activeSection === 'documents'
              ? "border-emerald-500 text-emerald-600"
              : "border-transparent hover:text-emerald-500"
          }`}
        >
          <FileText className="w-5 h-5 mr-2" />
          <span>Documents</span>
        </button>
        <button
          onClick={() => setActiveSection('performance')}
          className={`flex items-center px-6 py-3 border-b-2 transition-colors ${
            activeSection === 'performance'
              ? "border-emerald-500 text-emerald-600"
              : "border-transparent hover:text-emerald-500"
          }`}
        >
          <Award className="w-5 h-5 mr-2" />
          <span>Performance</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-lg shadow-sm">
        {/* Details Section */}
        {activeSection === 'details' && (
          <div className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Profile Photo and Basic Info */}
              <div className="md:w-1/3">
                <div className="flex flex-col items-center p-6 border rounded-lg bg-gray-50">
                  <div className="w-32 h-32 rounded-full overflow-hidden mb-4 border-4 border-emerald-500">
                    {staff.profile_photo_url ? (
                      <img 
                        src={staff.profile_photo_url} 
                        alt={staff.full_name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-emerald-100 text-emerald-500">
                        <User size={48} />
                      </div>
                    )}
                  </div>
                  <h2 className="text-xl font-semibold">{staff.full_name}</h2>
                  <div className="flex items-center gap-2 mb-2 mt-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      staff.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {staff.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {staff.role}
                    </span>
                  </div>
                  <p className="text-gray-600 flex items-center gap-2">
                    <Building className="w-4 h-4" /> {staff.department}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 w-full mt-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-gray-500">Documents</p>
                      <p className="font-semibold text-lg">{documents.length}</p>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <p className="text-sm text-gray-500">Reviews</p>
                      <p className="font-semibold text-lg">{reviews.length}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Staff Details */}
              <div className="md:w-2/3">
                {/* Personal Information */}
                <div className="border rounded-lg mb-6">
                  <div 
                    className="flex justify-between items-center p-4 cursor-pointer"
                    onClick={() => toggleSection('personalInfo')}
                  >
                    <h3 className="font-semibold flex items-center gap-2">
                      <User className="h-5 w-5 text-emerald-500" /> 
                      Personal Information
                    </h3>
                    {expandedSections.personalInfo ? (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  
                  {expandedSections.personalInfo && (
                    <div className="p-4 border-t">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Full Name</p>
                          <p>{staff.full_name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Employee ID</p>
                          <p>{staff.employee_id || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Date of Birth</p>
                          <p>{staff.date_of_birth || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Gender</p>
                          <p>{staff.gender || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Contact Information */}
                <div className="border rounded-lg mb-6">
                  <div 
                    className="flex justify-between items-center p-4 cursor-pointer"
                    onClick={() => toggleSection('contactInfo')}
                  >
                    <h3 className="font-semibold flex items-center gap-2">
                      <Mail className="h-5 w-5 text-emerald-500" /> 
                      Contact Information
                    </h3>
                    {expandedSections.contactInfo ? (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  
                  {expandedSections.contactInfo && (
                    <div className="p-4 border-t">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Email</p>
                          <p className="flex items-center gap-1">
                            <Mail className="h-4 w-4 text-gray-400" />
                            {staff.email}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Phone</p>
                          <p className="flex items-center gap-1">
                            <Phone className="h-4 w-4 text-gray-400" />
                            {staff.phone}
                          </p>
                        </div>
                        <div className="md:col-span-2">
                          <p className="text-sm text-gray-500">Address</p>
                          <p className="flex items-center gap-1">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            {staff.address || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Employment Details */}
                <div className="border rounded-lg mb-6">
                  <div 
                    className="flex justify-between items-center p-4 cursor-pointer"
                    onClick={() => toggleSection('employmentDetails')}
                  >
                    <h3 className="font-semibold flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-emerald-500" /> 
                      Employment Details
                    </h3>
                    {expandedSections.employmentDetails ? (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  
                  {expandedSections.employmentDetails && (
                    <div className="p-4 border-t">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Department</p>
                          <p>{staff.department}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Role</p>
                          <p>{staff.role}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Start Date</p>
                          <p className="flex items-center gap-1">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            {staff.hire_date || staff.start_date || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Status</p>
                          <p className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            staff.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {staff.is_active ? 'Active' : 'Inactive'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Base Salary</p>                          <p className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4 text-gray-400" />
                            {staff.base_salary ? `Rs${staff.base_salary}` : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Hourly Rate</p>
                          <p className="flex items-center gap-1">
                            <Clock className="h-4 w-4 text-gray-400" />
                            {staff.hourly_rate ? `Rs${staff.hourly_rate}/hr` : 'N/A'}
                          </p>
                        </div><div className="md:col-span-2">
                          <p className="text-sm text-gray-500">Skills</p>
                          <p>{Array.isArray(staff.skills) && staff.skills.length > 0 ? staff.skills.join(', ') : 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Emergency Contact */}
                <div className="border rounded-lg">
                  <div 
                    className="flex justify-between items-center p-4 cursor-pointer"
                    onClick={() => toggleSection('emergencyContact')}
                  >
                    <h3 className="font-semibold flex items-center gap-2">
                      <Shield className="h-5 w-5 text-emerald-500" /> 
                      Emergency Contact
                    </h3>
                    {expandedSections.emergencyContact ? (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  
                  {expandedSections.emergencyContact && (
                    <div className="p-4 border-t">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Name</p>
                          <p>{staff.emergency_contact_name || 'N/A'}</p>
                        </div>                        <div>
                          <p className="text-sm text-gray-500">Phone</p>
                          <p className="flex items-center gap-1">
                            <Phone className="h-4 w-4 text-gray-400" />
                            {staff.emergency_contact_phone || 'N/A'}
                          </p>
                        </div>                        <div>
                          <p className="text-sm text-gray-500">Relationship</p>
                          <p>{staff.emergency_contact_relation || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Documents Section */}
        {activeSection === 'documents' && (
          <div className="p-6">
            <DocumentManagement 
              documents={documents}
              onUploadDocument={handleDocumentUpload}
              onDeleteDocument={handleDocumentDelete}
              onVerifyDocument={handleDocumentVerify}
              staffMember={staff}
            />
          </div>
        )}
        
        {/* Performance Section */}
        {activeSection === 'performance' && (
          <div className="p-6">
            <PerformanceReview 
              reviews={reviews}
              onAddReview={handleAddReview}
              onEditReview={handleEditReview}
              onDeleteReview={handleDeleteReview}
            />
          </div>
        )}
      </div>

      {/* Edit Staff Form */}      <StaffForm 
        isOpen={showEditForm}
        onClose={() => setShowEditForm(false)}
        onSubmit={handleSubmit}
        initialData={staff as unknown as Partial<Staff>}
        isLoading={isSubmitting}
      />
    </div>
  );
}
