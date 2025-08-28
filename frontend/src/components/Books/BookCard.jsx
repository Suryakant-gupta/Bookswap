import React from 'react';
import { handleApiError } from '../../services/api';
import toast from 'react-hot-toast';
import { getImageUrl, handleImageError, getConditionColor } from '../../utils/helpers';

const BookCard = ({ book, onRequest, onEdit, onDelete, showActions = true, isOwner = false }) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-w-3 aspect-h-4">
        <img
          src={getImageUrl(book.image)}
          alt={book.title}
          className="w-full h-48 object-cover"
          onError={(e) => handleImageError(e)}
        />
      </div>
      
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 flex-1">
            {book.title}
          </h3>
          <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${getConditionColor(book.condition)}`}>
            {book.condition}
          </span>
        </div>
        
        <p className="text-sm text-gray-600 mb-2">by {book.author}</p>
        
        {book.genre && (
          <p className="text-xs text-gray-500 mb-2">Genre: {book.genre}</p>
        )}
        
        {book.description && (
          <p className="text-sm text-gray-700 line-clamp-2 mb-3">
            {book.description}
          </p>
        )}
        
        {book.owner && (
          <p className="text-xs text-gray-500 mb-3">
            Owner: {book.owner.name}
          </p>
        )}
        
        {!book.isAvailable && (
          <div className="mb-3">
            <span className="inline-block bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
              Not Available
            </span>
          </div>
        )}
        
        {showActions && (
          <div className="flex space-x-2">
            {isOwner ? (
              <>
                <button
                  onClick={() => onEdit(book)}
                  className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(book._id)}
                  className="flex-1 bg-red-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </>
            ) : (
              <button
                onClick={() => onRequest(book)}
                disabled={!book.isAvailable}
                className="w-full bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {book.isAvailable ? 'Request Book' : 'Not Available'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BookCard;