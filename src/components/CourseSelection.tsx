import React, { useState, useEffect } from 'react';
import { Course } from '../types';
import { API_ENDPOINTS } from '../utils/apiService';
import { getApiBaseUrl } from '../utils/config';

interface CourseSelectionProps {
  onCourseSelect: (course: Course) => void;
}

const CourseSelection: React.FC<CourseSelectionProps> = ({ onCourseSelect }) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

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

  // Filter courses based on search term
  const filteredCourses = courses.filter(
    (course) =>
      course.course_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.course_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (course.department && course.department.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-blue-700 text-white py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Library Dashboard</h1>
          <p className="text-blue-100">
            Access course materials, e-books, notes and more
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Select Course</h2>
          
          {/* Search Input */}
          <div className="relative max-w-md mb-8">
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <svg
              className="absolute right-3 top-2.5 h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 p-4 rounded-md text-center text-red-700">
              <p>{error}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course) => (
                <div
                  key={course.id}
                  className="bg-white p-6 rounded-lg border hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => onCourseSelect(course)}
                >
                  <h3 className="font-medium text-lg text-gray-900 mb-2">{course.course_name}</h3>
                  <p className="text-sm text-gray-500 mb-4">{course.course_code}</p>
                  {course.department && (
                    <p className="text-xs bg-blue-50 text-blue-600 py-1 px-2 rounded inline-block">
                      {course.department}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {!loading && !error && filteredCourses.length === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No courses found matching your search</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseSelection;