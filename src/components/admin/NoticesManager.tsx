import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, 
  Search, 
  Bell, 
  Edit, 
  Trash2, 
  ChevronDown,
  ChevronUp,
  Calendar
} from 'lucide-react';
import { Notice, Course } from '../../types';
import { notices as mockNotices, courses } from '../../utils/mockData';

const NoticesManager: React.FC = () => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [filteredNotices, setFilteredNotices] = useState<Notice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentNotice, setCurrentNotice] = useState<Notice | null>(null);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Notice | null;
    direction: 'ascending' | 'descending';
  }>({ key: 'date', direction: 'descending' });
  
  // Filter states
  const [filterCourse, setFilterCourse] = useState<string | undefined>(undefined);
  const [filterSemester, setFilterSemester] = useState<number | undefined>(undefined);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setNotices(mockNotices);
      setFilteredNotices(mockNotices);
      setIsLoading(false);
    }, 500);
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
      result = result.filter(notice => notice.courseId === filterCourse);
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
    setCurrentNotice(notice);
    setIsModalOpen(true);
  };

  const handleDeleteNotice = (id: string) => {
    if (window.confirm('Are you sure you want to delete this notice?')) {
      const updatedNotices = notices.filter(notice => notice.id !== id);
      setNotices(updatedNotices);
    }
  };

  const handleSaveNotice = (noticeData: Omit<Notice, 'id'>) => {
    if (currentNotice) {
      // Update existing notice
      const updatedNotices = notices.map(notice => 
        notice.id === currentNotice.id 
          ? { ...notice, ...noticeData } 
          : notice
      );
      setNotices(updatedNotices);
    } else {
      // Add new notice
      const newNotice: Notice = {
        id: `${Date.now()}`,
        ...noticeData,
        date: new Date().toISOString()
      };
      setNotices([...notices, newNotice]);
    }
    setIsModalOpen(false);
  };

  // Helper function to get course name by ID
  const getCourseName = (courseId: string) => {
    return courses.find(course => course.id === courseId)?.name || 'Unknown Course';
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
                {courses.map(course => (
                  <option key={course.id} value={course.id}>
                    {course.name}
                  </option>
                ))}
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
                        {getCourseName(notice.courseId)}
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
  onSave: (data: Omit<Notice, 'id'>) => void;
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
  
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    courseId: string;
    semester?: number;
    attachment?: {
      name: string;
      url: string;
      type: string;
    };
  }>({
    title: notice?.title || '',
    description: notice?.description || '',
    courseId: notice?.courseId || courses[0]?.id || '',
    semester: notice?.semester,
    attachment: notice?.attachment
  });

  const [hasAttachment, setHasAttachment] = useState(!!notice?.attachment);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'semester') {
      const semesterValue = value ? parseInt(value, 10) : undefined;
      setFormData(prev => ({ ...prev, semester: semesterValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      attachment: {
        ...prev.attachment!,
        [field]: value
      }
    }));
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...formData, date: notice?.date || new Date().toISOString() });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" onClick={onClose}>
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
              {isEditing ? 'Edit Notice' : 'Add New Notice'}
            </h3>
            
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
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="courseId" className="block text-sm font-medium text-gray-700 mb-1">
                    Course
                  </label>
                  <select
                    id="courseId"
                    name="courseId"
                    value={formData.courseId}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    {courses.map(course => (
                      <option key={course.id} value={course.id}>
                        {course.name}
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
                  />
                  <label htmlFor="hasAttachment" className="ml-2 block text-sm text-gray-700">
                    Add Attachment
                  </label>
                </div>
              </div>
              
              {hasAttachment && (
                <div className="mb-4 p-4 bg-gray-50 rounded-md">
                  <div className="mb-3">
                    <label htmlFor="attachmentName" className="block text-sm font-medium text-gray-700 mb-1">
                      Attachment Name
                    </label>
                    <input
                      type="text"
                      id="attachmentName"
                      value={formData.attachment?.name || ''}
                      onChange={(e) => handleAttachmentChange(e, 'name')}
                      required={hasAttachment}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g. Schedule.pdf"
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="attachmentUrl" className="block text-sm font-medium text-gray-700 mb-1">
                      Attachment URL
                    </label>
                    <input
                      type="text"
                      id="attachmentUrl"
                      value={formData.attachment?.url || ''}
                      onChange={(e) => handleAttachmentChange(e, 'url')}
                      required={hasAttachment}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Link to the document"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="attachmentType" className="block text-sm font-medium text-gray-700 mb-1">
                      File Type
                    </label>
                    <select
                      id="attachmentType"
                      value={formData.attachment?.type || 'pdf'}
                      onChange={(e) => handleAttachmentChange(e, 'type')}
                      required={hasAttachment}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="pdf">PDF</option>
                      <option value="doc">DOC</option>
                      <option value="ppt">PPT</option>
                      <option value="xlsx">XLSX</option>
                      <option value="image">Image</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
              )}
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {isEditing ? 'Update' : 'Save'}
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