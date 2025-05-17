import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  BookOpen, 
  Menu, 
  X, 
  Grid, 
  BookMarked, 
  Bell, 
  LogOut,
  GraduationCap,
  User2
} from 'lucide-react';
import { useAuth } from '../../utils/AuthContext';
import BookStocksManager from './BookStocksManager';
import CoursesManager from './CoursesManager';
import ResourcesManager from './ResourcesManager';
import NoticesManager from './NoticesManager';
import StudentManager from './StudentManger';
import AdminDashboard from './Dashboard'; // Assuming you have a dashboard component

const AdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeComponent, setActiveComponent] = useState<string>('dashboard');
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Define menu items with their corresponding component keys
  const sidebarItems = [
    { 
      name: 'Dashboard', 
      key: 'dashboard', 
      icon: <Grid className="w-5 h-5" /> 
    },
    { 
      name: 'Courses', 
      key: 'courses', 
      icon: <GraduationCap className="w-5 h-5" /> 
    },
    { 
      name: 'Resources', 
      key: 'resources', 
      icon: <BookMarked className="w-5 h-5" /> 
    },
    { 
      name: 'Notices', 
      key: 'notices', 
      icon: <Bell className="w-5 h-5" /> 
    },
    { 
      name: 'Book Stocks', 
      key: 'books', 
      icon: <BookOpen className="w-5 h-5" /> 
    },
    {
      name: 'Students',
      key: 'students',
      icon: <User2 className="w-5 h-5" />
    }
  ];

  // Render the active component based on selected menu item
  const renderActiveComponent = () => {
    switch (activeComponent) {
      case 'dashboard':
        return <AdminDashboard />;
      case 'courses':
        return <CoursesManager />;
      case 'resources':
        return <ResourcesManager />;
      case 'notices':
        return <NoticesManager />;
      case 'books':
        return <BookStocksManager />;
      case 'students':
        return <StudentManager />;
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      <div 
        className={`fixed inset-0 z-20 bg-black bg-opacity-50 transition-opacity duration-200 ${sidebarOpen ? 'opacity-100 block' : 'opacity-0 hidden'}`}
        onClick={() => setSidebarOpen(false)}
      ></div>

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-white border-r transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="h-full flex flex-col">
          {/* Sidebar header */}
          <div className="flex items-center justify-between px-4 py-5 border-b">
            <Link to="#" onClick={() => setActiveComponent('dashboard')} className="flex items-center space-x-2">
              <img src="https://res.cloudinary.com/dcliahekv/image/upload/v1745924858/logo_f6ikuk.png" alt="Logo" className="h-12 w-12" />
              <span className="text-xl font-semibold text-gray-800">Library Admin</span>
            </Link>
            <button 
              className="lg:hidden p-2 rounded-md hover:bg-gray-100"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Sidebar content */}
          <div className="flex-1 overflow-auto py-4">
            <nav className="px-2 space-y-1">
              {sidebarItems.map((item) => {
                const isActive = activeComponent === item.key;
                return (
                  <button
                    key={item.name}
                    onClick={() => {
                      setActiveComponent(item.key);
                      setSidebarOpen(false); // Close sidebar on mobile after selection
                    }}
                    className={`w-full flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                      isActive 
                        ? 'bg-blue-50 text-blue-700' 
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`mr-3 ${isActive ? 'text-blue-500' : 'text-gray-500'}`}>
                      {item.icon}
                    </div>
                    {item.name}
                  </button>
                );
              })}
            </nav>
          </div>
          
          {/* Sidebar footer */}
          <div className="border-t p-4">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="font-semibold text-blue-800">{user?.name?.substring(0, 1)}</span>
              </div>
              <div className="ml-3">
                <p className="font-medium text-sm text-gray-700">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
            </div>
            
            <button 
              onClick={handleLogout}
              className="mt-4 flex items-center w-full px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 rounded-md"
            >
              <LogOut className="w-5 h-5 mr-2" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top navigation */}
        <header className="bg-white border-b">
          <div className="px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <button
              className="lg:hidden p-2 rounded-md hover:bg-gray-100"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            
            <div className="text-lg font-semibold text-gray-800 lg:hidden">
              Library Admin
            </div>
            
            <div className="flex items-center space-x-3">
              <Link to="/" className="text-sm text-blue-600 hover:text-blue-700">
                View Library
              </Link>
            </div>
          </div>
        </header>
        
        {/* Page content */}
        <main className="flex-1 overflow-auto bg-gray-50 p-4">
          {renderActiveComponent()}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;