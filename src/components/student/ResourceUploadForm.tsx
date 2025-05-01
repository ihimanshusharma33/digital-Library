import React, { useState, useRef } from 'react';
import { Upload, Check, Clock, AlertCircle } from 'lucide-react';
import { useAuth } from '../../utils/AuthContext';

interface ResourceUploadFormProps {
  onUploadComplete: (resource: any) => void;
  onCancel: () => void;
}

const ResourceUploadForm: React.FC<ResourceUploadFormProps> = ({ 
  onUploadComplete, 
  onCancel 
}) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form state
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    type: 'notes' as 'ebook' | 'notes' | 'question',
    subject: '',
    author: user?.name || '',
    course_code: '',
    semester: 1,
  });
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Handle form changes
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setUploadForm(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Validate file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        setErrorMessage('File size exceeds 50MB limit');
        return;
      }
      
      // Set selected file
      setSelectedFile(file);
      setErrorMessage('');
      
      // Auto-fill title if empty
      if (!uploadForm.title) {
        setUploadForm(prev => ({
          ...prev,
          title: file.name.replace(/\.[^/.]+$/, '')
        }));
      }
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      setErrorMessage('Please select a file to upload');
      return;
    }
    
    setUploadStatus('uploading');
    setUploadProgress(0);
    
    // In a real app, this would be an API call with form data
    // const formData = new FormData();
    // formData.append('file', selectedFile);
    // formData.append('title', uploadForm.title);
    // formData.append('description', uploadForm.description);
    // formData.append('type', uploadForm.type);
    // formData.append('subject', uploadForm.subject);
    // formData.append('author', uploadForm.author);
    // formData.append('course_code', uploadForm.course_code);
    // formData.append('semester', uploadForm.semester.toString());
    // formData.append('user_id', user?.id || '');
    
    // Simulate upload progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 15) + 5;
      if (progress > 100) progress = 100;
      setUploadProgress(progress);
      
      if (progress === 100) {
        clearInterval(interval);
        setTimeout(() => {
          // Create new resource object
          const newResource = {
            id: `new-${Date.now()}`,
            title: uploadForm.title,
            description: uploadForm.description,
            type: uploadForm.type,
            subject: uploadForm.subject,
            author: uploadForm.author,
            fileUrl: URL.createObjectURL(selectedFile),
            created_at: new Date().toISOString(),
            status: 'pending',
            user_id: user?.id || '',
            course_code: uploadForm.course_code,
            semester: uploadForm.semester,
            view_count: 0,
            download_count: 0,
            likes: 0
          };
          
          setUploadStatus('success');
          
          // Send resource to parent component
          setTimeout(() => {
            onUploadComplete(newResource);
          }, 1500);
        }, 500);
      }
    }, 300);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* File Upload */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Upload File*
        </label>
        <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md cursor-pointer hover:bg-gray-50" onClick={() => fileInputRef.current?.click()}>
          <div className="space-y-1 text-center">
            {selectedFile ? (
              <div>
                <Check className="mx-auto h-12 w-12 text-green-500" />
                <p className="text-sm text-gray-600 truncate max-w-xs">{selectedFile.name}</p>
                <p className="text-xs text-gray-500">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="mt-1 text-sm text-red-600 hover:underline"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div>
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <p className="text-xs text-gray-500">
                  PDF, DOCX, PPTX, ZIP (Max. 50MB)
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  <span className="text-blue-600 hover:underline">Click to upload</span>
                  {" "}or drag and drop
                </p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileSelect}
              accept=".pdf,.doc,.docx,.ppt,.pptx,.zip"
            />
          </div>
        </div>
        {errorMessage && (
          <p className="mt-1 text-sm text-red-600">{errorMessage}</p>
        )}
      </div>
      
      {/* Resource Type */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Resource Type*
        </label>
        <select
          name="type"
          value={uploadForm.type}
          onChange={handleFormChange}
          className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          required
        >
          <option value="notes">Notes</option>
          <option value="ebook">E-Book</option>
          <option value="question">Question Paper</option>
        </select>
      </div>
      
      {/* Title */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Title*
        </label>
        <input
          type="text"
          name="title"
          value={uploadForm.title}
          onChange={handleFormChange}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          required
        />
      </div>
      
      {/* Two column layout */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-4">
        {/* Subject */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Subject*
          </label>
          <input
            type="text"
            name="subject"
            value={uploadForm.subject}
            onChange={handleFormChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            required
          />
        </div>
        
        {/* Author */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Author*
          </label>
          <input
            type="text"
            name="author"
            value={uploadForm.author}
            onChange={handleFormChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            required
          />
        </div>
        
        {/* Course Code */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Course Code*
          </label>
          <input
            type="text"
            name="course_code"
            value={uploadForm.course_code}
            onChange={handleFormChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            required
          />
        </div>
        
        {/* Semester */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Semester*
          </label>
          <select
            name="semester"
            value={uploadForm.semester}
            onChange={handleFormChange}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
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
      
      {/* Description */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          name="description"
          value={uploadForm.description}
          onChange={handleFormChange}
          rows={3}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          placeholder="Provide a brief description of this resource..."
        />
      </div>
      
      {/* Upload Progress */}
      {uploadStatus === 'uploading' && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-gray-700">Uploading...</span>
            <span className="text-sm font-medium text-gray-700">{uploadProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
          </div>
        </div>
      )}
      
      {/* Success Message */}
      {uploadStatus === 'success' && (
        <div className="mb-4 p-4 bg-green-50 border border-green-100 rounded flex items-start">
          <Check className="h-5 w-5 text-green-500 mt-0.5 mr-2" />
          <div>
            <h4 className="text-sm font-medium text-green-800">Upload successful!</h4>
            <p className="text-sm text-green-700 mt-1">Your resource has been submitted for review.</p>
          </div>
        </div>
      )}
      
      {/* Error Message */}
      {uploadStatus === 'error' && (
        <div className="mb-4 p-4 bg-red-50 border border-red-100 rounded flex items-start">
          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-2" />
          <div>
            <h4 className="text-sm font-medium text-red-800">Upload failed</h4>
            <p className="text-sm text-red-700 mt-1">Please try again later.</p>
          </div>
        </div>
      )}
      
      {/* Form Buttons */}
      <div className="mt-6 flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={uploadStatus === 'uploading' || uploadStatus === 'success'}
          className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
            uploadStatus === 'uploading' || uploadStatus === 'success' 
              ? 'bg-blue-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700'
          } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
        >
          {uploadStatus === 'uploading' ? (
            <span className="flex items-center">
              <Clock className="animate-spin -ml-1 mr-2 h-4 w-4" />
              Uploading...
            </span>
          ) : uploadStatus === 'success' ? (
            <span className="flex items-center">
              <Check className="-ml-1 mr-2 h-4 w-4" />
              Uploaded
            </span>
          ) : (
            'Upload Resource'
          )}
        </button>
      </div>
    </form>
  );
};

export default ResourceUploadForm;