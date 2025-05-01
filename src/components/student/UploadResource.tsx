import React, { useState, useRef, useEffect } from 'react';
import { Upload, Book, FileText, FileQuestion, X, ChevronDown, Check, AlertCircle, Clock } from 'lucide-react';
import { useAuth } from '../../utils/AuthContext';
import { API_ENDPOINTS } from '../../utils/apiService';
import { getApiBaseUrl } from '../../utils/config';

// Define resource type
type ResourceType = 'ebook' | 'notes' | 'question';

// Define upload status type
type UploadStatus = 'idle' | 'uploading' | 'success' | 'error' | 'review';

interface UploadedResource {
  id: string;
  title: string;
  type: ResourceType;
  fileUrl: string;
  thumbnail?: string;
  createdAt: string;
  status: 'pending' | 'approved' | 'rejected';
  viewCount: number;
  downloadCount: number;
}

const UploadResource: React.FC = () => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form state
  const [resourceType, setResourceType] = useState<ResourceType>('ebook');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    author: user?.name || '',
    subject: '',
    courseCode: '',
    semester: '1',
    description: '',
  });
  
  // UI state
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isTypeSelectorOpen, setIsTypeSelectorOpen] = useState(false);
  const [uploadedResources, setUploadedResources] = useState<UploadedResource[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user's uploaded resources
  useEffect(() => {
    const fetchUploadedResources = async () => {
      if (!user?.id) return;
      
      setIsLoading(true);
      try {
        // In a real app, this would be an actual API call
        // const response = await fetch(
        //   `${getApiBaseUrl()}${API_ENDPOINTS.USER_RESOURCES}?userId=${user.id}`
        // );
        // const data = await response.json();
        // if (data.status) {
        //   setUploadedResources(data.data);
        // }
        
        // For demo purposes, we'll use mock data
        setTimeout(() => {
          setUploadedResources([
            {
              id: '1',
              title: 'Introduction to Computer Science',
              type: 'ebook',
              fileUrl: 'https://example.com/files/intro-cs.pdf',
              createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
              status: 'approved',
              viewCount: 24,
              downloadCount: 12,
            },
            {
              id: '2',
              title: 'Database Management System Notes',
              type: 'notes',
              fileUrl: 'https://example.com/files/dbms-notes.pdf',
              thumbnail: 'https://example.com/thumbnails/dbms-notes.jpg',
              createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
              status: 'pending',
              viewCount: 0,
              downloadCount: 0,
            },
            {
              id: '3',
              title: 'Operating Systems Final Exam 2023',
              type: 'question',
              fileUrl: 'https://example.com/files/os-final-2023.pdf',
              createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
              status: 'rejected',
              viewCount: 5,
              downloadCount: 3,
            },
          ]);
          setIsLoading(false);
        }, 800);
      } catch (error) {
        console.error('Error fetching uploaded resources:', error);
        setIsLoading(false);
      }
    };

    fetchUploadedResources();
  }, [user?.id]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Check file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        setErrorMessage('File size exceeds 50MB limit.');
        setUploadStatus('error');
        return;
      }
      
      // Check file type
      const validTypes = {
        ebook: ['application/pdf', 'application/epub+zip'],
        notes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        question: ['application/pdf', 'image/jpeg', 'image/png']
      };
      
      if (!validTypes[resourceType].includes(file.type)) {
        setErrorMessage(`Invalid file type. Accepted formats: ${resourceType === 'ebook' ? 'PDF, EPUB' : resourceType === 'notes' ? 'PDF, DOC, DOCX' : 'PDF, JPG, PNG'}`);
        setUploadStatus('error');
        return;
      }
      
      setSelectedFile(file);
      setUploadStatus('idle');
      setErrorMessage('');
      
      // Auto-fill title if empty
      if (!formData.title) {
        setFormData({
          ...formData,
          title: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
        });
      }
    }
  };
  
  const handleResourceTypeChange = (type: ResourceType) => {
    setResourceType(type);
    setIsTypeSelectorOpen(false);
    // Reset file if changing type
    if (selectedFile) {
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      setErrorMessage('Please select a file to upload');
      setUploadStatus('error');
      return;
    }
    
    setUploadStatus('uploading');
    setUploadProgress(0);
    
    // In a real app, this would be an actual file upload
    // Simulated upload with progress
    let progress = 0;
    const intervalId = setInterval(() => {
      progress += Math.floor(Math.random() * 15) + 5;
      if (progress > 100) progress = 100;
      setUploadProgress(progress);
      
      if (progress === 100) {
        clearInterval(intervalId);
        setTimeout(() => {
          setUploadStatus('review');
          
          // Add to uploaded resources
          const newResource: UploadedResource = {
            id: `temp-${Date.now()}`,
            title: formData.title,
            type: resourceType,
            fileUrl: URL.createObjectURL(selectedFile),
            createdAt: new Date().toISOString(),
            status: 'pending',
            viewCount: 0,
            downloadCount: 0,
          };
          
          setUploadedResources(prev => [newResource, ...prev]);
          
          // Reset form
          setFormData({
            title: '',
            author: user?.name || '',
            subject: '',
            courseCode: '',
            semester: '1',
            description: '',
          });
          setSelectedFile(null);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }, 500);
      }
    }, 300);
  };
  
  // Helper function to get resource type display name
  const getResourceTypeLabel = (type: ResourceType): string => {
    switch(type) {
      case 'ebook': return 'E-Book';
      case 'notes': return 'Notes';
      case 'question': return 'Question Paper';
      default: return 'Resource';
    }
  };
  
  // Helper function to get resource type icon
  const getResourceTypeIcon = (type: ResourceType) => {
    switch(type) {
      case 'ebook': return <Book className="h-5 w-5 text-blue-600" />;
      case 'notes': return <FileText className="h-5 w-5 text-green-600" />;
      case 'question': return <FileQuestion className="h-5 w-5 text-orange-600" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };
  
  // Helper function to format date
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Upload Resources</h1>
        <p className="text-gray-600">Share your notes, e-books, or question papers with other students</p>
      </div>

      {/* Upload Form */}
      <div className="bg-white p-6 rounded-lg border shadow-sm mb-8">
        <h2 className="text-lg font-medium text-gray-800 mb-6">Upload a New Resource</h2>

        <form onSubmit={handleSubmit}>
          {/* Resource Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Resource Type
            </label>
            <div className="relative">
              <button
                type="button"
                className="w-full bg-white border rounded-md shadow-sm px-4 py-2 text-left flex items-center justify-between"
                onClick={() => setIsTypeSelectorOpen(!isTypeSelectorOpen)}
              >
                <div className="flex items-center">
                  {getResourceTypeIcon(resourceType)}
                  <span className="ml-2">{getResourceTypeLabel(resourceType)}</span>
                </div>
                <ChevronDown className="h-5 w-5 text-gray-400" />
              </button>
              
              {isTypeSelectorOpen && (
                <div className="absolute mt-1 w-full bg-white shadow-lg rounded-md z-10 border">
                  <ul>
                    <li>
                      <button
                        type="button"
                        className={`w-full px-4 py-2 text-left flex items-center hover:bg-gray-50 ${
                          resourceType === 'ebook' ? 'bg-blue-50 text-blue-700' : ''
                        }`}
                        onClick={() => handleResourceTypeChange('ebook')}
                      >
                        <Book className="h-5 w-5 mr-2" />
                        E-Book
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        className={`w-full px-4 py-2 text-left flex items-center hover:bg-gray-50 ${
                          resourceType === 'notes' ? 'bg-blue-50 text-blue-700' : ''
                        }`}
                        onClick={() => handleResourceTypeChange('notes')}
                      >
                        <FileText className="h-5 w-5 mr-2" />
                        Notes
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        className={`w-full px-4 py-2 text-left flex items-center hover:bg-gray-50 ${
                          resourceType === 'question' ? 'bg-blue-50 text-blue-700' : ''
                        }`}
                        onClick={() => handleResourceTypeChange('question')}
                      >
                        <FileQuestion className="h-5 w-5 mr-2" />
                        Question Paper
                      </button>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>
          
          {/* File Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Upload File
            </label>
            <div className="flex items-center justify-center w-full">
              <label className={`cursor-pointer flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg ${
                selectedFile ? 'bg-blue-50 border-blue-300' : 'bg-gray-50 border-gray-300'
              } hover:bg-gray-100 transition-colors duration-150`}>
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {selectedFile ? (
                    <>
                      <Check className="mx-auto h-12 w-12 text-green-500" />
                      <p className="mt-2 text-sm text-gray-700 truncate max-w-xs">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setSelectedFile(null);
                          if (fileInputRef.current) {
                            fileInputRef.current.value = '';
                          }
                        }}
                        className="mt-1 text-xs text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    </>
                  ) : (
                    <>
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">
                        {resourceType === 'ebook' ? 'PDF, EPUB (Max 50MB)' : 
                         resourceType === 'notes' ? 'PDF, DOC, DOCX (Max 50MB)' : 
                         'PDF, JPG, PNG (Max 50MB)'}
                      </p>
                    </>
                  )}
                </div>
                <input 
                  ref={fileInputRef}
                  type="file" 
                  className="hidden" 
                  onChange={handleFileSelect} 
                  accept={
                    resourceType === 'ebook' ? '.pdf,.epub' : 
                    resourceType === 'notes' ? '.pdf,.doc,.docx' : 
                    '.pdf,.jpg,.jpeg,.png'
                  }
                />
              </label>
            </div>
            {uploadStatus === 'error' && (
              <div className="text-red-500 text-sm mt-1 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errorMessage}
              </div>
            )}
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Title*
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="author" className="block text-sm font-medium text-gray-700 mb-1">
                Author/Creator*
              </label>
              <input
                type="text"
                id="author"
                name="author"
                value={formData.author}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                Subject*
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="courseCode" className="block text-sm font-medium text-gray-700 mb-1">
                Course Code*
              </label>
              <input
                type="text"
                id="courseCode"
                name="courseCode"
                value={formData.courseCode}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="semester" className="block text-sm font-medium text-gray-700 mb-1">
                Semester*
              </label>
              <select
                id="semester"
                name="semester"
                value={formData.semester}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                  <option key={sem} value={sem}>
                    Semester {sem}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-6">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Add a brief description of this resource..."
            />
          </div>

          {/* Upload Progress */}
          {uploadStatus === 'uploading' && (
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-1">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Success Message */}
          {uploadStatus === 'review' && (
            <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-md">
              <div className="flex">
                <Check className="h-5 w-5 text-green-500 mr-2" />
                <div>
                  <p className="text-green-800 font-medium">Resource submitted successfully!</p>
                  <p className="text-green-700 text-sm">Your resource will be reviewed by our librarians before it becomes available to all users.</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={uploadStatus === 'uploading'}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 flex items-center"
            >
              {uploadStatus === 'uploading' ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Resource
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Uploaded Resources */}
      <div className="bg-white p-6 rounded-lg border shadow-sm">
        <h2 className="text-lg font-medium text-gray-800 mb-6">Your Uploaded Resources</h2>
        
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((item) => (
              <div key={item} className="border rounded-lg p-4 animate-pulse">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div className="flex space-x-4">
                    <div className="w-12 h-12 bg-gray-200 rounded"></div>
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                  <div className="mt-4 md:mt-0">
                    <div className="h-6 bg-gray-200 rounded w-24"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : uploadedResources.length > 0 ? (
          <div className="space-y-4">
            {uploadedResources.map((resource) => (
              <div 
                key={resource.id} 
                className="border rounded-lg overflow-hidden"
              >
                <div className="flex flex-col md:flex-row">
                  <div className="flex-1 p-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 rounded bg-gray-100 flex items-center justify-center">
                          {getResourceTypeIcon(resource.type)}
                        </div>
                      </div>
                      <div className="ml-4">
                        <h3 className="font-medium text-gray-900">{resource.title}</h3>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500 mt-1">
                          <span>Uploaded: {formatDate(resource.createdAt)}</span>
                          <span>•</span>
                          <span>{getResourceTypeLabel(resource.type)}</span>
                        </div>
                        <div className="flex items-center mt-2">
                          {resource.status === 'approved' ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <Check className="h-3 w-3 mr-1" />
                              Approved
                            </span>
                          ) : resource.status === 'rejected' ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <X className="h-3 w-3 mr-1" />
                              Rejected
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              <Clock className="h-3 w-3 mr-1" />
                              Under Review
                            </span>
                          )}
                          
                          {resource.status === 'approved' && (
                            <div className="ml-4 text-xs text-gray-500 flex items-center">
                              <span className="mr-2">Views: {resource.viewCount}</span>
                              <span>Downloads: {resource.downloadCount}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 px-4 py-3 flex justify-end md:items-center border-t md:border-t-0 md:border-l">
                    <div>
                      <a 
                        href={resource.fileUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                      >
                        View File
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Upload className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>You haven't uploaded any resources yet</p>
            <p className="text-sm mt-1">Your uploaded resources will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadResource;