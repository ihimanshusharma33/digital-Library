import React, { useState, useEffect } from 'react';
import {
  PlusCircle,
  Search,
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp,
  Book as BookIcon,
} from 'lucide-react';
import { Book, Course } from '../../types';
import { API_ENDPOINTS } from '../../utils/apiService';
import { getApiBaseUrl } from '../../utils/config';
import { api } from '../../utils/apiService';

const BookStocksManager: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentBook, setCurrentBook] = useState<Book | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Filter states - removed filterSemester
  const [filterCategory, setFilterCategory] = useState<string | undefined>(undefined);
  const [filterCourse, setFilterCourse] = useState<string | undefined>(undefined);
  const [filterAvailability, setFilterAvailability] = useState<boolean | undefined>(undefined);

  // Sorting
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Book | null;
    direction: 'ascending' | 'descending';
  }>({ key: 'title', direction: 'ascending' });

  const [formData, setFormData] = useState<{
    id?: string;
    title: string;
    author: string;
    isbn: string;
    category: string;
    coverImage: string;
    availableCopies: number;
    courseCode: string;
    publisher: string;
    publication_year: number;
    edition: string;
    location: string;
    total_copies: number;
  }>({
    title: '',
    author: '',
    isbn: '',
    category: '',
    coverImage: '',
    availableCopies: 0,
    courseCode: '',
    publisher: '',
    publication_year: new Date().getFullYear(),
    edition: '',
    location: '',
    total_copies: 0
  });

  // Fetch courses from API
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch(`${getApiBaseUrl()}${API_ENDPOINTS.COURSES}`);
        const data = await response.json();

        if (data && data.status) {
          const formattedCourses = data.data.map((course: Course) => ({
            ...course,
            id: course.course_id.toString(),
            name: course.course_name,
            code: course.course_code
          }));
          setCourses(formattedCourses);
        } else {
          console.error('Failed to fetch courses from API');
        }
      } catch (error) {
        console.error('Error fetching courses:', error);
      }
    };

    fetchCourses();
  }, []);

  // Place this function at the top level of your component
  const fetchBooks = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${getApiBaseUrl()}${API_ENDPOINTS.BOOKS}`);
      const data = await response.json();
      if (data && data.status) {
        setBooks(data.data);
        setFilteredBooks(data.data);
      } else {
        console.error('Failed to fetch books from API');
      }
    } catch (error) {
      console.error('Error fetching books:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // In useEffect, call fetchBooks on mount
  useEffect(() => {
    fetchBooks();
  }, []);

  // Apply filters and search
  useEffect(() => {
    let result = [...books];

    // Apply search filter
    if (searchTerm) {
      result = result.filter(
        book =>
          book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
          book.isbn.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (book.publisher ? book.publisher.toLowerCase().includes(searchTerm.toLowerCase()) : false)
      );
    }

    // Apply category filter
    if (filterCategory) {
      result = result.filter(book => book.category === filterCategory);
    }

    // Apply course filter
    if (filterCourse) {
      // Use console.log to debug
      console.log("Filtering by course ID:", filterCourse);
      
      // Convert filterCourse to string to ensure consistent comparison
      const filterCourseStr = String(filterCourse);
      
      result = result.filter(book => {
        // Convert book.course_id to string as well for comparison
        return String(book.course_id) === filterCourseStr;
      });
    }

    // Apply availability filter
    if (filterAvailability !== undefined) {
      if (filterAvailability) {
        result = result.filter(book => 
          (book.availableCopies > 0) || 
          (book.available_quantity > 0)
        );
      } else {
        result = result.filter(book => 
          (book.availableCopies === 0 || book.availableCopies === undefined) && 
          (book.available_quantity === 0 || book.available_quantity === undefined)
        );
      }
    }

    // Apply sorting - make sure we're using safe property access
    if (sortConfig.key) {
      result.sort((a, b) => {
        const aValue = a[sortConfig.key as keyof Book];
        const bValue = b[sortConfig.key as keyof Book];
        
        // Handle undefined or null values
        const aComp = aValue ?? '';
        const bComp = bValue ?? '';
        
        if (aComp < bComp) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aComp > bComp) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }

    setFilteredBooks(result);
  }, [books, searchTerm, filterCategory, filterCourse, filterAvailability, sortConfig]);

  // Handle sorting
  const requestSort = (key: keyof Book) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // Get sort icon for table headers
  const getSortIcon = (key: keyof Book) => {
    if (sortConfig.key !== key) {
      return null;
    }
    return sortConfig.direction === 'ascending' ?
      <ChevronUp className="w-4 h-4 ml-1" /> :
      <ChevronDown className="w-4 h-4 ml-1" />;
  };

  // Reset form data
  const resetForm = () => {
    setFormData({
      title: '',
      author: '',
      isbn: '',
      category: '',
      coverImage: '',
      availableCopies: 0,
      courseCode: courses[0]?.code || '',
      publisher: '',
      publication_year: new Date().getFullYear(),
      edition: '',
      location: '',
      total_copies: 0
    });
  };

  // Handle opening modal for adding a new book
  const handleAddBook = () => {
    setCurrentBook(null);
    resetForm();
    setIsModalOpen(true);
  };

  // Handle opening modal for editing an existing book
  const handleEditBook = (book: Book) => {
    setCurrentBook(book);
    setFormData({
      id: book.book_id,
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      category: book.category,
      coverImage: book.coverImage,
      availableCopies: book.availableCopies,
      courseCode: book.courseCode || '',
      publisher: book.publisher || '',
      publication_year: book.publication_year || new Date().getFullYear(),
      edition: book.edition || '',
      location: book.shelf_location || '',
      total_copies: book.quantity || 0
    });
    setIsModalOpen(true);
  };

  // Handle form submission for adding/editing a book
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newBook: Omit<Book, 'book_id'> = {
      title: formData.title,
      author: formData.author,
      isbn: formData.isbn,
      category: formData.category,
      coverImage: formData.coverImage || 'https://placehold.co/200x300',
      availableCopies: formData.availableCopies,
      course_id: formData.courseCode,
      publisher: formData.publisher,
      publication_year: formData.publication_year,
      edition: formData.edition,
      shelf_location: formData.location,
      available_quantity: formData.availableCopies,
      quantity: formData.total_copies,
      is_available: formData.availableCopies > 0
    };

    setNotification(null); // Clear previous notification

    try {
      if (currentBook) {
        // Update existing book
        const response = await api.updateBook(currentBook.book_id, { ...newBook, book_id: currentBook.book_id });
        if (response && (response.status || response.success) && response.data) {
          setBooks(prevBooks =>
            prevBooks.map(book =>
              book.book_id === currentBook.book_id ? response.data : book
            ).filter((book): book is Book => book !== undefined)
          );
          setFilteredBooks(prevBooks =>
            prevBooks.map(book =>
              book.book_id === currentBook.book_id ? response.data : book
            ).filter((book): book is Book => book !== undefined)
          );
          setNotification({
            type: 'success',
            message: 'Book updated successfully.'
          });
          setTimeout(() => {
            setIsModalOpen(false);
            setNotification(null);
          }, 1200);
        } else {
          setNotification({
            type: 'error',
            message: response?.message || 'Failed to update book'
          });
        }
      } else {
        // Add new book (do not send book_id)
        const response = await api.createBook(newBook);
        if (response && (response.status || response.success) && response.data) {
          setBooks(prevBooks => [response.data, ...prevBooks]);
          setFilteredBooks(prevBooks => [response.data, ...prevBooks]);
          setNotification({
            type: 'success',
            message: 'Book added successfully.'
          });
          setTimeout(() => {
            setIsModalOpen(false);
            setNotification(null);
          }, 1200);
        } else {
          setNotification({
            type: 'error',
            message: response?.message || 'Failed to add book'
          });
        }
      }
    } catch (error) {
      setNotification({
        type: 'error',
        message: 'Network error while saving book.'
      });
    }
  };

  // Handle deleting a book
  const handleDeleteBook = async (bookId: string) => {
    setNotification(null); // Clear previous notification
    if (confirm('Are you sure you want to delete this book?')) {
      try {
        const response = await api.deleteBook(bookId);
        if (response && (response.status || response.success)) {
          setBooks(prevBooks => prevBooks.filter(book => book.book_id !== bookId));
          setFilteredBooks(prevBooks => prevBooks.filter(book => book.book_id !== bookId));
          setNotification({
            type: 'success',
            message: 'Book deleted successfully.'
          });
          setTimeout(() => {
            setNotification(null);
          }, 1200);
        } else {
          setNotification({
            type: 'error',
            message: response?.message || 'Failed to delete book'
          });
        }
      } catch (error) {
        setNotification({
          type: 'error',
          message: 'Network error while deleting book.'
        });
      }
    }
  };

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;

    // Parse numeric values
    if (type === 'number') {
      setFormData({
        ...formData,
        [name]: parseInt(value, 10) || 0
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  // Get unique categories for filtering
  const categories = [...new Set(books.map(book => book.category))];

  // Get availability status display
  const getAvailabilityDisplay = (book: Book) => {
    // Check which property exists and use that one
    const availableCount = book.availableCopies !== undefined ? book.availableCopies : 
                           book.available_quantity !== undefined ? book.available_quantity : 0;
    
    if (availableCount <= 0) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          Out of Stock
        </span>
      );
    } else if (availableCount < 3) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          Low Stock ({availableCount})
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          In Stock ({availableCount})
        </span>
      );
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Book Inventory Management</h1>
        <button
          onClick={handleAddBook}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          Add Book
        </button>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search books..."
              className="pl-10 pr-4 py-2 border rounded-lg w-full focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="relative">
              <select
                value={filterCategory || ''}
                onChange={(e) => setFilterCategory(e.target.value || undefined)}
                className="appearance-none bg-white border rounded-lg px-4 py-2 pr-8 leading-tight focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <select
                value={filterCourse || ''}
                onChange={(e) => setFilterCourse(e.target.value || undefined)}
                className="appearance-none bg-white border rounded-lg px-4 py-2 pr-8 leading-tight focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Courses</option>
                {courses.map(course => (
                  // Use the course_id as the value but display the name and code
                  <option key={course.course_id} value={course.course_id}>
                    {course.course_name || course.name} ({course.course_code || course.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <select
                value={filterAvailability === undefined ? '' : filterAvailability ? 'available' : 'unavailable'}
                onChange={(e) => {
                  if (e.target.value === '') setFilterAvailability(undefined);
                  else setFilterAvailability(e.target.value === 'available');
                }}
                className="appearance-none bg-white border rounded-lg px-4 py-2 pr-8 leading-tight focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Availability</option>
                <option value="available">In Stock</option>
                <option value="unavailable">Out of Stock</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Books Table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading books...</p>
          </div>
        ) : filteredBooks.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => requestSort('title')}
                  >
                    <div className="flex items-center">
                      Book Info
                      {getSortIcon('title')}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => requestSort('category')}
                  >
                    <div className="flex items-center">
                      Category
                      {getSortIcon('category')}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => requestSort('isbn')}
                  >
                    <div className="flex items-center">
                      ISBN
                      {getSortIcon('isbn')}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => requestSort('availableCopies')}
                  >
                    <div className="flex items-center">
                      Availability
                      {getSortIcon('availableCopies')}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => requestSort('shelf_location')}
                  >
                    <div className="flex items-center">
                      Location
                      {getSortIcon('shelf_location')}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBooks.map((book) => (
                  <tr key={book.book_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-8 flex-shrink-0 mr-4 bg-gray-200 rounded overflow-hidden">
                          {book.coverImage ? (
                            <img src={book.coverImage} alt={book.title} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <BookIcon className="h-5 w-5 text-gray-500" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{book.title}</div>
                          <div className="text-sm text-gray-500">
                            {book.author}
                            {book.edition && <span> • {book.edition} Edition</span>}
                          </div>
                          {book.courseCode && (
                            <div className="text-xs text-gray-500">
                              {book.courseCode}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {book.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {book.isbn}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getAvailabilityDisplay(book)}
                      <div className="text-xs text-gray-500 mt-1">
                        Total: {book.quantity || '—'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {book.shelf_location || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEditBook(book)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteBook(book.book_id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <BookIcon className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="mt-4 text-gray-900 font-medium">No books found</h3>
            <p className="mt-1 text-gray-500">
              {searchTerm || filterCategory || filterCourse || filterAvailability !== undefined ?
                'Try adjusting your search or filter criteria.' :
                'Add your first book by clicking the "Add Book" button above.'}
            </p>
          </div>
        )}
      </div>

      {/* Add/Edit Book Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg w-full max-w-3xl mx-4 shadow-xl">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h3 className="text-xl font-medium text-gray-900">
                {currentBook ? 'Edit Book' : 'Add New Book'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="p-6">
                <div className="mb-6">
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                    Book Title
                  </label>
                  <input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    type="text"
                    required
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="author" className="block text-sm font-medium text-gray-700 mb-1">
                      Author
                    </label>
                    <input
                      id="author"
                      name="author"
                      value={formData.author}
                      onChange={handleChange}
                      type="text"
                      required
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="isbn" className="block text-sm font-medium text-gray-700 mb-1">
                      ISBN
                    </label>
                    <input
                      id="isbn"
                      name="isbn"
                      value={formData.isbn}
                      onChange={handleChange}
                      type="text"
                      required
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <input
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      type="text"
                      required
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g. Computer Science, Mathematics"
                    />
                  </div>

                  <div>
                    <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                      Shelf Location
                    </label>
                    <input
                      id="location"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      type="text"
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g. Shelf A-12"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label htmlFor="publisher" className="block text-sm font-medium text-gray-700 mb-1">
                      Publisher
                    </label>
                    <input
                      id="publisher"
                      name="publisher"
                      value={formData.publisher}
                      onChange={handleChange}
                      type="text"
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="publication_year" className="block text-sm font-medium text-gray-700 mb-1">
                      Publication Year
                    </label>
                    <input
                      id="publication_year"
                      name="publication_year"
                      value={formData.publication_year}
                      onChange={handleChange}
                      type="number"
                      min="1900"
                      max={new Date().getFullYear()}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="edition" className="block text-sm font-medium text-gray-700 mb-1">
                      Edition
                    </label>
                    <input
                      id="edition"
                      name="edition"
                      value={formData.edition}
                      onChange={handleChange}
                      type="text"
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g. 1st, 2nd, 3rd"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="courseCode" className="block text-sm font-medium text-gray-700 mb-1">
                      Course Code
                    </label>
                    <select
                      id="courseCode"
                      name="courseCode"
                      value={formData.courseCode}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select a course</option>
                      {courses.map(course => (
                        <option key={course.course_id} value={course.course_id}>
                          {course.code} - {course.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label htmlFor="total_copies" className="block text-sm font-medium text-gray-700 mb-1">
                      Total Copies
                    </label>
                    <input
                      id="total_copies"
                      name="total_copies"
                      value={formData.total_copies}
                      onChange={handleChange}
                      type="number"
                      min="0"
                      required
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="availableCopies" className="block text-sm font-medium text-gray-700 mb-1">
                      Available Copies
                    </label>
                    <input
                      id="availableCopies"
                      name="availableCopies"
                      value={formData.availableCopies}
                      onChange={handleChange}
                      type="number"
                      min="0"
                      max={formData.total_copies}
                      required
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                    {formData.availableCopies > formData.total_copies && (
                      <p className="text-xs text-red-600 mt-1">
                        Available copies cannot exceed total copies
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="coverImage" className="block text-sm font-medium text-gray-700 mb-1">
                      Cover Image URL
                    </label>
                    <input
                      id="coverImage"
                      name="coverImage"
                      value={formData.coverImage}
                      onChange={handleChange}
                      type="url"
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="https://example.com/book-cover.jpg"
                    />
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t bg-gray-50 flex justify-end">
                <button
                  type="button"
                  disabled={formData.availableCopies > formData.total_copies}
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-700 bg-white border rounded-md shadow-sm mr-2 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  disabled={formData.availableCopies > formData.total_copies}
                >
                  {currentBook ? 'Update Book' : 'Add Book'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookStocksManager;