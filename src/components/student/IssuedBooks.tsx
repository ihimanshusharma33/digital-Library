import React, { useState, useEffect } from 'react';
import { Book, Clock, AlertCircle, Calendar, Check, X, DollarSign } from 'lucide-react';
import { useAuth } from '../../utils/AuthContext';
import { api } from '../../utils/apiService';
import { IssuedBooksResponse, IssuedBookDetails } from '../../types';

// Define filter types for better type safety
type FilterType = 'all' | 'current' | 'returned';

const IssuedBooks: React.FC = () => {
  const { user } = useAuth();
  const [allBooks, setAllBooks] = useState<IssuedBookDetails[]>([]); // Original data from API
  const [displayBooks, setDisplayBooks] = useState<IssuedBookDetails[]>([]); // Filtered books for display
  const [activeFilter, setActiveFilter] = useState<FilterType>('all'); // Track active filter
  const [totalFine, setTotalFine] = useState<number>(0);
  const [userInfo, setUserInfo] = useState<{ name: string; library_id: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch issued books when component mounts
    fetchIssuedBooks();
  }, []);

  const fetchIssuedBooks = async () => {
    if (!user?.id) {
      setError("User information is not available");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // Call the API with user ID to fetch issued books
      const response = await api.get<IssuedBooksResponse>(`/issued-booksbyId/${user.id}`);
      
      if (response?.status && response?.data) {
        const { issued_books, total_fine, user: userData } = response.data;
        const books = issued_books || []; // Set empty array if no books
        
        setAllBooks(books); // Store original data
        setDisplayBooks(books); // Initial display is all books
        setActiveFilter('all'); // Reset filter to 'all'
        setTotalFine(total_fine || 0); // Set 0 if no fine
        setUserInfo({ 
          name: userData.name,
          library_id: userData.library_id 
        });
      } else {
        setError("Failed to fetch issued books");
      }
    } catch (err) {
      console.error("Error fetching issued books:", err);
      setError("An error occurred while fetching your issued books");
    } finally {
      setLoading(false);
    }
  };

  // Filter books based on selected filter type
  const filterBooks = (filterType: FilterType) => {
    setActiveFilter(filterType);
    
    if (filterType === 'all') {
      setDisplayBooks(allBooks);
    } else if (filterType === 'current') {
      setDisplayBooks(allBooks.filter(book => !book.is_returned));
    } else if (filterType === 'returned') {
      setDisplayBooks(allBooks.filter(book => book.is_returned));
    }
  };

  // Calculate days remaining or overdue
  const calculateDaysStatus = (dueDate: string, isReturned: boolean): { days: number, isOverdue: boolean } => {
    if (isReturned) {
      return { days: 0, isOverdue: false };
    }
    
    const today = new Date();
    const due = new Date(dueDate);
    today.setHours(0, 0, 0, 0); // Reset time portion for accurate day calculation
    due.setHours(0, 0, 0, 0);
    
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return { 
      days: Math.abs(diffDays), 
      isOverdue: diffDays < 0
    };
  };

  // Format date to a readable string
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'N/A';
    
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
        <Book className="h-6 w-6 mr-2 text-blue-600" />
        My Issued Books
      </h1>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>{error}</span>
          </div>
        </div>
      ) : (
        <>
          {/* User information - always shown when data is loaded */}
          {userInfo && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 mb-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                <div>
                  <h2 className="text-lg font-semibold">{userInfo.name}</h2>
                  <p className="text-gray-600 text-sm">Library ID: {userInfo.library_id}</p>
                </div>
                {totalFine > 0 && (
                  <div className="mt-3 sm:mt-0 px-4 py-2 bg-red-50 rounded-md flex items-center">
                    <DollarSign className="h-4 w-4 mr-2 text-red-500" />
                    <span className="text-red-600 font-medium">
                      Total Outstanding Fine: ₹{totalFine.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Filter controls - always show if there are any books */}
          {allBooks.length > 0 && (
            <div className="flex justify-between items-center mb-4">
              <p className="text-gray-500">
                {displayBooks.length > 0 
                  ? `Showing ${displayBooks.length} book${displayBooks.length !== 1 ? 's' : ''}` 
                  : `No ${activeFilter !== 'all' ? activeFilter : ''} books found`
                }
              </p>
              <div className="flex space-x-2">
                <button 
                  className={`px-3 py-1 text-sm rounded-md ${
                    activeFilter === 'all'
                      ? 'bg-blue-50 text-blue-600 border border-blue-200' 
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                  }`}
                  onClick={() => filterBooks('all')}
                >
                  All Books
                </button>
                <button 
                  className={`px-3 py-1 text-sm rounded-md ${
                    activeFilter === 'current'
                      ? 'bg-blue-50 text-blue-600 border border-blue-200' 
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                  }`}
                  onClick={() => filterBooks('current')}
                >
                  Current
                </button>
                <button 
                  className={`px-3 py-1 text-sm rounded-md ${
                    activeFilter === 'returned'
                      ? 'bg-blue-50 text-blue-600 border border-blue-200' 
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                  }`}
                  onClick={() => filterBooks('returned')}
                >
                  Returned
                </button>
              </div>
            </div>
          )}

          {/* Books section - shown with different states based on availability */}
          {allBooks.length === 0 ? (
            <div className="bg-blue-50 border border-blue-200 text-blue-700 p-6 rounded-md text-center">
              <Book className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-lg font-semibold">No Books Currently Issued</p>
              <p className="mt-1">You don't have any books checked out at the moment.</p>
            </div>
          ) : displayBooks.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 text-gray-700 p-6 rounded-md text-center">
              <Book className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-lg font-semibold">No {activeFilter} books found</p>
              <p className="mt-1">
                {activeFilter === 'current' 
                  ? "You don't have any books currently checked out."
                  : "You haven't returned any books yet."}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {displayBooks.map((book) => {
                  const { days, isOverdue } = calculateDaysStatus(book.due_date, book.is_returned);
                  const isCurrentlyOverdue = isOverdue && !book.is_returned;
                  
                  return (
                    <div 
                      key={book.id} 
                      className={`bg-white rounded-lg shadow-md border ${
                        isCurrentlyOverdue ? 'border-red-200' : 
                        book.is_returned ? 'border-green-200' : 'border-gray-100'
                      } overflow-hidden flex flex-col`}
                    >
                      <div className="p-5 flex gap-4">
                        <div className="flex-shrink-0 w-20 h-28 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden">
                          {book.cover_image ? (
                            <img 
                              src={book.cover_image} 
                              alt={`Cover of ${book.book_title}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Book className="h-8 w-8 text-gray-400" />
                          )}
                        </div>
                        
                        <div className="flex-grow">
                          <h3 className="font-semibold text-lg text-gray-900 line-clamp-2">
                            {book.book_title}
                          </h3>
                          <p className="text-gray-600 text-sm mb-2">{book.book_author}</p>
                          <p className="text-gray-500 text-xs mb-2">ISBN: {book.book_isbn}</p>
                          
                          <div className="mt-3 space-y-1.5">
                            <div className="flex items-center text-sm">
                              <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                              <span className="text-gray-600">
                                Issued on: {formatDate(book.issue_date)}
                              </span>
                            </div>
                            
                            {book.is_returned ? (
                              <div className="flex items-center text-sm">
                                <Check className="h-4 w-4 mr-2 text-green-500" />
                                <span className="text-green-600">
                                  Returned on: {formatDate(book.return_date)}
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center text-sm">
                                <Clock className={`h-4 w-4 mr-2 ${isOverdue ? 'text-red-500' : 'text-amber-500'}`} />
                                <span className={isOverdue ? 'text-red-600 font-medium' : 'text-amber-600'}>
                                  {isOverdue 
                                    ? `Overdue by ${days} day${days !== 1 ? 's' : ''}` 
                                    : `Due in ${days} day${days !== 1 ? 's' : ''}`
                                  }
                                </span>
                              </div>
                            )}
                            
                            {book.remarks && (
                              <div className="text-xs text-gray-500 italic mt-2">
                                Note: {book.remarks}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Bottom status bar */}
                      <div className={`px-5 py-3 mt-auto text-sm flex justify-between items-center ${
                        isCurrentlyOverdue ? 'bg-red-50' : 
                        book.is_returned ? 'bg-green-50' : 'bg-blue-50'
                      }`}>
                        <div className="flex items-center">
                          {book.is_returned ? (
                            <>
                              <Check className="h-4 w-4 mr-1.5 text-green-500" />
                              <span className="text-green-600 font-medium">
                                Returned
                              </span>
                            </>
                          ) : isOverdue ? (
                            <>
                              <X className="h-4 w-4 mr-1.5 text-red-500" />
                              <span className="text-red-600 font-medium">
                                Return Overdue
                              </span>
                            </>
                          ) : (
                            <>
                              <Calendar className="h-4 w-4 mr-1.5 text-blue-500" />
                              <span className="text-blue-600">
                                Return by {formatDate(book.due_date)}
                              </span>
                            </>
                          )}
                        </div>
                        
                        {book.fine_amount > 0 && (
                          <div className="text-red-600 font-medium">
                            Fine: ₹{book.fine_amount.toFixed(2)}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default IssuedBooks;