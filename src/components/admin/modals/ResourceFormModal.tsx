import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle
} from 'lucide-react';
import { Course, Resource } from '../../../types';
import { api } from '../../../utils/apiService';

interface ResourceFormModalProps {
  isOpen: boolean;
  resource: Resource | null;
  onSave: (data: Omit<Resource, 'id'>) => void;
  onClose: () => void;
  courses: Course[];
}

const ResourceFormModal: React.FC<ResourceFormModalProps> = ({ 
  isOpen,
  resource, 
  onSave,  
  onClose,
  courses
}) => {
  const isEditing = !!resource;
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form data for digital resources only
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    courseId: string;
    category: 'textbook' | 'notes' | 'questions';
    semester: number;
    file?: File | null;
    url: string;
    fileType: 'pdf' | 'doc' | 'ppt' | 'xlsx' | 'image' | 'other';
    uploadedBy: string;
    subject: string;
    year: number;
    exam_type: 'midterm' | 'final' | 'quiz' | 'assignment' | 'other';
  }>({
    title: '',
    description: '',
    courseId: '',
    category: 'textbook',
    url: '',
    semester: 1,
    file: null,
    fileType: 'pdf',
    uploadedBy: '',
    subject: '',
    year: new Date().getFullYear(),
    exam_type: 'midterm',
  });

  // Initialize form data when resource or modal open state changes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: resource?.title || '',
        description: resource?.description || '',
        courseId: resource?.courseId || courses[0]?.id?.toString() || '',
        category: (resource?.category as 'textbook' | 'notes' | 'questions') || 'textbook',
        url: resource?.url || '',
        semester: resource?.semester || 1,
        file: null,
        fileType: resource?.fileType || 'pdf',
        uploadedBy: resource?.uploadedBy || '',
        subject: resource?.subject || '',
        year: typeof resource?.year === 'string' ? parseInt(resource.year, 10) : resource?.year || new Date().getFullYear(),
        exam_type: (resource?.exam_type as any) || 'midterm',
      });
      setFilePreview(resource?.url || null);
      setNotification(null);
      setFileError(null);
      setVarOcg('idle');
    }
  }, [isOpen, resource, courses]);

  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [varOcg, setVarOcg] = useState<'idle' | 'saving' | 'error'>('idle');
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: name === 'semester' || name === 'year'
        ? parseInt(value, 10) 
        : value
    }));

    // Clear notification when user makes changes
    if (notification) {
      setNotification(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files && e.target.files[0];
    setFileError(null);
    
    if (selectedFile) {
      // Check file size (limit to 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setFileError('File size should not exceed 10MB');
        return;
      }
      
      // Automatically detect file type
      let detectedFileType: 'pdf' | 'doc' | 'ppt' | 'xlsx' | 'image' | 'other' = 'other';
      const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();
      
      if (fileExtension === 'pdf') detectedFileType = 'pdf';
      else if (['doc', 'docx'].includes(fileExtension || '')) detectedFileType = 'doc';
      else if (['ppt', 'pptx'].includes(fileExtension || '')) detectedFileType = 'ppt';
      else if (['xls', 'xlsx'].includes(fileExtension || '')) detectedFileType = 'xlsx';
      else if (['jpg', 'jpeg', 'png', 'gif'].includes(fileExtension || '')) detectedFileType = 'image';
      
      setFormData(prev => ({
        ...prev,
        fileType: detectedFileType,
        file: selectedFile
      }));
      
      // Create a preview URL for the file
      const previewUrl = URL.createObjectURL(selectedFile);
      setFilePreview(previewUrl);
    } else {
      setFormData(prev => ({ ...prev, file: null }));
      setFilePreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset notifications and errors before starting validation
    setNotification(null);
    setFileError(null);
    
    // ------ Form Validation Based on API Requirements ------
    const errors = [];
    
    // Common validation for all resource types
    if (!formData.title.trim()) {
      errors.push('Title is required');
    } else if (formData.title.length > 255) {
      errors.push('Title must be less than 255 characters');
    }
    
    if (!formData.courseId) {
      errors.push('Please select a course');
    }
    
    if (formData.semester < 1) {
      errors.push('Semester must be at least 1');
    }
    
    // Validate subject field which is required by all APIs
    if (!formData.subject.trim()) {
      errors.push('Subject is required');
    } else if (formData.subject.length > 255) {
      errors.push('Subject must be less than 255 characters');
    }
    
    // Resource type specific validation
    if (formData.category === 'notes') {
      if (!formData.uploadedBy.trim()) {
        errors.push('Author is required for notes');
      } else if (formData.uploadedBy.length > 255) {
        errors.push('Author name must be less than 255 characters');
      }
    } else if (formData.category === 'questions') {
      if (!formData.year) {
        errors.push('Year is required for question papers');
      } else if (formData.year < 1900 || formData.year > new Date().getFullYear()) {
        errors.push(`Year must be between 1900 and ${new Date().getFullYear()}`);
      }
      
      // Validate exam_type for question papers
      if (!['midterm', 'final', 'supplementary', 'other'].includes(formData.exam_type)) {
        errors.push('Please select a valid exam type');
      }
    } else if (formData.category === 'textbook') {
      // E-book specific validation
      if (!formData.uploadedBy.trim()) {
        errors.push('Author is required for e-books');
      } else if (formData.uploadedBy.length > 255) {
        errors.push('Author name must be less than 255 characters');
      }
    }
    
    // File validation for new resources
    if (!isEditing && !formData.file) {
      errors.push('Please upload a file for the resource');
    }
    
    // Display the first error if any
    if (errors.length > 0) {
      setNotification({
        type: 'error',
        message: errors[0]
      });
      return;
    }
    
    // Set the saving state to show loading animation
    setVarOcg('saving');
    
    try {
      // Get course code from selected course
      const selectedCourse = courses.find(course => course.id.toString() === formData.courseId);
      const course_code = selectedCourse?.course_code || '';
      
      if (!course_code) {
        throw new Error('Could not determine course code. Please select a valid course.');
      }
      
      // If a file is selected, handle the upload based on category
      if (formData.file) {
        try {
          // Different handling based on resource category
          if (formData.category === 'textbook') {
            // For e-books, use the dedicated ebooks API endpoint
            const ebookData = {
              title: formData.title.trim(),
              description: formData.description.trim(),
              author: formData.uploadedBy.trim(),
              course_code: course_code,
              semester: formData.semester,
              subject: formData.subject.trim(),
              is_verified: true
            };
            
            // Use the ebooks API endpoint for e-books
            const response = await api.uploadEbook(ebookData, formData.file);
            
            if (response && (response.success === true || response.status)) {
              setVarOcg('idle');
              setNotification({
                type: 'success',
                message: `${isEditing ? 'Updated' : 'Added'} e-book successfully!`
              });
              
              setTimeout(() => {
                // Create a Resource object from the backend response and the form data
                const frontendResource: Omit<Resource, 'id'> = {
                  title: formData.title.trim(),
                  description: formData.description.trim(),
                  courseId: formData.courseId,
                  category: formData.category,
                  semester: formData.semester,
                  uploadDate: new Date().toISOString(),
                  uploadedBy: formData.uploadedBy.trim(),
                  fileType: formData.fileType,
                  url: (response.data as { file_path: string })?.file_path || '',
                  subject: formData.subject,
                  course_code: course_code // Ensure course_code is included
                };
                
                onSave(frontendResource);
                // Don't close the modal immediately on success, let the user see the success message
                setTimeout(() => onClose(), 1500);
              }, 500);
            } else {
              throw new Error(response?.message || 'Failed to save e-book. Server returned an error.');
            }
          } else if (formData.category === 'notes') {
            // For notes, use the notes API endpoint
            const notesData = {
              title: formData.title.trim(),
              description: formData.description.trim(),
              author: formData.uploadedBy.trim(),
              course_code: course_code,
              semester: formData.semester,
              subject: formData.subject.trim()
            };

            // Use the notes API endpoint
            const response = await api.uploadNotes(notesData, formData.file);
            
            if (response && (response.success === true || response.status)) {
              setVarOcg('idle');
              setNotification({
                type: 'success',
                message: `${isEditing ? 'Updated' : 'Added'} notes successfully!`
              });
              
              setTimeout(() => {
                const frontendResource: Omit<Resource, 'id'> = {
                  title: formData.title.trim(),
                  description: formData.description.trim(),
                  courseId: formData.courseId,
                  category: formData.category,
                  semester: formData.semester,
                  uploadDate: new Date().toISOString(),
                  uploadedBy: formData.uploadedBy.trim(),
                  fileType: formData.fileType,
                  url: (response.data as { file_path: string })?.file_path || '',
                  subject: formData.subject,
                  course_code: course_code // Ensure course_code is included
                };
                
                onSave(frontendResource);
                // Don't close the modal immediately on success, let the user see the success message
                setTimeout(() => onClose(), 1500);
              }, 500);
            } else {
              throw new Error(response?.message || 'Failed to save notes. Server returned an error.');
            }
          } else if (formData.category === 'questions') {
            // For question papers, use the oldquestion API endpoint
            const questionData = {
              title: formData.title.trim(),
              description: formData.description.trim(),
              author: formData.uploadedBy.trim(),
              course_code: course_code,
              semester: formData.semester,
              subject: formData.subject.trim(),
              exam_type: formData.exam_type, // Include exam_type in the API request
              year: formData.year.toString()
            };

            // Use the question papers API endpoint
            const response = await api.uploadQuestionPaper(questionData, formData.file);
            
            if (response && (response.success === true || response.status )) {
              setVarOcg('idle');
              setNotification({
                type: 'success',
                message: `${isEditing ? 'Updated' : 'Added'} question paper successfully!`
              });
              
              setTimeout(() => {
                const frontendResource: Omit<Resource, 'id'> = {
                  title: formData.title.trim(),
                  description: formData.description.trim(),
                  courseId: formData.courseId,
                  category: formData.category,
                  semester: formData.semester,
                  uploadDate: new Date().toISOString(),
                  uploadedBy: formData.uploadedBy.trim(),
                  fileType: formData.fileType,
                  url: (response.data as { file_path: string })?.file_path || '',
                  subject: formData.subject,
                  exam_type: formData.exam_type, // Include in the frontend resource as well
                  year: formData.year.toString(),
                  course_code: course_code // Ensure course_code is included
                };
                
                onSave(frontendResource);
                // Don't close the modal immediately on success, let the user see the success message
                setTimeout(() => onClose(), 1500);
              }, 500);
            } else {
              throw new Error(response?.message || 'Failed to save question paper. Server returned an error.');
            }
          }
        } catch (uploadError) {
          setVarOcg('error');
          throw new Error(uploadError instanceof Error ? uploadError.message : 'Failed to upload resource. Please try again.');
        }
      } else if (isEditing) {
        // Handle update logic for editing with or without new file upload
        try {
          const resourceData = {
            title: formData.title.trim(),
            description: formData.description.trim(),
            author: formData.uploadedBy.trim(),
            course_code: course_code,
            semester: formData.semester,
            subject: formData.subject.trim()
          };

          // Add category-specific fields
          if (formData.category === 'questions') {
            Object.assign(resourceData, {
              exam_type: formData.exam_type,
              year: formData.year.toString()
            });
          }

          // Get the resource ID
          const resourceId = resource?.id;
          let response;

          if (!resourceId) {
            throw new Error('Resource ID is missing for update operation');
          }

          // Call different API endpoints based on resource type
          switch (formData.category) {
            case 'textbook':
              response = await api.updateEbook(resourceId, resourceData, formData.file || undefined);
              break;
            case 'notes':
              response = await api.updateNote(resourceId, resourceData, formData.file || undefined);
              break;
            case 'questions':
              response = await api.updateQuestionPaper(resourceId, resourceData, formData.file || undefined);
              break;
            default:
              throw new Error('Unknown resource type');
          }
          
          if (response && (response.success === true || response.status)) {
            setVarOcg('idle');
            setNotification({
              type: 'success',
              message: `Updated resource successfully!`
            });
            
            setTimeout(() => {
              // Create resource object using updated data
              const frontendResource: Omit<Resource, 'id'> = {
                title: formData.title.trim(),
                description: formData.description.trim(),
                courseId: formData.courseId,
                category: formData.category,
                semester: formData.semester,
                uploadDate: new Date().toISOString(),
                uploadedBy: formData.uploadedBy.trim(),
                fileType: formData.fileType,
                url: formData.file ? (response.data as { file_path: string })?.file_path || '' : resource?.url || '',
                subject: formData.subject,
                course_code: course_code,
                year: formData.category === 'questions' ? formData.year.toString() : undefined,
                exam_type: formData.category === 'questions' ? formData.exam_type : undefined
              };
              
              onSave(frontendResource);
              // Don't close the modal immediately on success, let the user see the success message
              setTimeout(() => onClose(), 1500);
            }, 500);
          } else {
            throw new Error(response?.message || 'Failed to update resource');
          }
        } catch (error) {
          setVarOcg('error');
          console.error('Error updating resource:', error);
          setNotification({
            type: 'error',
            message: error instanceof Error ? error.message : 'Failed to update resource. Please try again.'
          });
        }
      }
    } catch (error) {
      setVarOcg('error');
      console.error('Error saving resource:', error);
      setNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to save resource. Please try again.'
      });
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const removeSelectedFile = () => {
    setFormData(prev => ({ ...prev, file: null }));
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" onClick={onClose}>
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
              {isEditing ? 'Edit Digital Resource' : 'Add New Digital Resource'}
            </h3>
            
            {notification && (
              <div className={`mb-4 p-4 rounded-md ${notification.type === 'success' ? 'bg-green-50' : 'bg-red-50'}`}>
                <div className="flex items-center">
                  {notification.type === 'success' ? (
                    <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 mr-2 text-red-500" />
                  )}
                  <div className={`ml-1 text-sm font-medium ${notification.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>
                    {notification.message}
                  </div>
                </div>
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  disabled={varOcg === 'saving'}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  disabled={varOcg === 'saving'}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="courseId" className="block text-sm font-medium text-gray-700 mb-1">
                    Course
                  </label>
                  <select
                    id="courseId"
                    name="courseId"
                    value={formData.courseId}
                    onChange={handleChange}
                    required
                    disabled={varOcg === 'saving'}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    {courses && courses.length > 0 ? (
                      courses.map(course => (
                        <option key={course.id} value={course.id}>
                          {course.course_code}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>No courses available</option>
                    )}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                    disabled={varOcg === 'saving'}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="textbook">E-Book</option>
                    <option value="notes">Notes</option>
                    <option value="questions">Questions</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="fileType" className="block text-sm font-medium text-gray-700 mb-1">
                    File Type
                  </label>
                  <select
                    id="fileType"
                    name="fileType"
                    value={formData.fileType}
                    onChange={handleChange}
                    required
                    disabled={varOcg === 'saving'}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="pdf">PDF</option>
                    <option value="doc">DOC</option>
                    <option value="ppt">PPT</option>
                    <option value="xlsx">XLSX</option>
                    <option value="image">Image</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="semester" className="block text-sm font-medium text-gray-700 mb-1">
                    Semester
                  </label>
                  <select
                    id="semester"
                    name="semester"
                    value={formData.semester}
                    onChange={handleChange}
                    required
                    disabled={varOcg === 'saving'}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((semester) => (
                      <option key={semester} value={semester}>
                        Semester {semester}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="mb-4">
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                  Subject <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  disabled={varOcg === 'saving'}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Mathematics, Computer Science, Physics, etc."
                />
              </div>
              
              {(formData.category === 'textbook' || formData.category === 'notes') && (
                <div className="mb-4">
                  <label htmlFor="uploadedBy" className="block text-sm font-medium text-gray-700 mb-1">
                    Author <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="uploadedBy"
                    name="uploadedBy"
                    value={formData.uploadedBy}
                    onChange={handleChange}
                    required
                    disabled={varOcg === 'saving'}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., John Doe, Jane Smith, etc."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.category === 'textbook' ? 'Author of the e-book' : 'Author/creator of the notes'}
                  </p>
                </div>
              )}
              
              {formData.category === 'questions' && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Question Paper Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">
                        Year
                      </label>
                      <input
                        type="number"
                        id="year"
                        name="year"
                        min="1990"
                        max={new Date().getFullYear()}
                        value={formData.year}
                        onChange={handleChange}
                        disabled={varOcg === 'saving'}
                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="exam_type" className="block text-sm font-medium text-gray-700 mb-1">
                        Exam Type
                      </label>
                      <select
                        id="exam_type"
                        name="exam_type"
                        value={formData.exam_type}
                        onChange={handleChange}
                        disabled={varOcg === 'saving'}
                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="midterm">Midterm</option>
                        <option value="final">Final</option>
                        <option value="quiz">Quiz</option>
                        <option value="assignment">Assignment</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Resource File
                </label>
                
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={varOcg === 'saving'}
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.xlsx,.xls,.jpg,.jpeg,.png,.gif"
                />
                
                {filePreview || formData.url ? (
                  <div className="border rounded-md p-3 mb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <FileText className="h-6 w-6 text-blue-500 mr-2" />
                        <span className="text-sm truncate max-w-[200px]">
                          {formData.file?.name || (formData.url && 'Current file')}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={removeSelectedFile}
                        disabled={varOcg === 'saving'}
                        className="text-red-600 hover:text-red-800 text-sm ml-2"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div 
                      onClick={triggerFileInput}
                      className={`border-2 border-dashed border-gray-300 rounded-md p-6 flex flex-col items-center cursor-pointer hover:border-blue-500 transition-colors ${varOcg === 'saving' ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <Upload className="h-8 w-8 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        PDF, DOC, PPT, XLSX, images, etc. (Max 10MB)
                      </p>
                    </div>
                    {fileError && (
                      <p className="text-red-500 text-xs mt-1">{fileError}</p>
                    )}
                  </>
                )}
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={varOcg === 'saving'}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={varOcg === 'saving'}
                  className="flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {varOcg === 'saving' && (
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-t-2 border-white" />
                  )}
                  {varOcg === 'saving'
                    ? 'Saving…'
                    : isEditing
                    ? 'Update'
                    : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourceFormModal;