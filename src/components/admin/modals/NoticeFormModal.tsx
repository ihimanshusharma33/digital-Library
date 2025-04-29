import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle } from 'lucide-react';
import { api } from '../../../utils/apiService';
import { Notice,Course } from '../../../types';

interface NoticeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  notice: Notice | null;
  onSave: (notice: Omit<Notice, 'id'>) => void;
  courses: Course[];
}

const NoticeFormModal: React.FC<NoticeFormModalProps> = ({ isOpen, onClose, notice, onSave }) => {
  const isEditing = !!notice;
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    is_active: true,
    publish_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });
  
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form with notice data when editing
  useEffect(() => {
    if (notice) {
      setFormData({
        title: notice.title || '',
        content: notice.content || '',
        is_active: notice.is_active ?? true,
        publish_date: notice.publish_date || new Date().toISOString().split('T')[0],
        end_date: notice.end_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });
    } else {
      // Reset form when adding new notice
      setFormData({
        title: '',
        content: '',
        is_active: true,
        publish_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });
    }
  }, [notice]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      setFormData({
        ...formData,
        [name]: checkbox.checked
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setNotification(null);
    
    try {
      // Validate form data
      if (!formData.title.trim()) {
        throw new Error('Title is required');
      }
      
      if (!formData.content.trim()) {
        throw new Error('Content is required');
      }
      
      // Validate dates
      const publishDate = new Date(formData.publish_date);
      const endDate = new Date(formData.end_date);
      
      if (isNaN(publishDate.getTime())) {
        throw new Error('Publish date is invalid');
      }
      
      if (isNaN(endDate.getTime())) {
        throw new Error('End date is invalid');
      }
      
      if (endDate < publishDate) {
        throw new Error('End date cannot be before publish date');
      }
      
      const noticeData = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        is_active: formData.is_active,
        publish_date: formData.publish_date,
        end_date: formData.end_date,
        course_code: notice?.course_code || '', 
        description: notice?.description || '', 
        date: notice?.date || new Date().toISOString()
      };
      
      let response;
      
      if (isEditing && notice) {
        // Update existing notice
        response = await api.updateNotice(notice.id, noticeData);
      } else {
        // Create new notice
        response = await api.createNotice(noticeData);
      }
      
      if (response && response.status) {
        setNotification({
          type: 'success',
          message: isEditing ? 'Notice updated successfully!' : 'Notice created successfully!'
        });
        
        setTimeout(() => {
          onSave(noticeData);
          onClose();
        }, 1500);
      } else {
        throw new Error(response?.message || 'Failed to save notice');
      }
    } catch (error) {
      console.error('Error saving notice:', error);
      setNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to save notice. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
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

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex justify-between items-center pb-4 border-b">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                {isEditing ? 'Edit Notice' : 'Add New Notice'}
              </h3>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {notification && (
              <div className={`mt-4 p-4 rounded-md ${notification.type === 'success' ? 'bg-green-50' : 'bg-red-50'}`}>
                <div className="flex">
                  {notification.type === 'success' ? (
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                  )}
                  <span className={`text-sm ${notification.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>
                    {notification.message}
                  </span>
                </div>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Title *
                </label>
                <input
                  type="text"
                  name="title"
                  id="title"
                  value={formData.title}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="content" className="block text-sm font-medium text-gray-700">
                  Content *
                </label>
                <textarea
                  name="content"
                  id="content"
                  rows={5}
                  value={formData.content}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="publish_date" className="block text-sm font-medium text-gray-700">
                    Publish Date
                  </label>
                  <input
                    type="date"
                    name="publish_date"
                    id="publish_date"
                    value={formData.publish_date}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                
                <div>
                  <label htmlFor="end_date" className="block text-sm font-medium text-gray-700">
                    End Date
                  </label>
                  <input
                    type="date"
                    name="end_date"
                    id="end_date"
                    value={formData.end_date}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="is_active"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                  disabled={isSubmitting}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
                  Active
                </label>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center"
                >
                  {isSubmitting && (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {isEditing ? 'Update Notice' : 'Add Notice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoticeFormModal;