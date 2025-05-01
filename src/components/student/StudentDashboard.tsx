import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, CheckCircle, CreditCard } from 'lucide-react';
import { useAuth } from '../../utils/AuthContext';
// import { IssuedBook, LibraryCardStatus } from '../../types';
// import UserBookDetails from './UserBookDetails';

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  // const [issuedBooks, setIssuedBooks] = useState<IssuedBook[]>([]);
  // const [libraryCard, setLibraryCard] = useState<LibraryCardStatus | null>(null);
  // const [loading, setLoading] = useState(true);
  // const [error, setError] = useState<Error | null>(null);


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