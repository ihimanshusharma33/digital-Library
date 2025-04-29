import React from 'react';
import { BookOpen, FileText, HelpCircle, Grid3x3 } from 'lucide-react';
import { ResourceCategory } from '../types';

interface TabNavigationProps {
  activeTab: ResourceCategory;
  onTabChange: (tab: ResourceCategory) => void;
  counts?: {
    all?: number;
    textbooks?: number;
    notes?: number;
    questions?: number;
  };
}

const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, onTabChange, counts = {} }) => {
  const tabs = [
    { 
      id: 'all', 
      label: 'All Resources', 
      icon: <Grid3x3 className="w-5 h-5" />,
      count: counts.all || 0
    },
    { 
      id: 'textbooks', 
      label: 'E-Books', 
      icon: <BookOpen className="w-5 h-5" />,
      count: counts.textbooks || 0
    },
    { 
      id: 'notes', 
      label: 'Student Notes', 
      icon: <FileText className="w-5 h-5" />,
      count: counts.notes || 0
    },
    { 
      id: 'questions', 
      label: 'Question Papers', 
      icon: <HelpCircle className="w-5 h-5" />,
      count: counts.questions || 0
    },
  ];

  return (
    <div className="mb-6">
      <div className="border-b">
        <div className="flex overflow-x-auto -mb-px hide-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`inline-flex items-center py-3 px-4 md:px-6 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => onTabChange(tab.id as ResourceCategory)}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
              {tab.count > 0 && (
                <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                  activeTab === tab.id 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TabNavigation;