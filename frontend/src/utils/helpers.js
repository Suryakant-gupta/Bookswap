// Date formatting utilities
export const formatDate = (dateString) => {
  const options = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  return new Date(dateString).toLocaleDateString('en-US', options);
};

// Format date to simple date
export const formatSimpleDate = (dateString) => {
  const options = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  };
  return new Date(dateString).toLocaleDateString('en-US', options);
};

// Get relative time (e.g., "2 days ago")
export const getRelativeTime = (dateString) => {
  const now = new Date();
  const date = new Date(dateString);
  const diffInMs = now - date;
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));

  if (diffInDays > 7) {
    return formatSimpleDate(dateString);
  } else if (diffInDays >= 1) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  } else if (diffInHours >= 1) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  } else if (diffInMinutes >= 1) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  } else {
    return 'Just now';
  }
};

// Truncate text with ellipsis
export const truncateText = (text, maxLength) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// Validate email format
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate ISBN format (10 or 13 digits)
export const isValidISBN = (isbn) => {
  if (!isbn) return true; // Optional field
  const cleanISBN = isbn.replace(/[-\s]/g, '');
  return /^(?:\d{10}|\d{13})$/.test(cleanISBN);
};

// Get book condition color classes
export const getConditionColor = (condition) => {
  const colors = {
    'New': 'bg-green-100 text-green-800 border-green-200',
    'Like New': 'bg-blue-100 text-blue-800 border-blue-200',
    'Good': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'Fair': 'bg-orange-100 text-orange-800 border-orange-200',
    'Poor': 'bg-red-100 text-red-800 border-red-200'
  };
  return colors[condition] || 'bg-gray-100 text-gray-800 border-gray-200';
};

// Get request status color classes
export const getStatusColor = (status) => {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    accepted: 'bg-green-100 text-green-800 border-green-200',
    declined: 'bg-red-100 text-red-800 border-red-200',
    cancelled: 'bg-gray-100 text-gray-800 border-gray-200',
    completed: 'bg-blue-100 text-blue-800 border-blue-200'
  };
  return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
};

// Format file size
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Check if image file
export const isImageFile = (file) => {
  return file && file.type.startsWith('image/');
};

// FIXED IMAGE URL FUNCTION - Use this everywhere in your app
export const getImageUrl = (imagePath) => {
  // Return placeholder if no image path
  if (!imagePath) {
    return getPlaceholderImage();
  }
  
  // Get base URL from environment variable or default to localhost
  const baseURL = import.meta.env.VITE_API_URL 
    ? import.meta.env.VITE_API_URL.replace('/api', '') 
    : 'http://localhost:5000';
  
  // Handle different image path formats
  let cleanImagePath = imagePath;
  
  // If the imagePath already contains 'uploads/', remove it to avoid duplication
  if (imagePath.startsWith('uploads/')) {
    cleanImagePath = imagePath.replace('uploads/', '');
  }
  
  // If the imagePath starts with '/', remove it
  if (cleanImagePath.startsWith('/')) {
    cleanImagePath = cleanImagePath.substring(1);
  }
  
  // Construct the final URL
  const finalUrl = `${baseURL}/uploads/${cleanImagePath}`;
  
  console.log('Image URL constructed:', finalUrl); // Debug log - remove in production
  
  return finalUrl;
};

// Generate placeholder image URL
export const getPlaceholderImage = (width = 200, height = 300) => {
  return `https://via.placeholder.com/${width}x${height}/e5e7eb/9ca3af?text=No+Image`;
};

// NEW: Handle image loading errors - use this in onError handlers
export const handleImageError = (event, fallbackUrl = null) => {
  const img = event.target;
  
  // If we haven't already tried the placeholder, try it
  if (!img.src.includes('placeholder')) {
    img.src = fallbackUrl || getPlaceholderImage();
  }
  
  console.warn('Image failed to load:', img.src); // Debug log - remove in production
};

// NEW: Preload image utility
export const preloadImage = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};

// NEW: Get optimized image URL with size parameters (if your backend supports it)
export const getOptimizedImageUrl = (imagePath, width = null, height = null) => {
  const baseUrl = getImageUrl(imagePath);
  
  if (!baseUrl || baseUrl.includes('placeholder')) {
    return baseUrl;
  }
  
  // Add query parameters for image optimization (implement on backend if needed)
  const params = new URLSearchParams();
  if (width) params.append('w', width);
  if (height) params.append('h', height);
  
  return params.toString() ? `${baseUrl}?${params}` : baseUrl;
};