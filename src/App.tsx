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
import { AuthProvider } from './utils/AuthContext';
// Import student components
import StudentLayout from './components/student/StudentLayout';
import StudentDashboard from './components/student/StudentDashboard';
import StudentProfile from './components/student/IssuedBooks';
// Import the new CheckAuth component
import CheckAuth from './components/auth/CheckAuth';

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Auth routes - redirect authenticated users away */}
      <Route path="/signin" element={
        <CheckAuth authPage={true}>
          <SignIn />
        </CheckAuth>
      } />
      <Route path="/signup" element={
        <CheckAuth authPage={true}>
          <SignUp />
        </CheckAuth>
      } />
      
      {/* Library Dashboard routes - open to all users */}
      <Route path="/" element={<LibraryDashboard />} />
      <Route path="/library" element={<LibraryDashboard />} />

      {/* Admin routes - accessible by both admin and staff */}
      <Route path="/admin" element={
        <CheckAuth requiredRole="admin">
          <AdminLayout />
        </CheckAuth>
      }>
        <Route index element={<Dashboard />} />
        <Route path="resources" element={<ResourcesManager />} />
        <Route path="notices" element={<NoticesManager />} />
        <Route path="courses" element={<CoursesManager />} />
        <Route path="books" element={<BookStocksManager />} />
        <Route path="users" element={<div>Users Management Page</div>} />
        <Route path="settings" element={<div>Settings Page</div>} />
      </Route>

      {/* Student routes - accessible by students */}
      <Route path="/student" element={
        <CheckAuth requiredRole="student">
          <StudentLayout />
        </CheckAuth>
      }>
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