import React, { useState, useEffect } from 'react';
import { Course, Resource } from '../types';
import Header from './Layout/Header';
import Footer from './Layout/Footer';
import { ArrowLeft, BookOpen, FileText, FileQuestion, Download, Eye, ExternalLink } from 'lucide-react';
import { API_ENDPOINTS } from '../utils/apiService';
import { getApiBaseUrl } from '../utils/config';

interface ResourceListProps {
    Course: Course;
    semester: number;
    onclose: () => void;
}

type TabType = 'ebooks' | 'notes' | 'questions';

const ResourceList: React.FC<ResourceListProps> = ({
    semester,
    Course,
    onclose,
}) => {
    const [activeTab, setActiveTab] = useState<TabType>('ebooks');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Resources state
    const [ebooks, setEbooks] = useState<Resource[]>([]);
    const [notes, setNotes] = useState<Resource[]>([]);
    const [questions, setQuestions] = useState<Resource[]>([]);

    // Fetch resources on component mount and when semester/course changes
    useEffect(() => {
        const fetchResources = async () => {
            try {
                setLoading(true);
                setError(null);

                const url = `${getApiBaseUrl()}${API_ENDPOINTS.RESOURCES}?course_code=${Course.course_code}&semester=${semester}`;
                const response = await fetch(url);

                if (!response.ok) {
                    throw new Error('Failed to fetch resources');
                }

                const data = await response.json();

                if (data && data.status && data.data) {
                    // Process e-books
                    if (data.data.ebooks) {
                        const ebooksData = data.data.ebooks.map((ebook: any) => ({
                            id: ebook.id.toString(),
                            title: ebook.title,
                            author: ebook.author || '',
                            type: 'ebook',
                            courseCode: ebook.course_code,
                            semester: ebook.semester,
                            subject: ebook.subject || '',
                            description: ebook.description || '',
                            fileUrl: ebook.file_url,
                            thumbnail: ebook.thumbnail || null,
                            createdAt: ebook.created_at
                        }));
                        setEbooks(ebooksData);
                    } else {
                        setEbooks([]);
                    }

                    // Process notes
                    if (data.data.notes) {
                        const notesData = data.data.notes.map((note: any) => ({
                            id: note.id.toString(),
                            title: note.title,
                            author: note.author || '',
                            type: 'note',
                            courseCode: note.course_code,
                            semester: note.semester,
                            subject: note.subject || '',
                            description: note.description || '',
                            fileUrl: note.file_url,
                            thumbnail: note.thumbnail || null,
                            createdAt: note.created_at
                        }));
                        setNotes(notesData);
                    } else {
                        setNotes([]);
                    }

                    // Process question papers
                    if (data.data.oldquestion) {
                        const questionsData = data.data.oldquestion.map((question: any) => ({
                            id: question.id.toString(),
                            title: question.title,
                            author: question.author || '',
                            type: 'question',
                            courseCode: question.course_code,
                            semester: question.semester,
                            subject: question.subject || '',
                            description: question.description || '',
                            fileUrl: question.file_url,
                            thumbnail: question.thumbnail || null,
                            createdAt: question.created_at
                        }));
                        setQuestions(questionsData);
                    } else {
                        setQuestions([]);
                    }
                } else {
                    setEbooks([]);
                    setNotes([]);
                    setQuestions([]);
                    setError('No resources found for this semester');
                }
            } catch (err) {
                console.error('Error fetching resources:', err);
                setError('Failed to load resources. Please try again later.');
                setEbooks([]);
                setNotes([]);
                setQuestions([]);
            } finally {
                setLoading(false);
            }
        };

        fetchResources();
    }, [Course.course_code, semester]);

    // Format date for display
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Handle resource download/open
    const handleResourceAction = (resource: Resource, action: 'download' | 'view') => {
        if (action === 'download') {
            // Create an anchor element to trigger download
            const link = document.createElement('a');
            link.href = resource.file_path || '';
            link.download = resource.title;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            // Open in new tab
            window.open(resource.file_path, '_blank');
        }
    };

    // Determine which resources to show based on active tab
    const getActiveResources = () => {
        switch (activeTab) {
            case 'ebooks': return ebooks;
            case 'notes': return notes;
            case 'questions': return questions;
            default: return [];
        }
    };

    // Get the icon for resource type
    const getResourceIcon = (type: TabType) => {
        switch (type) {
            case 'ebooks': return <BookOpen className="h-5 w-5" />;
            case 'notes': return <FileText className="h-5 w-5" />;
            case 'questions': return <FileQuestion className="h-5 w-5" />;
            default: return <BookOpen className="h-5 w-5" />;
        }
    };

    const activeResources = getActiveResources();

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Header />

            <main className="flex-grow">
                {/* Course Info Header */}
                <div className="bg-white shadow">
                    <div className="max-w-7xl mx-auto px-4 py-6">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                            <div className="flex items-center">
                                <button
                                    onClick={onclose}
                                    className="mr-4 p-2 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                                    aria-label="Go back"
                                >
                                    <ArrowLeft className="h-5 w-5 text-gray-600" />
                                </button>
                                <div className="flex-grow">
                                    <h1 className="text-2xl font-bold text-gray-900">{Course.course_name} &nbsp; Semester {semester} </h1>
                                    {Course.description && (
                                        <h1 className="text-xl font-semi-bold text-gray-900">{Course.description}</h1>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="bg-white border-b">
                    <div className="max-w-7xl mx-auto px-4">
                        <div className="flex space-x-8 overflow-x-auto">
                            <button
                                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'ebooks'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                                onClick={() => setActiveTab('ebooks')}
                            >
                                <BookOpen className="mr-2 h-5 w-5" />
                                E-Books
                                <span className="ml-2 bg-gray-100 text-gray-700 py-0.5 px-2 rounded-full text-xs">
                                    {ebooks.length}
                                </span>
                            </button>

                            <button
                                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'notes'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                                onClick={() => setActiveTab('notes')}
                            >
                                <FileText className="mr-2 h-5 w-5" />
                                Notes
                                <span className="ml-2 bg-gray-100 text-gray-700 py-0.5 px-2 rounded-full text-xs">
                                    {notes.length}
                                </span>
                            </button>

                            <button
                                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'questions'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                                onClick={() => setActiveTab('questions')}
                            >
                                <FileQuestion className="mr-2 h-5 w-5" />
                                Question Papers
                                <span className="ml-2 bg-gray-100 text-gray-700 py-0.5 px-2 rounded-full text-xs">
                                    {questions.length}
                                </span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Resources Content Area */}
                <div className="max-w-7xl mx-auto px-4 py-8">
                    {/* Tab Content */}
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="flex flex-col items-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                                <p className="mt-4 text-gray-500">Loading {activeTab}...</p>
                            </div>
                        </div>
                    ) : error ? (
                        <div className="bg-red-50 p-6 rounded-lg text-center">
                            <p className="text-red-600">{error}</p>
                            <button
                                onClick={() => window.location.reload()}
                                className="mt-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
                            >
                                Try Again
                            </button>
                        </div>
                    ) : activeResources.length === 0 ? (
                        <div className="bg-gray-50 p-12 rounded-lg text-center">
                            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-gray-100 mb-4">
                                {getResourceIcon(activeTab)}
                            </div>
                            <h3 className="text-lg font-medium text-gray-900">No {activeTab} available</h3>
                            <p className="mt-2 text-gray-500">
                                {activeTab === 'ebooks' && "There are no e-books available for this semester yet."}
                                {activeTab === 'notes' && "There are no notes available for this semester yet."}
                                {activeTab === 'questions' && "There are no question papers available for this semester yet."}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-6">
                            {activeResources.map((resource) => (
                                <div key={resource.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
                                    <div className="p-6">
                                        <div className="flex items-start">
                                            <div className="flex-shrink-0">
                                                <div className="w-12 h-12 rounded bg-blue-100 flex items-center justify-center">
                                                    {activeTab === 'ebooks' && <BookOpen className="h-6 w-6 text-blue-600" />}
                                                    {activeTab === 'notes' && <FileText className="h-6 w-6 text-blue-600" />}
                                                    {activeTab === 'questions' && <FileQuestion className="h-6 w-6 text-blue-600" />}
                                                </div>
                                            </div>
                                            <div className="ml-4 flex-1">
                                                <h3 className="text-lg font-medium text-gray-900">{resource.title}</h3>
                                                <div className="mt-1 flex flex-wrap items-center text-sm text-gray-500 gap-x-4 gap-y-1">
                                                    {resource.subject && (
                                                        <span>{resource.subject}</span>
                                                    )}
                                                    {resource.author && (
                                                        <span>By: {resource.author}</span>
                                                    )}
                                                    <span>Added: {formatDate(resource.created_at || '')}</span>
                                                </div>
                                                {resource.description && (
                                                    <p className="mt-3 text-gray-600">{resource.description}</p>
                                                )}
                                                <div className="mt-4 flex flex-wrap gap-3">
                                                    <button
                                                        onClick={() => handleResourceAction(resource, 'download')}
                                                        className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md bg-green-50 text-green-700 hover:bg-green-100 focus:outline-none"
                                                    >
                                                        <Download className="mr-1.5 h-4 w-4" />
                                                        Download
                                                    </button>
                                                    <a
                                                        href={resource.file_path}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 focus:outline-none"
                                                    >
                                                        <ExternalLink className="mr-1.5 h-4 w-4" />
                                                        Open in New Tab
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default ResourceList;