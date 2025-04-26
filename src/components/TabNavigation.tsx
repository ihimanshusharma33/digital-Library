import React from 'react';
import { BookOpen, FileText, HelpCircle, Bell } from 'lucide-react';
import { ResourceCategory } from '../types';

interface TabNavigationProps {
  activeTab: ResourceCategory;
  onTabChange: (tab: ResourceCategory) => void;
}

const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'textbooks', label: 'Textbooks', icon: <BookOpen className="w-5 h-5" /> },
    { id: 'notes', label: 'Student Notes', icon: <FileText className="w-5 h-5" /> },
    { id: 'questions', label: 'Previous Questions', icon: <HelpCircle className="w-5 h-5" /> },
  ];

  return (
    <div className="mb-8">
      <div className="border-b">
        <div className="flex flex-wrap -mb-px">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`inline-flex items-center py-4 px-4 md:px-6 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => onTabChange(tab.id as ResourceCategory)}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TabNavigation;