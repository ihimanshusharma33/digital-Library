import React, { ReactNode } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { BookOpen, Library, CreditCard, Book, User, LogOut } from 'lucide-react';
import { useAuth } from '../../utils/AuthContext';

interface StudentLayoutProps {
  children?: ReactNode;
}

const StudentLayout: React.FC<StudentLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { path: '/student', label: 'Dashboard', icon: <BookOpen className="h-5 w-5" /> },
    { path: '/student/library-card', label: 'Library Card', icon: <CreditCard className="h-5 w-5" /> },
    { path: '/student/issued-books', label: 'Issued Books', icon: <Book className="h-5 w-5" /> },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Sidebar */}
      <div className="bg-blue-800 text-white md:w-64 md:fixed md:inset-y-0">
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-blue-700">
            <div className="flex items-center space-x-2">
              <Library className="h-8 w-8" />
              <span className="text-xl font-bold">Digital Library</span>
            </div>
          </div>
          
          {/* User info */}
          <div className="p-4 border-b border-blue-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                <User className="h-6 w-6" />
              </div>
              <div>
                <div className="font-medium">{user?.name || 'Student'}</div>
                <div className="text-sm text-blue-300">{user?.email || 'student@example.com'}</div>
              </div>
            </div>
          </div>
          
          {/* Navigation */}
          <nav className="p-4 flex-1">
            <ul className="space-y-2">
              {navItems.map(item => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    end={item.path === '/student'}
                    className={({ isActive }) =>
                      `flex items-center px-3 py-2 rounded-md transition-colors ${
                        isActive
                          ? 'bg-blue-700 text-white'
                          : 'text-blue-200 hover:bg-blue-700 hover:text-white'
                      }`
                    }
                  >
                    <span className="mr-3">{item.icon}</span>
                    <span>{item.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          
          {/* Bottom actions */}
          <div className="p-4 border-t border-blue-700">
            <button
              onClick={() => logout()}
              className="flex items-center justify-center w-full px-4 py-2 rounded-md text-blue-200 hover:bg-blue-700 hover:text-white transition-colors"
            >
              <LogOut className="h-5 w-5 mr-2" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 md:ml-64">
        <main className="p-6">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
};

export default StudentLayout;