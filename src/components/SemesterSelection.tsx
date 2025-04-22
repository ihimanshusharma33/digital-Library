import React from 'react';
import { Course } from '../types';
import { MAX_SEMESTERS } from '../utils/mockData';
import { ArrowLeft, BookOpen } from 'lucide-react';

interface SemesterSelectionProps {
  course: Course;
  onSemesterSelect: (semester: number) => void;
  onBack: () => void;
}

const SemesterSelection: React.FC<SemesterSelectionProps> = ({ course, onSemesterSelect, onBack }) => {
  const semesters = Array.from({ length: MAX_SEMESTERS }, (_, i) => i + 1);

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
              <h1 className="text-2xl font-bold">{course.name}</h1>
              <p className="text-blue-100">{course.code}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Select Semester</h2>
          <p className="text-gray-600 mb-6">
            Choose a semester to view resources for {course.name}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {semesters.map((semester) => (
            <div
              key={semester}
              className="bg-white p-6 rounded-lg border hover:shadow-md transition-shadow cursor-pointer flex flex-col items-center"
              onClick={() => onSemesterSelect(semester)}
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
      </div>
    </div>
  );
};

export default SemesterSelection;