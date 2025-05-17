import React, { useState, useEffect } from 'react';
import { X, Loader, CheckCircle, Copy, ClipboardCheck } from 'lucide-react';
import { api } from '../../../utils/apiService';
import { StudentFormData, Course } from '../../../types';

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

// Define a type for the successful response
interface StudentCreationResponse {
  status: boolean;
  message: string;
  data: {
    name: string;
    email: string;
    role: string;
    library_id: string;
    phone_number: string;
    department: string;
    university_roll_number: string;
    course_code: string;
    updated_at: string;
    created_at: string;
    id: number;
    [key: string]: any; // For any additional fields
  };
}

const AddStudentModal: React.FC<AddStudentModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successResponse, setSuccessResponse] = useState<StudentCreationResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState<StudentFormData>({
    name: '',
    email: '',
    phone_number: '',
    department: '',
    university_roll_number: 0,
    course_id: ''
  });

  // Fetch courses when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchCourses();
      setError(null);
      setSuccessResponse(null);
      setCopied(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (successResponse) {
      console.log("Success response changed:", successResponse);
      // This ensures successResponse is properly set before rendering
    }
  }, [successResponse]);

  const fetchCourses = async () => {
    try {
      setCoursesLoading(true);
      // Use the getCourses function from apiService instead of direct API call
      const response = await api.getCourses();
      if (response && response.status) {
        setCourses(response.data || []);
      } else {
        console.error('Failed to fetch courses:', response?.message);
      }
    } catch (err) {
      console.error('Error fetching courses:', err);
    } finally {
      setCoursesLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (isSubmitting) return false;
    setIsSubmitting(true);
    setError(null);

    try {
      // Only send course_id, not department
      const { department, ...submitData } = formData;
      const response: { status: boolean; message?: string; data?: any } = await api.post('/user', submitData);
      if (response && response?.status === true) {
        setSuccessResponse(response as StudentCreationResponse);
      } else {
        setError(response.message || 'Failed to add student. Please check details and try again.');
      }
    } catch (error: any) {
      if (error.response?.data) {
        setError(error.response.data.message || 'Failed to add student. Please check your input.');
      } else {
        setError('Network error. Please try again later.');
      }
    } finally {
      setIsSubmitting(false);
    }
    return false;
  };



  const handleCopyLibraryId = () => {
    if (successResponse?.data?.library_id) {
      navigator.clipboard.writeText(successResponse.data.library_id);
      setCopied(true);
      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    }
  };

  if (!isOpen) return null;

  // Filter active courses

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex justify-between items-center pb-4 mb-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">
                {successResponse ? 'Student Added Successfully' : 'Add New Student'}
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
                {error}
              </div>
            )}

            {successResponse ? (
              <div className="space-y-4">
                <div className="flex justify-center mb-4">
                  <div className="rounded-full bg-green-100 p-3">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                </div>

                <p className="text-center text-gray-700">{successResponse.message}</p>

                <div className="bg-blue-50 p-4 rounded-md my-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-blue-800">Library ID</p>
                      <p className="text-2xl font-bold text-blue-900">{successResponse.data.library_id}</p>
                    </div>
                    <button
                      onClick={handleCopyLibraryId}
                      className="p-2 bg-blue-100 rounded-full hover:bg-blue-200 transition-colors"
                      title="Copy Library ID"
                    >
                      {copied ? (
                        <ClipboardCheck className="h-5 w-5 text-green-600" />
                      ) : (
                        <Copy className="h-5 w-5 text-blue-700" />
                      )}
                    </button>
                  </div>
                  <p className="mt-2 text-sm text-blue-700">
                    This is the initial password for {successResponse.data.name}.
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-md space-y-3">
                  <h4 className="font-medium text-gray-700">Student Information</h4>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Name</p>
                      <p className="font-medium">{successResponse.data.name}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Email</p>
                      <p className="font-medium">{successResponse.data.email}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Roll Number</p>
                      <p className="font-medium">{successResponse.data.university_roll_number}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Department</p>
                      <p className="font-medium">{successResponse.data.department}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Course Code</p>
                      <p className="font-medium">{successResponse.data.course_code}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Phone Number</p>
                      <p className="font-medium">{successResponse.data.phone_number || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      // Only call onSuccess when the user explicitly acknowledges
                      if (onSuccess) onSuccess();
                      onClose();
                    }}
                    className="inline-flex justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    I have noted the Library ID
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="mt-1 block w-full h-12 p-2 border-2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    disabled={isSubmitting}
                    placeholder="Enter full name"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="mt-1 block w-full h-12 p-2 border-2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    disabled={isSubmitting}
                    placeholder="student@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="university_roll_number" className="block text-sm font-medium text-gray-700">
                    University Roll Number *
                  </label>
                  <input
                    type="text"
                    id="university_roll_number"
                    name="university_roll_number"
                    required
                    value={formData.university_roll_number}
                    onChange={handleChange}
                    className="mt-1 block w-full h-12 p-2 border-2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    disabled={isSubmitting}
                    placeholder="e.g. CS2023001"
                  />
                </div>

                <div>
                  <label htmlFor="course_id" className="block text-sm font-medium text-gray-700">
                    Course *
                  </label>
                  {coursesLoading ? (
                    <div className="mt-1 h-12 w-full bg-gray-100 animate-pulse rounded-md"></div>
                  ) : (
                    <select
                      id="course_id"
                      name="course_id"
                      required
                      value={formData.course_id}
                      onChange={handleChange}
                      className="mt-1 block w-full h-12 p-2 border-2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      disabled={isSubmitting}
                    >
                      <option value="">Select a course</option>
                      {courses.filter(course => course.is_active).map(course => (
                        <option key={course.course_id} value={course.course_id}>
                          {course.course_name} ({course.course_code})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone_number"
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleChange}
                    className="mt-1 block w-full h-12 p-2 rounded-md border-gray-300 border-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    disabled={isSubmitting}
                    placeholder="e.g. 1234567890"
                  />
                </div>
                <div className="mt-5 sm:mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    disabled={isSubmitting}
                  >
                    {isSubmitting && (
                      <Loader className="mr-2 h-4 w-4 animate-spin text-white" />
                    )}
                    {isSubmitting ? 'Adding...' : 'Add Student'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddStudentModal;