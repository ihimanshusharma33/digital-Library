import React, { useState, useEffect } from 'react';
import { X, Loader } from 'lucide-react';
import { api } from '../../../utils/apiService';
import { StudentFormData, Course } from '../../../types';

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const AddStudentModal: React.FC<AddStudentModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<StudentFormData>({
    name: '',
    email: '',
    phone_number: '',
    department: '',
    university_roll_number: '',
    course_code: ''
  });

  // Fetch courses when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchCourses();
    }
  }, [isOpen]);

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
    
    // When course changes, auto-fill department if possible
    if (name === 'course_code') {
      const selectedCourse = courses.find(c => c.course_code === value);
      if (selectedCourse) {
        setFormData(prev => ({
          ...prev,
          [name]: value,
          department: selectedCourse.department
        }));
        return;
      }
    }
    
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Use the createStudent function from apiService instead of direct API call
      // If it doesn't exist, add it to apiService.ts
      const response = await api.createStudent(formData);
      if (response && response.status) {
        onSuccess?.();
        resetForm();
        onClose(); // Close modal after successful submission
      } else {
        setError(response?.message || 'Failed to add student. Please try again.');
      }
    } catch (error) {
      console.error('Error adding student:', error);
      setError('Failed to add student. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone_number: '',
      department: '',
      university_roll_number: '',
      course_code: ''
    });
    setError(null);
  };

  if (!isOpen) return null;

  // Filter active courses
  const activeCourses = courses.filter(course => course.is_active === true);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex justify-between items-center pb-4 mb-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">Add New Student</h3>
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="course_code" className="block text-sm font-medium text-gray-700">
                    Course Code *
                  </label>
                  {coursesLoading ? (
                    <div className="mt-1 h-12 w-full bg-gray-100 animate-pulse rounded-md"></div>
                  ) : (
                    <select
                      id="course_code"
                      name="course_code"
                      required
                      value={formData.course_code}
                      onChange={handleChange}
                      className="mt-1 block w-full h-12 p-2 border-2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      disabled={isSubmitting}
                    >
                      <option value="">Select a course</option>
                      {activeCourses.map(course => (
                        <option key={course.id} value={course.course_code}>
                          {course.course_name} ({course.course_code})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                
                <div>
                  <label htmlFor="department" className="block text-sm font-medium text-gray-700">
                    Department *
                  </label>
                  <input
                    type="text"
                    id="department"
                    name="department"
                    required
                    value={formData.department}
                    onChange={handleChange}
                    className="mt-1 block w-full h-12 p-2 border-2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    disabled={formData.course_code !== '' || isSubmitting}
                    placeholder="e.g. Computer Science"
                  />
                </div>
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddStudentModal;