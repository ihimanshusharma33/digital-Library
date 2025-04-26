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

const BookStocksManager: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentBook, setCurrentBook] = useState<Book | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);

  // Filter states
  const [filterCategory, setFilterCategory] = useState<string | undefined>(undefined);
  const [filterCourse, setFilterCourse] = useState<string | undefined>(undefined);
  const [filterSemester, setFilterSemester] = useState<number | undefined>(undefined);
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
    semester: number;
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
    semester: 1,
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
            id: course.id.toString(),
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

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const response = await fetch(`${getApiBaseUrl()}${API_ENDPOINTS.BOOKS}`);
        const data = await response.json();
        
        if (data && data.status) {
          setBooks(data.data);
          setFilteredBooks(data.data);
          // Removed unused setApiError call
        } else {
          console.error('Failed to fetch books from API');
          // Removed unused setApiError call
        }
      } catch (error) {
        console.error('Error fetching books:', error);
        // Removed unused setApiError call
      } finally {
        setIsLoading(false);
      }
    };

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
          book.publisher?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply category filter
    if (filterCategory) {
      result = result.filter(book => book.category === filterCategory);
    }
    
    // Apply course filter
    if (filterCourse) {
      result = result.filter(book => book.courseCode === filterCourse);
    }
    
    // Apply semester filter
    if (filterSemester !== undefined) {
      result = result.filter(book => book.semester === filterSemester);
    }

    // Apply availability filter
    if (filterAvailability !== undefined) {
      if (filterAvailability) {
        result = result.filter(book => book.availableCopies > 0);
      } else {
        result = result.filter(book => book.availableCopies === 0);
      }
    }
    
    // Apply sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        if (sortConfig.key && (a[sortConfig.key as keyof Book] ?? '') < (b[sortConfig.key as keyof Book] ?? '')) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (sortConfig.key && (a[sortConfig.key as keyof Book] ?? '') > (b[sortConfig.key as keyof Book] ?? '')) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }

    setFilteredBooks(result);
  }, [books, searchTerm, filterCategory, filterCourse, filterSemester, filterAvailability, sortConfig]);

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
      semester: 1,
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
      id: book.id,
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      category: book.category,
      coverImage: book.coverImage,
      availableCopies: book.availableCopies,
      courseCode: book.courseCode || '',
      semester: book.semester || 1,
      publisher: book.publisher || '',
      publication_year: book.publication_year || new Date().getFullYear(),
      edition: book.edition || '',
      location: book.location || '',
      total_copies: book.total_copies || 0
    });
    setIsModalOpen(true);
  };

  // Handle deleting a book
  const handleDeleteBook = (bookId: string) => {
    if (confirm('Are you sure you want to delete this book?')) {
      // In a real app, make an API call to delete the book
      setBooks(prevBooks => prevBooks.filter(book => book.id !== bookId));
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

  // Handle form submission for adding/editing a book
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newBook: Book = {
      id: currentBook?.id || String(new Date().getTime()),
      title: formData.title,
      author: formData.author,
      isbn: formData.isbn,
      category: formData.category,
      coverImage: formData.coverImage || 'https://placehold.co/200x300',
      availableCopies: formData.availableCopies,
      courseCode: formData.courseCode,
      semester: formData.semester,
      publisher: formData.publisher,
      publication_year: formData.publication_year,
      edition: formData.edition,
      location: formData.location,
      total_copies: formData.total_copies
    };

    if (currentBook) {
      // Editing existing book
      setBooks(prevBooks => 
        prevBooks.map(book => 
          book.id === currentBook.id ? newBook : book
        )
      );
    } else {
      // Adding new book
      setBooks(prevBooks => [...prevBooks, newBook]);
    }
    
    setIsModalOpen(false);
  };
  
  // Get unique categories for filtering
  const categories = [...new Set(books.map(book => book.category))];
  
  // Get availability status display
  const getAvailabilityDisplay = (book: Book) => {
    if (book.availableCopies <= 0) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          Out of Stock
        </span>
      );
    } else if (book.availableCopies < 3) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          Low Stock ({book.availableCopies})
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          In Stock ({book.availableCopies})
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
                    onClick={() => requestSort('location')}
                  >
                    <div className="flex items-center">
                      Location
                      {getSortIcon('location')}
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
                  <tr key={book.id} className="hover:bg-gray-50">
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
                              {book.courseCode} {book.semester && `• Sem ${book.semester}`}
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
                        Total: {book.total_copies || '—'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {book.location || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => handleEditBook(book)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteBook(book.id)}
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
              {searchTerm || filterCategory || filterCourse || filterSemester !== undefined ? 
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
                        <option key={course.id} value={course.code}>
                          {course.code} - {course.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="semester" className="block text-sm font-medium text-gray-700 mb-1">
                      Semester
                    </label>
                    <select
                      id="semester"
                      name="semester"
                      value={formData.semester}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                        <option key={sem} value={sem}>
                          Semester {sem}
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