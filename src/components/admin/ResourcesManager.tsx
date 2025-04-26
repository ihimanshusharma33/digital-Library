import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  PlusCircle, 
  Search, 
  FileText, 
  Edit, 
  Trash2, 
  ChevronDown,
  ChevronUp,
  Upload,
  AlertCircle,
  CheckCircle,
  Loader // Import Loader icon for pending state
} from 'lucide-react';
import { Resource, Course } from '../../types';
import { resources as mockResources } from '../../utils/mockData';
import { API_ENDPOINTS, api } from '../../utils/apiService';
import { getApiBaseUrl } from '../../utils/config';

const ResourcesManager: React.FC = () => {
  // Original resources data (never modified after initial fetch)
  const [originalResources, setOriginalResources] = useState<Resource[]>([]);
  
  // Filtered resources for display (changes with filters)
  const [filteredResources, setFilteredResources] = useState<Resource[]>([]);
  
  // Loading states
  const [resourcesLoading, setResourcesLoading] = useState(true);
  const [coursesLoading, setCoursesLoading] = useState(true);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string | undefined>(undefined);
  const [filterCourse, setFilterCourse] = useState<string | undefined>(undefined);
  const [filterSemester, setFilterSemester] = useState<number | undefined>(undefined);
  
  // Other states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentResource, setCurrentResource] = useState<Resource | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseLoadError, setCourseLoadError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [deletingResource, setDeletingResource] = useState<string | null>(null);
  
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Resource | null;
    direction: 'ascending' | 'descending';
  }>({ key: 'uploadDate', direction: 'descending' });

  // Fetch courses from API
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setCoursesLoading(true);
        const response = await fetch(`${getApiBaseUrl()}${API_ENDPOINTS.COURSES}`);
        const data = await response.json();
        
        if (data && data.status) {
          // Format courses to maintain compatibility with existing code
          const formattedCourses = data.data.map((course: any) => ({
            id: course.id.toString(),
            course_code: course.course_code,
            course_name: course.course_name,
            total_semesters: course.total_semesters,
            department: course.department,
            faculty: course.faculty,
            description: course.description
          })) as Course[];
          setCourses(formattedCourses);
          setCourseLoadError(null);
        } else {
          console.error('Failed to fetch courses from API');
          setCourseLoadError('Failed to load courses');
        }
      } catch (error) {
        console.error('Error fetching courses:', error);
        setCourseLoadError('Error loading courses. Please try again later.');
      } finally {
        setCoursesLoading(false);
      }
    };

    fetchCourses();
  }, []);

  useEffect(() => {
    // Fetch resources from the API
    const fetchResources = async () => {
      setResourcesLoading(true);
      try {
        const response = await api.getResources();
        console.log('API Response:', response); // Debug log to check what's returned

        // Check if response exists and has the expected format
        if (response && response.status === true && response.data) {
          // Extract the different resource types from the response
          const ebooksData = response.data.ebooks || [];
          const notesData = response.data.notes || [];
          const questionPapersData = response.data.question_papers || [];
          
          console.log('Extracted resources:', { 
            ebooks: ebooksData.length, 
            notes: notesData.length, 
            questionPapers: questionPapersData.length 
          });
          
          // Transform ebooks to Resource objects
          const ebookResources: Resource[] = ebooksData.map((item, index) => ({
            id: item.id.toString(),
            title: item.title || 'Untitled E-book',
            description: item.description || '',
            courseId: '',
            category: 'textbook', // E-books are mapped to textbook category
            semester: item.semester || 1,
            uploadDate: item.created_at || new Date().toISOString(),
            uploadedBy: item.uploadedBy || 'Unknown',
            fileType: getFileTypeFromPath(item.file_path || ''),
            url: item.file_path || '',
            subject: '',
            course_code: item.course_code || '',
            author: item.author || ''
          }));
          
          // Transform notes to Resource objects
          const noteResources: Resource[] = notesData.map((item, index) => ({
            id: item.id.toString(),
            title: item.title || 'Untitled Note',
            description: item.description || '',
            courseId: '',
            category: 'notes', // Notes are mapped to notes category
            semester: item.semester || 1,
            uploadDate: item.created_at || new Date().toISOString(),
            uploadedBy: item.author || 'Unknown',
            fileType: getFileTypeFromPath(item.file_path || ''),
            url: item.file_path || '',
            subject: item.subject || '',
            course_code: item.course_code || '',
            author: item.author || ''
          }));
          
          // Transform question papers to Resource objects
          const questionPaperResources: Resource[] = questionPapersData.map((item, index) => ({
            id: item.id.toString(),
            title: item.title || 'Untitled Question Paper',
            description: item.description || '',
            courseId: '',
            category: 'questions', // Question papers are mapped to questions category
            semester: item.semester || 1,
            uploadDate: item.created_at || new Date().toISOString(),
            uploadedBy: item.author || 'Unknown',
            fileType: getFileTypeFromPath(item.file_path || ''),
            url: item.file_path || '',
            subject: item.subject || '',
            year: item.year?.toString() || new Date().getFullYear().toString(),
            exam_type: item.exam_type || 'midterm',
            course_code: item.course_code || ''
          }));
          
          // Combine all resource types into a single array
          const allResources: Resource[] = [
            ...ebookResources,
            ...noteResources,
            ...questionPaperResources
          ];
          
          console.log('Transformed resources:', allResources);
          // Store the original data that will never be modified after fetching
          setOriginalResources(allResources);
          // Initialize filtered resources with all resources
          setFilteredResources(allResources);
        } else {
          console.error('Failed to fetch resources or unexpected response format:', response);
          // Fall back to mock data if API fails
          setOriginalResources(mockResources);
          setFilteredResources(mockResources);
        }
      } catch (error) {
        console.error('Error fetching resources:', error);
        // Fall back to mock data if API fails
        setOriginalResources(mockResources);
        setFilteredResources(mockResources);
      } finally {
        setResourcesLoading(false);
      }
    };

    // Helper function to determine file type from path
    const getFileTypeFromPath = (path: string): 'pdf' | 'doc' | 'ppt' | 'xlsx' | 'image' | 'other' => {
      if (!path) return 'other';
      
      const ext = path.split('.').pop()?.toLowerCase();
      if (ext === 'pdf') return 'pdf';
      if (['doc', 'docx'].includes(ext || '')) return 'doc';
      if (['ppt', 'pptx'].includes(ext || '')) return 'ppt';
      if (['xls', 'xlsx'].includes(ext || '')) return 'xlsx';
      if (['jpg', 'jpeg', 'png', 'gif'].includes(ext || '')) return 'image';
      return 'other';
    };
    
    // Helper function to map resource types from API to frontend categories
    const mapResourceTypeToCategory = (type: string): 'textbook' | 'notes' | 'questions' => {
      type = type.toLowerCase();
      if (type.includes('book') || type.includes('ebook') || type === 'textbook') return 'textbook';
      if (type.includes('note')) return 'notes';
      if (type.includes('question') || type.includes('exam') || type.includes('paper')) return 'questions';
      return 'textbook'; // Default
    };

    fetchResources();
  }, []);

  // Apply filters function - moved outside useEffect for reusability
  const applyFilters = useCallback(() => {
    // Always start with the original unchanged data
    let result = [...originalResources];
    
    // Apply search filter
    if (searchTerm) {
      result = result.filter(
        resource => 
          resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          resource.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          resource.uploadedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
          resource.subject?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply category filter
    if (filterCategory) {
      result = result.filter(resource => resource.category === filterCategory);
    }
    
    // Apply course filter - now using course_code
    if (filterCourse) {
      const selectedCourse = courses.find(course => course.id.toString() === filterCourse);
      if (selectedCourse && selectedCourse.course_code) {
        result = result.filter(resource => resource.course_code === selectedCourse.course_code);
      }
    }
    
    // Apply semester filter
    if (filterSemester !== undefined) {
      result = result.filter(resource => resource.semester === filterSemester);
    }
    
    // Apply sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        if (sortConfig.key) {
          const aValue = a[sortConfig.key as keyof Resource];
          const bValue = b[sortConfig.key as keyof Resource];
          if ((aValue ?? '') < (bValue ?? '')) {
            return sortConfig.direction === 'ascending' ? -1 : 1;
          }
          if ((aValue ?? '') > (bValue ?? '')) {
            return sortConfig.direction === 'ascending' ? 1 : -1;
          }
        }
        return 0;
      });
    }
    
    setFilteredResources(result);
  }, [originalResources, searchTerm, filterCategory, filterCourse, filterSemester, sortConfig, courses]);

  // Run the filter whenever any filter parameter changes
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const requestSort = (key: keyof Resource) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (columnName: keyof Resource) => {
    if (sortConfig.key !== columnName) {
      return <ChevronDown className="w-4 h-4 opacity-20" />;
    }
    return sortConfig.direction === 'ascending' ? 
      <ChevronUp className="w-4 h-4" /> : 
      <ChevronDown className="w-4 h-4" />;
  };

  const handleAddResource = () => {
    setCurrentResource(null);
    setIsModalOpen(true);
  };

  const handleEditResource = (resource: Resource) => {
    setCurrentResource(resource);
    setIsModalOpen(true);
  };

 // Modify the handleDeleteResource function to use notifications and show delete state
  const handleDeleteResource = async (id: string, resourceType: string) => {
    try {
      // Set the deleting state to show feedback to the user
      setDeletingResource(id);
      
      let response;
      let resourceTypeName = '';
      
      // Call different API endpoints based on resource type
      switch(resourceType) {
        case 'textbook':
          resourceTypeName = 'E-book';
          response = await api.deleteEbook(id);
          break;
        case 'notes':
          resourceTypeName = 'Note';
          response = await api.deleteNote(id);
          break;
        case 'questions':
          resourceTypeName = 'Question Paper';
          response = await api.deleteQuestionPaper(id);
          break;
        default:
          throw new Error('Unknown resource type');
      }
      
      // Check for success field in API response - this is the key fix
      if (response && response.success === true) {
        // On successful API delete, update the UIa
        const updatedResources = originalResources.filter(resource => resource.id !== id);
        setOriginalResources(updatedResources);
        applyFilters();
        
        // Show success notification
        setNotification({
          type: 'success',
          message: `${resourceTypeName} deleted successfully`
        });
        
        // Clear the notification after a few seconds
        setTimeout(() => {
          setNotification(null);
        }, 5000);
      } else {
        throw new Error(response?.message || `Failed to delete ${resourceTypeName.toLowerCase()}`);
      }
    } catch (error) {
      console.error('Error deleting resource:', error);
      
      // Show error notification
      setNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to delete resource. Please try again.'
      });
      
      // Clear the notification after a few seconds
      setTimeout(() => {
        setNotification(null);
      }, 5000);
    } finally {
      // Clear the deleting state
      setDeletingResource(null);
    }
  };

  const handleSaveResource = (resourceData: Omit<Resource, 'id'>) => {
    if (currentResource) {
      // Update existing resource
      const updatedOriginalResources = originalResources.map(resource => 
        resource.id === currentResource.id 
          ? { 
              ...resource, 
              ...resourceData,
              // Ensure consistency with types
              fileType: resourceData.fileType || resource.fileType,
              uploadDate: new Date().toISOString()
            } 
          : resource
      );
      setOriginalResources(updatedOriginalResources);
    } else {
      // Add new resource with proper type consistency
      const newResource: Resource = {
        id: `${Date.now()}`,
        ...resourceData,
        uploadDate: new Date().toISOString(),
        // Ensure all required fields are present
        fileType: resourceData.fileType || 'pdf',
        uploadedBy: resourceData.uploadedBy || 'Admin',
        url: resourceData.url || ''
      };
      setOriginalResources([...originalResources, newResource]);
    }
    setIsModalOpen(false);
    applyFilters();
  };

  // File type to icon/color mapping
  const getFileTypeDisplay = (fileType: string) => {
    const typeColors: Record<string, string> = {
      pdf: 'bg-red-100 text-red-800',
      doc: 'bg-blue-100 text-blue-800',
      ppt: 'bg-orange-100 text-orange-800',
      xlsx: 'bg-green-100 text-green-800',
      image: 'bg-purple-100 text-purple-800',
      other: 'bg-gray-100 text-gray-800'
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeColors[fileType] || typeColors.other}`}>
        <FileText className="w-3 h-3 mr-1" />
        {fileType.toUpperCase()}
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Notification Banner */}
      {notification && (
        <div className={`mb-6 p-4 rounded-md ${notification.type === 'success' ? 'bg-green-50' : 'bg-red-50'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {notification.type === 'success' ? (
                <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 mr-2 text-red-500" />
              )}
              <div className={`ml-1 text-sm font-medium ${notification.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>
                {notification.message}
              </div>
            </div>
            <button 
              onClick={() => setNotification(null)}
              className="text-gray-400 hover:text-gray-500"
            >
              <span className="sr-only">Dismiss</span>
              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Digital Resources</h1>
          <p className="text-gray-600">Manage e-books, notes, question papers and other digital materials</p>
        </div>
        
        <button 
          onClick={handleAddResource}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          Add Resource
        </button>
      </div>
      
      {/* Filters and search */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search resources..."
              className="pl-10 pr-4 py-2 border rounded-lg w-full focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex flex-wrap gap-3">
            <div className="relative">
              <select
                value={filterCategory || ''}
                onChange={(e) => setFilterCategory(e.target.value || undefined)}
                className="appearance-none bg-white border rounded-lg px-4 py-2 pr-8 leading-tight focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Categories</option>
                <option value="textbook">E-Books</option>
                <option value="notes">Notes</option>
                <option value="questions">Questions</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
            
            <div className="relative">
              <select
                value={filterCourse || ''}
                onChange={(e) => setFilterCourse(e.target.value || undefined)}
                className="appearance-none bg-white border rounded-lg px-4 py-2 pr-8 leading-tight focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                disabled={coursesLoading}
              >
                <option value="">All Courses</option>
                {coursesLoading ? (
                  <option disabled>Loading courses...</option>
                ) : (
                  courses.map(course => (
                    <option key={course.id} value={course.id}>
                      {course.course_code}
                    </option>
                  ))
                )}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
            
            <div className="relative">
              <select
                value={filterSemester !== undefined ? filterSemester.toString() : ''}
                onChange={(e) => setFilterSemester(e.target.value ? parseInt(e.target.value) : undefined)}
                className="appearance-none bg-white border rounded-lg px-4 py-2 pr-8 leading-tight focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Semesters</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map(semester => (
                  <option key={semester} value={semester}>{`Semester ${semester}`}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Resources Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {resourcesLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredResources.length === 0 ? (
          <div className="flex justify-center items-center h-64 text-gray-500">
            No resources found
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Resource
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => requestSort('fileType')}
                    >
                      <div className="flex items-center">
                        File Type
                        {getSortIcon('fileType')}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => requestSort('category')}
                    >
                      <div className="flex items-center">
                        Type
                        {getSortIcon('category')}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => requestSort('semester')}
                    >
                      <div className="flex items-center">
                        Semester
                        {getSortIcon('semester')}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => requestSort('uploadDate')}
                    >
                      <div className="flex items-center">
                        Date
                        {getSortIcon('uploadDate')}
                      </div>
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredResources.map((resource) => (
                    <tr key={resource.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 flex-shrink-0 mr-3">
                            <div className="w-full h-full flex items-center justify-center rounded bg-gray-100">
                              <FileText className="w-5 h-5 text-gray-500" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {resource.title}
                            </p>
                            <p className="text-sm text-gray-500 truncate">
                              {resource.course_code || 
                               courses.find(course => course.code === resource.course_code || course.course_code === resource.course_code)?.course_code || 
                               'Unknown Course'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getFileTypeDisplay(resource.fileType)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                        ${resource.category === 'textbook' ? 'bg-blue-100 text-blue-800' : 
                          resource.category === 'notes' ? 'bg-green-100 text-green-800' : 
                          'bg-orange-100 text-orange-800'}`}>
                          {resource.category === 'textbook' ? 'E-Book' : 
                           resource.category === 'notes' ? 'Notes' : 
                           'Question Paper'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                          Semester {resource.semester}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(resource.uploadDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          onClick={() => handleEditResource(resource)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                          disabled={deletingResource === resource.id}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteResource(resource.id, resource.category)}
                          className="text-red-600 hover:text-red-900"
                          disabled={deletingResource === resource.id}
                        >
                          {deletingResource === resource.id ? (
                            <Loader className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-gray-500 text-sm">
              {filteredResources.length} resources found
            </div>
          </>
        )}
      </div>

      {/* Resource Modal */}
      {isModalOpen && (
        <ResourceFormModal
          resource={currentResource}
          onSave={handleSaveResource}
          onClose={() => setIsModalOpen(false)}
          courses={courses}
        />
      )}
    </div>
  );
};

// Resource Form Modal Component
interface ResourceFormModalProps {
  resource: Resource | null;
  onSave: (data: Omit<Resource, 'id'>) => void;
  onClose: () => void;
  courses: Course[];
}

const ResourceFormModal: React.FC<ResourceFormModalProps> = ({ 
  resource, 
  onSave, 
  onClose,
  courses
}) => {
  const isEditing = !!resource;
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form data for digital resources only
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    courseId: string;
    category: 'textbook' | 'notes' | 'questions';
    semester: number;
    file?: File | null;
    url: string;
    fileType: 'pdf' | 'doc' | 'ppt' | 'xlsx' | 'image' | 'other';
    uploadedBy: string;
    subject: string;
    year: number;
    exam_type: 'midterm' | 'final' | 'quiz' | 'assignment' | 'other';
  }>({
    // Common fields - initialize with resource values if editing
    title: resource?.title || '',
    description: resource?.description || '',
    courseId: resource?.courseId || courses[0]?.id?.toString() || '',
    category: (resource?.category as 'textbook' | 'notes' | 'questions') || 'textbook',
    url: resource?.url || '',
    semester: resource?.semester || 1,
    file: null,
    fileType: resource?.fileType || 'pdf',
    uploadedBy: resource?.uploadedBy || '',
    subject: resource?.subject || '',
    year: typeof resource?.year === 'string' ? parseInt(resource.year, 10) : resource?.year || new Date().getFullYear(),
    exam_type: 'midterm',
  });

  const [filePreview, setFilePreview] = useState<string | null>(resource?.url || null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [varOcg, setVarOcg] = useState<'idle' | 'saving' | 'error'>('idle');
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: name === 'semester' || name === 'year'
        ? parseInt(value, 10) 
        : value
    }));

    // Clear notification when user makes changes
    if (notification) {
      setNotification(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files && e.target.files[0];
    setFileError(null);
    
    if (selectedFile) {
      // Check file size (limit to 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setFileError('File size should not exceed 10MB');
        return;
      }
      
      // Automatically detect file type
      let detectedFileType: 'pdf' | 'doc' | 'ppt' | 'xlsx' | 'image' | 'other' = 'other';
      const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();
      
      if (fileExtension === 'pdf') detectedFileType = 'pdf';
      else if (['doc', 'docx'].includes(fileExtension || '')) detectedFileType = 'doc';
      else if (['ppt', 'pptx'].includes(fileExtension || '')) detectedFileType = 'ppt';
      else if (['xls', 'xlsx'].includes(fileExtension || '')) detectedFileType = 'xlsx';
      else if (['jpg', 'jpeg', 'png', 'gif'].includes(fileExtension || '')) detectedFileType = 'image';
      
      setFormData(prev => ({
        ...prev,
        fileType: detectedFileType,
        file: selectedFile
      }));
      
      // Create a preview URL for the file
      const previewUrl = URL.createObjectURL(selectedFile);
      setFilePreview(previewUrl);
    } else {
      setFormData(prev => ({ ...prev, file: null }));
      setFilePreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset notifications and errors before starting validation
    setNotification(null);
    setFileError(null);
    
    // ------ Form Validation Based on API Requirements ------
    const errors = [];
    
    // Common validation for all resource types
    if (!formData.title.trim()) {
      errors.push('Title is required');
    } else if (formData.title.length > 255) {
      errors.push('Title must be less than 255 characters');
    }
    
    if (!formData.courseId) {
      errors.push('Please select a course');
    }
    
    if (formData.semester < 1) {
      errors.push('Semester must be at least 1');
    }
    
    // Validate subject field which is required by all APIs
    if (!formData.subject.trim()) {
      errors.push('Subject is required');
    } else if (formData.subject.length > 255) {
      errors.push('Subject must be less than 255 characters');
    }
    
    // Resource type specific validation
    if (formData.category === 'notes') {
      if (!formData.uploadedBy.trim()) {
        errors.push('Author is required for notes');
      } else if (formData.uploadedBy.length > 255) {
        errors.push('Author name must be less than 255 characters');
      }
    } else if (formData.category === 'questions') {
      if (!formData.year) {
        errors.push('Year is required for question papers');
      } else if (formData.year < 1900 || formData.year > new Date().getFullYear()) {
        errors.push(`Year must be between 1900 and ${new Date().getFullYear()}`);
      }
      
      // Validate exam_type for question papers
      if (!['midterm', 'final', 'supplementary', 'other'].includes(formData.exam_type)) {
        errors.push('Please select a valid exam type');
      }
    } else if (formData.category === 'textbook') {
      // E-book specific validation
      if (!formData.uploadedBy.trim()) {
        errors.push('Author is required for e-books');
      } else if (formData.uploadedBy.length > 255) {
        errors.push('Author name must be less than 255 characters');
      }
    }
    
    // File validation for new resources
    if (!isEditing && !formData.file) {
      errors.push('Please upload a file for the resource');
    }
    
    // Display the first error if any
    if (errors.length > 0) {
      setNotification({
        type: 'error',
        message: errors[0]
      });
      return;
    }
    
    // Set the saving state to show loading animation
    setVarOcg('saving');
    
    try {
      // Get course code from selected course
      const selectedCourse = courses.find(course => course.id.toString() === formData.courseId);
      const course_code = selectedCourse?.course_code || '';
      
      if (!course_code) {
        throw new Error('Could not determine course code. Please select a valid course.');
      }
      
      // If a file is selected, handle the upload based on category
      if (formData.file) {
        try {
          // Different handling based on resource category
          if (formData.category === 'textbook') {
            // For e-books, use the dedicated ebooks API endpoint
            const ebookData = {
              title: formData.title.trim(),
              description: formData.description.trim(),
              author: formData.uploadedBy.trim(),
              course_code: course_code,
              semester: formData.semester,
              subject: formData.subject.trim(),
              is_verified: true
            };
            
            // Use the ebooks API endpoint for e-books
            const response = await api.uploadEbook(ebookData, formData.file);
            
            if (response && (response.success === true || response.status === true)) {
              setVarOcg('idle');
              setNotification({
                type: 'success',
                message: `${isEditing ? 'Updated' : 'Added'} e-book successfully!`
              });
              
              setTimeout(() => {
                // Create a Resource object from the backend response and the form data
                const frontendResource: Omit<Resource, 'id'> = {
                  title: formData.title.trim(),
                  description: formData.description.trim(),
                  courseId: formData.courseId,
                  category: formData.category,
                  semester: formData.semester,
                  uploadDate: new Date().toISOString(),
                  uploadedBy: formData.uploadedBy.trim(),
                  fileType: formData.fileType,
                  url: (response.data as { file_path: string })?.file_path || '',
                  subject: formData.subject,
                  course_code: course_code // Ensure course_code is included
                };
                
                onSave(frontendResource);
                // Don't close the modal immediately on success, let the user see the success message
                setTimeout(() => onClose(), 1500);
              }, 500);
            } else {
              throw new Error(response?.message || 'Failed to save e-book. Server returned an error.');
            }
          } else if (formData.category === 'notes') {
            // For notes, use the notes API endpoint
            const notesData = {
              title: formData.title.trim(),
              description: formData.description.trim(),
              author: formData.uploadedBy.trim(),
              course_code: course_code,
              semester: formData.semester,
              subject: formData.subject.trim()
            };

            // Use the notes API endpoint
            const response = await api.uploadNotes(notesData, formData.file);
            
            if (response && (response.success === true || response.status === true)) {
              setVarOcg('idle');
              setNotification({
                type: 'success',
                message: `${isEditing ? 'Updated' : 'Added'} notes successfully!`
              });
              
              setTimeout(() => {
                const frontendResource: Omit<Resource, 'id'> = {
                  title: formData.title.trim(),
                  description: formData.description.trim(),
                  courseId: formData.courseId,
                  category: formData.category,
                  semester: formData.semester,
                  uploadDate: new Date().toISOString(),
                  uploadedBy: formData.uploadedBy.trim(),
                  fileType: formData.fileType,
                  url: (response.data as { file_path: string })?.file_path || '',
                  subject: formData.subject,
                  course_code: course_code // Ensure course_code is included
                };
                
                onSave(frontendResource);
                // Don't close the modal immediately on success, let the user see the success message
                setTimeout(() => onClose(), 1500);
              }, 500);
            } else {
              throw new Error(response?.message || 'Failed to save notes. Server returned an error.');
            }
          } else if (formData.category === 'questions') {
            // For question papers, use the oldquestion API endpoint
            const questionData = {
              title: formData.title.trim(),
              description: formData.description.trim(),
              author: formData.uploadedBy.trim(),
              course_code: course_code,
              semester: formData.semester,
              subject: formData.subject.trim(),
              exam_type: formData.exam_type, // Include exam_type in the API request
              year: formData.year.toString()
            };

            // Use the question papers API endpoint
            const response = await api.uploadQuestionPaper(questionData, formData.file);
            
            if (response && (response.success === true || response.status === true)) {
              setVarOcg('idle');
              setNotification({
                type: 'success',
                message: `${isEditing ? 'Updated' : 'Added'} question paper successfully!`
              });
              
              setTimeout(() => {
                const frontendResource: Omit<Resource, 'id'> = {
                  title: formData.title.trim(),
                  description: formData.description.trim(),
                  courseId: formData.courseId,
                  category: formData.category,
                  semester: formData.semester,
                  uploadDate: new Date().toISOString(),
                  uploadedBy: formData.uploadedBy.trim(),
                  fileType: formData.fileType,
                  url: (response.data as { file_path: string })?.file_path || '',
                  subject: formData.subject,
                  exam_type: formData.exam_type, // Include in the frontend resource as well
                  year: formData.year.toString(),
                  course_code: course_code // Ensure course_code is included
                };
                
                onSave(frontendResource);
                // Don't close the modal immediately on success, let the user see the success message
                setTimeout(() => onClose(), 1500);
              }, 500);
            } else {
              throw new Error(response?.message || 'Failed to save question paper. Server returned an error.');
            }
          }
        } catch (uploadError) {
          setVarOcg('error');
          throw new Error(uploadError instanceof Error ? uploadError.message : 'Failed to upload resource. Please try again.');
        }
      } else if (isEditing) {
        // Handle update logic for editing with or without new file upload
        try {
          const resourceData = {
            title: formData.title.trim(),
            description: formData.description.trim(),
            author: formData.uploadedBy.trim(),
            course_code: course_code,
            semester: formData.semester,
            subject: formData.subject.trim()
          };

          // Add category-specific fields
          if (formData.category === 'questions') {
            Object.assign(resourceData, {
              exam_type: formData.exam_type,
              year: formData.year.toString()
            });
          }

          // Get the resource ID
          const resourceId = resource?.id;
          let response;

          if (!resourceId) {
            throw new Error('Resource ID is missing for update operation');
          }

          // Call different API endpoints based on resource type
          switch (formData.category) {
            case 'textbook':
              response = await api.updateEbook(resourceId, resourceData, formData.file || undefined);
              break;
            case 'notes':
              response = await api.updateNote(resourceId, resourceData, formData.file || undefined);
              break;
            case 'questions':
              response = await api.updateQuestionPaper(resourceId, resourceData, formData.file || undefined);
              break;
            default:
              throw new Error('Unknown resource type');
          }
          
          if (response && (response.success === true || response.status === true)) {
            setVarOcg('idle');
            setNotification({
              type: 'success',
              message: `Updated resource successfully!`
            });
            
            setTimeout(() => {
              // Create resource object using updated data
              const frontendResource: Omit<Resource, 'id'> = {
                title: formData.title.trim(),
                description: formData.description.trim(),
                courseId: formData.courseId,
                category: formData.category,
                semester: formData.semester,
                uploadDate: new Date().toISOString(),
                uploadedBy: formData.uploadedBy.trim(),
                fileType: formData.fileType,
                url: formData.file ? (response.data as { file_path: string })?.file_path || '' : resource?.url || '',
                subject: formData.subject,
                course_code: course_code,
                year: formData.category === 'questions' ? formData.year.toString() : undefined,
                exam_type: formData.category === 'questions' ? formData.exam_type : undefined
              };
              
              onSave(frontendResource);
              // Don't close the modal immediately on success, let the user see the success message
              setTimeout(() => onClose(), 1500);
            }, 500);
          } else {
            throw new Error(response?.message || 'Failed to update resource');
          }
        } catch (error) {
          setVarOcg('error');
          console.error('Error updating resource:', error);
          setNotification({
            type: 'error',
            message: error instanceof Error ? error.message : 'Failed to update resource. Please try again.'
          });
        }
      }
    } catch (error) {
      setVarOcg('error');
      console.error('Error saving resource:', error);
      setNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to save resource. Please try again.'
      });
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const removeSelectedFile = () => {
    setFormData(prev => ({ ...prev, file: null }));
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" onClick={onClose}>
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
              {isEditing ? 'Edit Digital Resource' : 'Add New Digital Resource'}
            </h3>
            
            {notification && (
              <div className={`mb-4 p-4 rounded-md ${notification.type === 'success' ? 'bg-green-50' : 'bg-red-50'}`}>
                <div className="flex items-center">
                  {notification.type === 'success' ? (
                    <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 mr-2 text-red-500" />
                  )}
                  <div className={`ml-1 text-sm font-medium ${notification.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>
                    {notification.message}
                  </div>
                </div>
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  disabled={varOcg === 'saving'}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  disabled={varOcg === 'saving'}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="courseId" className="block text-sm font-medium text-gray-700 mb-1">
                    Course
                  </label>
                  <select
                    id="courseId"
                    name="courseId"
                    value={formData.courseId}
                    onChange={handleChange}
                    required
                    disabled={varOcg === 'saving'}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    {courses && courses.length > 0 ? (
                      courses.map(course => (
                        <option key={course.id} value={course.id}>
                          {course.course_code}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>No courses available</option>
                    )}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                    disabled={varOcg === 'saving'}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="textbook">E-Book</option>
                    <option value="notes">Notes</option>
                    <option value="questions">Questions</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="fileType" className="block text-sm font-medium text-gray-700 mb-1">
                    File Type
                  </label>
                  <select
                    id="fileType"
                    name="fileType"
                    value={formData.fileType}
                    onChange={handleChange}
                    required
                    disabled={varOcg === 'saving'}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="pdf">PDF</option>
                    <option value="doc">DOC</option>
                    <option value="ppt">PPT</option>
                    <option value="xlsx">XLSX</option>
                    <option value="image">Image</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="semester" className="block text-sm font-medium text-gray-700 mb-1">
                    Semester
                  </label>
                  <select
                    id="semester"
                    name="semester"
                    value={formData.semester}
                    onChange={handleChange}
                    required
                    disabled={varOcg === 'saving'}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((semester) => (
                      <option key={semester} value={semester}>
                        Semester {semester}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="mb-4">
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                  Subject <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  disabled={varOcg === 'saving'}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Mathematics, Computer Science, Physics, etc."
                />
              </div>
              
              {(formData.category === 'textbook' || formData.category === 'notes') && (
                <div className="mb-4">
                  <label htmlFor="uploadedBy" className="block text-sm font-medium text-gray-700 mb-1">
                    Author <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="uploadedBy"
                    name="uploadedBy"
                    value={formData.uploadedBy}
                    onChange={handleChange}
                    required
                    disabled={varOcg === 'saving'}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., John Doe, Jane Smith, etc."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.category === 'textbook' ? 'Author of the e-book' : 'Author/creator of the notes'}
                  </p>
                </div>
              )}
              
              {formData.category === 'questions' && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Question Paper Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">
                        Year
                      </label>
                      <input
                        type="number"
                        id="year"
                        name="year"
                        min="1990"
                        max={new Date().getFullYear()}
                        value={formData.year}
                        onChange={handleChange}
                        disabled={varOcg === 'saving'}
                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="exam_type" className="block text-sm font-medium text-gray-700 mb-1">
                        Exam Type
                      </label>
                      <select
                        id="exam_type"
                        name="exam_type"
                        value={formData.exam_type}
                        onChange={handleChange}
                        disabled={varOcg === 'saving'}
                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="midterm">Midterm</option>
                        <option value="final">Final</option>
                        <option value="quiz">Quiz</option>
                        <option value="assignment">Assignment</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Resource File
                </label>
                
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={varOcg === 'saving'}
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.xlsx,.xls,.jpg,.jpeg,.png,.gif"
                />
                
                {filePreview || formData.url ? (
                  <div className="border rounded-md p-3 mb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <FileText className="h-6 w-6 text-blue-500 mr-2" />
                        <span className="text-sm truncate max-w-[200px]">
                          {formData.file?.name || (formData.url && 'Current file')}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={removeSelectedFile}
                        disabled={varOcg === 'saving'}
                        className="text-red-600 hover:text-red-800 text-sm ml-2"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div 
                      onClick={triggerFileInput}
                      className={`border-2 border-dashed border-gray-300 rounded-md p-6 flex flex-col items-center cursor-pointer hover:border-blue-500 transition-colors ${varOcg === 'saving' ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <Upload className="h-8 w-8 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        PDF, DOC, PPT, XLSX, images, etc. (Max 10MB)
                      </p>
                    </div>
                    {fileError && (
                      <p className="text-red-500 text-xs mt-1">{fileError}</p>
                    )}
                  </>
                )}
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={varOcg === 'saving'}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={varOcg === 'saving'}
                  className="flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {varOcg === 'saving' && (
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-t-2 border-white" />
                  )}
                  {varOcg === 'saving'
                    ? 'Saving…'
                    : isEditing
                    ? 'Update'
                    : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourcesManager;
