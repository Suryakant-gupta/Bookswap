import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token management
const getAccessToken = () => localStorage.getItem('accessToken');
const getRefreshToken = () => localStorage.getItem('refreshToken');
const setTokens = (accessToken, refreshToken) => {
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
};
const clearTokens = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
};

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = getRefreshToken();
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });

          const { accessToken, refreshToken: newRefreshToken } = response.data.data;
          setTokens(accessToken, newRefreshToken);

          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh failed, redirect to login
          clearTokens();
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token, redirect to login
        clearTokens();
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// Helper function to handle API errors
export const handleApiError = (error) => {
  const message = error.response?.data?.message || error.message || 'Something went wrong';
  toast.error(message);
  console.error('API Error:', error);
  return message;
};

// Auth API functions
export const authAPI = {
  signup: (email, name) => api.post('/auth/signup', { email, name }),
  verifyOTP: (email, otp, password) => api.post('/auth/verify-otp', { email, otp, password }),
  login: (email, password) => api.post('/auth/login', { email, password }),
  logout: (refreshToken) => api.post('/auth/logout', { refreshToken }),
  getProfile: () => api.get('/auth/profile'),
  refreshToken: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
};

// Books API functions
export const booksAPI = {
  getAllBooks: (params = {}) => api.get('/books', { params }),
  getMyBooks: (params = {}) => api.get('/books/my-books', { params }),
  getBookById: (id) => api.get(`/books/${id}`),
  createBook: (formData) => api.post('/books', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  updateBook: (id, formData) => api.put(`/books/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteBook: (id) => api.delete(`/books/${id}`),
};

// Requests API functions
export const requestsAPI = {
  createRequest: (bookId, message) => api.post('/requests', { bookId, message }),
  getSentRequests: (params = {}) => api.get('/requests/sent', { params }),
  getReceivedRequests: (params = {}) => api.get('/requests/received', { params }),
  getRequestById: (id) => api.get(`/requests/${id}`),
  updateRequest: (id, status, responseMessage) => api.put(`/requests/${id}`, { status, responseMessage }),
  cancelRequest: (id) => api.delete(`/requests/${id}`),
  getRequestStats: () => api.get('/requests/stats'),
};