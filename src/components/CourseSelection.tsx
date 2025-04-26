import React, { useState, useEffect } from 'react';
import { Search, BookOpen, LayoutDashboard, User, ChevronRight } from 'lucide-react';
import { Notice, Course } from '../types';
import NoticeCard from './NoticeCard';
import { useAuth } from '../utils/AuthContext';
import { useNavigate } from 'react-router-dom';
import { api, API_ENDPOINTS } from '../utils/apiService';
import { getApiBaseUrl } from '../utils/config';

interface CourseSelectionProps {
  courses?: Course[];
  onCourseSelect: (course: Course) => void;
}

interface User {
  name: string;
  email: string;
  role?: string; // Add the role property
}

const CourseSelection: React.FC<CourseSelectionProps> = ({ onCourseSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated, user } = useAuth() as { isAuthenticated: boolean; user: User | null };
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [noticesLoading, setNoticesLoading] = useState(true);
  const [noticesError, setNoticesError] = useState<string | null>(null);
  const [showAllNotices, setShowAllNotices] = useState(false);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${getApiBaseUrl()}${API_ENDPOINTS.COURSES}`);
        const data = await response.json();
        
        // Debug logs to understand the response structure
        console.log('API Response:', data);
        console.log('Response type:', typeof data);
        console.log('Has status property:', 'status' in data);
        console.log('Has data property:', 'data' in data);
        
        // Check if data has the expected structure
        if (data && (data.status || data.data || Array.isArray(data))) {
          let coursesData = [];
          
          if (Array.isArray(data)) {
            // If response is directly an array
            coursesData = data;
            console.log('Processing direct array response');
          } else if (Array.isArray(data.data)) {
            // If response is an object with data property as array
            coursesData = data.data;
            console.log('Processing data.data array response');
          }
          
          if (coursesData.length > 0) {
            console.log('Sample course object:', coursesData[0]);
            
            // Map API response to match our application's course format
            // Check if course objects have the expected properties
            const mappedCourses: Course[] = coursesData.map((course: any): Course => {
              const mappedCourse: Course = {
                id: course.id || Math.random().toString(),
                course_name: course.course_name || course.name || 'Unknown Course',
                course_code: course.course_code || course.code || 'N/A',
                department: course.department || 'Department',
                total_semesters: course.total_semesters || 0,
                description: course.description || 'No description available',
                is_active: course.is_active ?? true,
                created_at: course.created_at || new Date().toISOString(),
                updated_at: course.updated_at || new Date().toISOString(),
              };
              return mappedCourse;
            });

            console.log('Mapped courses:', mappedCourses);
            setCourses(mappedCourses);
          } else {
            console.log('No courses found in response');
            setError('No courses found');
          }
        } else {
          console.error('Unexpected API response structure:', data);
          setError('Failed to load courses: Unexpected API response format');
        }
      } catch (err) {
        console.error('Error fetching courses:', err);
        setError('Failed to load courses. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
    
    // Fetch notices from API
    const fetchNotices = async () => {
      try {
        setNoticesLoading(true);
        // Use the API endpoint for notices with proper API_BASE_URL
        const response = await fetch(`${getApiBaseUrl()}${API_ENDPOINTS.NOTICES}`);
        const data = await response.json();
        // More flexible condition checking
        if ((data.status == 200 || data.status === true || data.success === true) && Array.isArray(data.data)) {
          console.log('Processing notices data:', data.data);
          const formattedNotices = data.data.map((notice: any) => ({
            id: notice.id.toString(),
            title: notice.title,
            description: notice.description,
            date: notice.created_at,
            courseId: notice.course_code || '',
            semester: notice.semester,
            attachment: notice.attachment_url ? {
              name: notice.attachment_name || 'Attachment',
              url: notice.attachment_url,
              type: notice.attachment_type || 'pdf'
            } : undefined
          }));
          console.log('Formatted notices:', formattedNotices);
          setNotices(formattedNotices);
          setNoticesError(null);
        } else if (Array.isArray(data)) {
          // Handle case where API directly returns an array
          console.log('Processing direct array response for notices');
          const formattedNotices = data.map((notice: any) => ({
            id: notice.id.toString(),
            title: notice.title,
            description: notice.description,
            date: notice.created_at || notice.date || new Date().toISOString(),
            courseId: notice.course_code || notice.courseId || '',
            semester: notice.semester,
            attachment: notice.attachment_url ? {
              name: notice.attachment_name || 'Attachment',
              url: notice.attachment_url,
              type: notice.attachment_type || 'pdf'
            } : notice.attachment
          }));
          console.log('Formatted notices from array:', formattedNotices);
          setNotices(formattedNotices);
          setNoticesError(null);
        } else {
          console.error('Failed to parse notices from API:', data);
          setNotices([]);
          setNoticesError('Failed to load notices');
        }
      } catch (error) {
        console.error('Error fetching notices:', error);
        setNoticesError('Error loading notices. Please try again later.');
      } finally {
        setNoticesLoading(false);
      }
    };

    fetchNotices();
  }, []);

  const filteredCourses = courses.filter(course => 
    course.course_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    course.course_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get latest notices across all courses
  const sortedNotices = notices
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  // If showAllNotices is false, show only 4 notices, otherwise show all
  const displayedNotices = showAllNotices ? sortedNotices : sortedNotices.slice(0, 4);

  const handleDashboardClick = () => {
    if (isAuthenticated && user?.role === 'admin') {
      navigate('/admin');
    } else {
      navigate('/signin');
    }
  };

  const handleStudentDashboardClick = () => {
    if (isAuthenticated) {
      navigate('/student');
    } else {
      navigate('/signin');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden h-[60vh]">
        {/* Background Image */}
        <div 
          className="absolute h-[60vh] inset-0 bg-cover bg-center z-0" 
          style={{ 
            backgroundImage: "url('https://images.unsplash.com/photo-1521587760476-6c12a4b040da?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')",
          }}
        >
          <div className="absolute inset-0 bg-blue-600 bg-opacity-20"></div>
        </div>

        {/* Dashboard Buttons */}
        <div className="absolute top-4 right-4 z-20 flex space-x-3">
          {/* Student Dashboard Button */}
          <button 
            onClick={handleStudentDashboardClick}
            className="flex items-center px-4 py-2 bg-white bg-opacity-90 hover:bg-opacity-100 text-blue-700 rounded-lg shadow-md transition-all"
          >
            <User className="w-5 h-5 mr-2" />
            <span>{isAuthenticated ? 'Student Dashboard' : 'Student Login'}</span>
          </button>
          
          {/* Admin Dashboard Button */}
          <button 
            onClick={handleDashboardClick}
            className="flex items-center px-4 py-2 bg-white bg-opacity-90 hover:bg-opacity-100 text-blue-700 rounded-lg shadow-md transition-all"
          >
            <LayoutDashboard className="w-5 h-5 mr-2" />
            <span>{isAuthenticated && user?.role === 'admin' ? 'Admin Dashboard' : 'Admin Login'}</span>
          </button>
        </div>
        
        {/* Hero Content */}
        <div className="relative z-10 max-w-4xl mx-auto px-4 py-20 text-center">
          <div className="flex justify-center mb-6">
            <BookOpen className="w-12 h-12 text-yellow-300" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4 tracking-wide">Digital Library</h1>
          <p className="text-xl text-yellow-100 mb-8">
            Access course materials, textbooks, and resources all in one place
          </p>
          
          <div className="relative max-w-xl mx-auto bg-white bg-opacity-15 p-2 rounded-lg backdrop-blur-sm border border-white border-opacity-20">
            <div 
              className="flex items-center p-3 rounded-lg bg-white shadow-md"
              onClick={() => setIsOpen(!isOpen)}
            >
              <Search className="w-5 h-5 text-blue-600 mr-3" />
              <input
                type="text"
                placeholder="Search for your course..."
                className="flex-1 border-none focus:ring-0 outline-none text-gray-800 placeholder-gray-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            
            {(isOpen || searchTerm) && filteredCourses.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-white rounded-lg shadow-lg border">
                {filteredCourses.map((course) => (
                  <div 
                    key={course.id}
                    className="p-3 hover:bg-gray-50 cursor-pointer flex items-center"
                    onClick={() => {
                      onCourseSelect(course);
                      setIsOpen(false);
                      setSearchTerm('');
                    }}
                  >
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center mr-3">
                      <span className="font-semibold text-blue-800">{course.course_code.substring(0, 2)}</span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{course.course_name}</div>
                      <div className="text-sm text-gray-500">{course.course_code}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {searchTerm && filteredCourses.length === 0 && (
              <div className="absolute z-10 mt-1 w-full bg-white rounded-lg shadow-lg border p-4 text-center">
                <p className="text-gray-500">No courses found matching "{searchTerm}"</p>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* hero section end */}

      <div className="max-w-6xl mx-auto px-4 py-12">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 p-4 rounded-md text-center text-red-700">
            <p>{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-2 px-4 py-2 bg-red-100 hover:bg-red-200 rounded-md text-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Course Cards */}
            <div className="md:col-span-2">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Courses</h2>
              <div className="grid gap-6">
                {filteredCourses.map(course => (
                  <div 
                    key={course.id} 
                    onClick={() => onCourseSelect(course)}
                    className="bg-white rounded-lg border shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{course.course_name}</h3>
                        <p className="text-sm text-gray-500 mt-1">{course.course_code}</p>
                        <p className="text-xs text-gray-400">{course.department} • {course.total_semesters} Semesters</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Notice Board */}
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Latest Notices</h2>
              </div>
              
              {noticesLoading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : noticesError ? (
                <div className="bg-red-50 p-4 rounded-md text-center text-red-700">
                  <p>{noticesError}</p>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {displayedNotices.length > 0 ? (
                      displayedNotices.map(notice => (
                        <NoticeCard key={notice.id} notice={notice} />
                      ))
                    ) : (
                      <div className="text-center py-8 bg-gray-50 rounded-lg border">
                        <p className="text-gray-500">No notices available</p>
                      </div>
                    )}
                  </div>
                  
                  {sortedNotices.length > 4 && (
                    <button
                      onClick={() => setShowAllNotices(!showAllNotices)}
                      className="mt-4 w-full py-2 px-4 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-blue-600 hover:bg-gray-50 flex items-center justify-center"
                    >
                      {showAllNotices ? 'Show Less' : `View All Notices (${sortedNotices.length})`}
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseSelection;