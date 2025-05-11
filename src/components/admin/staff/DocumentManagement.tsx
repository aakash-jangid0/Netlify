import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  File, 
  FileText, 
  Upload, 
  Download, 
  Trash2, 
  Eye, 
  Plus, 
  FolderPlus,
  FilePlus,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Search
} from 'lucide-react';

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

interface DocumentManagementProps {
  documents: StaffDocument[];
  onUploadDocument: (document: Omit<StaffDocument, 'id' | 'upload_date' | 'status'>) => Promise<void>;
  onDeleteDocument: (id: string) => Promise<void>;
  onVerifyDocument: (id: string, isVerified: boolean) => Promise<void>;
  staffMember?: { id: string; full_name: string };
}

export default function DocumentManagement({
  documents,
  onUploadDocument,
  onDeleteDocument,
  onVerifyDocument,
  staffMember
}: DocumentManagementProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    file_name: '',
    category: 'identification',
    expiry_date: '',
  });
  
  // Get unique categories from documents
  const categories = Array.from(new Set(documents.map(doc => doc.category)));

  // Filter documents by search and category
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.file_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Function to format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  // Function to get icon based on file type
  const getFileIcon = (fileType: string) => {
    switch (fileType.toLowerCase()) {
      case 'pdf':
        return <FileText className="h-6 w-6 text-red-500" />;
      case 'doc':
      case 'docx':
        return <FileText className="h-6 w-6 text-blue-500" />;
      case 'xls':
      case 'xlsx':
        return <FileText className="h-6 w-6 text-green-500" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
        return <File className="h-6 w-6 text-purple-500" />;
      default:
        return <File className="h-6 w-6 text-gray-500" />;
    }
  };

  // Function to get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  // Group documents by category for better organization
  const groupedDocuments: { [key: string]: StaffDocument[] } = {};
  filteredDocuments.forEach(doc => {
    if (!groupedDocuments[doc.category]) {
      groupedDocuments[doc.category] = [];
    }
    groupedDocuments[doc.category].push(doc);
  });

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold">
          {staffMember 
            ? `Documents for ${staffMember.full_name}` 
            : 'Staff Documents Management'}
        </h2>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowUploadModal(true)}
          className="flex items-center px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload Document
        </motion.button>
      </div>
      
      {/* Search and filter */}
      <div className="flex flex-wrap gap-4 mb-6 items-center">
        <div className="flex-grow relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-full px-4 py-2 border rounded-lg"
          />
        </div>
        
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2 border rounded-lg bg-white"
        >
          <option value="all">All Categories</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </option>
          ))}
        </select>
      </div>
      
      {/* Documents list */}
      {Object.keys(groupedDocuments).length === 0 ? (
        <div className="text-center py-12">
          <FilePlus className="mx-auto h-12 w-12 text-gray-300 mb-3" />
          <h3 className="text-gray-500 font-medium">No documents found</h3>
          <p className="text-gray-400 text-sm mt-1">
            {searchQuery || selectedCategory !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Upload documents to get started'}
          </p>
          
          <button
            onClick={() => setShowUploadModal(true)}
            className="mt-4 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200"
          >
            <Plus className="w-4 h-4 mr-1 inline" /> Add New Document
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.keys(groupedDocuments).map((category) => (
            <div key={category} className="border rounded-lg overflow-hidden">
              <div className="bg-gray-50 py-3 px-4 border-b">
                <h3 className="font-medium capitalize">{category}</h3>
              </div>
              
              <div className="divide-y">
                {groupedDocuments[category].map((document) => (
                  <motion.div
                    key={document.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {getFileIcon(document.file_type)}
                        <div className="ml-3">
                          <h4 className="font-medium">{document.file_name}</h4>
                          <div className="flex items-center text-sm text-gray-500 space-x-4">
                            <span>{document.file_type.toUpperCase()}</span>
                            <span>{formatFileSize(document.file_size)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {document.expiry_date && (
                          <div className="flex items-center text-sm text-gray-500 mr-4">
                            <Calendar className="w-4 h-4 mr-1" />
                            <span>Expires: {formatDate(document.expiry_date)}</span>
                          </div>
                        )}
                        
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(document.status)}`}>
                          {document.status}
                        </span>
                        
                        <div className="flex items-center space-x-2 ml-4">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => window.open(document.file_url, '_blank')}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded-full"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </motion.button>
                            <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => {
                              const a = window.document.createElement('a');
                              a.href = document.file_url;
                              a.download = document.file_name;
                              window.document.body.appendChild(a);
                              a.click();
                              window.document.body.removeChild(a);
                            }}
                            className="p-1 text-green-600 hover:bg-green-50 rounded-full"
                            title="Download"
                          >
                            <Download className="w-4 h-4" />
                          </motion.button>
                          
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => onVerifyDocument(document.id, !document.is_verified)}
                            className={`p-1 rounded-full ${
                              document.is_verified 
                                ? 'text-green-600 hover:bg-green-50' 
                                : 'text-gray-600 hover:bg-gray-50'
                            }`}
                            title={document.is_verified ? 'Verified' : 'Mark as Verified'}
                          >
                            {document.is_verified ? (
                              <CheckCircle className="w-4 h-4" />
                            ) : (
                              <XCircle className="w-4 h-4" />
                            )}
                          </motion.button>
                          
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => onDeleteDocument(document.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded-full"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </motion.button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center text-xs text-gray-500 mt-2">
                      <Clock className="w-3 h-3 mr-1" />
                      <span>Uploaded on {formatDate(document.upload_date)}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg w-full max-w-md p-6"
          >
            <h3 className="text-lg font-semibold mb-4">Upload New Document</h3>
            
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Document Name
                </label>
                <input
                  type="text"
                  value={uploadForm.file_name}
                  onChange={(e) => setUploadForm({ ...uploadForm, file_name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={uploadForm.category}
                  onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="identification">Identification</option>
                  <option value="contract">Contract</option>
                  <option value="certificate">Certificate</option>
                  <option value="training">Training</option>
                  <option value="legal">Legal</option>
                  <option value="medical">Medical</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expiry Date (if applicable)
                </label>
                <input
                  type="date"
                  value={uploadForm.expiry_date}
                  onChange={(e) => setUploadForm({ ...uploadForm, expiry_date: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">
                  Drag & drop files here or
                  <button type="button" className="text-emerald-600 hover:text-emerald-700 ml-1">
                    browse files
                  </button>
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Supported formats: PDF, DOC, JPG, PNG (Max 10MB)
                </p>
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
                >
                  Upload
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
