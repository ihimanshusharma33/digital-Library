import React, { useState } from 'react';
import { getResourcesByCategory, getNoticesByCourse } from '../utils/mockData';
import { Course, ResourceCategory, Resource } from '../types';
import TabNavigation from './TabNavigation';
import ResourceCard from './ResourceCard';
import NoticeCard from './NoticeCard';
import { ArrowLeft, Search } from 'lucide-react';

interface LibraryDashboardProps {
  course: Course;
  selectedSemester: number;
  onBack: () => void;
}

const LibraryDashboard: React.FC<LibraryDashboardProps> = ({ course, selectedSemester, onBack }) => {
  const [activeTab, setActiveTab] = useState<ResourceCategory>('textbooks');
  const [searchTerm, setSearchTerm] = useState('');

  const getResources = (): Resource[] => {
    let resources: Resource[] = [];
    
    switch (activeTab) {
      case 'textbooks':
        resources = getResourcesByCategory(course.id, 'textbook', selectedSemester);
        break;
      case 'notes':
        resources = getResourcesByCategory(course.id, 'notes', selectedSemester);
        break;
      case 'questions':
        resources = getResourcesByCategory(course.id, 'questions', selectedSemester);
        break;
      default:
        resources = [];
    }
    
    // Apply search term filter
    return resources.filter(resource => 
      resource.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const getFilteredNotices = () => {
    const notices = getNoticesByCourse(course.id, selectedSemester);
      
    return notices.filter(notice => 
      notice.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notice.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const resources = getResources();
  const filteredNotices = getFilteredNotices();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-blue-700 text-white py-6 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center mb-4">
            <button 
              onClick={onBack}
              className="mr-4 p-2 rounded-full hover:bg-blue-600 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <h1 className="text-2xl font-bold">{course.name} - Semester {selectedSemester}</h1>
              <p className="text-blue-100">{course.code}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <div className="mb-4 md:mb-0">
            <h2 className="text-xl font-semibold text-gray-800">Resources for Semester {selectedSemester}</h2>
          </div>
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search resources..."
              className="pl-10 pr-4 py-2 border rounded-lg w-full md:w-64 focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Show resource count */}
        <div className="text-sm text-gray-500 mb-4">
          {activeTab !== 'notices' ? (
            <p>Showing {resources.length} {activeTab} for semester {selectedSemester}</p>
          ) : (
            <p>Showing {filteredNotices.length} notices for semester {selectedSemester}</p>
          )}
        </div>

        {activeTab !== 'notices' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resources.length > 0 ? (
              resources.map(resource => (
                <ResourceCard key={resource.id} resource={resource} />
              ))
            ) : (
              <div className="col-span-full text-center py-10">
                <p className="text-gray-500">No {activeTab} found for semester {selectedSemester}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'notices' && (
          <div className="space-y-4">
            {filteredNotices.length > 0 ? (
              filteredNotices.map(notice => (
                <NoticeCard key={notice.id} notice={notice} />
              ))
            ) : (
              <div className="text-center py-10">
                <p className="text-gray-500">No notices found for semester {selectedSemester}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LibraryDashboard;