import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Book, Calendar, Clock, AlertTriangle, CheckCircle, CreditCard } from 'lucide-react';
import { useAuth } from '../../utils/AuthContext';
import { IssuedBook, LibraryCardStatus } from '../../types';

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [issuedBooks, setIssuedBooks] = useState<IssuedBook[]>([]);
  const [libraryCard, setLibraryCard] = useState<LibraryCardStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, these would be API calls
    if (user) {
      const books = getIssuedBooks(user.id);
      const cardStatus = getLibraryCardStatus(user.id);
      
      setIssuedBooks(books);
      setLibraryCard(cardStatus);
      setLoading(false);
    }
  }, [user]);

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  // Calculate statistics
  const activeBooks = issuedBooks.filter(book => book.status === 'issued').length;
  const overdueBooks = issuedBooks.filter(book => book.status === 'overdue').length;
  const returnedBooks = issuedBooks.filter(book => book.status === 'returned').length;
  const totalFine = issuedBooks.reduce((sum, book) => sum + (book.fine || 0), 0);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Student Dashboard</h1>
        <p className="text-gray-600">Welcome back, {user?.name || 'Student'}</p>
      </div>

      {/* Library card status */}
      <div className="mb-8 bg-white p-6 rounded-lg border shadow-sm">
        <h2 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
          <CreditCard className="h-5 w-5 mr-2 text-blue-600" />
          Library Card Status
        </h2>

        {libraryCard ? (
          <div className="flex flex-col md:flex-row md:items-center">
            <div className="md:mr-6 mb-4 md:mb-0">
              {libraryCard.photo ? (
                <img 
                  src={libraryCard.photo} 
                  alt="Profile" 
                  className="w-20 h-20 object-cover rounded-lg border"
                />
              ) : (
                <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                  <span className="text-gray-500">No photo</span>
                </div>
              )}
            </div>
            
            <div className="flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {libraryCard.status === 'approved' ? (
                  <>
                    <div>
                      <div className="text-sm font-medium text-gray-500">Card Number</div>
                      <div className="text-gray-800">{libraryCard.cardNumber}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-500">Issued Date</div>
                      <div className="text-gray-800">{libraryCard.issuedDate}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-500">Expiry Date</div>
                      <div className="text-gray-800">{libraryCard.expiryDate}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-500">Status</div>
                      <div className="inline-flex items-center">
                        <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Active
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="col-span-full">
                    <div className="flex items-center mb-2">
                      <Clock className="h-5 w-5 text-yellow-500 mr-2" />
                      <span className="font-medium text-gray-800">
                        Your library card application is {libraryCard.status}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm">
                      We're reviewing your application. You'll be notified once it's processed.
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-4 md:mt-0 md:ml-4">
              {libraryCard.status === 'approved' ? (
                <Link 
                  to="/student/library-card"
                  className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md inline-flex items-center"
                >
                  <span>View Card</span>
                </Link>
              ) : (
                <Link 
                  to="/student/library-card"
                  className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md inline-flex items-center"
                >
                  <span>Check Status</span>
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="mb-2">You don't have a library card yet</div>
            <Link 
              to="/student/library-card"
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md inline-flex items-center"
            >
              Apply for Library Card
            </Link>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Active Books</p>
              <h3 className="text-2xl font-bold text-gray-800 mt-1">{activeBooks}</h3>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Book className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Overdue</p>
              <h3 className="text-2xl font-bold text-gray-800 mt-1">{overdueBooks}</h3>
            </div>
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Returned</p>
              <h3 className="text-2xl font-bold text-gray-800 mt-1">{returnedBooks}</h3>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Fine</p>
              <h3 className="text-2xl font-bold text-gray-800 mt-1">₹{totalFine}</h3>
            </div>
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Calendar className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Recently issued books */}
      <div className="bg-white p-6 rounded-lg border shadow-sm mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-800">Recently Issued Books</h2>
          <Link to="/student/issued-books" className="text-blue-600 hover:text-blue-800 text-sm">
            View all
          </Link>
        </div>
        
        {issuedBooks.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Book
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Issued Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {issuedBooks.slice(0, 3).map((book) => (
                  <tr key={book.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-8 bg-gray-200 rounded flex-shrink-0 mr-3 overflow-hidden">
                          {book.book.coverImage && (
                            <img 
                              src={book.book.coverImage} 
                              alt={book.book.title} 
                              className="h-full w-full object-cover"
                            />
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                            {book.book.title}
                          </div>
                          <div className="text-xs text-gray-500">{book.book.author.split(',')[0]}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {book.issuedDate}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {book.dueDate}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {book.status === 'issued' && (
                        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                          Issued
                        </span>
                      )}
                      {book.status === 'overdue' && (
                        <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                          Overdue
                        </span>
                      )}
                      {book.status === 'returned' && (
                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                          Returned
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            You haven't issued any books yet
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;