import React, { useState } from 'react';
import { Calendar, ChevronDown, ChevronUp, FileText, Download } from 'lucide-react';
import { Notice } from '../types';

interface NoticeCardProps {
  notice: Notice;
}

const NoticeCard: React.FC<NoticeCardProps> = ({ notice }) => {
  const [expanded, setExpanded] = useState(false);
  const { title, description, date, attachment, semester } = notice;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border p-5 transition-all duration-300 ${expanded ? 'shadow-md' : ''}`}>
      <div className="flex items-start mb-2">
        <Calendar className="w-5 h-5 text-blue-600 mt-1 mr-3 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="font-semibold text-lg text-gray-800">{title}</h3>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500 whitespace-nowrap ">{formatDate(date)}</span>
            {semester && (
              <div className="ml-auto bg-blue-100 text-blue-800 text-xs font-medium rounded-full px-2.5 py-1 w-24 text-center">
                Sem {semester}
              </div>
            )}
          </div>

          <div className={`mt-2 ${expanded ? '' : 'line-clamp-2'}`}>
            <p className="text-sm text-gray-600">{description}</p>
          </div>

          {attachment && (
            <div className="mt-3 flex items-center">
              <FileText className="w-4 h-4 text-gray-500 mr-2" />
              <span className="text-sm text-gray-600">{attachment.name}</span>
              <button
                className="p-1 rounded-full hover:bg-gray-100 ml-2"
                onClick={() => window.open(attachment.url, '_blank')}
              >
                <Download className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          )}
        </div>
      </div>

      <button
        className="text-blue-600 hover:text-blue-800 flex items-center text-sm mt-2 ml-auto"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? (
          <>
            <ChevronUp className="w-4 h-4 mr-1" />
            Show less
          </>
        ) : (
          <>
            <ChevronDown className="w-4 h-4 mr-1" />
            Read more
          </>
        )}
      </button>
    </div>
  );
};

export default NoticeCard;