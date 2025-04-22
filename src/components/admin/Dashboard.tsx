import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Users, FileText, Bell, ArrowRight } from 'lucide-react';
import { courses, resources, notices } from '../../utils/mockData';

interface StatCardProps {
  title: string;
  value: number;
  icon: JSX.Element;
  bgColor: string;
  textColor: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, bgColor }) => (
  <div className="bg-white rounded-lg shadow p-6 flex items-center">
    <div className={`mr-4 p-3 rounded-lg ${bgColor}`}>
      {icon}
    </div>
    <div>
      <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
      <p className="text-2xl font-bold">{value.toLocaleString()}</p>
    </div>
  </div>
);

const RecentActivityItem: React.FC<{ date: string; title: string; description: string }> = ({ 
  date, title, description 
}) => (
  <div className="flex pb-4 mb-4 border-b">
    <div className="min-w-[120px] text-sm text-gray-500">
      {new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      })}
    </div>
    <div>
      <h4 className="font-medium text-gray-900">{title}</h4>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  </div>
);

const Dashboard: React.FC = () => {
  // Simulated stats for demo
  const [stats, setStats] = useState({
    totalResources: 0,
    totalUsers: 0,
    totalCourses: courses.length,
    totalNotices: notices.length
  });

  // Simulate loading stats
  useEffect(() => {
    const timer = setTimeout(() => {
      setStats({
        totalResources: resources.length,
        totalUsers: 45, // Mock user count
        totalCourses: courses.length,
        totalNotices: notices.length
      });
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  // Simulated recent activity for demo
  const recentActivities = [
    { 
      id: '1', 
      date: new Date().toISOString(), 
      title: 'New Resource Added',
      description: 'Advanced Machine Learning Textbook was added to Computer Science Engineering.'
    },
    { 
      id: '2', 
      date: new Date(Date.now() - 86400000).toISOString(), // 1 day ago 
      title: 'Notice Posted',
      description: 'Exam schedule for final semester was published.'
    },
    { 
      id: '3', 
      date: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
      title: 'New Course Added',
      description: 'Data Science curriculum was added to available courses.'
    },
    { 
      id: '4', 
      date: new Date(Date.now() - 345600000).toISOString(), // 4 days ago
      title: 'Resources Updated',
      description: 'Operating Systems lecture notes were updated with new content.'
    }
  ];

  const latestResources = resources.slice(0, 5);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome to the admin dashboard</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Resources"
          value={stats.totalResources}
          icon={<BookOpen className="h-6 w-6 text-blue-600" />}
          bgColor="bg-blue-100"
          textColor="text-blue-600"
        />
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          icon={<Users className="h-6 w-6 text-green-600" />}
          bgColor="bg-green-100"
          textColor="text-green-600"
        />
        <StatCard
          title="Total Courses"
          value={stats.totalCourses}
          icon={<FileText className="h-6 w-6 text-purple-600" />}
          bgColor="bg-purple-100"
          textColor="text-purple-600"
        />
        <StatCard
          title="Active Notices"
          value={stats.totalNotices}
          icon={<Bell className="h-6 w-6 text-yellow-600" />}
          bgColor="bg-yellow-100"
          textColor="text-yellow-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
            <button className="text-sm text-blue-600 hover:text-blue-800">View all</button>
          </div>

          <div className="space-y-4">
            {recentActivities.map(activity => (
              <RecentActivityItem
                key={activity.id}
                date={activity.date}
                title={activity.title}
                description={activity.description}
              />
            ))}
          </div>
        </div>

        {/* Latest Resources */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Latest Resources</h2>
            <Link to="/admin/resources" className="text-sm text-blue-600 hover:text-blue-800">
              View all
            </Link>
          </div>

          <div className="space-y-4">
            {latestResources.map(resource => (
              <div key={resource.id} className="flex items-center p-3 hover:bg-gray-50 rounded-md">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center mr-3">
                  <span className="font-semibold text-blue-800">
                    {resource.fileType.substring(0, 1).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{resource.title}</p>
                  <p className="text-xs text-gray-500">Semester {resource.semester}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-400" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;