import React, { useEffect, useState } from 'react';
import { Course, Resume, Note, QuestionPaper, ResourceType } from '../types';
import { ArrowLeft, BookOpen, FileText, FileQuestion, Download, File } from 'lucide-react';
import { api, API_ENDPOINTS } from '../utils/apiService';

interface SemesterSelectionProps {
  course: Course;
  onSemesterSelect: (semester: number) => void;
  onBack: () => void;
}

const SemesterSelection: React.FC<SemesterSelectionProps> = ({ course, onSemesterSelect, onBack }) => {
  const totalSemesters = course.total_semesters || 8; 
  const semesters = Array.from({ length: totalSemesters }, (_, i) => i + 1);
  const [selectedSemester, setSelectedSemester] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<ResourceType>('resume');
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [questionPapers, setQuestionPapers] = useState<QuestionPaper[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch resources based on the selected semester and active tab
  useEffect(() => {
    if (!selectedSemester) return;

    const fetchResources = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const params = {
          course_code: course.course_code || course.code || '',
          semester: selectedSemester.toString()
        };

        // Fetch resources based on the active tab
        if (activeTab === 'resume') {
          // Use the consistent API approach for books/textbooks
          const resumesData = await api.get(API_ENDPOINTS.BOOKS, params);
          setResumes(resumesData.data || []);
        }
        
        if (activeTab === 'note') {
          // Use the notes endpoint with course_code and semester parameters
          const notesData = await api.get(API_ENDPOINTS.NOTES, params);
          setNotes(notesData.data || []);
        }
        
        if (activeTab === 'question_paper') {
          // Use the question papers endpoint with course_code and semester parameters
          const questionPapersData = await api.get(API_ENDPOINTS.QUESTION_PAPERS, params);
          setQuestionPapers(questionPapersData.data || []);
        }
      } catch (err) {
        console.error(`Error fetching ${activeTab}:`, err);
        setError(`Failed to load ${activeTab}. Please try again later.`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResources();
  }, [activeTab, selectedSemester, course]);

  const handleSemesterClick = (semester: number) => {
    setSelectedSemester(semester);
    onSemesterSelect(semester);
  };

  const renderResourceList = () => {
    if (isLoading) {
      return <div className="text-center py-8">Loading resources...</div>;
    }

    if (error) {
      return <div className="text-center py-8 text-red-500">{error}</div>;
    }

    let resources: any[] = [];
    
    switch (activeTab) {
      case 'resume':
        resources = resumes;
        break;
      case 'note':
        resources = notes;
        break;
      case 'question_paper':
        resources = questionPapers;
        break;
    }

    if (resources.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          No {activeTab === 'resume' ? 'resumes' : activeTab === 'note' ? 'notes' : 'question papers'} available for this semester.
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {resources.map((resource) => (
          <div key={resource.id} className="bg-white p-4 rounded-lg border shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium text-gray-900">{resource.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{resource.description || 'No description available'}</p>
                <div className="flex items-center text-xs text-gray-500 mt-2">
                  <span className="mr-3">Uploaded by: {resource.uploaded_by}</span>
                  <span>Upload date: {new Date(resource.upload_date).toLocaleDateString()}</span>
                </div>
                <span className="inline-block mt-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  {resource.file_type}
                </span>
              </div>
              <a 
                href={resource.file_path} 
                className="flex items-center px-3 py-1.5 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Download className="w-4 h-4 mr-1" />
                Download
              </a>
            </div>
          </div>
        ))}
      </div>
    );
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
              <h1 className="text-2xl font-bold">{course.name || course.course_name}</h1>
              <p className="text-blue-100">{course.code || course.course_code}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {selectedSemester === null ? (
          <>
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Select Semester</h2>
              <p className="text-gray-600 mb-6">
                Choose a semester to view resources for {course.name || course.course_name}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {semesters.map((semester) => (
                <div
                  key={semester}
                  className="bg-white p-6 rounded-lg border hover:shadow-md transition-shadow cursor-pointer flex flex-col items-center"
                  onClick={() => handleSemesterClick(semester)}
                >
                  <div className="w-16 h-16 mb-4 rounded-full bg-blue-100 flex items-center justify-center">
                    <BookOpen className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="font-medium text-lg text-gray-900 mb-1">Semester {semester}</h3>
                  <p className="text-sm text-gray-500 text-center">
                    View all resources for semester {semester}
                  </p>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div>
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Semester {selectedSemester}</h2>
              <p className="text-gray-600">
                Resources for {course.name || course.course_name} - Semester {selectedSemester}
              </p>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-gray-200 mb-6">
              <nav className="flex -mb-px space-x-8">
                <button
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'resume' 
                      ? 'border-blue-500 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => setActiveTab('resume')}
                >
                  <div className="flex items-center">
                    <File className="w-4 h-4 mr-2" />
                    Resumes
                  </div>
                </button>
                <button
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'note' 
                      ? 'border-blue-500 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => setActiveTab('note')}
                >
                  <div className="flex items-center">
                    <FileText className="w-4 h-4 mr-2" />
                    Notes
                  </div>
                </button>
                <button
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'question_paper' 
                      ? 'border-blue-500 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => setActiveTab('question_paper')}
                >
                  <div className="flex items-center">
                    <FileQuestion className="w-4 h-4 mr-2" />
                    Question Papers
                  </div>
                </button>
              </nav>
            </div>

            {/* Resource List */}
            <div className="mt-6">
              {renderResourceList()}
            </div>

            {/* Back Button */}
            <button
              className="mt-8 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
              onClick={() => setSelectedSemester(null)}
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Semester Selection
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SemesterSelection;