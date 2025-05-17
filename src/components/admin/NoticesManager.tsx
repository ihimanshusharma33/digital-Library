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
import { Notice, Course, ApiResponse } from '../../types';
import { api, API_ENDPOINTS, } from '../../utils/apiService';
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
  

    // Fetch notices from API
    const fetchNotices = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await api.get<ApiResponse<Notice[]>>(API_ENDPOINTS.NOTICES);
        const data = response.data;

        console.log('Notices API Response:', data);

        if (Array.isArray(data)) {

          const formattedNotices: Notice[] = data.map((notice: any): Notice => ({
            notification_id: String(notice.notification_id),
            title: notice.title || 'Untitled Notice',
            description: notice.description || '',
            date: notice.created_at || notice.date || new Date().toISOString(),
            attachment_name: notice.attachment_name || 'Attachment',
            attachment_url: notice.attachment_url,
            attachment_type: notice.attachment_type || 'pdf',
            user_id: notice.user_id || 'Unknown User',
            notification_type: notice.notification_type || 'general',
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
    setCurrentNotice(notice);
    setIsModalOpen(true);
  };

  const handleDeleteNotice = async (notification_id: string) => {
    try {
      console.log('Deleting notice with ID:', notification_id);
      const response = await api.deleteNotice(`${notification_id}`);
      if (response.status) {
        // Update local state after successful deletion
        const updatedNotices = notices.filter(notice => notice.notification_id !== notification_id);
        setNotices(updatedNotices);
        setFilteredNotices(updatedNotices);

        setNotification({
          type: 'success',
          message: 'Notice deleted successfully'
        });

        setTimeout(() => {
          setNotification(null);
        }, 3000);
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
  };

  const handleSaveNotice = async (noticeData: Notice, action: 'add' | 'update') => {
    try {
      let response;
      if (action === 'add') {
        response = await api.createNotice(noticeData);
        if (response && (response.status || response.success)) {
          const newNotice = response.data;
          if (newNotice) {
            setNotices(prev => [newNotice, ...prev]);
          }
          if (newNotice) {
            setFilteredNotices(prev => [newNotice, ...prev]);
          }
          setNotification({ type: 'success', message: response.message || 'Notice added successfully' });
        } else {
          setNotification({ type: 'error', message: response?.message || 'Failed to add notice' });
        }
      } else if (action === 'update') {
        const noticeId = noticeData.notification_id || noticeData.notification_id;
        response = await api.updateNotice(noticeId, noticeData);
        if (response && (response.status || response.success)) {
          const updatedNotice = response.data;
          if (updatedNotice) {
            setNotices(prev => prev.map(n => (n.notification_id === updatedNotice.notification_id) ? updatedNotice : n));
            setFilteredNotices(prev => prev.map(n => (n.notification_id === updatedNotice.notification_id) ? updatedNotice : n));
          }
          setNotification({ type: 'success', message: response.message || 'Notice updated successfully' });
        } else {
          setNotification({ type: 'error', message: response?.message || 'Failed to update notice' });
        }
      }
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      setNotification({ type: 'error', message: 'Network error. Please try again.' });
    }
  };


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
      {
          notification && (
            <div className={`mt-4 p-4 rounded-md text-sm ${notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {notification.message}
            </div>
          )
        }

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
                    <option key={course.course_id} value={course.course_id}>
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
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredNotices.map((notice) => (
                    <tr key={notice.notification_id} className="hover:bg-gray-50">
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
                          onClick={() => handleDeleteNotice(notice.notification_id)}
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
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          notice={currentNotice}
          onSave={(notice, action) => {
            if (action === 'add') {
              setNotices(prev => [notice, ...prev]);
              setFilteredNotices(prev => [notice, ...prev]);
            } else if (action === 'update') {
              setNotices(prev => prev.map(n => (n.notification_id === notice.notification_id) ? notice : n));
              setFilteredNotices(prev => prev.map(n => (n.notification_id === notice.notification_id) ? notice : n));
            }
          }}
          courses={courses}
        />
      )}
    </div>
  );
};



export default NoticesManager;
