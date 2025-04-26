import React, { useState, useEffect, useRef } from 'react';
import { 
  PlusCircle, 
  Search, 
  Bell, 
  Edit, 
  Trash2, 
  ChevronDown,
  ChevronUp,
  Calendar,
  Upload,
  FileText,
  X,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Notice, Course } from '../../types';
import { api, API_ENDPOINTS, ApiResponse, ResourceApiResponse } from '../../utils/apiService';
import { getApiBaseUrl } from '../../utils/config';

const NoticesManager: React.FC = () => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [filteredNotices, setFilteredNotices] = useState<Notice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentNotice, setCurrentNotice] = useState<Notice | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Notice | null;
    direction: 'ascending' | 'descending';
  }>({ key: 'date', direction: 'descending' });
  
  // Filter states
  const [filterCourse, setFilterCourse] = useState<string | undefined>(undefined);
  const [filterSemester, setFilterSemester] = useState<number | undefined>(undefined);
  const [courses, setCourses] = useState<Course[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setCoursesLoading(true);
        const response = await api.get<ResourceApiResponse<Course[]>>(API_ENDPOINTS.COURSES);
        const data = response.data;
        
        if (Array.isArray(data)) {
          const formattedCourses = data.map((course: Course) => ({
            ...course,
            name: course.course_name,
            code: course.course_code
          }));
          setCourses(formattedCourses);
        } else {
          console.error('Failed to fetch courses from API');
          setError('Failed to load courses. Please try again later.');
        }
      } catch (error) {
        console.error('Error fetching courses:', error);
        setError('Network error while loading courses. Please try again later.');
      } finally {
        setCoursesLoading(false);
      }
    };

    // Fetch notices from API
    const fetchNotices = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await api.get<ApiResponse<Notice[]>>(API_ENDPOINTS.NOTICES);
        const data = response.data;
        
        console.log('Notices API Response:', data); // Debug log
        
        if (Array.isArray(data)) {
          
          // Map API response to match our application's notice format
          const formattedNotices: Notice[] = data.map((notice: any): Notice => ({
            id: notice.id.toString(),
            title: notice.title || 'Untitled Notice',
            description: notice.description || '',
            date: notice.created_at || notice.date || new Date().toISOString(),
            course_code: notice.course_code || notice.course_id?.toString() || '',
            semester: notice.semester || undefined,
            attachment: notice.attachment_url ? {
              name: notice.attachment_name || 'Attachment',
              url: notice.attachment_url,
              type: notice.attachment_type || 'pdf'
            } : undefined,
            priority: notice.priority || 'medium',
            expiry_date: notice.expiry_date,
            created_by: notice.created_by || notice.author
          }));
          
          setNotices(formattedNotices);
          setFilteredNotices(formattedNotices);
          setError(null);
        } else {
          setNotices([]);
          setFilteredNotices([]);
          setError('Failed to load notices from server. Please check your API connection or try again later.');
        }
      } catch (error) {
        console.error('Error fetching notices:', error);
        // Empty the notices instead of falling back to mock data
        setNotices([]);
        setFilteredNotices([]);
        setError('Network error while loading notices. Please check your network connection and try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourses();
    fetchNotices();
  }, []);

  useEffect(() => {
    let result = [...notices];
    
    // Apply search filter
    if (searchTerm) {
      result = result.filter(
        notice => 
          notice.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          notice.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply course filter
    if (filterCourse) {
      result = result.filter(notice => notice.course_code === filterCourse);
    }
    
    // Apply semester filter
    if (filterSemester !== undefined) {
      result = result.filter(notice => notice.semester === filterSemester);
    }
    
    // Apply sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        if (sortConfig.key === 'date') {
          return sortConfig.direction === 'ascending'
            ? new Date(a.date).getTime() - new Date(b.date).getTime()
            : new Date(b.date).getTime() - new Date(a.date).getTime();
        }
        
        if ((a[sortConfig.key as keyof Notice] ?? '') < (b[sortConfig.key as keyof Notice] ?? '')) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if ((a[sortConfig.key as keyof Notice] ?? '') > (b[sortConfig.key as keyof Notice] ?? '')) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    
    setFilteredNotices(result);
  }, [notices, searchTerm, sortConfig, filterCourse, filterSemester]);

  const requestSort = (key: keyof Notice) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (columnName: keyof Notice) => {
    if (sortConfig.key !== columnName) {
      return <ChevronDown className="w-4 h-4 opacity-20" />;
    }
    return sortConfig.direction === 'ascending' ? 
      <ChevronUp className="w-4 h-4" /> : 
      <ChevronDown className="w-4 h-4" />;
  };

  const handleAddNotice = () => {
    setCurrentNotice(null);
    setIsModalOpen(true);
  };

  const handleEditNotice = (notice: Notice) => {
    // Only open the modal if courses have been loaded
    if (courses.length === 0) {
      alert('Please wait until courses are loaded');
      return;
    }
    setCurrentNotice(notice);
    setIsModalOpen(true);
  };

  const handleDeleteNotice = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this notice?')) {
      try {
        const response = await api.delete<ApiResponse<null>>(`${API_ENDPOINTS.NOTICES}/${id}`);
        
        const data = response.data;
        
        if (data.success) {
          // Update local state after successful deletion
          const updatedNotices = notices.filter(notice => notice.id !== id);
          setNotices(updatedNotices);
          setFilteredNotices(updatedNotices);
          
          // Replace alert with a styled notification
          setNotification({
            type: 'success',
            message: 'Notice deleted successfully'
          });
          
          // Clear notification after a few seconds
          setTimeout(() => {
            setNotification(null);
          }, 5000);
        } else {
          console.error('Failed to delete notice:', data.message);
          setNotification({
            type: 'error',
            message: `Failed to delete notice: ${data.message || 'Unknown error'}`
          });
        }
      } catch (error) {
        console.error('Error deleting notice:', error);
        setNotification({
          type: 'error',
          message: 'Network error while deleting notice. Please try again later.'
        });
      }
    }
  };

  const handleSaveNotice = async (noticeData: Omit<Notice, 'id'>) => {
    try {
      let response;
      let data;
      
      // Get the course code from the selected course
      const selectedCourse = courses.find(course => course.id.toString() === noticeData.course_code);
      
      // Create FormData object for multipart/form-data submission
      const formData = new FormData();
      
      // Add all JSON fields as form fields
      formData.append('title', noticeData.title);
      formData.append('description', noticeData.description);
      formData.append('user_id', '1'); // Using default user_id, you may need to get the actual user ID from your auth context
      formData.append('course_code', selectedCourse?.course_code || '');
      
      // Add optional fields only if they exist
      if (noticeData.semester) {
        formData.append('semester', noticeData.semester.toString());
      }
      formData.append('notification_type', 'general'); // Setting default notification type
      if (noticeData.expiry_date) {
        formData.append('expires_at', noticeData.expiry_date);
      }
      
      // Handle file attachment if present
      let hasAttachment = false;
      if (noticeData.attachment && noticeData.attachment.url) {
        // Check if the URL is a data URL (from file input)
        if (noticeData.attachment.url.startsWith('data:')) {
          // Convert data URL to File object
          const response = await fetch(noticeData.attachment.url);
          const blob = await response.blob();
          const file = new File([blob], noticeData.attachment.name, { type: blob.type });
          
          // Append file to FormData with field name 'attachment'
          formData.append('attachment', file);
          hasAttachment = true;
        } else if (currentNotice?.attachment?.url === noticeData.attachment.url) {
          // This is an existing attachment URL, not a new file upload
          formData.append('attachment_url', noticeData.attachment.url);
          formData.append('attachment_name', noticeData.attachment.name);
          formData.append('attachment_type', noticeData.attachment.type);
        }
      }

      console.log("Sending notice data to API as multipart/form-data");

      if (currentNotice) {
        // Update existing notice
        const endpoint = `${API_ENDPOINTS.NOTICES}/${currentNotice.id}`;
        
        // For updates with files, we may need to use a different approach than standard put
        if (hasAttachment) {
          // Some APIs require a _method field for method spoofing when dealing with files
          formData.append('_method', 'PUT');
          
          response = await fetch(`${getApiBaseUrl()}${endpoint}`, {
            method: 'POST', // Actually sending as POST but with _method=PUT
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}` // Include auth token if required
              // Note: Do NOT set Content-Type here, the browser will set it with the correct boundary
            },
            body: formData
          });
          
          data = await response.json();
        } else {
          // If no file, we can use the standard API put method with FormData
          response = await fetch(`${getApiBaseUrl()}${endpoint}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}` // Include auth token if required
            },
            body: formData
          });
          
          data = await response.json();
        }
        
        if (data.success || response.ok) {
          // Update local state after successful update
          const updatedNotices = notices.map(notice => 
            notice.id === currentNotice.id 
              ? { 
                  ...notice, 
                  ...noticeData,
                  // Keep the existing id and date
                  id: notice.id,
                  date: data.data?.updated_at || notice.date
                } 
              : notice
          );
          setNotices(updatedNotices);
          setFilteredNotices(updatedNotices);
          
          // Return success to the modal (instead of showing notification here)
          return { success: true, message: 'Notice updated successfully' };
        } else {
          console.error('Failed to update notice:', data.message);
          return { success: false, message: `Failed to update notice: ${data.message || 'Unknown error'}` };
        }
      } else {
        // Create new notice
        const endpoint = API_ENDPOINTS.NOTICES;
        
        response = await fetch(`${getApiBaseUrl()}${endpoint}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}` // Include auth token if required
            // Note: Do NOT set Content-Type header, the browser will set it with the correct boundary
          },
          body: formData
        });
        
        data = await response.json();
        
        if (data.success || response.ok) {
          // Create a new notice object with the response data
          const newNotice: Notice = {
            id: data.data?.id.toString() || Math.random().toString(),
            ...noticeData,
            date: data.data?.created_at || new Date().toISOString()
          };
          
          setNotices([...notices, newNotice]);
          setFilteredNotices([...notices, newNotice]);
          
          // Return success to the modal (instead of showing notification here)
          return { success: true, message: 'Notice created successfully' };
        } else {
          console.error('Failed to create notice:', data.message);
          return { success: false, message: `Failed to create notice: ${data.message || 'Unknown error'}` };
        }
      }
    } catch (error) {
      console.error('Error saving notice:', error);
      return { success: false, message: 'Network error while saving notice. Please try again later.' };
    }
  };

  // Helper function to get course name by I

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notices Management</h1>
          <p className="text-gray-600">Manage library notices and announcements</p>
        </div>
        
        <button 
          onClick={handleAddNotice}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          Add Notice
        </button>
      </div>
      
      {/* Filters and search */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search notices..."
              className="pl-10 pr-4 py-2 border rounded-lg w-full focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex flex-wrap gap-3">
            <div className="relative">
              <select
                value={filterCourse || ''}
                onChange={(e) => setFilterCourse(e.target.value || undefined)}
                className="appearance-none bg-white border rounded-lg px-4 py-2 pr-8 leading-tight focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Courses</option>
                {coursesLoading ? (
                  <option value="" disabled>Loading courses...</option>
                ) : (
                  courses.map(course => (
                    <option key={course.id} value={course.id}>
                      {course.code ? `${course.code} - ${course.name}` : course.name}
                    </option>
                  ))
                )}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
            
            <div className="relative">
              <select
                value={filterSemester !== undefined ? filterSemester.toString() : ''}
                onChange={(e) => setFilterSemester(e.target.value ? parseInt(e.target.value) : undefined)}
                className="appearance-none bg-white border rounded-lg px-4 py-2 pr-8 leading-tight focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Semesters</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map(semester => (
                  <option key={semester} value={semester}>{`Semester ${semester}`}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Notices Table */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline">{error}</span>
          <button 
            onClick={() => setError(null)} 
            className="absolute top-0 bottom-0 right-0 px-4 py-3"
          >
            <X className="w-4 h-4 text-red-500" />
          </button>
        </div>
      )}
      {notification && (
        <div className="mb-6 p-4 rounded-md flex items-center" style={{
          backgroundColor: notification.type === 'success' ? 'rgba(220, 252, 231, 1)' : 'rgba(254, 226, 226, 1)',
          border: `1px solid ${notification.type === 'success' ? 'rgba(134, 239, 172, 1)' : 'rgba(248, 113, 113, 1)'}`
        }}>
          <div className={`w-5 h-5 mr-3 ${notification.type === 'success' ? 'text-green-500' : 'text-red-500'}`}>
            {notification.type === 'success' ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            )}
          </div>
          <div className={`font-medium ${notification.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>
            {notification.message}
          </div>
          <button
            onClick={() => setNotification(null)}
            className="ml-auto text-gray-400 hover:text-gray-500" 
          >
            <span className="sr-only">Close</span>
            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Notice
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Course
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Semester
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => requestSort('date')}
                    >
                      <div className="flex items-center">
                        Date
                        {getSortIcon('date')}
                      </div>
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredNotices.map((notice) => (
                    <tr key={notice.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 flex-shrink-0 mr-3">
                            <div className="w-full h-full flex items-center justify-center rounded bg-yellow-100">
                              <Bell className="w-5 h-5 text-yellow-500" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {notice.title}
                            </p>
                            <p className="text-sm text-gray-500 truncate">
                              {notice.description.length > 60 
                                ? `${notice.description.substring(0, 60)}...` 
                                : notice.description}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {notice.course_code ? notice.course_code : 'no course code'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {notice.semester ? (
                          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                            Semester {notice.semester}
                          </span>
                        ) : (
                          <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                            All Semesters
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                          {formatDate(notice.date)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          onClick={() => handleEditNotice(notice)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteNotice(notice.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-gray-500 text-sm">
              {filteredNotices.length} notices found
            </div>
          </>
        )}
      </div>

      {/* Notice Modal */}
      {isModalOpen && (
        <NoticeFormModal
          notice={currentNotice}
          onSave={handleSaveNotice}
          onClose={() => setIsModalOpen(false)}
          courses={courses}
        />
      )}
    </div>
  );
};

// Notice Form Modal Component
interface NoticeFormModalProps {
  notice: Notice | null;
  onSave: (data: Omit<Notice, 'id'>) => Promise<{ success: boolean; message: string }>;
  onClose: () => void;
  courses: Course[];
}

const NoticeFormModal: React.FC<NoticeFormModalProps> = ({ 
  notice, 
  onSave, 
  onClose,
  courses
}) => {
  const isEditing = !!notice;
  
  if (courses.length === 0) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center">
          <div className="fixed inset-0 transition-opacity" onClick={onClose}>
            <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
          </div>

          <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
          <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:mt-0 sm:text-left">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">Loading</h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Waiting for courses to load...
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button 
                type="button" 
                onClick={onClose}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    course_code: string;
    semester?: number;
    attachment?: {
      name: string;
      url: string;
      type: string;
    };
  }>({
    title: notice?.title || '',
    description: notice?.description || '',
    course_code: notice?.course_code || (courses.length > 0 ? String(courses[0].id) : ''),
    semester: notice?.semester,
    attachment: notice?.attachment
  });
  
  const [hasAttachment, setHasAttachment] = useState(!!notice?.attachment);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [varOcg, setVarOcg] = useState<'idle' | 'saving' | 'error'>('idle');
  const [note, setNote] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'semester') {
      const semesterValue = value ? parseInt(value, 10) : undefined;
      setFormData(prev => ({ ...prev, semester: semesterValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Clear any notification when user makes changes
    if (note) {
      setNote(null);
    }
  };

  const handleToggleAttachment = () => {
    setHasAttachment(prev => !prev);
    if (!hasAttachment) {
      setFormData(prev => ({
        ...prev,
        attachment: {
          name: '',
          url: '',
          type: 'pdf'
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        attachment: undefined
      }));
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Get file type from the file extension
      const fileType = file.name.split('.').pop()?.toLowerCase() || 'pdf';
      
      console.log('File selected:', file);
      console.log('File type:', fileType);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        console.log('File read complete, data URL length:', result.length);
        
        // Set attachment data in the form
        setFormData(prev => ({
          ...prev,
          attachment: {
            name: file.name,
            url: result, // This will be a data URL (base64 encoded)
            type: fileType
          }
        }));
      };
      
      // Read file as data URL (base64 encoded)
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAttachment = () => {
    setFormData(prev => ({
      ...prev,
      attachment: undefined
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Creating a new object with the proper field names to match the Notice type
    const noticeData: Omit<Notice, 'id'> = {
      title: formData.title,
      description: formData.description,
      course_code: formData.course_code,
      semester: formData.semester,
      attachment: formData.attachment,
      date: notice?.date || new Date().toISOString()
    };
    
    setVarOcg('saving');
    
    try {
      const result = await onSave(noticeData);
      setVarOcg('idle');
      setNote({
        type: result.success ? 'success' : 'error',
        message: result.message
      });
      
      // Only close modal automatically on success after a short delay
      if (result.success) {
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } catch (error) {
      setVarOcg('error');
      setNote({
        type: 'error',
        message: error instanceof Error ? error.message : 'An error occurred while saving the notice'
      });
    }
  };

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
              {isEditing ? 'Edit Notice' : 'Add New Notice'}
            </h3>
            
            {note && (
              <div className={`mb-4 p-4 rounded-md flex items-center ${
                note.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                {note.type === 'success' ? (
                  <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 mr-2 text-red-500" />
                )}
                <span>{note.message}</span>
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
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  disabled={varOcg === 'saving'}
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
                  rows={5}
                  required
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  disabled={varOcg === 'saving'}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="course_code" className="block text-sm font-medium text-gray-700 mb-1">
                    Course
                  </label>
                  <select
                    id="course_code"
                    name="course_code"
                    value={formData.course_code}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    disabled={varOcg === 'saving'}
                  >
                    {courses.map(course => (
                      <option key={course.id} value={String(course.id)}>
                        {course.code ? `${course.code} - ${course.name}` : course.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="semester" className="block text-sm font-medium text-gray-700 mb-1">
                    Semester (Optional)
                  </label>
                  <select
                    id="semester"
                    name="semester"
                    value={formData.semester || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    disabled={varOcg === 'saving'}
                  >
                    <option value="">All Semesters</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                      <option key={num} value={num}>Semester {num}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="mb-4">
                <div className="flex items-center">
                  <input
                    id="hasAttachment"
                    type="checkbox"
                    checked={hasAttachment}
                    onChange={handleToggleAttachment}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    disabled={varOcg === 'saving'}
                  />
                  <label htmlFor="hasAttachment" className="ml-2 block text-sm text-gray-700">
                    Add Attachment
                  </label>
                </div>
              </div>
              
              {hasAttachment && (
                <div className="mb-4 p-4 bg-gray-50 rounded-md">
                  <div className="mb-3">
                    <label htmlFor="attachmentFile" className="block text-sm font-medium text-gray-700 mb-2">
                      Upload File
                    </label>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="file"
                        id="attachmentFile"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        className="hidden"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png"
                        disabled={varOcg === 'saving'}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        disabled={varOcg === 'saving'}
                      >
                        <Upload className="h-4 w-4 mr-2 inline" />
                        Browse Files
                      </button>
                      
                      <span className="text-xs text-gray-500">
                        (PDF, Word, Excel, PowerPoint, Images)
                      </span>
                    </div>
                    
                    {formData.attachment?.name ? (
                      <div className="mt-3 flex items-center p-3 bg-blue-50 rounded-md border border-blue-100">
                        <FileText className="h-5 w-5 text-blue-500 mr-2" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-blue-700 truncate">
                            {formData.attachment.name}
                          </p>
                          <p className="text-xs text-blue-500">
                            File selected
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveAttachment}
                          className="ml-2 bg-blue-100 text-blue-600 p-1 rounded-full hover:bg-blue-200"
                          disabled={varOcg === 'saving'}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="mt-2 text-sm text-gray-500">
                        No file selected. Supported formats: PDF, Word, Excel, PowerPoint, and image files.
                      </div>
                    )}
                  </div>
                </div>
              )}
              
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

export default NoticesManager;
