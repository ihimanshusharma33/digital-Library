import React, { useState, useEffect, useRef } from 'react';
import {
  BookOpen,
  User,
  LogOut,
  X,
  FileText,
  BookMarked,
  BookText,
} from 'lucide-react';
import { useAuth } from '../../utils/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import StudentDashboard from './StudentDashboard';
import IssuedBooksComponent from './IssuedBooks';
import ResourceDetail from './ResourceList'; 
import StudentProfile from './StudentProfile';
// Component references
const Dashboard = () => <StudentDashboard/>;
const IssuedBooks = () => <IssuedBooksComponent />;
const Profile = () => <StudentProfile/>;
const Resources = () => <ResourceDetail/>; 


const StudentLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState('dashboard');

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const renderComponent = () => {
    switch (selectedTab) {
      case 'resources': return <Resources />;
      case 'issued': return <IssuedBooks />;
      case 'profile': return <Profile />;
      default: return <Dashboard />;
    }
  };

  const navItems = [
    { key: 'dashboard', label: 'Dashboard', icon: BookOpen },
    { key: 'resources', label: 'My Resources', icon: FileText },
    { key: 'issued', label: 'Issued Books', icon: BookMarked },
    { key: 'profile', label: 'Profile', icon: User }
  ];

  const renderNavButtons = () =>
    navItems.map(({ key, label, icon: Icon }) => (
      <button
        key={key}
        onClick={() => { setSelectedTab(key); setIsSidebarOpen(false); }}
        className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-md transition ${
          selectedTab === key
            ? 'bg-blue-50 text-blue-700'
            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
        }`}
      >
        <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
        {label}
      </button>
    ));

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar (Desktop) */}
      <div className="hidden md:flex md:flex-col md:w-64 md:fixed md:inset-y-0 bg-white shadow-md z-20">
        <Link to={'/'} className="flex items-center h-16 px-4 border-b border-gray-200">
          <img src='https://res.cloudinary.com/dcliahekv/image/upload/v1745924858/logo_f6ikuk.png' className='w-16 h-16' alt='logo'/>
          <span className="ml-2 text-xl font-semibold">IGU Library</span>
        </Link>
        <div className="flex flex-col justify-between flex-1 overflow-y-auto">
          <nav className="flex-1 px-2 py-4 space-y-1">
            {renderNavButtons()}
          </nav>
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-medium">
                {user?.name?.charAt(0) || 'S'}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700 truncate">{user?.name || 'Student'}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email || ''}</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100">
              <button
                onClick={handleLogout}
                className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md w-full"
              >
                <LogOut className="mr-3 h-4 w-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar Overlay (Mobile) */}
      <div
        className={`md:hidden fixed inset-0 z-20 bg-gray-600 bg-opacity-50 transition-opacity duration-300 ${
          isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={toggleSidebar}
      ></div>

      {/* Mobile Sidebar */}
      <div
        className={`md:hidden fixed inset-y-0 left-0 z-30 w-64 bg-white transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          <div className="flex items-center">
            <img src='https://res.cloudinary.com/dcliahekv/image/upload/v1745924858/logo_f6ikuk.png' className='w-10 h-10' alt='logo'/>
            <span className="ml-2 text-xl font-semibold">IGU Library</span>
          </div>
          <button
            onClick={toggleSidebar}
            className="h-10 w-10 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex flex-col justify-between h-[calc(100%-4rem)]">
          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
            {renderNavButtons()}
          </nav>
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-medium">
                {user?.name?.charAt(0) || 'S'}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700 truncate">{user?.name || 'Student'}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="mt-3 flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md w-full"
            >
              <LogOut className="mr-3 h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-10 bg-white shadow-sm">
        <div className="flex items-center justify-between h-16 px-4">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-md text-gray-600 hover:bg-gray-100"
          >
            <BookText className="h-6 w-6" />
          </button>
          <span className="text-lg font-medium">{navItems.find(item => item.key === selectedTab)?.label || 'Dashboard'}</span>
          <div className="w-8"></div> {/* Empty div for balance */}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 md:ml-64 overflow-y-auto">
        <div className="md:pt-0 pt-16">
          {renderComponent()}
        </div>
      </div>
    </div>
  );
};

export default StudentLayout;
