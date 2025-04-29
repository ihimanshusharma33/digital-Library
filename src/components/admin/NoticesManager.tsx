import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, 
  Search, 
  Bell, 
  Edit, 
  Trash2, 
  ChevronDown,
  ChevronUp,
  Calendar,
  X
} from 'lucide-react';
import { Notice, Course, ResourceApiResponse,ApiResponse } from '../../types';
import { api, API_ENDPOINTS ,} from '../../utils/apiService';
import NoticeFormModal from './modals/NoticeFormModal';

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

          const formattedNotices: Notice[] = data.map((notice: any): Notice => ({
            id: String(notice.id),
            title: notice.title || 'Untitled Notice',
            description: notice.description || '',
            date: notice.created_at || notice.date || new Date().toISOString(),
            course_code: notice.course_code || notice.course_id?.toString() || '',
            semester: notice.semester ?? undefined,
            attachment: notice.attachment_url ? {
              name: notice.attachment_name || 'Attachment',
              url: notice.attachment_url,
              type: notice.attachment_type || 'pdf',
            } : undefined,
            priority: notice.priority || 'medium',
            expiry_date: notice.expiry_date,
            created_by: notice.created_by || notice.author,
            is_active: notice.is_active ?? true, // Default true if not provided
            publish_date: notice.publish_date || new Date().toISOString(), // Default to current date
            end_date: notice.end_date || null, // Default to null if not provided
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
        if (response.success) {
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
          console.error('Failed to delete notice:', response.message);
          setNotification({
            type: 'error',
            message: `Failed to delete notice: ${response.message || 'Unknown error'}`
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
      // Get the course code from the selected course
      const selectedCourse = courses.find(course => course.id.toString() === noticeData.course_code);
      const formData = new FormData();
      formData.append('title', noticeData.title);
      formData.append('description', noticeData.description);
      formData.append('user_id', '1');
      formData.append('course_code', selectedCourse?.course_code || '');
      if (noticeData.semester) {
        formData.append('semester', noticeData.semester.toString());
      }
      formData.append('notification_type', 'general'); 
      if (noticeData.expiry_date) {
        formData.append('expires_at', noticeData.expiry_date);
      }
      if (noticeData.attachment && noticeData.attachment.url) {
        // Check if the URL is a data URL (from file input)
        if (noticeData.attachment.url.startsWith('data:')) {
          // Convert data URL to File object
          const response = await fetch(noticeData.attachment.url);
          const blob = await response.blob();
          const file = new File([blob], noticeData.attachment.name, { type: blob.type });
          formData.append('attachment', file);
        } else if (currentNotice?.attachment?.url === noticeData.attachment.url) {
          // This is an existing attachment URL, not a new file upload
          formData.append('attachment_url', noticeData.attachment.url);
          formData.append('attachment_name', noticeData.attachment.name);
          formData.append('attachment_type', noticeData.attachment.type);
        }
      }

      console.log("Sending notice data to API as multipart/form-data");
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
          isOpen={isModalOpen}
        />
      )}
    </div>
  );
};



export default NoticesManager;
