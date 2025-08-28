// src/pages/ReceivedRequests.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { requestsAPI, handleApiError } from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const ReceivedRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalRequests: 0
  });
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [responseMessage, setResponseMessage] = useState('');
  const [responseLoading, setResponseLoading] = useState(false);

  const fetchRequests = async (page = 1, status = '') => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 10,
        ...(status && status !== 'all' && { status })
      };
      
      const response = await requestsAPI.getReceivedRequests(params);
      setRequests(response.data.data.requests);
      setPagination(response.data.data.pagination);
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    fetchRequests(1, newFilter);
  };

  const handlePageChange = (page) => {
    fetchRequests(page, filter);
  };

  const handleResponseClick = (request, status) => {
    setSelectedRequest({ ...request, responseStatus: status });
    setResponseMessage('');
    setShowResponseModal(true);
  };

  const submitResponse = async () => {
    if (!selectedRequest) return;

    setResponseLoading(true);
    try {
      await requestsAPI.updateRequest(
        selectedRequest._id,
        selectedRequest.responseStatus,
        responseMessage
      );
      toast.success(`Request ${selectedRequest.responseStatus} successfully`);
      setShowResponseModal(false);
      setSelectedRequest(null);
      setResponseMessage('');
      fetchRequests(pagination.currentPage, filter);
    } catch (error) {
      handleApiError(error);
    } finally {
      setResponseLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-green-100 text-green-800',
      declined: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
      completed: 'bg-blue-100 text-blue-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

 const getImageUrl = (imagePath) => {
  if (!imagePath) return '/api/placeholder/100/150';

 
  return `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}/uploads/${imagePath}`;
};

  if (loading && requests.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Received Requests</h1>
          <p className="text-gray-600">Manage requests for your books</p>
        </div>
        <Link
          to="/requests/sent"
          className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
        >
          View Sent Requests
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex flex-wrap gap-2">
          {['all', 'pending', 'accepted', 'declined', 'completed'].map((status) => (
            <button
              key={status}
              onClick={() => handleFilterChange(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === status
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status === 'all' ? 'All Requests' : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-6">
        <p className="text-gray-600">
          {pagination.totalRequests} request{pagination.totalRequests !== 1 ? 's' : ''} found
        </p>
      </div>

      {/* Requests List */}
      {requests.length > 0 ? (
        <div className="space-y-6 mb-8">
          {requests.map((request) => (
            <div key={request._id} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Book Image */}
                  <div className="flex-shrink-0">
                    <img
                      src={getImageUrl(request.book.image)}
                      alt={request.book.title}
                      className="w-20 h-28 object-cover rounded"
                      onError={(e) => {
                        e.target.src = '/api/placeholder/100/150';
                      }}
                    />
                  </div>

                  {/* Request Details */}
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {request.book.title}
                        </h3>
                        <p className="text-sm text-gray-600">by {request.book.author}</p>
                        <p className="text-sm text-gray-500">Requested by: {request.requester.name}</p>
                        <p className="text-xs text-gray-400">Email: {request.requester.email}</p>
                      </div>
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(request.status)}`}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </span>
                    </div>

                    {request.message && (
                      <div className="mb-3">
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Requester's message:</span> {request.message}
                        </p>
                      </div>
                    )}

                    {request.responseMessage && (
                      <div className="mb-3">
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Your response:</span> {request.responseMessage}
                        </p>
                      </div>
                    )}

                    <div className="flex justify-between items-center">
                      <div className="text-xs text-gray-500">
                        <p>Requested: {new Date(request.requestedAt).toLocaleDateString()}</p>
                        {request.respondedAt && (
                          <p>Responded: {new Date(request.respondedAt).toLocaleDateString()}</p>
                        )}
                      </div>

                      {request.status === 'pending' && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleResponseClick(request, 'accepted')}
                            className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleResponseClick(request, 'declined')}
                            className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
                          >
                            Decline
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📬</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No requests found</h3>
          <p className="text-gray-600 mb-6">
            {filter === 'all' 
              ? "You haven't received any book requests yet"
              : `No ${filter} requests found`
            }
          </p>
          <Link
            to="/my-books"
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            Manage My Books
          </Link>
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

      {/* Response Modal */}
      {showResponseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {selectedRequest?.responseStatus === 'accepted' ? 'Accept' : 'Decline'} Request
            </h3>
            
            <p className="text-sm text-gray-600 mb-4">
              Book: <span className="font-medium">{selectedRequest?.book.title}</span>
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Response Message (Optional)
              </label>
              <textarea
                value={responseMessage}
                onChange={(e) => setResponseMessage(e.target.value)}
                rows="4"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder={
                  selectedRequest?.responseStatus === 'accepted'
                    ? "Let the requester know how to proceed with the book exchange..."
                    : "Optionally explain why you're declining this request..."
                }
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowResponseModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={submitResponse}
                disabled={responseLoading}
                className={`px-4 py-2 rounded-md text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed ${
                  selectedRequest?.responseStatus === 'accepted'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {responseLoading ? 'Processing...' : 
                  (selectedRequest?.responseStatus === 'accepted' ? 'Accept Request' : 'Decline Request')
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceivedRequests;