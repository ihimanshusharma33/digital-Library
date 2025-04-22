import React, { useState } from 'react';
import { Search, BookOpen, LayoutDashboard, User } from 'lucide-react';
import { courses, notices } from '../utils/mockData';
import { Course } from '../types';
import NoticeCard from './NoticeCard';
import { useAuth } from '../utils/AuthContext';
import { useNavigate } from 'react-router-dom';

interface CourseSelectionProps {
  courses: Course[];
  onCourseSelect: (course: Course) => void;
}

const CourseSelection: React.FC<CourseSelectionProps> = ({ onCourseSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const filteredCourses = courses.filter(course => 
    course.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    course.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get latest notices across all courses
  const latestNotices = notices
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);

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
                      <span className="font-semibold text-blue-800">{course.code.substring(0, 2)}</span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{course.name}</div>
                      <div className="text-sm text-gray-500">{course.code}</div>
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
        <div className="grid md:grid-cols-3 gap-8">
          {/* Course List */}
          <div className="md:col-span-2">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Courses</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {courses.map((course) => (
                <div 
                  key={course.id}
                  className="bg-white p-4 rounded-lg border hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => onCourseSelect(course)}
                >
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mr-4">
                      <span className="font-semibold text-blue-800">{course.code.substring(0, 2)}</span>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{course.name}</h3>
                      <p className="text-sm text-gray-500">{course.code}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notice Board */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Latest Notices</h2>
            <div className="space-y-4">
              {latestNotices.map(notice => (
                <NoticeCard key={notice.id} notice={notice} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseSelection;