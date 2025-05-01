import React, { useState, useRef, useEffect } from 'react';
import { FileText, X, Check, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../utils/AuthContext';
import { api } from '../../utils/apiService';
import { Course } from '../../types';

interface ResourceUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}



const ResourceUploadModal: React.FC<ResourceUploadModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'ebook' | 'notes' | 'question'>('notes');
  const [subject, setSubject] = useState('');
  const [author, setAuthor] = useState(user?.name || '');
  const [courseCode, setCourseCode] = useState('');
  const [semester, setSemester] = useState<number>(1);
  const [file, setFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Define resetForm function before it's used in useEffect
  const resetForm = () => {
    setTitle('');
    setDescription('');
    setType('notes');
    setSubject('');
    setAuthor(user?.name || '');
    setCourseCode('');
    setSemester(1);
    setFile(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Fetch courses when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchCourses();
    }
  }, [isOpen]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      resetForm();
      setUploadStatus('idle');
      setErrorMessage('');
    }
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node) && isOpen) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const fetchCourses = async () => {
    try {
      setLoadingCourses(true);
      const response = await api.getCourses();
      if (response?.data) {
        setCourses(response.data);
      }
    } catch (err) {
      console.error('Error fetching courses:', err);
    } finally {
      setLoadingCourses(false);
    }
  };

  // Don't render if not open
  if (!isOpen) return null;

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const trackUploadProgress = (percentage: number) => {
    setUploadProgress(percentage);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setUploadStatus('error');
      setErrorMessage('Please enter a title for your resource');
      return;
    }

    if (!file) {
      setUploadStatus('error');
      setErrorMessage('Please select a file to upload');
      return;
    }

    // Validate form based on resource type
    if ((type === 'notes' || type === 'question') && !subject.trim()) {
      setUploadStatus('error');
      setErrorMessage(`Please enter a subject for this ${type === 'notes' ? 'note' : 'question paper'}`);
      return;
    }

    if (!courseCode) {
      setUploadStatus('error');
      setErrorMessage('Please select a course');
      return;
    }

    try {
      setUploading(true);
      setUploadStatus('idle');
      setErrorMessage('');
      
      // Prepare data object based on the API structure
      const data = {
        title,
        description,
        author,
        course_code: courseCode,
        semester,
        subject,
        user_id: user?.id || '',
      };
      
      let response;
      
      // Use different API methods based on resource type
      switch (type) {
        case 'ebook':
          response = await api.uploadEbook(data, file, trackUploadProgress);
          break;
        case 'notes':
          response = await api.uploadNotes(data, file, trackUploadProgress);
          break;
        case 'question':
          response = await api.uploadQuestionPaper(data, file, trackUploadProgress);
          break;
      }
      
      if (response?.status) {
        setUploadStatus('success');
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      } else {
        throw new Error('Upload failed');
      }
    } catch (err) {
      console.error("Error uploading resource:", err);
      setUploadStatus('error');
      setErrorMessage('Failed to upload resource. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>

        {/* Center modal */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        
        {/* Modal panel */}
        <div 
          ref={modalRef}
          className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full"
        >
          {/* Modal header */}
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                <div className="flex justify-between items-center pb-3">
                  <h3 className="text-lg leading-6 font-semibold text-gray-900" id="modal-title">
                    Upload New Resource
                  </h3>
                  <button 
                    type="button" 
                    onClick={onClose}
                    className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                  >
                    <span className="sr-only">Close</span>
                    <X className="h-6 w-6" />
                  </button>
                </div>
                
                {/* Upload status message */}
                {uploadStatus === 'success' && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-md flex items-start">
                    <Check className="h-5 w-5 mr-2 mt-0.5 text-green-500" />
                    <div>
                      <p className="font-medium">Resource uploaded successfully!</p>
                      <p className="text-sm">Your resource has been uploaded and will be reviewed shortly.</p>
                    </div>
                  </div>
                )}
                
                {uploadStatus === 'error' && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md flex items-start">
                    <AlertTriangle className="h-5 w-5 mr-2 mt-0.5 text-red-500" />
                    <div>
                      <p className="font-medium">Upload failed</p>
                      <p className="text-sm">{errorMessage}</p>
                    </div>
                  </div>
                )}

                {/* Form content */}
                <div className="mt-2">
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-5">
                      {/* Resource Type */}
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Resource Type *
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                          <button
                            type="button"
                            onClick={() => setType('notes')}
                            className={`flex items-center justify-center px-3 py-2 border ${
                              type === 'notes' 
                                ? 'bg-blue-50 border-blue-500 text-blue-700' 
                                : 'border-gray-300 text-gray-700'
                            } rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                          >
                            <FileText className={`h-4 w-4 mr-1.5 ${type === 'notes' ? 'text-blue-600' : 'text-gray-400'}`} />
                            Notes
                          </button>
                          <button
                            type="button"
                            onClick={() => setType('ebook')}
                            className={`flex items-center justify-center px-3 py-2 border ${
                              type === 'ebook' 
                                ? 'bg-blue-50 border-blue-500 text-blue-700' 
                                : 'border-gray-300 text-gray-700'
                            } rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                          >
                            <svg 
                              className={`h-4 w-4 mr-1.5 ${type === 'ebook' ? 'text-blue-600' : 'text-gray-400'}`}
                              fill="currentColor" 
                              viewBox="0 0 20 20"
                            >
                              <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                            </svg>
                            E-Book
                          </button>
                          <button
                            type="button"
                            onClick={() => setType('question')}
                            className={`flex items-center justify-center px-3 py-2 border ${
                              type === 'question' 
                                ? 'bg-blue-50 border-blue-500 text-blue-700' 
                                : 'border-gray-300 text-gray-700'
                            } rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                          >
                            <svg 
                              className={`h-4 w-4 mr-1.5 ${type === 'question' ? 'text-blue-600' : 'text-gray-400'}`}
                              fill="currentColor" 
                              viewBox="0 0 20 20"
                            >
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                            </svg>
                            Questions
                          </button>
                        </div>
                      </div>
                      
                      {/* Title */}
                      <div className="md:col-span-2">
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                          Title *
                        </label>
                        <input
                          type="text"
                          id="title"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          className="h-10 px-2 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                          placeholder="Enter a descriptive title"
                          required
                        />
                      </div>
                      
                      {/* Subject - show for notes and questions only */}
                      {(type === 'notes' || type === 'question') && (
                        <div>
                          <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                            Subject *
                          </label>
                          <input
                            type="text"
                            id="subject"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            className="h-10 px-2  focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                            placeholder="e.g. Mathematics, Physics"
                            required
                          />
                        </div>
                      )}
                      
                      {/* Author */}
                      <div className={type === 'question' ? 'md:col-span-2' : ''}>
                        <label htmlFor="author" className="block text-sm font-medium text-gray-700 mb-1">
                          Author
                        </label>
                        <input
                          type="text"
                          id="author"
                          value={author}
                          onChange={(e) => setAuthor(e.target.value)}
                          className="h-10 px-2  focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                          placeholder="Your name or original author"
                        />
                      </div>
                      
                      {/* Course Code */}
                      <div>
                        <label htmlFor="course-code" className="block text-sm font-medium text-gray-700 mb-1">
                          Course *
                        </label>
                        <select
                          id="course-code"
                          value={courseCode}
                          onChange={(e) => setCourseCode(e.target.value)}
                          className="h-10 px-2  focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                          required
                        >
                          <option value="">Select a course</option>
                          {loadingCourses ? (
                            <option disabled>Loading courses...</option>
                          ) : (
                            courses.length > 0 ? (
                              courses.map(course => (
                                <option key={course.id} value={course.course_code}>
                                  {course.course_name}-{course.course_code}
                                </option>
                              ))
                            ) : (
                              <>
                                <option value="BTECH-CSE-101">BTECH-CSE-101 - Computer Science</option>
                                <option value="BTECH-ME-103">BTECH-ME-103 - Mechanical Engineering</option>
                                <option value="BTECH-EE-102">BTECH-EE-102 - Electrical Engineering</option>
                              </>
                            )
                          )}
                        </select>
                      </div>
                      
                      {/* Semester */}
                      <div>
                        <label htmlFor="semester" className="block text-sm font-medium text-gray-700 mb-1">
                          Semester *
                        </label>
                        <select
                          id="semester"
                          value={semester}
                          onChange={(e) => setSemester(parseInt(e.target.value))}
                          className="h-10 px-2  focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                          required
                        >
                          {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                            <option key={num} value={num}>Semester {num}</option>
                          ))}
                        </select>
                      </div>
                      
                      {/* Description */}
                      <div className="md:col-span-2">
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <textarea
                          id="description"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          rows={3}
                          className="spx-2 hadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          placeholder="Provide a brief description of this resource"
                        ></textarea>
                      </div>
                      
                      {/* File Upload */}
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Upload File *
                        </label>
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                          <div className="space-y-1 text-center">
                            {!file ? (
                              <>
                                <svg
                                  className="mx-auto h-10 w-12 text-gray-400"
                                  stroke="currentColor"
                                  fill="none"
                                  viewBox="0 0 48 48"
                                  aria-hidden="true"
                                >
                                  <path
                                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                                    strokeWidth={2}
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                                <div className="flex text-sm text-gray-600 justify-center">
                                  <label
                                    htmlFor="file-upload"
                                    className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                                  >
                                    <span>Upload a file</span>
                                    <input
                                      id="file-upload"
                                      name="file-upload"
                                      type="file"
                                      ref={fileInputRef}
                                      onChange={handleFileChange}
                                      className="sr-only"
                                      accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.png,.jpg,.jpeg"
                                      required
                                    />
                                  </label>
                                  <p className="pl-1">or drag and drop</p>
                                </div>
                                <p className="text-xs text-gray-500">
                                  PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, PNG, JPG, JPEG up to 10MB
                                </p>
                              </>
                            ) : (
                              <div className="space-y-2">
                                <div className="flex items-center justify-center">
                                  <FileText className="h-8 w-8 text-blue-500" />
                                </div>
                                <div className="text-sm font-medium text-gray-900">{file.name}</div>
                                <div className="text-xs text-gray-500">{formatFileSize(file.size)}</div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFile(null);
                                    if (fileInputRef.current) {
                                      fileInputRef.current.value = '';
                                    }
                                  }}
                                  className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                  Replace file
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Upload Progress Bar (visible during upload) */}
                    {uploading && (
                      <div className="w-full mt-4">
                        <div className="text-xs font-medium text-gray-500 mb-1 flex justify-between">
                          <span>Uploading...</span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                            style={{ width: `${uploadProgress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                    
                    {/* Buttons */}
                    <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                      <button
                        type="submit"
                        disabled={uploading || uploadStatus === 'success'}
                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:col-start-2 sm:text-sm disabled:bg-blue-300 disabled:cursor-not-allowed"
                      >
                        {uploading ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Uploading...
                          </>
                        ) : uploadStatus === 'success' ? (
                          <>
                            <Check className="h-5 w-5 mr-2" />
                            Uploaded
                          </>
                        ) : (
                          'Upload Resource'
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={onClose}
                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourceUploadModal;