import React, { useState, useEffect } from 'react';
import { booksAPI, handleApiError } from '../services/api';
import BookCard from '../components/Books/BookCard';
import BookForm from '../components/Books/BookForm';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const MyBooks = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalBooks: 0
  });
   useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async (page = 1) => {
    setLoading(true);
    try {
      const response = await booksAPI.getMyBooks({ page, limit: 12 });
      setBooks(response.data.data.books);
      setPagination(response.data.data.pagination);
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

 

  const handleAddBook = () => {
    setEditingBook(null);
    setShowForm(true);
  };

  const handleEditBook = (book) => {
    setEditingBook(book);
    setShowForm(true);
  };

  const handleDeleteBook = async (bookId) => {
    if (!window.confirm('Are you sure you want to delete this book?')) {
      return;
    }

    try {
      await booksAPI.deleteBook(bookId);
      toast.success('Book deleted successfully');
      // Refresh the current page or go to previous page if current page becomes empty
      const newTotalBooks = pagination.totalBooks - 1;
      const newTotalPages = Math.ceil(newTotalBooks / 12);
      const targetPage = pagination.currentPage > newTotalPages ? Math.max(1, newTotalPages) : pagination.currentPage;
      fetchBooks(targetPage);
    } catch (error) {
      handleApiError(error);
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingBook(null);
    fetchBooks(pagination.currentPage);
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingBook(null);
  };

  const handlePageChange = (page) => {
    fetchBooks(page);
  };

  if (loading && books.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (showForm) {
    return (
      <BookForm
        book={editingBook}
        onSuccess={handleFormSuccess}
        onCancel={handleFormCancel}
      />
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Books</h1>
          <p className="text-gray-600">Manage your book collection</p>
        </div>
        <button
          onClick={handleAddBook}
          className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
        >
          + Add New Book
        </button>
      </div>

      {/* Stats */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-indigo-600">{pagination.totalBooks}</div>
            <div className="text-sm text-gray-600">Total Books</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {books.filter(book => book.isAvailable).length}
            </div>
            <div className="text-sm text-gray-600">Available</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600">
              {books.filter(book => !book.isAvailable).length}
            </div>
            <div className="text-sm text-gray-600">Not Available</div>
          </div>
        </div>
      </div>

      {/* Books Grid */}
      {books.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
          {books.map((book) => (
            <BookCard
              key={book._id}
              book={book}
              onEdit={handleEditBook}
              onDelete={handleDeleteBook}
              isOwner={true}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📖</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No books yet</h3>
          <p className="text-gray-600 mb-6">
            Start building your collection by adding your first book
          </p>
          <button
            onClick={handleAddBook}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            Add Your First Book
          </button>
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2">
          <button
            onClick={() => handlePageChange(pagination.currentPage - 1)}
            disabled={!pagination.hasPrevPage}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          <span className="px-4 py-2 text-sm text-gray-700">
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          
          <button
            onClick={() => handlePageChange(pagination.currentPage + 1)}
            disabled={!pagination.hasNextPage}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default MyBooks;