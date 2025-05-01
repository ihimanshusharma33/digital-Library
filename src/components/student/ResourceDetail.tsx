import React from 'react';
import { Download, AlertCircle, Clock, BookOpen, FileText, FileQuestion } from 'lucide-react';

interface Resource {
  id: string;
  title: string;
  description: string;
  type: 'ebook' | 'notes' | 'question';
  subject: string;
  author: string;
  fileUrl: string;
  thumbnail?: string;
  created_at: string;
  status: 'pending' | 'approved' | 'rejected';
  user_id: string;
  course_code: string;
  semester: number;
  view_count: number;
  download_count: number;
  likes: number;
}

interface ResourceDetailProps {
  resource: Resource;
}

const ResourceDetail: React.FC<ResourceDetailProps> = ({ resource }) => {
  // Helper functions
  const getResourceTypeIcon = (type: string) => {
    switch(type) {
      case 'ebook': 
        return <BookOpen className="h-5 w-5 text-blue-600" />;
      case 'notes': 
        return <FileText className="h-5 w-5 text-green-600" />;
      case 'question': 
        return <FileQuestion className="h-5 w-5 text-orange-600" />;
      default: 
        return <FileText className="h-5 w-5 text-gray-600" />;
    }
  };
  
  const getResourceTypeLabel = (type: string): string => {
    switch(type) {
      case 'ebook': return 'E-Book';
      case 'notes': return 'Notes';
      case 'question': return 'Question Paper';
      default: return 'Resource';
    }
  };
  
  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'approved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Approved
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            Under Review
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            Rejected
          </span>
        );
      default:
        return null;
    }
  };
  
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div>
      <div className="flex items-start mb-4">
        <div className="flex-shrink-0">
          <div className="w-16 h-16 rounded bg-gray-100 flex items-center justify-center">
            {resource.thumbnail ? (
              <img 
                src={resource.thumbnail} 
                alt={resource.title} 
                className="w-16 h-16 object-cover rounded"
              />
            ) : (
              getResourceTypeIcon(resource.type)
            )}
          </div>
        </div>
        <div className="ml-4">
          <h4 className="text-lg font-medium text-gray-900">{resource.title}</h4>
          <p className="text-sm text-gray-500">
            {getResourceTypeLabel(resource.type)} • {resource.subject}
          </p>
          <div className="mt-1">
            {getStatusBadge(resource.status)}
          </div>
        </div>
      </div>
      
      <div className="border-t border-gray-200 pt-4">
        <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
          <div className="sm:col-span-1">
            <dt className="text-sm font-medium text-gray-500">Author</dt>
            <dd className="mt-1 text-sm text-gray-900">{resource.author}</dd>
          </div>
          <div className="sm:col-span-1">
            <dt className="text-sm font-medium text-gray-500">Course Code</dt>
            <dd className="mt-1 text-sm text-gray-900">{resource.course_code}</dd>
          </div>
          <div className="sm:col-span-1">
            <dt className="text-sm font-medium text-gray-500">Semester</dt>
            <dd className="mt-1 text-sm text-gray-900">{resource.semester}</dd>
          </div>
          <div className="sm:col-span-1">
            <dt className="text-sm font-medium text-gray-500">Upload Date</dt>
            <dd className="mt-1 text-sm text-gray-900">{formatDate(resource.created_at)}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-sm font-medium text-gray-500">Description</dt>
            <dd className="mt-1 text-sm text-gray-900">{resource.description || "No description provided"}</dd>
          </div>
          
          {resource.status === 'approved' && (
            <>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Views</dt>
                <dd className="mt-1 text-sm text-gray-900">{resource.view_count}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Downloads</dt>
                <dd className="mt-1 text-sm text-gray-900">{resource.download_count}</dd>
              </div>
            </>
          )}
        </dl>
      </div>
      
      {resource.status === 'rejected' && (
        <div className="mt-4 p-4 bg-red-50 rounded-md">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 mr-2" />
            <div>
              <h4 className="text-sm font-medium text-red-800">Rejection Reason</h4>
              <p className="mt-1 text-sm text-red-700">
                This submission was rejected because it contains content that violates our guidelines.
                Please review our content policy and submit again.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {resource.status === 'pending' && (
        <div className="mt-4 p-4 bg-yellow-50 rounded-md">
          <div className="flex">
            <Clock className="h-5 w-5 text-yellow-400 mt-0.5 mr-2" />
            <div>
              <h4 className="text-sm font-medium text-yellow-800">Under Review</h4>
              <p className="mt-1 text-sm text-yellow-700">
                Your submission is currently being reviewed by our librarians.
                This process usually takes 1-2 business days.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResourceDetail;