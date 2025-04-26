import React from 'react';
import { UnifiedResource } from '../types';
import { FileText, Download, Calendar, BookOpen, FileQuestion, File } from 'lucide-react';

interface ResourceCardProps {
  resource: UnifiedResource;
}

// Helper to determine the file type icon based on resource type
const getResourceIcon = (resourceType: string) => {
  switch (resourceType) {
    case 'ebook':
      return <BookOpen className="w-4 h-4 text-blue-500" />;
    case 'note':
      return <FileText className="w-4 h-4 text-green-500" />;
    case 'question_paper':
      return <FileQuestion className="w-4 h-4 text-orange-500" />;
    default:
      return <File className="w-4 h-4 text-gray-500" />;
  }
};

// Helper to extract file extension from path
const getFileExtension = (filePath: string): string => {
  const match = filePath.match(/\.([^.]+)$/);
  return match ? match[1].toLowerCase() : 'unknown';
};

const ResourceCard: React.FC<ResourceCardProps> = ({ resource }) => {
  const { 
    title, 
    description, 
    author, 
    filePath, 
    semester,
    createdAt,
    resourceType,
    subject,
    examType,
    year
  } = resource;
  
  const fileExtension = getFileExtension(filePath);
  const createdAtFormatted = new Date(createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="bg-white rounded-lg border shadow-sm p-5 transition-shadow hover:shadow-md">
      <div className="mb-4">
        <div className="flex items-center mb-2">
          {getResourceIcon(resourceType)}
          <span className="text-xs text-gray-500 uppercase ml-2">
            {resourceType === 'ebook' ? 'E-Book' : 
             resourceType === 'note' ? 'Note' : 
             'Question Paper'}
          </span>
          <div className="ml-auto bg-blue-100 text-blue-800 text-xs font-medium rounded-full px-2.5 py-1">
            Sem {semester}
          </div>
        </div>
        <h3 className="font-medium text-gray-900 line-clamp-2">{title}</h3>
      </div>
      
      {description && (
        <div className="mb-4">
          <p className="text-sm text-gray-600 line-clamp-2">{description}</p>
        </div>
      )}
      
      {/* Resource-specific details */}
      <div className="flex flex-wrap gap-2 mb-3">
        {subject && (
          <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs text-gray-600">
            {subject}
          </span>
        )}
        
        {examType && (
          <span className="inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-xs text-yellow-700">
            {examType}
          </span>
        )}
        
        {year && (
          <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs text-blue-700">
            {year}
          </span>
        )}
        
        <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs text-red-700">
          .{fileExtension}
        </span>
      </div>
      
      <div className="flex flex-wrap items-center justify-between text-xs">
        <div className="flex items-center text-gray-500">
          <Calendar className="w-3 h-3 mr-1" />
          <span>{createdAtFormatted}</span>
        </div>
        
        <div className="flex items-center">
          <span className="text-gray-500 mr-2">By {author}</span>
          <button 
            className="p-1 rounded-full hover:bg-gray-100"
            onClick={() => window.open(filePath, '_blank')}
            title="Download resource"
          >
            <Download className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResourceCard;