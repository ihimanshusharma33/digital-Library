import React from 'react';
import { useAuth } from '../../utils/AuthContext';

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div>
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl mt-2 font-bold text-gray-900 mb-6 flex items-center">
          Student Dashboard
        </h1>
      </div>
    </div>
  );
};

export default StudentDashboard;