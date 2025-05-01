import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
// Import student components
import StudentLayout from './components/student/StudentLayout';
import StudentDashboard from './components/student/StudentDashboard';
import StudentProfile from './components/student/IssuedBooks';

// Protected route component for admin and staff routes
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();

  // Check if user is authenticated AND has either admin OR staff role
  if (!isAuthenticated || (user?.role !== 'admin' && user?.role !== 'staff')) {
    return <Navigate to="/signin" />;
  }

  return <>{children}</>;
};

// Protected route component for student routes
const StudentRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();

  // Check if user is authenticated AND has student role
  if (!isAuthenticated || user?.role !== 'student') {
    return <Navigate to="/signin" />;
  }

  return <>{children}</>;
};

// Auth route component to prevent authenticated users from accessing login/signup pages
const AuthRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  
  // Redirect based on user role
  if (isAuthenticated) {
    if (user?.role === 'admin' || user?.role === 'staff') {
      return <Navigate to="/admin" />;
    } else if (user?.role === 'student') {
      return <Navigate to="/student" />;
    }
    return <Navigate to="/" />;
  }

  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Auth routes */}
      <Route path="/signin" element={<AuthRoute><SignIn /></AuthRoute>} />
      <Route path="/signup" element={<AuthRoute><SignUp /></AuthRoute>} />
      
      {/* Library Dashboard routes */}
      <Route path="/" element={<LibraryDashboard />} />
      <Route path="/library" element={<LibraryDashboard />} />

      {/* Admin routes - accessible by both admin and staff */}
      <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="resources" element={<ResourcesManager />} />
        <Route path="notices" element={<NoticesManager />} />
        <Route path="courses" element={<CoursesManager />} />
        <Route path="books" element={<BookStocksManager />} />
        <Route path="users" element={<div>Users Management Page</div>} />
        <Route path="settings" element={<div>Settings Page</div>} />
      </Route>

      {/* Student routes - accessible by students */}
      <Route path="/student" element={<StudentRoute><StudentLayout /></StudentRoute>}>
        <Route index element={<StudentDashboard />} />
        <Route path="profile" element={<StudentProfile />} />
        <Route path="favorites" element={<div>Favorites Page</div>} />
        <Route path="history" element={<div>Download History Page</div>} />
        <Route path="settings" element={<div>Account Settings Page</div>} />
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