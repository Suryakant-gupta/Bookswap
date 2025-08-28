import React, { useState, useEffect } from 'react';
import authService from '../services/auth';
import toast from 'react-hot-toast';

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async (retryCount = 0) => {
    const maxRetries = 2;
    const retryDelay = 1000; // 1 second
    
    try {
      setLoading(true);
      
      // First, try to get fresh data from API
      try {
        const response = await authService.getProfile();
        const userData = response.data;
        setProfile(userData);
        setFormData({
          name: userData.name || '',
          email: userData.email || '',
        });
      } catch (apiError) {
        console.error('API Error:', apiError);
        
        // Handle specific error cases
        if (apiError.response?.status === 429 && retryCount < maxRetries) {
          // Rate limit hit, retry after delay
          console.log(`Rate limit hit, retrying in ${retryDelay}ms... (Attempt ${retryCount + 1}/${maxRetries})`);
          setTimeout(() => {
            fetchProfile(retryCount + 1);
          }, retryDelay * (retryCount + 1)); // Exponential backoff
          return;
        }
        
        // If API fails or max retries reached, fallback to localStorage data
        console.log('API call failed, using cached user data');
        const cachedUser = authService.getUser();
        if (cachedUser) {
          setProfile(cachedUser);
          setFormData({
            name: cachedUser.name || '',
            email: cachedUser.email || '',
          });
          
          if (apiError.response?.status === 429) {
            toast.error('Server is busy. Showing cached profile data.');
          }
        } else {
          throw new Error('No user data available');
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Unable to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveChanges = async () => {
    try {
      await authService.updateProfile(formData);
      const updatedUser = { ...profile, ...formData };
      setProfile(updatedUser);
      setIsEditing(false);
    } catch (error) {
      // Error is handled by authService
    }
  };

  const handleCancelEdit = () => {
    setFormData({
      name: profile?.name || '',
      email: profile?.email || '',
    });
    setIsEditing(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="text-gray-600">Loading profile...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-8">
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg">
                <span className="text-3xl font-bold text-indigo-600">
                  {profile?.name?.charAt(0)?.toUpperCase()}
                </span>
              </div>
              <div className="text-white">
                <h1 className="text-3xl font-bold">{profile?.name}</h1>
                <p className="text-indigo-100 mt-1">{profile?.email}</p>
              </div>
            </div>
          </div>

          {/* Profile Content */}
          <div className="px-6 py-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center space-x-2"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span>Edit Profile</span>
                </button>
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={handleSaveChanges}
                    className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors flex items-center space-x-2"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Save</span>
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="bg-gray-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-600 transition-colors flex items-center space-x-2"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span>Cancel</span>
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">{profile?.name}</p>
                )}
              </div>

              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">{profile?.email}</p>
                )}
              </div>

              {/* User ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  User ID
                </label>
                <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">{profile?.id || profile?._id}</p>
              </div>

              {/* Account Created */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Member Since
                </label>
                <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                  {formatDate(profile?.createdAt)}
                </p>
              </div>

              {/* Verification Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Status
                </label>
                <div className="flex items-center space-x-2">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      profile?.isVerified
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {profile?.isVerified ? 'Verified' : 'Pending Verification'}
                  </span>
                  {profile?.isVerified && (
                    <svg
                      className="w-4 h-4 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </div>
              </div>

              {/* Last Updated */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Updated
                </label>
                <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                  {formatDate(profile?.updatedAt)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;