import React from 'react';
import { Resource } from '../types';
import { FileText, Download, Calendar } from 'lucide-react';

interface ResourceCardProps {
  resource: Resource;
}

const getFileIcon = (fileType: string) => {
  switch (fileType) {
    case 'pdf':
      return <FileText className="w-4 h-4 text-red-500" />;
    case 'doc':
      return <FileText className="w-4 h-4 text-blue-500" />;
    case 'ppt':
      return <FileText className="w-4 h-4 text-orange-500" />;
    case 'xlsx':
      return <FileText className="w-4 h-4 text-green-500" />;
    case 'image':
      return <FileText className="w-4 h-4 text-purple-500" />;
    default:
      return <FileText className="w-4 h-4 text-gray-500" />;
  }
};

const ResourceCard: React.FC<ResourceCardProps> = ({ resource }) => {
  const { title, uploadedBy, fileType, description, uploadDate, semester } = resource;
  const uploadDateFormatted = new Date(uploadDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="bg-white rounded-lg border shadow-sm p-5 transition-shadow hover:shadow-md">
      <div className="mb-4">
        <div className="flex items-center mb-2">
          {getFileIcon(fileType)}
          <span className="text-xs text-gray-500 uppercase ml-2">{fileType}</span>
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
      
      <div className="flex flex-wrap items-center justify-between text-xs">
        <div className="flex items-center text-gray-500">
          <Calendar className="w-3 h-3 mr-1" />
          <span>{uploadDateFormatted}</span>
        </div>
        
        <div className="flex items-center">
          <span className="text-gray-500 mr-2">By {uploadedBy}</span>
          <button 
            className="p-1 rounded-full hover:bg-gray-100"
            onClick={() => window.open(resource.url, '_blank')}
          >
            <Download className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResourceCard;