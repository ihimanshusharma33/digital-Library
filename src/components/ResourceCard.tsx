import React from 'react';
import { Download, ExternalLink, Book, FileText, HelpCircle, Calendar } from 'lucide-react';
import { Resource } from '../types';

interface ResourceCardProps {
  resource: Resource;
}

const ResourceCard: React.FC<ResourceCardProps> = ({ resource }) => {
  const { title, author, type, subject, fileUrl, createdAt } = resource;
  
  // Format the date to be more readable
  const formattedDate = new Date(createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
  
  // Get icon based on resource type
  const getResourceIcon = () => {
    switch (type) {
      case 'ebook':
        return <Book className="w-5 h-5 text-blue-600" />;
      case 'note':
        return <FileText className="w-5 h-5 text-green-600" />;
      case 'question':
        return <HelpCircle className="w-5 h-5 text-amber-600" />;
      default:
        return <FileText className="w-5 h-5 text-gray-600" />;
    }
  };
  
  // Get color theme based on resource type
  const getTypeColor = () => {
    switch (type) {
      case 'ebook':
        return 'bg-blue-100 text-blue-700';
      case 'note':
        return 'bg-green-100 text-green-700';
      case 'question':
        return 'bg-amber-100 text-amber-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };
  
  // Get type label
  const getTypeLabel = () => {
    switch (type) {
      case 'ebook':
        return 'E-Book';
      case 'note':
        return 'Note';
      case 'question':
        return 'Question Paper';
      default:
        return 'Resource';
    }
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Check if fileUrl exists
    if (!fileUrl) {
      alert('Download link is not available');
      return;
    }
    
    // If it's a direct file URL, create a download link
    const link = document.createElement('a');
    link.href = fileUrl;
    link.target = '_blank';
    link.download = title || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleViewClick = () => {
    if (fileUrl) {
      window.open(fileUrl, '_blank');
    }
  };

  return (
    <div className="bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow">
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center">
              <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getTypeColor()}`}>
                {getTypeLabel()}
              </span>
              {subject && (
                <span className="ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {subject}
                </span>
              )}
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 mt-2 line-clamp-2">{title}</h3>
            
            <div className="flex items-center mt-2 text-sm text-gray-500">
              {author && (
                <div className="mr-3">
                  By: {author}
                </div>
              )}
              <div className="flex items-center">
                <Calendar className="w-3 h-3 mr-1" />
                {formattedDate}
              </div>
            </div>
          </div>
          
          <div className="ml-4">
            {getResourceIcon()}
          </div>
        </div>
        
        <div className="flex justify-between mt-4 pt-3 border-t">
          <button
            onClick={handleViewClick}
            className="flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            <ExternalLink className="w-4 h-4 mr-1" />
            View
          </button>
          
          <button
            onClick={handleDownload}
            className="flex items-center text-sm text-gray-700 hover:text-gray-900 font-medium"
          >
            <Download className="w-4 h-4 mr-1" />
            Download
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResourceCard;