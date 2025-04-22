import React, { useState, useEffect } from 'react';
import { Book, Filter, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { useAuth } from '../../utils/AuthContext';
import { getIssuedBooks } from '../../utils/mockData';
import { IssuedBook } from '../../types';

const IssuedBooks: React.FC = () => {
  const { user } = useAuth();
  const [issuedBooks, setIssuedBooks] = useState<IssuedBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'issued' | 'overdue' | 'returned'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // In a real app, this would be an API call
    if (user) {
      const books = getIssuedBooks(user.id);
      setIssuedBooks(books);
      setLoading(false);
    }
  }, [user]);

  // Filter and search books
  const filteredBooks = issuedBooks
    .filter(book => {
      if (filter === 'all') return true;
      return book.status === filter;
    })
    .filter(book => 
      book.book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.book.isbn.toLowerCase().includes(searchTerm.toLowerCase())
    );

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="text-gray-500">Loading books...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Issued Books</h1>
        <p className="text-gray-600">View and manage your issued books</p>
      </div>

      {/* Filter and search */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="flex space-x-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 text-sm rounded-md ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border hover:bg-gray-50'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('issued')}
            className={`px-4 py-2 text-sm rounded-md flex items-center ${
              filter === 'issued'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border hover:bg-gray-50'
            }`}
          >
            <Book className="h-4 w-4 mr-1" />
            Issued
          </button>
          <button
            onClick={() => setFilter('overdue')}
            className={`px-4 py-2 text-sm rounded-md flex items-center ${
              filter === 'overdue'
                ? 'bg-red-600 text-white'
                : 'bg-white text-gray-700 border hover:bg-gray-50'
            }`}
          >
            <AlertTriangle className="h-4 w-4 mr-1" />
            Overdue
          </button>
          <button
            onClick={() => setFilter('returned')}
            className={`px-4 py-2 text-sm rounded-md flex items-center ${
              filter === 'returned'
                ? 'bg-green-600 text-white'
                : 'bg-white text-gray-700 border hover:bg-gray-50'
            }`}
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            Returned
          </button>
        </div>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3">
            <Filter className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search books..."
            className="pl-10 pr-4 py-2 rounded-md border w-full md:w-64"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Books list */}
      {filteredBooks.length > 0 ? (
        <div className="bg-white shadow overflow-hidden rounded-md border">
          <ul className="divide-y divide-gray-200">
            {filteredBooks.map((book) => (
              <li key={book.id} className="p-4 hover:bg-gray-50">
                <div className="flex flex-col md:flex-row md:items-center">
                  <div className="flex items-start md:w-1/2">
                    <div className="h-16 w-12 bg-gray-100 rounded flex-shrink-0 overflow-hidden mr-4">
                      {book.book.coverImage && (
                        <img
                          src={book.book.coverImage}
                          alt={book.book.title}
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{book.book.title}</div>
                      <div className="text-sm text-gray-500">{book.book.author}</div>
                      <div className="text-sm text-gray-500">ISBN: {book.book.isbn}</div>
                      <div className="mt-1">
                        {book.status === 'issued' && (
                          <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 flex items-center w-fit">
                            <Book className="h-3 w-3 mr-1" />
                            Issued
                          </span>
                        )}
                        {book.status === 'overdue' && (
                          <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800 flex items-center w-fit">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Overdue
                          </span>
                        )}
                        {book.status === 'returned' && (
                          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 flex items-center w-fit">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Returned
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 md:mt-0 md:ml-6 grid grid-cols-1 md:grid-cols-3 gap-4 md:w-1/2">
                    <div>
                      <div className="text-xs font-medium text-gray-500 uppercase">Issued Date</div>
                      <div className="mt-1 text-sm text-gray-900">{book.issuedDate}</div>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-gray-500 uppercase">Due Date</div>
                      <div className="mt-1 text-sm text-gray-900">{book.dueDate}</div>
                    </div>
                    <div>
                      {book.status === 'overdue' && (
                        <>
                          <div className="text-xs font-medium text-red-500 uppercase">Fine</div>
                          <div className="mt-1 text-sm text-red-600">₹{book.fine}</div>
                        </>
                      )}
                      {book.status === 'returned' && (
                        <>
                          <div className="text-xs font-medium text-gray-500 uppercase">Returned On</div>
                          <div className="mt-1 text-sm text-gray-900">{book.returnDate}</div>
                        </>
                      )}
                      {book.status === 'issued' && (
                        <>
                          <div className="text-xs font-medium text-gray-500 uppercase">Remaining</div>
                          <div className="mt-1 text-sm text-gray-900">
                            {Math.max(
                              0,
                              Math.ceil(
                                (new Date(book.dueDate).getTime() - new Date().getTime()) /
                                  (1000 * 60 * 60 * 24)
                              )
                            )}{" "}
                            days
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="bg-white p-8 rounded-md border text-center">
          <Book className="h-12 w-12 mx-auto text-gray-300" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">No books found</h3>
          <p className="mt-1 text-gray-500">
            {filter !== 'all'
              ? `You don't have any ${filter} books`
              : searchTerm
              ? 'No books match your search criteria'
              : 'You have not issued any books yet'}
          </p>
        </div>
      )}
    </div>
  );
};

export default IssuedBooks;