import React, { useState, useEffect } from 'react';
import { Course, ResourceCategory, Resource, UnifiedResource, ApiResourcesResponse, Notice } from '../types';
import TabNavigation from './TabNavigation';
import ResourceCard from './ResourceCard';
import NoticeCard from './NoticeCard';
import { ArrowLeft, Search, Loader2, Filter } from 'lucide-react';
import { api, API_ENDPOINTS, ResourceApiResponse, ApiResponse } from '../utils/apiService';
import { getApiBaseUrl } from '../utils/config';
import { normalizeResources, sortResourcesByDate } from '../utils/resourceUtils';

interface LibraryDashboardProps {
  course: Course;
  selectedSemester: number;
  onBack: () => void;
}

const LibraryDashboard: React.FC<LibraryDashboardProps> = ({ course, selectedSemester, onBack }) => {
  const [activeTab, setActiveTab] = useState<ResourceCategory>('textbooks');
  const [searchTerm, setSearchTerm] = useState('');
  const [resources, setResources] = useState<UnifiedResource[]>([]);
  const [filteredNotices, setFilteredNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch resources from the unified resources endpoint
  const fetchResources = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Prepare parameters for API call
      const params = {
        course_code: course.course_code || course.code,
        semester: selectedSemester
      };
      
      // Call the unified resources API endpoint
      const response = await api.getResources(params);
      console.log('API Response for resources:', response);
      
      if (response && response.status && response.data) {
        // Normalize the resources from different types into a unified format
        const normalizedResources = normalizeResources(response.data);
        
        // Sort resources by date (newest first)
        const sortedResources = sortResourcesByDate(normalizedResources);
        
        setResources(sortedResources);
      } else {
        setResources([]);
      }
    } catch (err) {
      console.error('Error fetching resources:', err);
      setError('Failed to load resources. Please try again later.');
      setResources([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Function to fetch notices for the current course and semester
  const fetchNotices = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get<ApiResponse<Notice[]>>(API_ENDPOINTS.NOTICES);
      const data = response.data;
      let noticesData: any[] = [];
    
      // Handle different API response structures
      if ((data.status === 200 || data.status === true || data.success === true) && Array.isArray(data.data)) {
        console.log('Processing notices from data.data array');
        noticesData = data.data;
      } else if (Array.isArray(data)) {
        console.log('Processing notices from direct array');
        noticesData = data;
      } else {
        console.error('Unexpected API response format:', data);
        setFilteredNotices([]);
        return;
      }
    
      // Directly map notices without any filtering
      const relevantNotices = noticesData.map((notice): Notice => ({
        id: notice.id?.toString() ?? '',
        title: notice.title ?? 'Untitled Notice',
        description: notice.description ?? '',
        date: notice.created_at ?? notice.date ?? new Date().toISOString(),
        courseId: notice.course_id ? notice.course_id.toString() : notice.courseId,
        semester: notice.semester ?? undefined,
        attachment: notice.attachment_url
          ? {
              name: notice.attachment_name ?? 'Attachment',
              url: notice.attachment_url,
              type: notice.attachment_type ?? 'pdf',
            }
          : notice.attachment ?? undefined,
      }));
    
      console.log('All notices:', relevantNotices);
      setFilteredNotices(relevantNotices);
    } catch (err) {
      console.error('Error fetching notices:', err);
      setFilteredNotices([]);
    } finally {
      setLoading(false);
    }    
  };
  
  // Fetch resources when selectedSemester changes
  useEffect(() => {
    fetchResources();
    fetchNotices();
  }, [selectedSemester, course.id]);
  
  // Filter resources based on search term and active tab
  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (resource.description?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    
    // Filter based on the active tab
    let matchesCategory = false;
    switch (activeTab) {
      case 'textbooks':
        matchesCategory = resource.resourceType === 'ebook';
        break;
      case 'notes':
        matchesCategory = resource.resourceType === 'note';
        break;
      case 'questions':
        matchesCategory = resource.resourceType === 'question_paper';
        break;
      default:
        matchesCategory = true;
    }
    
    return matchesSearch && matchesCategory;
  });

  // Handle tab change
  const handleTabChange = (tab: ResourceCategory) => {
    setActiveTab(tab);
    // No need to re-fetch - we'll just filter the existing resources
  };

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
              <h1 className="text-2xl font-bold">{course.name || course.course_name} - Semester {selectedSemester}</h1>
              <p className="text-blue-100">{course.code || course.course_code}</p>
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

        <TabNavigation activeTab={activeTab} onTabChange={handleTabChange} />


        {/* Show loading state */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            <span className="ml-2 text-gray-600">Loading {activeTab}...</span>
          </div>
        )}

        {/* Show error message if any */}
        {error && !loading && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p>{error}</p>
          </div>
        )}

        {/* Show resources */}
        {!loading && !error && activeTab !== 'notices' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResources.length > 0 ? (
              filteredResources.map(resource => (
                <ResourceCard key={resource.id} resource={resource} />
              ))
            ) : (
              <div className="col-span-full text-center py-10">
                <p className="text-gray-500">No {activeTab} found for semester {selectedSemester}</p>
              </div>
            )}
          </div>
        )}

        {/* Show notices */}
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