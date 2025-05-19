import React, { useState, useEffect } from 'react';
import { X, Loader, Search, BookOpen } from 'lucide-react';
import { api } from '../../../utils/apiService';
import { ReturnBookModalProps } from '../../../types';

// Define the API response structure
interface UserIssuedBooksResponse {
  user: {
    id: number;
    name: string;
    library_id: string;
    email: string;
  };
  total_fine: number;
  issued_books: Array<{
    issue_id: number; // <-- use issue_id everywhere
    book_id: number;
    book_title: string;
    book_author: string;
    book_isbn?: string;
    issue_date: string;
    due_date: string;
    return_date: string | null;
    is_returned: boolean;
    fine_amount: string;
    status: string;
    remarks: string | null;
  }>;
}

// Create a proper type for the return book request
interface ReturnBookRequest {
  issue_id: number; // <-- use issue_id as required by backend
  return_date: string;
  remarks?: string;
  fine_amount?: number;
}

const ReturnBookModal: React.FC<ReturnBookModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [libraryIdSearchTerm, setLibraryIdSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [issuedBooks, setIssuedBooks] = useState<UserIssuedBooksResponse['issued_books']>([]);
  const [selectedIssuedBook, setSelectedIssuedBook] = useState<UserIssuedBooksResponse['issued_books'][0] | null>(null);
  const [returnDate, setReturnDate] = useState(new Date().toISOString().split('T')[0]);
  const [remarks, setRemarks] = useState('');
  const [fineAmount, setFineAmount] = useState(0);
  const [calculatedFine, setCalculatedFine] = useState(0);
  const [userData, setUserData] = useState<UserIssuedBooksResponse['user'] | null>(null);

  // Reset everything when the modal opens
  useEffect(() => {
    if (isOpen) {
      setLibraryIdSearchTerm('');
      setIssuedBooks([]);
      setSelectedIssuedBook(null);
      setUserData(null);
      setReturnDate(new Date().toISOString().split('T')[0]);
      setRemarks('');
      setFineAmount(0);
      setCalculatedFine(0);
      setError(null);
    }
  }, [isOpen]);

  // Calculate fine when a book is selected or return date changes
  useEffect(() => {
    if (selectedIssuedBook) {
      const dueDate = new Date(selectedIssuedBook.due_date);
      const currentReturnDate = new Date(returnDate);

      if (currentReturnDate > dueDate) {
        const daysLate = Math.ceil((currentReturnDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        // Assuming a fine of $1 per day late
        const calculatedFine = daysLate * 1;
        setCalculatedFine(calculatedFine);
        setFineAmount(calculatedFine);
      } else {
        setCalculatedFine(0);
        setFineAmount(0);
      }
    }
  }, [selectedIssuedBook, returnDate]);

  // Search for books issued to a student by library ID
  const searchByLibraryId = async () => {
    if (!libraryIdSearchTerm.trim()) {
      setError('Please enter a Library ID');
      return;
    }

    setIsSearching(true);
    setError(null);
    setIssuedBooks([]);
    setUserData(null);

    try {
      const response = await api.getUserIssuedBooks(libraryIdSearchTerm);

      if (response && response.status) {
        // Type assertion to ensure proper type safety
        if (response.data && 'user' in response.data && 'issued_books' in response.data) {
          const typedData = response.data as unknown as UserIssuedBooksResponse;

          // Extract user info and issued books from the response - only set once
          setUserData(typedData.user);

          const activeBooks = typedData.issued_books.filter(book => !book.is_returned);
          setIssuedBooks(activeBooks);

          if (activeBooks.length === 0) {
            setError(`No active loans found for Library ID: ${libraryIdSearchTerm}`);
          }
        } else {
          setError('Invalid response structure received from the server.');
        }
      } else {
        setError(response?.message || `Failed to find loans for Library ID: ${libraryIdSearchTerm}`);
      }
    } catch (error) {
      console.error('Error fetching user issued books:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch issued books. Please try again later.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleReturnDateChange = (date: string) => {
    setReturnDate(date);
  };

  const handleBookSelection = (issuedBook: UserIssuedBooksResponse['issued_books'][0]) => {
    setSelectedIssuedBook(issuedBook);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIssuedBook) {
      setError('No book issue record selected.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Set return date to today's date - not editable by user
      const today = new Date().toISOString().split('T')[0];

      const returnBookData: ReturnBookRequest = {
        issue_id: selectedIssuedBook.issue_id, // <-- use issue_id here
        return_date: today,
        ...(fineAmount > 0 ? { fine_amount: fineAmount } : {}),
        ...(remarks.trim() ? { remarks: remarks.trim() } : {})
      };

      const response = await api.returnBook(returnBookData);

      if (response && response.status) {
        setIssuedBooks(prevBooks => prevBooks.filter(book => book.issue_id !== selectedIssuedBook.issue_id));
        setSelectedIssuedBook(null);
        setRemarks('');
      } else {
        setError(response?.message || 'Failed to process book return. Please try again.');
      }
    } catch (error) {
      console.error('Error returning book:', error);
      setError('Failed to process book return. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex justify-between items-center pb-4 mb-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">Return Book</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
                {error}
              </div>
            )}

            {!selectedIssuedBook ? (
              <div>
                {/* Library ID Search */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Find Books by Library ID
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Enter student Library ID (e.g. LIB12345)"
                      value={libraryIdSearchTerm}
                      onChange={(e) => setLibraryIdSearchTerm(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && searchByLibraryId()}
                      className="pl-10 pr-4 py-2 border rounded-lg w-full focus:ring-blue-500 focus:border-blue-500"
                      disabled={isSearching}
                    />
                    <button
                      type="button"
                      onClick={searchByLibraryId}
                      className="absolute inset-y-0 right-0 px-3 flex items-center bg-blue-600 text-white rounded-r-lg hover:bg-blue-700"
                      disabled={isSearching}
                    >
                      {isSearching ? (
                        <>
                          <Loader className="h-4 w-4 animate-spin text-white mr-1" />
                          <span>Searching</span>
                        </>
                      ) : (
                        <span>Search</span>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Enter the student's library ID to view their borrowed books
                  </p>
                </div>

                {/* Student Information */}
                {userData && (
                  <div className="mb-4 p-3 bg-blue-50 rounded-md">
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Student Information</h4>
                    <p className="text-sm">{userData.name}</p>
                    <p className="text-xs text-gray-600">Library ID: {userData.library_id}</p>
                    {userData.email && <p className="text-xs text-gray-600">{userData.email}</p>}
                  </div>
                )}

                {/* Search Results */}
                {issuedBooks.length > 0 && (
                  <div className="mt-4 mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      {issuedBooks.length} Active Loan{issuedBooks.length !== 1 ? 's' : ''} for {userData?.name || libraryIdSearchTerm}
                    </h4>
                    <div className="max-h-64 overflow-y-auto border rounded-md">
                      <div className="divide-y">
                        {issuedBooks.map((issuedBook) => (
                          <div
                            key={issuedBook.issue_id}
                            className="p-3 hover:bg-gray-50 cursor-pointer"
                            onClick={() => handleBookSelection(issuedBook)}
                          >
                            <div className="flex items-start">
                              <BookOpen className="h-5 w-5 text-blue-500 mt-1 mr-3" />
                              <div>
                                <p className="font-medium">{issuedBook.book_title}</p>
                                <p className="text-sm text-gray-600">
                                  By {issuedBook.book_author}
                                </p>
                                <div className="flex items-center text-xs text-gray-500 mt-1">
                                  <span>Issued: {new Date(issuedBook.issue_date).toLocaleDateString()}</span>
                                  <span className="mx-2">•</span>
                                  <span>Due: {new Date(issuedBook.due_date).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="mb-4 p-4 bg-gray-50 rounded-md">
                  <h4 className="font-medium mb-1">Book Information</h4>
                  <p className="text-sm">{selectedIssuedBook.book_title}</p>
                  <p className="text-sm text-gray-600">By: {selectedIssuedBook.book_author}</p>
                  {selectedIssuedBook.book_isbn && (
                    <p className="text-sm text-gray-600">ISBN: {selectedIssuedBook.book_isbn}</p>
                  )}

                  <h4 className="font-medium mt-3 mb-1">Student Information</h4>
                  {userData && (
                    <>
                      <p className="text-sm">{userData.name}</p>
                      <p className="text-sm text-gray-600">ID: {userData.library_id}</p>
                    </>
                  )}

                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <div>
                      <p className="text-xs text-gray-500">Issue Date</p>
                      <p className="text-sm">{new Date(selectedIssuedBook.issue_date).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Due Date</p>
                      <p className="text-sm">{new Date(selectedIssuedBook.due_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="returnDate" className="block text-sm font-medium text-gray-700">
                    Return Date *
                  </label>
                  <input
                    type="date"
                    id="returnDate"
                    required
                    value={returnDate}
                    onChange={(e) => handleReturnDateChange(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    disabled={isSubmitting}
                  />
                </div>

                {calculatedFine > 0 && (
                  <div className="bg-yellow-50 p-3 rounded-md border border-yellow-100">
                    <p className="text-sm text-yellow-800">
                      This book is being returned <strong>{Math.ceil((new Date(returnDate).getTime() - new Date(selectedIssuedBook.due_date).getTime()) / (1000 * 60 * 60 * 24))}</strong> days late.
                    </p>
                    <div className="mt-2">
                      <label htmlFor="fineAmount" className="block text-sm font-medium text-gray-700">
                        Fine Amount
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">$</span>
                        </div>
                        <input
                          type="number"
                          id="fineAmount"
                          min="0"
                          step="0.01"
                          value={fineAmount}
                          onChange={(e) => setFineAmount(parseFloat(e.target.value) || 0)}
                          className="pl-7 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          disabled={isSubmitting}
                        />
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        Calculated fine: ${calculatedFine.toFixed(2)}
                      </p>
                    </div>
                  </div>
                )}

                <div>
                  <label htmlFor="remarks" className="block text-sm font-medium text-gray-700">
                    Remarks (Optional)
                  </label>
                  <textarea
                    id="remarks"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    rows={2}
                    placeholder="Any notes about book condition or return process"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="mt-5 sm:mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setSelectedIssuedBook(null)}
                    className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isSubmitting}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="flex items-center rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                    disabled={isSubmitting}
                  >
                    {isSubmitting && (
                      <Loader className="mr-2 h-4 w-4 animate-spin text-white" />
                    )}
                    {isSubmitting ? 'Processing Return...' : 'Return Book'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReturnBookModal;