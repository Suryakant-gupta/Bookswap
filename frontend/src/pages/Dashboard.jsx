import React, { useState, useEffect, useCallback } from 'react';
import { booksAPI, requestsAPI, handleApiError, authAPI } from '../services/api';
import BookCard from '../components/Books/BookCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const Dashboard = () => {
  console.log('Dashboard component rendering...');
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    condition: '',
    genre: ''
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalBooks: 0,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [requestMessage, setRequestMessage] = useState('');
  const [requestLoading, setRequestLoading] = useState(false);

  console.log('Dashboard state - books:', books.length, 'loading:', loading);

  // Debounced search function for genre
  const debounce = useCallback((func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }, []);

  // Debounced fetchBooks function
  const debouncedFetchBooks = useCallback(
    debounce((page, search, condition, genre) => {
      fetchBooks(page, search, condition, genre);
    }, 500),
    []
  );

  useEffect(() => {
    console.log('useEffect triggered - about to call fetchBooks');
    fetchBooks();
    console.log('useEffect completed - fetchBooks called');
  }, []);

  const fetchBooks = async (page = 1, search = '', condition = '', genre = '') => {
    console.log('Fetching books with params:', { page, search, condition, genre });
    setLoading(true);
    
    try {
      const params = {
        page,
        limit: 12,
        ...(search && { search }),
        ...(condition && { condition }),
        ...(genre && { genre })
      };
      
      console.log('API request params:', params);
      const response = await booksAPI.getAllBooks(params);
      console.log('API response:', response);
      
      // Handle the response data structure
      if (response && response.data) {
        const { books: fetchedBooks, pagination: paginationData } = response.data.data;
        
        setBooks(fetchedBooks || []);
        setPagination({
          currentPage: paginationData?.currentPage || 1,
          totalPages: paginationData?.totalPages || 1,
          totalBooks: paginationData?.totalBooks || 0,
          hasNextPage: paginationData?.hasNextPage || false,
          hasPrevPage: paginationData?.hasPrevPage || false
        });
      } else {
        console.error('Unexpected response structure:', response);
        setBooks([]);
      }
    } catch (error) {
      console.error('Error fetching books:', error);
      handleApiError(error);
      setBooks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    console.log('Search submitted with term:', searchTerm);
    fetchBooks(1, searchTerm, filters.condition, filters.genre);
  };

  const handleFilterChange = (filterName, value) => {
    console.log('Filter changed:', filterName, '=', value);
    const newFilters = { ...filters, [filterName]: value };
    setFilters(newFilters);
    
    // For condition filter, fetch immediately since it's a dropdown
    if (filterName === 'condition') {
      fetchBooks(1, searchTerm, newFilters.condition, newFilters.genre);
    } 
    // For genre filter, use debounced search to prevent cursor jumping
    else if (filterName === 'genre') {
      debouncedFetchBooks(1, searchTerm, newFilters.condition, newFilters.genre);
    }
  };

  const handlePageChange = (page) => {
    console.log('Page changed to:', page);
    fetchBooks(page, searchTerm, filters.condition, filters.genre);
  };

  const handleRequestBook = (book) => {
    setSelectedBook(book);
    setShowRequestModal(true);
    setRequestMessage('');
  };

  const submitRequest = async () => {
    if (!selectedBook) return;

    setRequestLoading(true);
    try {
      await requestsAPI.createRequest(selectedBook._id, requestMessage);
      toast.success('Request sent successfully!');
      setShowRequestModal(false);
      setSelectedBook(null);
      setRequestMessage('');
      // Refresh books to update availability
      fetchBooks(pagination.currentPage, searchTerm, filters.condition, filters.genre);
    } catch (error) {
      handleApiError(error);
    } finally {
      setRequestLoading(false);
    }
  };

  // Show loading spinner only when loading and no books are displayed
  if (loading && books.length === 0) {
    console.log('Dashboard showing loading spinner');
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  console.log('Dashboard rendering main content with books:', books.length);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Book Exchange Marketplace</h1>
        <p className="text-gray-600">Discover books from other users and request what interests you</p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <form onSubmit={handleSearch} className="mb-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search books by title, author, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </form>

        <div className="flex flex-col sm:flex-row gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Condition
            </label>
            <select
              value={filters.condition}
              onChange={(e) => handleFilterChange('condition', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">All Conditions</option>
              <option value="New">New</option>
              <option value="Like New">Like New</option>
              <option value="Good">Good</option>
              <option value="Fair">Fair</option>
              <option value="Poor">Poor</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Genre
            </label>
            <input
              type="text"
              placeholder="Enter genre (e.g., Fiction, Mystery, Romance)"
              value={filters.genre}
              onChange={(e) => handleFilterChange('genre', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-6">
        <p className="text-gray-600">
          Showing {books.length} of {pagination.totalBooks} books
          {(searchTerm || filters.condition || filters.genre) && (
            <span className="ml-2 text-sm">
              {searchTerm && `(searching for "${searchTerm}")`}
              {filters.condition && ` (condition: ${filters.condition})`}
              {filters.genre && ` (genre: ${filters.genre})`}
            </span>
          )}
        </p>
      </div>

      {/* Books Grid */}
      {books.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
          {books.map((book) => (
            <BookCard
              key={book._id}
              book={book}
              onRequest={handleRequestBook}
              isOwner={false}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📚</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No books found</h3>
          <p className="text-gray-600">
            {searchTerm || filters.condition || filters.genre
              ? 'Try adjusting your search or filters'
              : 'No books are currently available for exchange'}
          </p>
          {(searchTerm || filters.condition || filters.genre) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setFilters({ condition: '', genre: '' });
                fetchBooks(1, '', '', '');
              }}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2">
          <button
            onClick={() => handlePageChange(pagination.currentPage - 1)}
            disabled={!pagination.hasPrevPage || loading}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          <span className="px-4 py-2 text-sm text-gray-700">
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          
          <button
            onClick={() => handlePageChange(pagination.currentPage + 1)}
            disabled={!pagination.hasNextPage || loading}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}

      {/* Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Request Book: {selectedBook?.title}
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message to Owner (Optional)
              </label>
              <textarea
                value={requestMessage}
                onChange={(e) => setRequestMessage(e.target.value)}
                rows="4"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Add a personal message to the book owner..."
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowRequestModal(false)}
                disabled={requestLoading}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={submitRequest}
                disabled={requestLoading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {requestLoading ? 'Sending...' : 'Send Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;