import React, { useState, useEffect } from 'react';
import { Book, Upload, FileText, AlertCircle, Download, Plus, BookOpen, FileQuestion } from 'lucide-react';
import { useAuth } from '../../utils/AuthContext';
import { api } from '../../utils/apiService';
import ResourceUploadModal from './ResourceUploadModal';
import { useNavigate } from 'react-router-dom';

// Define interfaces for each resource type
interface EBook {
    id: number;
    title: string;
    description: string;
    author: string;
    file_path: string;
    course_code: string;
    semester: number;
    is_verified: boolean;
    created_at: string;
    updated_at: string;
}

interface Note {
    id: number;
    title: string;
    description: string;
    subject: string;
    author: string;
    file_path: string;
    course_code: string;
    semester: number;
    is_verified: boolean;
    created_at: string;
    updated_at: string;
}

interface QuestionPaper {
    id: number;
    title: string;
    description: string;
    subject: string;
    file_path: string;
    course_code: string;
    semester: number;
    exam_type: string;
    exam_date: string;
    is_verified: boolean;
    created_at: string;
    updated_at: string;
}

// Combined interface for all types of resources
interface ResourceData {
    ebooks: EBook[];
    notes: Note[];
    question_papers: QuestionPaper[];
}

// Generic resource type for UI representation
interface DisplayResource {
    id: number;
    title: string;
    description: string;
    type: 'ebook' | 'note' | 'question_paper';
    subject?: string;
    author?: string;
    file_path: string;
    course_code: string;
    semester: number;
    is_verified: boolean;
    created_at: string;
    updated_at: string;
    exam_type?: string;
    exam_date?: string;
}

const ResourceList: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [resourceData, setResourceData] = useState<ResourceData>({ ebooks: [], notes: [], question_papers: [] });
    const [displayResources, setDisplayResources] = useState<DisplayResource[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showUploadModal, setShowUploadModal] = useState(false);

    // Fetch resources on component mount and when user changes
    useEffect(() => {
        if (user?.user_id) {
            fetchUserResources();
        }
    }, [user?.user_id]);

    // Process the fetched resources into a flat array for display
    useEffect(() => {
        const allResources: DisplayResource[] = [
            ...resourceData.ebooks.map(ebook => ({
                ...ebook,
                type: 'ebook' as const,
                subject: undefined
            })),
            ...resourceData.notes.map(note => ({
                ...note,
                type: 'note' as const
            })),
            ...resourceData.question_papers.map(paper => ({
                ...paper,
                type: 'question_paper' as const,
                author: undefined
            }))
        ];

        // Sort by most recent first
        allResources.sort((a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        setDisplayResources(allResources);
    }, [resourceData]);

    const fetchUserResources = async () => {
        if (!user?.user_id) {
            setError("User ID not found. Please log in.");
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const response = await api.get<{ status: boolean; data: ResourceData }>(`/resources?user_id=${user.user_id}`);

            if (response.data && response.status) {
                console.log("User resources data:", response.data);
                setResourceData(response.data);
            } else {
                setError("Failed to load resources data");
            }
        } catch (err) {
            console.error("Error fetching resources:", err);
            setError("Failed to load resources. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    // Helper functions
    const formatDate = (dateString: string): string => {
        const options: Intl.DateTimeFormatOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    const getResourceTypeIcon = (type: string) => {
        switch (type) {
            case 'ebook':
                return <BookOpen className="h-5 w-5 text-blue-600" />;
            case 'note':
                return <FileText className="h-5 w-5 text-green-600" />;
            case 'question_paper':
                return <FileQuestion className="h-5 w-5 text-orange-600" />;
            default:
                return <FileText className="h-5 w-5 text-gray-600" />;
        }
    };



    const getTypeLabel = (type: string): string => {
        switch (type) {
            case 'ebook': return 'E-Book';
            case 'note': return 'Note';
            case 'question_paper': return 'Question Paper';
            default: return 'Resource';
        }
    };

    const handleDeleteResource = async (resource: DisplayResource) => {
        if (!confirm(`Are you sure you want to delete this ${getTypeLabel(resource.type).toLowerCase()}?`)) {
            return;
        }

        try {
            let endpoint = '';
            switch (resource.type) {
                case 'ebook':
                    endpoint = `/ebooks/${resource.id}`;
                    break;
                case 'note':
                    endpoint = `/notes/${resource.id}`;
                    break;
                case 'question_paper':
                    endpoint = `/question-papers/${resource.id}`;
                    break;
            }

            await api.delete(endpoint);

            // Update resources list after deletion
            setDisplayResources(displayResources.filter(r => !(r.id === resource.id && r.type === resource.type)));

            // Also update the original data
            fetchUserResources();
        } catch (err) {
            console.error("Error deleting resource:", err);
            alert("Failed to delete resource. Please try again.");
        }
    };


    const getResourceCount = (): number => {
        return resourceData.ebooks.length + resourceData.notes.length + resourceData.question_papers.length;
    };

    const hasResources = (): boolean => {
        return getResourceCount() > 0;
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                    <Book className="h-6 w-6 mr-2 text-blue-600" />
                    My Uploaded Resources
                </h1>

                <button
                    onClick={() => setShowUploadModal(true)}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Upload New Resource
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            ) : error ? (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
                    <div className="flex items-center">
                        <AlertCircle className="h-5 w-5 mr-2" />
                        <span>{error}</span>
                    </div>
                </div>
            ) : !hasResources() ? (
                <div className="bg-blue-50 border border-blue-200 text-blue-700 p-8 rounded-md text-center">
                    <Upload className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="text-lg font-semibold">No Resources Uploaded</p>
                    <p className="mt-1 mb-4">You haven't uploaded any resources yet.</p>
                    <button
                        onClick={() => setShowUploadModal(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                        Upload Your First Resource
                    </button>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Summary counts */}
                    <div className="flex space-x-4 text-sm text-gray-500">
                        <div>Total: {getResourceCount()}</div>
                        {resourceData.ebooks.length > 0 && (
                            <div>E-Books: {resourceData.ebooks.length}</div>
                        )}
                        {resourceData.notes.length > 0 && (
                            <div>Notes: {resourceData.notes.length}</div>
                        )}
                        {resourceData.question_papers.length > 0 && (
                            <div>Question Papers: {resourceData.question_papers.length}</div>
                        )}
                    </div>

                    {/* Resource cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {displayResources.map((resource) => (
                            <div
                                key={`${resource.type}-${resource.id}`}
                                className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-all hover:border-blue-300"
                            >
                                {/* Card Header with Icon & Badge */}
                                <div className="px-5 pt-5 pb-3">
                                    <div className="flex items-start">
                                        {/* Resource Type Icon */}
                                        <div className="flex-shrink-0">
                                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                                                resource.type === 'ebook' ? 'bg-blue-50 text-blue-600' : 
                                                resource.type === 'note' ? 'bg-green-50 text-green-600' : 
                                                'bg-orange-50 text-orange-600'
                                            }`}>
                                                {getResourceTypeIcon(resource.type)}
                                            </div>
                                        </div>

                                        {/* Title and Type */}
                                        <div className="ml-4 flex-grow min-w-0">
                                            <h3 className="text-lg font-semibold text-gray-800 truncate pr-2">
                                                {resource.title}
                                            </h3>
                                            <div className="flex items-center mt-1">
                                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                                    resource.type === 'ebook' ? 'bg-blue-100 text-blue-800' : 
                                                    resource.type === 'note' ? 'bg-green-100 text-green-800' : 
                                                    'bg-orange-100 text-orange-800'
                                                }`}>
                                                    {getTypeLabel(resource.type)}
                                                </span>
                                                {resource.subject && (
                                                    <span className="ml-2 text-xs text-gray-500">
                                                        {resource.subject}
                                                    </span>
                                                )}
                                                
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Description */}
                                    {resource.description && (
                                        <div className="mt-3">
                                            <p className="text-sm text-gray-600 line-clamp-2">
                                                {resource.description}
                                            </p>
                                        </div>
                                    )}
                                </div>
                                
                                {/* Card Divider with Course Info */}
                                <div className="px-5 py-2 bg-gray-50 text-xs font-medium">
                                    <span className="text-gray-600">{resource.course_code}</span>
                                    <span className="mx-2 text-gray-400">•</span>
                                    <span className="text-gray-600">Semester {resource.semester}</span>
                                </div>
                                
                                {/* Card Footer */}
                                <div className="px-5 py-3 flex items-center justify-between">
                                    {/* Left side - metadata */}
                                    <div className="flex items-center text-xs text-gray-500">
                                        <span className="flex items-center">
                                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                            </svg>
                                            {formatDate(resource.created_at)}
                                        </span>
                                        {resource.author && (
                                            <span className="ml-3 flex items-center">
                                                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                                </svg>
                                                {resource.author}
                                            </span>
                                        )}
                                    </div>
                                    
                                    {/* Right side - actions */}
                                    <div className="flex space-x-2">
                                        <a
                                            href={resource.file_path}
                                            download
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-1.5 text-gray-500 hover:text-blue-600 rounded hover:bg-blue-50"
                                            title="Download"
                                        >
                                            <Download className="h-4 w-4" />
                                        </a>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Resource Upload Modal */}
            <ResourceUploadModal
                isOpen={showUploadModal}
                onClose={() => setShowUploadModal(false)}
                onSuccess={fetchUserResources}
            />
        </div>
    );
};

export default ResourceList;