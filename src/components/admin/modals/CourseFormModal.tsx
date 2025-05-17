import React, { useState } from 'react';
import { X } from 'lucide-react';
import { api, API_ENDPOINTS } from '../../../utils/apiService';
import { ApiResponse, Course } from '../../../types';

interface CourseFormModalProps {
  isOpen: boolean;
  course: Course | null; // `null` for creating a new course
  onCreated: (course: Course) => void;
  onUpdated: (course: Course) => void;
  onError: (message: string) => void;
  onClose: () => void;
}

const CourseFormModal: React.FC<CourseFormModalProps> = ({
  isOpen,
  course,
  onCreated,
  onUpdated,
  onError,
  onClose,
}) => {
  const [formData, setFormData] = useState<Course>(
    course || {
      course_name: '',
      course_id: 0,
      course_code: '',
      description: '',
      department: '',
      total_semesters: 0,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'total_semesters' ? parseInt(value, 10) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (course) {
        // Update existing course
        const response = await api.put<ApiResponse>(`${API_ENDPOINTS.COURSES}/${course.course_id}`, formData);
        if (response && response.status) {
          onUpdated({ ...course, ...formData });
        } else {
          onError(response?.message || 'Failed to update course');
        }
      } else {
        // Create new course
        const response = await api.post<ApiResponse>(API_ENDPOINTS.COURSES, formData);
        if (response && response.status) {
          onCreated({ ...formData, ...(response.data as Partial<Course>) });
        } else {
          onError(response?.message || 'Failed to create course');
        }
      }
    } catch (error) {
      console.error('Error saving course:', error);
      onError('An error occurred while saving the course');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg max-w-lg w-full">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-medium text-gray-900">
            {course ? 'Edit Course' : 'Add Course'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 focus:outline-none"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="course_name" className="block text-sm font-medium text-gray-700">
              Course Name
            </label>
            <input
              type="text"
              id="course_name"
              name="course_name"
              value={formData.course_name}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label htmlFor="course_code" className="block text-sm font-medium text-gray-700">
              Course Code
            </label>
            <input
              type="text"
              id="course_code"
              name="course_code"
              value={formData.course_code}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
            />
          </div>
          <div>
            <label htmlFor="department" className="block text-sm font-medium text-gray-700">
              Department
            </label>
            <input
              type="text"
              id="department"
              name="department"
              value={formData.department}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label htmlFor="total_semesters" className="block text-sm font-medium text-gray-700">
              Total Semesters
            </label>
            <input
              type="number"
              id="total_semesters"
              name="total_semesters"
              value={formData.total_semesters}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              name="is_active"
              checked={formData.is_active}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, is_active: e.target.checked }))
              }
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
              Active
            </label>
          </div>

          {/* Modal Footer */}
          <div className="flex justify-end pt-4 space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CourseFormModal;