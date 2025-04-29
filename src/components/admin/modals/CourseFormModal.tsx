import React, { useState, useEffect } from 'react';
import { X, Loader } from 'lucide-react';
import { api } from '../../../utils/apiService';
import { Course } from '../../../types';

interface CourseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onSave: (data: Omit<Course, 'id'>) => Promise<{ ok: boolean; message: string }>;
  course?: Course | null; // Pass course for edit mode, null for create mode
}

const CourseFormModal: React.FC<CourseFormModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess,
  course 
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    course_name: '',
    course_code: '',
    description: '',
    total_semesters: 8,
    department: '',
    is_active: true
  });

  // Load course data when editing
  useEffect(() => {
    if (course) {
      setFormData({
        course_name: course.course_name,
        course_code: course.course_code,
        description: course.description || '',
        total_semesters: course.total_semesters,
        department: course.department,
        is_active: course.is_active
      });
    } else {
      // Reset form when adding a new course
      setFormData({
        course_name: '',
        course_code: '',
        description: '',
        total_semesters: 8,
        department: '',
        is_active: true
      });
    }
  }, [course]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (name === 'total_semesters') {
      setFormData(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      let response;
      
      if (course) {
        // Update existing course
        response = await api.updateCourse(course.id, formData);
      } else {
        // Create new course
        response = await api.createCourse(formData);
      }

      if (response.data && response.status) {
        onSuccess?.();
        onClose();
      } else {
        setError(response.message || 'Failed to save course. Please try again.');
      }
    } catch (error) {
      console.error('Error saving course:', error);
      setError('Failed to save course. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex justify-between items-center pb-4 mb-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">
                {course ? 'Edit Course' : 'Add New Course'}
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

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="course_name" className="block text-sm font-medium text-gray-700">
                  Course Name *
                </label>
                <input
                  type="text"
                  id="course_name"
                  name="course_name"
                  required
                  value={formData.course_name}
                  onChange={handleChange}
                  className="mt-1 block w-full h-12 p-2 border-2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  disabled={isSubmitting}
                  placeholder="e.g. Bachelor of Computer Science"
                />
              </div>

              <div>
                <label htmlFor="course_code" className="block text-sm font-medium text-gray-700">
                  Course Code *
                </label>
                <input
                  type="text"
                  id="course_code"
                  name="course_code"
                  required
                  value={formData.course_code}
                  onChange={handleChange}
                  className="mt-1 block w-full h-12 p-2 border-2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  disabled={isSubmitting || !!course} // Disable editing course code if updating
                  placeholder="e.g. CS101"
                />
                {course && (
                  <p className="mt-1 text-xs text-gray-500">
                    Course codes cannot be changed after creation.
                  </p>
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
                  disabled={isSubmitting}
                  placeholder="e.g. Computer Science"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleChange}
                  className="mt-1 block w-full p-2 border-2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  disabled={isSubmitting}
                  placeholder="Enter course description"
                />
              </div>

              <div>
                <label htmlFor="total_semesters" className="block text-sm font-medium text-gray-700">
                  Total Semesters *
                </label>
                <input
                  type="number"
                  id="total_semesters"
                  name="total_semesters"
                  required
                  min={1}
                  max={12}
                  value={formData.total_semesters}
                  onChange={handleChange}
                  className="mt-1 block w-full h-12 p-2 border-2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  disabled={isSubmitting}
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  disabled={isSubmitting}
                />
                <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
                  Course is active
                </label>
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
                  {isSubmitting ? 'Saving...' : course ? 'Update Course' : 'Add Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseFormModal;