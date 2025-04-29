import React from 'react';
import { SemesterSelectionProps } from '../types';
import { BookOpen,  ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from './Layout/Header';
import ResourceList from './ResourceList';

const SemesterSelection: React.FC<SemesterSelectionProps> = ({
  course,
  onBack,
}) => {
  const navigate = useNavigate();
  const semesters = Array.from({ length: course.total_semesters }, (_, i) => i + 1);
  const [semesterSelected,setSemesterSelected] = React.useState<number>(0);
  const [showResources, setShowResources] = React.useState(false);
  const handleSemesterSelect = (semester: number) => {
    setSemesterSelected(semester);
    setShowResources(true);
  }


if(showResources){
  return (
    <ResourceList  semester={semesterSelected} Course={course}  onclose={() => setShowResources(false)}/>
  )
}

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      {/* Course Header Card */}
      <div className="bg-white ">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center">
            <button
              onClick={() => onBack ? onBack() : navigate('/')}
              className="mr-4 p-2 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex-grow">
              <h1 className="text-2xl font-bold text-gray-900">{course.course_name}</h1>
              {course.description && (
                <h1 className="text-xl font-semi-bold text-gray-900">{course.description}</h1>
              )}
            </div>
          </div>


        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900">Select Semester</h2>
        </div>

        {/* Semester Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {semesters.map((semester) => (
            <div
              key={semester}
              onClick={() => handleSemesterSelect(semester)}
              className="bg-white border border-gray-200 rounded-xl p-6 text-center shadow-sm hover:shadow-md transition-all cursor-pointer"
            >
              {/* Icon */}
              <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <BookOpen className="text-indigo-600 w-6 h-6" />
              </div>

              {/* Title */}
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                Semester {semester}
              </h3>

              {/* Subtitle */}
              <p className="text-sm text-gray-500">
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