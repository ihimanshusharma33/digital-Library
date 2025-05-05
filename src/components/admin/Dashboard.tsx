import React, { useState, useEffect } from 'react';
import { BookOpen, Users, FileText, Bell, PlusCircle, FileCheck, BookOpenCheck, BookX } from 'lucide-react';
import { api } from '../../utils/apiService';

import AddStudentModal from './modals/AddStudentModal';
import GenerateNocModal from './modals/GenerateNOCModal';
import IssueBookModal from './modals/IssueBookModal';
import ReturnBookModal from './modals/ReturnBookModal';  // Fix typo: ReturnBookModel -> ReturnBookModal
import { DashboardStatistics, ApiResponse, StatCardProps, IssuedBook } from '../../types/index'

// Define interfaces for API responses

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, bgColor, isLoading = false }) => (
  <div className="bg-white rounded-lg shadow p-6 flex items-center">
    <div className={`mr-4 p-3 rounded-lg ${bgColor}`}>
      {icon}
    </div>
    <div>
      <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
      {isLoading ? (
        <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
      ) : (
        <p className="text-2xl font-bold">{typeof value === 'number' ? value.toLocaleString() : value}</p>
      )}
    </div>
  </div>
);



const Dashboard: React.FC = () => {
  // Stats state with loading indicator
  const [stats, setStats] = useState({
    totalResources: 0,
    totalUsers: 0,
    totalCourses: 0,
    totalNotices: 0,
    totalBooks: 0,
    totalPhysicalBooks: 0,
    totalStudents: 0,
    isLoading: true
  });

  const [isLoading, setIsLoading] = useState({
    stats: true,
    activities: true,
    resources: true
  });

  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showGenerateNocModal, setShowGenerateNocModal] = useState(false);
  const [showIssueBookModal, setShowIssueBookModal] = useState(false);
  const [showReturnBookModal, setShowReturnBookModal] = useState(false);  // Add this state variable
  const [selectedIssuedBook] = useState<IssuedBook | null>(null); 
  const [shouldRefresh, setShouldRefresh] = useState(false);

  // Use effect to handle refresh
  useEffect(() => {
    if (shouldRefresh) {
      setShouldRefresh(false);
    }
  }, [shouldRefresh]);

  // Fetch dashboard stats from API
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch statistics
        const statsResponse = await api.get<ApiResponse<DashboardStatistics>>('/statistics');
        if (statsResponse.data && statsResponse.status) {
          const statsData = statsResponse.data;
          setStats({
            totalResources: statsData.resources?.total || 0,
            totalUsers: statsData.users?.total || 0,
            totalCourses: statsData.courses?.total || 0,
            totalNotices: statsData.notices?.active || 0,
            totalBooks: statsData.books?.total || 0,
            totalPhysicalBooks: statsData.books?.physical || 0,
            totalStudents: statsData.users?.students || 0,
            isLoading: false,
          });
        }
        setIsLoading(prev => ({ ...prev, stats: false }));

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // Set fallback data on error

        setIsLoading({
          stats: false,
          activities: false,
          resources: false
        });
      }
    };

    fetchDashboardData();
  }, []);


  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome to the admin dashboard</p>
      </div>

      {/* Stats grid */}
      {isLoading.stats ? (
        <div className="flex justify-center items-center my-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total Resources"
              value={stats.totalResources}
              icon={<BookOpen className="h-6 w-6 text-blue-600" />}
              bgColor="bg-blue-100"
              textColor="text-blue-600"
              isLoading={stats.isLoading}
            />
            <StatCard
              title="Total Users"
              value={stats.totalUsers}
              icon={<Users className="h-6 w-6 text-green-600" />}
              bgColor="bg-green-100"
              textColor="text-green-600"
              isLoading={stats.isLoading}
            />
            <StatCard
              title="Total Courses"
              value={stats.totalCourses}
              icon={<FileText className="h-6 w-6 text-purple-600" />}
              bgColor="bg-purple-100"
              textColor="text-purple-600"
              isLoading={stats.isLoading}
            />
            <StatCard
              title="Active Notices"
              value={stats.totalNotices}
              icon={<Bell className="h-6 w-6 text-yellow-600" />}
              bgColor="bg-yellow-100"
              textColor="text-yellow-600"
              isLoading={stats.isLoading}
            />
          </div>

          {/* Additional Stats */}

        </>
      )}

      {/* Quick Action Buttons */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => setShowAddStudentModal(true)}
            className="flex items-center p-4 bg-white shadow rounded-lg hover:bg-green-50 transition-colors text-left w-full"
          >
            <div className="mr-4 p-3 rounded-lg bg-green-100">
              <PlusCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-medium">Add Student</h3>
              <p className="text-sm text-gray-500">Register new student accounts</p>
            </div>
          </button>

          <button
            onClick={() => setShowGenerateNocModal(true)}
            className="flex items-center p-4 bg-white shadow rounded-lg hover:bg-purple-50 transition-colors text-left w-full"
          >
            <div className="mr-4 p-3 rounded-lg bg-purple-100">
              <FileCheck className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-medium">Generate NOC</h3>
              <p className="text-sm text-gray-500">Create No Objection Certificates</p>
            </div>
          </button>

          <button
            onClick={() => setShowIssueBookModal(true)}
            className="flex items-center p-4 bg-white shadow rounded-lg hover:bg-yellow-50 transition-colors text-left w-full"
          >
            <div className="mr-4 p-3 rounded-lg bg-yellow-100">
              <BookOpenCheck className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <h3 className="font-medium">Issue Book</h3>
              <p className="text-sm text-gray-500">Lend books to students</p>
            </div>
          </button>

          {/* Add Return Book button */}
          <button
            onClick={() => {
              setShowReturnBookModal(true);
              console.log('Return Book button clicked');
            }}
            className="flex items-center p-4 bg-white shadow rounded-lg hover:bg-red-50 transition-colors text-left w-full"
          >
            <div className="mr-4 p-3 rounded-lg bg-red-100">
              <BookX className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h3 className="font-medium">Return Book</h3>
              <p className="text-sm text-gray-500">Process book returns</p>
            </div>
          </button>
        </div>
      </div>

      {/* Modals */}
      <AddStudentModal
        isOpen={showAddStudentModal}
        onClose={() => setShowAddStudentModal(false)}
        onSuccess={() => {
          setShouldRefresh(true);
          setShowAddStudentModal(false);
        }}
      />

      <GenerateNocModal
        isOpen={showGenerateNocModal}
        onClose={() => setShowGenerateNocModal(false)}
      />

      <IssueBookModal
        isOpen={showIssueBookModal}
        onClose={() => setShowIssueBookModal(false)}
      />

      <ReturnBookModal
        isOpen={showReturnBookModal}
        onClose={() => setShowReturnBookModal(false)}
        issuedBook={selectedIssuedBook!} 
      />


    </div>
  );
};

export default Dashboard;

