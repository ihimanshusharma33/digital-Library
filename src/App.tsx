import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import CourseSelection from './components/CourseSelection';
import SemesterSelection from './components/SemesterSelection';
import LibraryDashboard from './components/LibraryDashboard';
import SignIn from './components/auth/SignIn';
import SignUp from './components/auth/SignUp';
import AdminLayout from './components/admin/AdminLayout';
import Dashboard from './components/admin/Dashboard';
import ResourcesManager from './components/admin/ResourcesManager';
import NoticesManager from './components/admin/NoticesManager';
import CoursesManager from './components/admin/CoursesManager';
import BookStocksManager from './components/admin/BookStocksManager';
import { AuthProvider, useAuth } from './utils/AuthContext';
import { Course } from './types';

// Protected route component for admin routes
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  
  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }
  
  if (!isAuthenticated || user?.role !== 'admin') {
    return <Navigate to="/signin" />;
  }
  
  return <>{children}</>;
};

// Protected route component for authenticated users
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/signin" />;
  }
  
  return <>{children}</>;
};

// Auth route component to prevent authenticated users from accessing login/signup pages
const AuthRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  
  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }
  
  if (isAuthenticated) {
    return <Navigate to={user?.role === 'admin' ? '/admin' : '/dashboard'} />;
  }
  
  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedSemester, setSelectedSemester] = useState<number | null>(null);
  const [navigationState, setNavigationState] = useState<'courses' | 'semesters' | 'resources'>('courses');

  const handleCourseSelect = (course: Course) => {
    setSelectedCourse(course);
    setNavigationState('semesters');
  };

  const handleSemesterSelect = (semester: number) => {
    setSelectedSemester(semester);
    setNavigationState('resources');
  };

  const handleBackToSemesters = () => {
    setSelectedSemester(null);
    setNavigationState('semesters');
  };

  const handleBackToCourses = () => {
    setSelectedCourse(null);
    setNavigationState('courses');
  };

  const renderHomeContent = () => {
    switch (navigationState) {
      case 'courses':
        return <CourseSelection onCourseSelect={handleCourseSelect} />;
      
      case 'semesters':
        return selectedCourse ? (
          <SemesterSelection 
            course={selectedCourse} 
            onSemesterSelect={handleSemesterSelect} 
            onBack={handleBackToCourses} 
          />
        ) : (
          <Navigate to="/" />
        );
      
      case 'resources':
        return (selectedCourse && selectedSemester !== null) ? (
          <LibraryDashboard 
            course={selectedCourse} 
            selectedSemester={selectedSemester}
            onBack={handleBackToSemesters} 
          />
        ) : (
          <Navigate to="/" />
        );
      
      default:
        return <Navigate to="/" />;
    }
  };

  return (
    <Routes>
      {/* Auth routes */}
      <Route path="/signin" element={<AuthRoute><SignIn /></AuthRoute>} />
      <Route path="/signup" element={<AuthRoute><SignUp /></AuthRoute>} />
      
      {/* Home page - accessible to anyone */}
      <Route path="/" element={renderHomeContent()} />
      
      {/* Dashboard page - requires authentication */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <CourseSelection onCourseSelect={handleCourseSelect} />
          </ProtectedRoute>
        } 
      />
      
      {/* Admin routes */}
      <Route 
        path="/admin" 
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="resources" element={<ResourcesManager />} />
        <Route path="notices" element={<NoticesManager />} />
        <Route path="courses" element={<CoursesManager />} />
        <Route path="books" element={<BookStocksManager />} />
        <Route path="users" element={<div>Users Management Page</div>} />
        <Route path="settings" element={<div>Settings Page</div>} />
      </Route>
      
      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
};

export default App;