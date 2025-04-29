import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api } from '../utils/apiService';

// Define the course interface
export interface Course {
  id: string;
  course_name: string;
  course_code: string;
  department: string;
  description?: string;
  total_semesters?: number;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

// Define the context shape
interface CoursesContextType {
  courses: Course[];
  isLoading: boolean;
  error: string | null;
  refreshCourses: () => Promise<void>;
  getActiveCourses: () => Course[];
  getCourseById: (id: string) => Course | undefined;
  getCoursesByDepartment: (department: string) => Course[];
}

// Create the context
const CoursesContext = createContext<CoursesContextType | undefined>(undefined);

// Provider component
export const CoursesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch courses from API
  const fetchCourses = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await api.get('/course');
      if (response.data && response.data.status) {
        setCourses(response.data.data);
      } else {
        setError('Failed to fetch courses');
      }
    } catch (err) {
      console.error('Error fetching courses:', err);
      setError('An error occurred while fetching courses');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch on mount
  useEffect(() => {
    fetchCourses();
  }, []);

  // Function to refresh courses
  const refreshCourses = async () => {
    await fetchCourses();
  };

  // Helper functions to work with courses
  const getActiveCourses = () => {
    return courses.filter(course => course.is_active);
  };

  const getCourseById = (id: string) => {
    return courses.find(course => course.id === id);
  };

  const getCoursesByDepartment = (department: string) => {
    return courses.filter(course => course.department === department);
  };

  return (
    <CoursesContext.Provider value={{
      courses,
      isLoading,
      error,
      refreshCourses,
      getActiveCourses,
      getCourseById,
      getCoursesByDepartment
    }}>
      {children}
    </CoursesContext.Provider>
  );
};

// Custom hook to use the context
export const useCourses = (): CoursesContextType => {
  const context = useContext(CoursesContext);
  if (context === undefined) {
    throw new Error('useCourses must be used within a CoursesProvider');
  }
  return context;
};