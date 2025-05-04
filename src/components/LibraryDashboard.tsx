import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Course, Notice } from '../types';
import { Search, BookOpen, Bell, ExternalLink, LogOut, User, Menu } from 'lucide-react';
import { api, API_ENDPOINTS } from '../utils/apiService';
import { getApiBaseUrl } from '../utils/config';
import { useAuth } from '../utils/AuthContext';
import { ResourceApiResponse } from '../types';
import SemesterSelection from './SemesterSelection';
import Footer from './Layout/Footer';

const LibraryDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  
  // Add a state for mobile menu
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Rest of your state variables...
  const [courses, setCourses] = useState<Course[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showsemester, setShowSemester] = useState(false);
  const [noticesLoading, setNoticesLoading] = useState(true);
  const [noticesError, setNoticesError] = useState<string | null>(null);
  const [currentCourse, setCurrentCourse] = useState<Course | null>(null);
  const [allNotices, setAllNotices] = useState<Notice[]>([]); // Store all notices
  const [visibleNotices, setVisibleNotices] = useState<Notice[]>([]); // Store notices to display
  const [showingAllNotices, setShowingAllNotices] = useState(false); // Track if showing all notices

  // Fetch courses list on component mount
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${getApiBaseUrl()}${API_ENDPOINTS.COURSES}`);
        const data = await response.json();

        if (data && data.data) {
          const courseList = data.data.map((course: any) => ({
            id: course.id.toString(),
            course_name: course.course_name || course.name,
            course_code: course.course_code || course.code,
            department: course.department,
            total_semesters: course.total_semesters || 8,
            description: course.description,
            is_active: course.is_active,
            created_at: course.created_at,
            updated_at: course.updated_at,
          }));
          setCourses(courseList);
        } else {
          setCourses([]);
          setError('No courses available');
        }
      } catch (err) {
        console.error('Error fetching courses:', err);
        setError('Failed to load courses. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  // Fetch notices on component mount
  useEffect(() => {
    const fetchNotices = async () => {
      try {
        setNoticesLoading(true);
        const response = await api.get<ResourceApiResponse<Notice[]>>(API_ENDPOINTS.NOTICES);
        const notices: Notice[] = response.data;
        setNoticesError(null);
        
        if (notices && notices.length > 0) {
          setAllNotices(notices); // Store all notices
          setVisibleNotices(notices.slice(0, 5)); // Initially display only 5
        } else {
          setAllNotices([]);
          setVisibleNotices([]);
          setNoticesError('No notices available');
        }
      } catch (err) {
        console.error('Error fetching notices:', err);
        setNoticesError('Failed to load notices. Please try again later.');
      } finally {
        setNoticesLoading(false);
      }
    };
    fetchNotices();
  }, []);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Filter courses based on search
  const filteredCourses = courses.filter(
    course =>
      course.course_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.course_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (course.department && course.department.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Handle course selection
  const handleCourseSelect = (course: Course) => {
    setCurrentCourse(course);
    setShowSemester(true);
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/'); // Redirect to home after logout
  };

  // Add a handler for "View All Notices" button
  const handleViewAllNotices = () => {
    if (showingAllNotices) {
      // If already showing all, go back to showing only 5
      setVisibleNotices(allNotices.slice(0, 5));
      setShowingAllNotices(false);
    } else {
      // Show all notices
      setVisibleNotices(allNotices);
      setShowingAllNotices(true);
    }
  };

  if (showsemester && currentCourse) {
    console.log('currentCourse', currentCourse);
    return (
      <SemesterSelection
        course={currentCourse as Course}
        onBack={() => setShowSemester(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Header Navigation - Will work on all screen sizes */}
      <header className="bg-white shadow-sm fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo/Home link */}
            <div className="flex items-center">
              <img
                src="https://res.cloudinary.com/dcliahekv/image/upload/v1745924858/logo_f6ikuk.png" 
                alt="Logo" 
                className="h-10 w-10 cursor-pointer"
                onClick={() => navigate('/')}
              />
              <span className="ml-2 mx-auto text-lg font-semibold text-gray-900">IGU Library</span>
            </div>

            {/* Desktop navigation */}
            <div className="hidden md:flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  <button
                    onClick={() => {
                      if (user) {
                        user.role === 'admin' ? navigate('/admin') : navigate('/student');
                      }
                    }}
                    className="px-4 py-2 bg-orange-500 hover:bg-orange-400 text-white rounded-md"
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex items-center text-gray-600 hover:text-gray-900"
                  >
                    <LogOut className="h-5 w-5 mr-1" />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => navigate('/signin')}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md"
                >
                  Login
                </button>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-md text-gray-600 hover:text-gray-900 focus:outline-none"
              >
                <Menu className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu, show/hide based on menu state */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 py-2 px-4">
            {isAuthenticated ? (
              <div className="space-y-2">
                <button
                  onClick={() => {
                    if (user) {
                      user.role === 'admin' ? navigate('/admin') : navigate('/student');
                    }
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 bg-orange-500 hover:bg-orange-400 text-white rounded-md"
                >
                  Dashboard
                </button>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="flex w-full items-center px-4 py-2 text-gray-600 hover:text-gray-900"
                >
                  <LogOut className="h-5 w-5 mr-1" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  navigate('/signin');
                  setMobileMenuOpen(false);
                }}
                className="w-fit text-left px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md"
              >
                Login
              </button>
            )}
          </div>
        )}
      </header>

      {/* Add padding-top to account for fixed header */}
      <div className="pt-16">
        {/* Hero Section */}
        <div className="bg-blue-700 h-[50vh] lg:h-[55h] text-white relative overflow-hidden">
          <div
            className="absolute h-[50vh] lg:h-[100%] inset-0 bg-cover bg-center z-0"
            style={{
              backgroundImage: "url('https://res.cloudinary.com/dcliahekv/image/upload/v1745924828/bg_j20yug.png')",
            }}
          >
            <div className="absolute inset-0 bg-gray-600 bg-opacity-50"></div>
          </div>

          <div className="max-w-7xl mx-auto px-4 py-16 relative z-10">
            <div className='flex justify-center'>
              <div className='mt-[5rem]'>
                <h1 className="text-4xl text-center ml-4 md:text-5xl font-bold">Welcome to IGU Digital Library</h1>
                <div className='hidden lg:block sm:block'>
                  <img src='https://himachal365.s3.ap-south-1.amazonaws.com/73/Igu-New-Logo-website-1.png' className='w-full' />
                </div>

                <div className="mt-8 max-w-xl mx-auto">
                  <div className="relative">
                    <input
                      type="text"
                      className="w-full px-4 py-3 pl-10 border-0 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 text-gray-900"
                      placeholder="Search courses by name, code or department..."
                      value={searchTerm}
                      onChange={handleSearchChange}
                    />
                    <Search className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Rest of your content */}
        <div className="max-w-7xl mx-auto px-4 py-12">
          {/* Your existing course listing and notice board code */}
          <div className="lg:grid lg:grid-cols-3 lg:gap-8">
            {/* Courses section */}
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <BookOpen className="mr-2 h-6 w-6 text-blue-600" />
                Available Courses
              </h2>

              {loading ? (
                <div className="flex justify-center items-center h-[22vh]  py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : error ? (
                <div className="bg-red-50 p-4 rounded-md text-center text-red-700">
                  <p>{error}</p>
                </div>
              ) : (
                <div className="min-h-[60vh] grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {filteredCourses.length > 0 ? (
                    filteredCourses.map((course) => (
                      <div
                        key={course.id}
                        className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => { handleCourseSelect(course) }}
                      >
                        <h3 className="font-medium text-lg text-gray-900 mb-2">{course.course_name}</h3>
                        <p className="text-sm text-gray-500 mb-4">{course.course_code}</p>
                        <div className="flex flex-wrap gap-2">
                          {course.department && (
                            <span className="text-xs bg-blue-50 text-blue-600 py-1 px-2 rounded">
                              {course.department}
                            </span>
                          )}
                          <span className="text-xs bg-gray-100 text-gray-600 py-1 px-2 rounded">
                            {course.total_semesters} semesters
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full bg-gray-50 p-8 rounded-lg text-center">
                      <p className="text-gray-500">
                        {searchTerm ? 'No courses match your search' : 'No courses available'}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Notices section */}
            <div className="mt-8 lg:mt-0">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <Bell className="mr-2 h-6 w-6 text-blue-600" />
                Notice Board
              </h2>

              <div className="bg-white rounded-lg shadow-sm">
                {noticesLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                ) : noticesError ? (
                  <div className="p-4 text-center text-red-600">
                    <p>{noticesError}</p>
                  </div>
                ) : visibleNotices.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <p>No notices available</p>
                  </div>
                ) : (
                  <div>
                    {visibleNotices.map((notice, index) => (
                      <div
                        key={notice.id}
                        className={`p-4 ${index !== visibleNotices.length - 1 ? 'border-b border-gray-100' : ''}`}
                      >
                        <div className="flex justify-between items-start">
                          <h3 className="font-medium text-gray-900">{notice.title}</h3>
                          <span className="text-xs text-gray-500 mt-1 whitespace-nowrap ml-2">
                            {notice.created_at ? new Date(notice.created_at).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>

                        <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                          {notice.content}
                        </p>

                        <div className="mt-3">
                          <button
                            className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center"
                            onClick={(e) => {
                              e.stopPropagation();
                              alert(`${notice.title}\n\n${notice.content}`);
                            }}
                          >
                            Read More <ExternalLink className="ml-1 h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {allNotices.length > 5 && (
                      <div className="p-4 bg-gray-50 text-center border-t border-gray-100">
                        <button
                          className="text-sm font-medium text-blue-600 hover:text-blue-800"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewAllNotices();
                          }}
                        >
                          {showingAllNotices ? 'Show Less' : 'View All Notices'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default LibraryDashboard;