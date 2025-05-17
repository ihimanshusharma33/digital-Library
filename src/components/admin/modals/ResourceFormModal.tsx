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
    course_id: string;
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
    course_id: '',
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
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);


  // Initialize form data when resource or modal open state changes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: resource?.title || '',
        description: resource?.description || '',
        course_id: resource?.course_id || '0',
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
      setSuccess(null);
      setError(null);
      setVarOcg('idle');
    }
  }, [isOpen, resource, courses]);

  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [varOcg, setVarOcg] = useState<'idle' | 'saving' | 'error'>('idle');
 
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: name === 'semester' || name === 'year'
        ? parseInt(value, 10) 
        : value
    }));

    if (success) {
      setSuccess(null);
    }
    if (error) {
      setError(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files && e.target.files[0];
    if (selectedFile) {
      setFormData((prev) => ({
        ...prev,
        file: selectedFile, // Update the file in formData
      }));
      setFilePreview(URL.createObjectURL(selectedFile)); // Generate a preview URL
      console.log('Selected File:', selectedFile.name); // Debug log
    } else {
      setFormData((prev) => ({ ...prev, file: null }));
      setFilePreview(null);
      console.error('No file selected');
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const resourceType =
      formData.category === 'textbook'
        ? 'ebooks'
        : formData.category === 'notes'
        ? 'notes'
        : 'oldquestion';

    const data: Record<string, any> = {
      title: formData.title,
      description: formData.description,
      course_id: formData.course_id,
      semester: formData.semester.toString(),
      subject: formData.subject,
      author: formData.uploadedBy,
      year: formData.year.toString(),
    };

    if (resourceType === 'oldquestion') {
      data.exam_type = formData.exam_type;
    }

    console.log('Data being sent to backend:', data); // Debug log

    try {
      setVarOcg('saving');
      setSuccess(null);
      setError(null);

      let response;
      if (isEditing) {
        if (resourceType === 'ebooks') {
          response = await api.updateEbook(resource?.book_id || resource?.id || '', data, formData.file || undefined);
        } else if (resourceType === 'notes') {
          response = await api.updateNote(resource?.notes_id || resource?.id || '', data, formData.file || undefined);
        } else if (resourceType === 'oldquestion') {
          response = await api.updateQuestionPaper(resource?.paper_id || resource?.id || '', data, formData.file || undefined);
        }
      } else {
        if (resourceType === 'ebooks') {
          response = await api.uploadEbook(data, formData.file || undefined);
        } else if (resourceType === 'notes') {
          response = await api.uploadNotes(data, formData.file || undefined);
        } else if (resourceType === 'oldquestion') {
          response = await api.uploadQuestionPaper(data, formData.file || undefined);
        }
      }

      if (response?.status) {
        setSuccess(isEditing ? 'Resource updated successfully!' : 'Resource added successfully!');
        onSave(response.data as Omit<Resource, 'id'>);
      } else {
        throw new Error(response?.message || 'Failed to save resource');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save resource');
    } finally {
      setVarOcg('idle');
    }
  };


  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const removeSelectedFile = () => {
    setFormData((prev) => ({ ...prev, file: null }));
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div
          className="fixed inset-0 transition-opacity"
          aria-hidden="true"
        >
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
        {/* Modal content */}
        <div
          className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all my-8 sm:align-middle max-w-3xl w-full"
          onClick={e => e.stopPropagation()} 
        >
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex  w-full">
              <div className="mt-3  w-full ">
                <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                  {isEditing ? 'Edit Digital Resource' : 'Add New Digital Resource'}
                </h3>
                {success && (
                  <div className="mb-4 p-3 rounded bg-green-100 text-green-800 flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2" /> {success}
                  </div>
                )}
                {error && (
                  <div className="mb-4 p-3 rounded bg-red-100 text-red-800 flex items-center">
                    <AlertCircle className="w-5 h-5 mr-2" /> {error}
                  </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Title */}
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      required
                      disabled={varOcg === 'saving'}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter the resource title"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={3}
                      disabled={varOcg === 'saving'}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Provide a brief description of the resource"
                    />
                  </div>

                  {/* Course and Category */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Course */}
                    <div>
                      <label htmlFor="course_id" className="block text-sm font-medium text-gray-700">
                        Course <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="course_id"
                        name="course_id"
                        value={formData.course_id}
                        onChange={handleChange}
                        required
                        disabled={varOcg === 'saving'}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">No Course</option>
                        {courses.map((course) => (
                          <option key={course.course_id} value={course.course_id}>
                            {course.course_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Category */}
                    <div>
                      <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                        Category <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="category"
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        required
                        disabled={varOcg === 'saving'}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="textbook">E-Book</option>
                        <option value="notes">Notes</option>
                        <option value="questions">Questions</option>
                      </select>
                    </div>
                  </div>

                  {/* File Type and Semester */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* File Type */}
                    <div>
                      <label htmlFor="fileType" className="block text-sm font-medium text-gray-700">
                        File Type
                      </label>
                      <select
                        id="fileType"
                        name="fileType"
                        value={formData.fileType}
                        onChange={handleChange}
                        required
                        disabled={varOcg === 'saving'}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="pdf">PDF</option>
                        <option value="doc">DOC</option>
                        <option value="ppt">PPT</option>
                        <option value="xlsx">XLSX</option>
                        <option value="image">Image</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    {/* Semester */}
                    <div>
                      <label htmlFor="semester" className="block text-sm font-medium text-gray-700">
                        Semester
                      </label>
                      <select
                        id="semester"
                        name="semester"
                        value={formData.semester}
                        onChange={handleChange}
                        required
                        disabled={varOcg === 'saving'}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((semester) => (
                          <option key={semester} value={semester}>
                            Semester {semester}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Subject */}
                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
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
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Mathematics, Computer Science, Physics, etc."
                    />
                  </div>

                  {/* Author (for Textbook/Notes) */}
                  {(formData.category === 'textbook' || formData.category === 'notes') && (
                    <div>
                      <label htmlFor="uploadedBy" className="block text-sm font-medium text-gray-700">
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
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., John Doe, Jane Smith, etc."
                      />
                    </div>
                  )}

                  {/* Question Paper Details (for Questions) */}
                  {formData.category === 'questions' && (
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Question Paper Details</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Year */}
                        <div>
                          <label htmlFor="year" className="block text-sm font-medium text-gray-700">
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
                            required
                            disabled={varOcg === 'saving'}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>

                        {/* Exam Type */}
                        <div>
                          <label htmlFor="exam_type" className="block text-sm font-medium text-gray-700">
                            Exam Type
                          </label>
                          <select
                            id="exam_type"
                            name="exam_type"
                            value={formData.exam_type}
                            onChange={handleChange}
                            required
                            disabled={varOcg === 'saving'}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
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

                  {/* File Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Resource File</label>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      disabled={varOcg === 'saving'}
                      className="hidden"
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
                      <div
                        onClick={triggerFileInput}
                        className={`border-2 border-dashed border-gray-300 rounded-md p-6 flex flex-col items-center cursor-pointer hover:border-blue-500 transition-colors ${
                          varOcg === 'saving' ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        <Upload className="h-8 w-8 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500">Click to upload or drag and drop</p>
                        <p className="text-xs text-gray-400 mt-1">PDF, DOC, PPT, XLSX, images, etc. (Max 10MB)</p>
                      </div>
                    )}
                    {fileError && <p className="text-red-500 text-xs mt-1">{fileError}</p>}
                  </div>

                  {/* Buttons */}
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={()=>{onClose()}}
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
                      {varOcg === 'saving' ? 'Saving…' : isEditing ? 'Update' : 'Save'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourceFormModal;