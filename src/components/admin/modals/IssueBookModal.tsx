import React, { useState, useEffect } from 'react';
import { X, Loader, Search } from 'lucide-react';
import { api } from '../../../utils/apiService';
import { Book, Student } from '../../../types';
import { useAuth } from '../../../utils/AuthContext';

interface IssueBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const IssueBookModal: React.FC<IssueBookModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const auth = useAuth(); // <-- Move this here, at the top level

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookSearchTerm, setBookSearchTerm] = useState('');
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isSearchingBooks, setIsSearchingBooks] = useState(false);
  const [isSearchingStudents, setIsSearchingStudents] = useState(false);
  const [returnDate, setReturnDate] = useState('');
  const [remarks, setRemarks] = useState('');
  const [bookSearchType, setBookSearchType] = useState<'title' | 'author' | 'isbn' | 'id'>('title');
  const [issueDate] = useState(new Date().toISOString().split('T')[0]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const searchBooks = async (term: string) => {
    if (!term) return;
    setIsSearchingBooks(true);
    setError(null);

    try {
      // Use the searchBooks function from apiService with type parameter
      const response = await api.searchBooks(term, bookSearchType);

      if (response && response.status) {
        // Set the books from the response data array
        setBooks(response.data || []);

        // If no results found, show a message
        if (!response.data || response.data.length === 0) {
          setError("No books found matching your search criteria");
        }
      } else {
        setError(response?.message || "Failed to search books");
      }
    } catch (error) {
      console.error('Error searching books:', error);
      setError('Error searching for books. Please try again.');
    } finally {
      setIsSearchingBooks(false);
    }
  };

  // Update the searchStudents function to handle the specific response format
  const searchStudents = async (term: string) => {
    if (!term) return;
    setIsSearchingStudents(true);
    setError(null);

    try {
      // Use the endpoint for library ID search
      const response = await api.searchUserByLibraryId(term);

      // Handle the specific response format where status is a boolean
      if (response && response.status === true) {
        // If we get a single user object in the data field
        const userData = response.data ? [response.data] : [];
        setStudents(userData);

        // If no results found, show a message
        if (userData.length === 0) {
          setError("No student found with this library ID");
        }
      } else {
        // If status is false or another issue
        setError(response?.message || "Failed to search student");
      }
    } catch (error) {
      console.error('Error searching students:', error);
      setError('Error searching for student. Please try again.');
    } finally {
      setIsSearchingStudents(false);
    }
  };

  // Update the handleSubmit function to use the correct endpoint and request format
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBook || !selectedStudent || !returnDate) {
      setError('Please select a book, student and return date.');
      setSuccessMessage(null); // Clear any existing success message
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const requestData = {
        book_id: selectedBook.book_id,
        user_id: selectedStudent.user_id,
        issue_date: issueDate, // Today's date
        due_date: returnDate,
        issued_by: auth.user?.user_id || 0, // Use auth here
        issued_by_name: auth.user?.name || 'Unknown',
        remarks: remarks.trim() || undefined
      };

      // Log the request data to debug
      console.log('Issuing book with data:', requestData);

      // Use a direct API call to the specific endpoint
      const response = await api.issueBook(requestData);

      // Log the response to debug
      console.log('Issue book API response:', response);

      if (response && response.status) {
        // On successful book issuance
        setSuccessMessage(response.message || 'Book issued successfully!');
        
        // Reset form including the 14-day default
        resetForm();
        
        // Focus the book search input
        const bookSearchInput = document.querySelector('input[placeholder^="Search by"]');
        if (bookSearchInput) {
          (bookSearchInput as HTMLInputElement).focus();
        }
        
        // Call success callback and clear message after delay
        onSuccess?.();
        setTimeout(() => {
          setSuccessMessage(null);
          onClose();
        }, 2000);
        
      } else {
        // Show specific error message if available, otherwise use generic message
        let errorMessage = 'Failed to issue book. Please try again.';

        if (response?.message) {
          errorMessage = response.message;
        }

        if (response?.error) {
          errorMessage += ` (${response.error})`;
        }

        setError(errorMessage);
      }
    } catch (error) {
      console.error('Error issuing book:', error);
      setError('Failed to issue book. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectBook = (book: Book) => {
    // Only allow selecting available books
    if (book.is_available) {
      setSelectedBook(book);
    } else {
      setError("This book is not available for checkout");
    }
  };

  // Update the getCurrentUser function to ensure it always returns a valid ID
  const getCurrentUser = () => {
    try {
      const userString = localStorage.getItem('user');

      // Default to admin ID 1 if no user found in localStorage
      if (!userString) {
        console.log('No user found in localStorage, using default ID');
        return { id: 1, name: 'System' };
      }

      const user = JSON.parse(userString);

      // Ensure we always return a numeric ID (never null)
      const userId = user.id ? user.id : 1;
      const userName = user.name ? user.name : 'System';

      console.log('Current user data:', { id: userId, name: userName });

      return {
        id: userId,
        name: userName
      };
    } catch (err) {
      console.error('Error getting current user data:', err);
      // Always return a valid default ID in case of error
      return { id: 1, name: 'System' };
    }
  };

  // 1. Update the useEffect to also reset the date when the modal opens
  useEffect(() => {
    if (isOpen) {
      // Set default return date to 14 days from now
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 14);
      setReturnDate(defaultDate.toISOString().split('T')[0]);
    }
  }, [isOpen]); // Add isOpen as a dependency

  // 2. Add a helper function to reset the form with default values
  const resetForm = () => {
    setSelectedBook(null);
    setSelectedStudent(null);
    setBooks([]);
    setStudents([]);
    setBookSearchTerm('');
    setStudentSearchTerm('');
    setRemarks('');
    
    // Reset the due date to 14 days from now
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 14);
    setReturnDate(defaultDate.toISOString().split('T')[0]);
  };

  useEffect(() => {
    // Set default return date to 14 days from now
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 14);
    setReturnDate(defaultDate.toISOString().split('T')[0]);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex justify-between items-center pb-4 mb-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">Issue Book</h3>
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

            {successMessage && (
              <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md text-sm">
                {successMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Book Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Book *
                </label>
                {!selectedBook ? (
                  <div className="space-y-2">
                    <div className="flex">
                      <select
                        value={bookSearchType}
                        onChange={(e) => setBookSearchType(e.target.value as 'title' | 'author' | 'isbn' | 'id')}
                        className="rounded-l-md border border-r-0 border-gray-300 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        disabled={isSubmitting}
                      >
                        <option value="title">Title</option>
                        <option value="author">Author</option>
                        <option value="isbn">ISBN</option>
                        <option value="id">Book ID</option>
                      </select>
                      <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          placeholder={`Search by ${bookSearchType}...`}
                          value={bookSearchTerm}
                          onChange={(e) => setBookSearchTerm(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && searchBooks(bookSearchTerm)}
                          className="pl-10 pr-4 py-2 border rounded-r-lg w-full focus:ring-blue-500 focus:border-blue-500"
                          disabled={isSubmitting}
                        />
                        <button
                          type="button"
                          onClick={() => searchBooks(bookSearchTerm)}
                          className="absolute inset-y-0 right-0 px-3 flex items-center bg-blue-600 text-white rounded-r-lg hover:bg-blue-700"
                        >
                          Search
                        </button>
                      </div>
                    </div>

                    {isSearchingBooks && (
                      <div className="flex items-center justify-center p-4">
                        <Loader className="h-5 w-5 animate-spin text-blue-600 mr-2" />
                        <span className="text-sm text-gray-500">Searching books...</span>
                      </div>
                    )}

                    {!isSearchingBooks && books.length > 0 && (
                      <div className="mt-2 max-h-64 overflow-y-auto border rounded-md">
                        <div className="divide-y">
                          {books.map((book) => (
                            <label
                              key={book.book_id}
                              className="flex items-start p-3 hover:bg-gray-50 cursor-pointer"
                            >
                              <input
                                type="radio"
                                name="bookSelection"
                                onChange={() => handleSelectBook(book)}
                              />
                              <div className="ml-3">
                                <p className="font-medium">{book.title}</p>
                                <p className="text-sm text-gray-600">
                                  By: {book.author || 'Unknown'} {book.isbn && `• ISBN: ${book.isbn}`}
                                </p>
                                <div className="flex items-center mt-1">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${book.is_available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {book.is_available ? 'Available' : 'Unavailable'}
                                  </span>
                                  {book.publication_year && (
                                    <span className="ml-2 text-xs text-gray-500">
                                      Published: {book.publication_year}
                                    </span>
                                  )}
                                  {book.edition && (
                                    <span className="ml-2 text-xs text-gray-500">
                                      Edition: {book.edition}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {!isSearchingBooks && books.length === 0 && bookSearchTerm && (
                      <div className="text-center py-4 text-gray-500">
                        No books found matching your search criteria
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{selectedBook.title}</p>
                      <p className="text-sm text-gray-600">
                        {selectedBook.author} {selectedBook.isbn && `• ISBN: ${selectedBook.isbn}`}
                      </p>
                      <div className="mt-1">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800`}>
                          Available
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedBook(null)}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Student Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Student *
                </label>
                {!selectedStudent ? (
                  <div className="space-y-2">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        placeholder="Enter library ID or roll number"
                        value={studentSearchTerm}
                        onChange={(e) => setStudentSearchTerm(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && searchStudents(studentSearchTerm)}
                        className="pl-10 pr-4 py-2 border rounded-lg w-full focus:ring-blue-500 focus:border-blue-500"
                        disabled={isSubmitting}
                      />
                      <button
                        type="button"
                        onClick={() => searchStudents(studentSearchTerm)}
                        className="absolute inset-y-0 right-0 px-3 flex items-center bg-blue-600 text-white rounded-r-lg hover:bg-blue-700"
                      >
                        Search
                      </button>
                    </div>

                    {isSearchingStudents && (
                      <div className="flex items-center justify-center p-4">
                        <Loader className="h-5 w-5 animate-spin text-blue-600 mr-2" />
                        <span className="text-sm text-gray-500">Searching student...</span>
                      </div>
                    )}

                    {!isSearchingStudents && students.length > 0 && (
                      <div className="mt-2 max-h-64 overflow-y-auto border rounded-md">
                        <div className="divide-y">
                          {students.map((student) => (
                            <label
                              key={student.user_id}
                              className="flex items-start p-3 hover:bg-gray-50 cursor-pointer"
                            >
                              <input
                                type="radio"
                                name="studentSelection"
                                onChange={() => setSelectedStudent(student)}
                              />
                              <div className="ml-3">
                                <p className="font-medium">{student.name}</p>
                                <p className="text-sm text-gray-600">
                                  Library ID: {student.library_id  }
                                  {student.course_id && ` • ${student.course_id}`}
                                </p>
                                {student.email && (
                                  <p className="text-xs text-gray-500 mt-1">{student.email}</p>
                                )}
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {!isSearchingStudents && students.length === 0 && studentSearchTerm && (
                      <div className="text-center py-4 text-gray-500">
                        No student found with this library ID
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{selectedStudent.name}</p>
                      <p className="text-sm text-gray-600">
                        Library ID: {selectedStudent.library_id || selectedStudent.university_roll_number || selectedStudent.university_roll_number || 'No ID'}
                        {selectedStudent.course_id
                         && ` • ${selectedStudent.course_id}`}
                      </p>
                      {selectedStudent.email && (
                        <p className="text-xs text-gray-500 mt-1">{selectedStudent.email}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedStudent(null)}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Return Date */}
              <div>
                <label htmlFor="returnDate" className="block text-sm font-medium text-gray-700">
                  Due Date * (14 days by default)
                </label>
                <input
                  type="date"
                  id="returnDate"
                  required
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]} // Minimum date is today
                  className="mt-1 block w-full h-10 border-2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  disabled={isSubmitting}
                />
              </div>
              
              {/* Remarks */}
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
                  placeholder="Any notes about this issue"
                  disabled={isSubmitting}
                />
              </div>

              <div className="mt-5 sm:mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  disabled={isSubmitting || !selectedBook || !selectedStudent || !returnDate}
                >
                  {isSubmitting && (
                    <Loader className="mr-2 h-4 w-4 animate-spin text-white" />
                  )}
                  {isSubmitting ? 'Issuing Book...' : 'Issue Book'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};


export default IssueBookModal;