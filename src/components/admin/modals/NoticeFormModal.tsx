import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle } from 'lucide-react';
import { api } from '../../../utils/apiService';
import { Notice, Course } from '../../../types';
import { useAuth } from '../../../utils/AuthContext';

interface NoticeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  notice: Notice | null;
  onSave: (notice: Notice, action: 'add' | 'update') => void;
  courses: Course[];
}

const NoticeFormModal: React.FC<NoticeFormModalProps> = ({ isOpen, onClose, notice, onSave }) => {
  const isEditing = !!notice;
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    title: '',
    notification_type: 'general',
    description: '',
    user_id: '',
    attachment_url: '',
    attachment_name: '',
    attachment_type: 'pdf',
  });

  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setFormData({
      title: notice?.title || '',
      notification_type: notice?.notification_type || 'general',
      description: notice?.description || '',
      user_id: notice?.user_id ? String(notice.user_id) : user?.user_id ? String(user.user_id) : '',
      attachment_url: notice?.attachment_url || '',
      attachment_name: notice?.attachment_name || '',
      attachment_type: notice?.attachment_type || 'pdf',
    });
  }, [notice, user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setNotification(null);

    try {
      if (!formData.title.trim()) throw new Error('Title is required');
      if (!formData.notification_type.trim()) throw new Error('Notification type is required');

      const payload = {
        title: formData.title.trim(),
        notification_type: formData.notification_type,
        description: formData.description.trim(),
        user_id: formData.user_id,
        attachment_url: formData.attachment_url,
        attachment_name: formData.attachment_name,
        attachment_type: formData.attachment_type,
      };

      let response;
      if (isEditing && notice) {
        const noticeId = notice?.notification_id || notice?.notification_id || notice?.id;
        if (!noticeId) throw new Error('Notice ID is missing for update.');
        response = await api.updateNotice(noticeId, payload);
      } else {
        response = await api.createNotice(payload);
      }

      if (response && (response.status || response.success)) {
        setNotification({
          type: 'success',
          message: response.message || (isEditing ? 'Notice updated successfully!' : 'Notice created successfully!')
        });
        setTimeout(() => {
          if (response.data) {
            onSave(response.data, isEditing ? 'update' : 'add');
          }
          onClose();
          setNotification(null);
        }, 500);
      } else {
        setNotification({
          type: 'error',
          message: response?.message || 'Failed to save notice'
        });
      }
    } catch (error) {
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
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
          onClick={e => e.stopPropagation()}>
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
                <label htmlFor="notification_type" className="block text-sm font-medium text-gray-700">
                  Notification Type *
                </label>
                <select
                  name="notification_type"
                  id="notification_type"
                  value={formData.notification_type}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                  required
                >
                  <option value="general">General</option>
                  <option value="due_date">Due Date</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  name="description"
                  id="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="user_id" className="block text-sm font-medium text-gray-700">
                  User ID
                </label>
                <input
                  type="number"
                  name="user_id"
                  id="user_id"
                  value={formData.user_id}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                />
              </div>
              <div>
                <label htmlFor="attachment_url" className="block text-sm font-medium text-gray-700">
                  Attachment URL
                </label>
                <input
                  type="text"
                  name="attachment_url"
                  id="attachment_url"
                  value={formData.attachment_url}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                  placeholder="https://example.com/file.pdf"
                />
              </div>
              <div>
                <label htmlFor="attachment_name" className="block text-sm font-medium text-gray-700">
                  Attachment Name
                </label>
                <input
                  type="text"
                  name="attachment_name"
                  id="attachment_name"
                  value={formData.attachment_name}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                  placeholder="FileName.pdf"
                />
              </div>
              <div>
                <label htmlFor="attachment_type" className="block text-sm font-medium text-gray-700">
                  Attachment Type
                </label>
                <input
                  type="text"
                  name="attachment_type"
                  id="attachment_type"
                  value={formData.attachment_type}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                  placeholder="pdf, image, doc, etc."
                />
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