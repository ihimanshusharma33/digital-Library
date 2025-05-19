import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LibraryDashboard from './components/LibraryDashboard';
import SignIn from './components/auth/SignIn';
import AdminLayout from './components/admin/AdminLayout';
import Dashboard from './components/admin/Dashboard';
import { AuthProvider } from './utils/AuthContext';
import StudentLayout from './components/student/StudentLayout';
import StudentDashboard from './components/student/StudentDashboard';
import CheckAuth from './components/auth/CheckAuth';
import ForgotPassword from './components/auth/ForgotPassword';

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Auth routes - direct routes without wrappers */}
      <Route path="/signin" element={<SignIn />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      
      {/* Library Dashboard routes */}
      <Route path="/" element={<LibraryDashboard />} />

      {/* Admin routes */}
      <Route path="/admin" element={<CheckAuth requiredRole="admin"><AdminLayout /></CheckAuth>}>
        <Route index element={<Dashboard />} />
      </Route>

      {/* Student routes */}
      <Route path="/student" element={<CheckAuth requiredRole="student"><StudentLayout /></CheckAuth>}>
        <Route index element={<StudentDashboard />} />
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