import React, { useState, useEffect, useCallback } from 'react';
import {
  PlusCircle,
  Search,
  FileText,
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle,
  Loader // Import Loader icon for pending state
} from 'lucide-react';
import { Resource, Course } from '../../types';
import { API_ENDPOINTS, api } from '../../utils/apiService';
import { getApiBaseUrl } from '../../utils/config';
import ResourceFormModal from './modals/ResourceFormModal';

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

  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch courses from API
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setCoursesLoading(true);
        const response = await fetch(`${getApiBaseUrl()}${API_ENDPOINTS.COURSES}`);
        const data = await response.json();

        if (data && data.status) {
          const formattedCourses = data.data.map((course: any) => ({
            course_id: course.course_id.toString(),
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
        if (response && response.data) {
          console.log('Resources fetched successfully:', response.data);
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
          const ebookResources: Resource[] = ebooksData.map((item) => ({
            id: item.ebook_id.toString(),
            title: item.title || 'Untitled E-book',
            description: item.description || '',
            courseId: '',
            category: 'textbook', // E-books are mapped to textbook category
            semester: item.semester || 1,
            uploadDate: item.created_at || new Date().toISOString(),
            uploadedBy: item.author || 'Unknown',
            fileType: getFileTypeFromPath(item.file_path || ''),
            url: item.file_path || '',
            subject: '',
            course_id: item.course_id || '',
            author: item.author || ''
          }));

          // Transform notes to Resource objects
          const noteResources: Resource[] = notesData.map((item) => ({
            id: item.note_id.toString(),
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
            author: item.author || '',
            course_id: item.course_id || '',
          }));

          // Ensure the category is consistent
          const questionPaperResources: Resource[] = questionPapersData.map((item) => ({
            id: item.paper_id.toString(),
            title: item.title || 'Untitled Question Paper',
            description: item.description || '',
            course_id: item.course_id || '', // Ensure course_id is correctly set
            category: 'questions', // Ensure category matches the filter
            semester: item.semester || 1,
            uploadDate: item.created_at || new Date().toISOString(),
            uploadedBy: item.uploaded_by || 'Unknown',
            fileType: getFileTypeFromPath(item.file_path || ''),
            url: item.file_path || '',
            subject: item.subject || '',
            year: item.year?.toString() || new Date().getFullYear().toString(),
            exam_type: item.exam_type || 'midterm',
          }));

          // Combine all resource types into a single array
          const allResources: Resource[] = [
            ...ebookResources,
            ...noteResources,
            ...questionPaperResources
          ];
          // Store the original data that will never be modified after fetching
          setOriginalResources(allResources);
          // Initialize filtered resources with all resources
          setFilteredResources(allResources);
        } else {
          console.error('Failed to fetch resources or unexpected response format:', response);
        }
      } catch (error) {
        console.error('Error fetching resources:', error);
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

    // Apply course filter with better debugging and property checking
    if (filterCourse) {
      console.log('Filtering by course:', filterCourse);
      
      // Find the selected course
      const selectedCourse = courses.find(course => 
        course.course_id?.toString() === filterCourse);
      
      console.log('Selected course:', selectedCourse);
      
      // If we found a course, filter resources that match either course_id or course_code
      if (selectedCourse) {
        const courseId = selectedCourse.course_id?.toString();
        console.log('Course ID is selected', courseId);
        console.log(result);
        result = result.filter(resource =>  resource.id === courseId);
        
        console.log(`Filtered to ${result.length} resources`);
      } else {
        console.log('No matching course found');
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
      setDeletingResource(id);
      setSuccess(null);
      setError(null);

      let response;
      let resourceTypeName = '';

      switch (resourceType) {
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

      if (response && response.status) {
        setSuccess(`${resourceTypeName} deleted successfully.`);
        const updatedResources = originalResources.filter(resource => resource.id !== id);
        setOriginalResources(updatedResources);
        setFilteredResources(updatedResources);
      } else {
        console.log('coming in else block',response)
        throw new Error(response?.message || `Failed to delete ${resourceTypeName.toLowerCase()}`);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete resource. Please try again.');
    } finally {
      setDeletingResource(null);
    }
  };

  const handleSaveResource = (resourceData: Omit<Resource, 'id'>) => {
    setSuccess('Resource saved successfully!');
    setError(null);
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

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentResource(null);
  };

  const getCourseDisplay = (resource: Resource, courseList: Course[]) => {
    // If resource has a direct course name, use it
    if (resource.subject) return resource.subject;
    
    // Try to find matching course by ID or code
    const matchingCourse = courseList.find(course => 
      course.course_id.toString() === resource.course_id
    );
    
    // If found, return a formatted display
    if (matchingCourse) {
      return `${matchingCourse.course_name} (${matchingCourse.course_code})`;
    }
    
    // Fallback to any course ID info available
    return resource.course_id || resource.course_id || 'No Course';
  };

  return (
    <div className="max-w-7xl mx-auto">
      {success && (
        <div className="mb-6 p-4 rounded-md bg-green-50 text-green-700 flex items-center">
          <CheckCircle className="h-5 w-5 mr-2 text-green-500" /> {success}
          <button onClick={() => setSuccess(null)} className="ml-auto text-green-700 hover:text-green-900">&times;</button>
        </div>
      )}
      {error && (
        <div className="mb-6 p-4 rounded-md bg-red-50 text-red-700 flex items-center">
          <AlertCircle className="h-5 w-5 mr-2 text-red-500" /> {error}
          <button onClick={() => setError(null)} className="ml-auto text-red-700 hover:text-red-900">&times;</button>
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
                ) : courses.length > 0 ? (
                  courses.map(course => (
                    <option key={course.course_id} value={course.course_id}>
                      {course.course_name} ({course.course_code})
                    </option>
                  ))
                ) : (
                  <option disabled>No courses available</option>
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
                  {filteredResources.map((resource,index) => (
                    <tr key={index} className="hover:bg-gray-50">
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
                              {getCourseDisplay(resource, courses)}
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
          onClose={handleCloseModal}
          courses={courses}
          isOpen={isModalOpen}  // Use the same state variable for consistency
        />
      )}
    </div>
  );
};

export default ResourcesManager;
