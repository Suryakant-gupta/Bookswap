import { authAPI, handleApiError } from './api';
import toast from 'react-hot-toast';

class AuthService {
  constructor() {
    this.user = null;
    this.isAuthenticated = false;
    this.init();
  }

  init() {
    const user = localStorage.getItem('user');
    const accessToken = localStorage.getItem('accessToken');
    
    if (user && accessToken) {
      this.user = JSON.parse(user);
      this.isAuthenticated = true;
    }
  }

  async signup(email, name) {
    try {
      const response = await authAPI.signup(email, name);
      toast.success(response.data.message);
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  }

  async verifyOTP(email, otp, password) {
    try {
      const response = await authAPI.verifyOTP(email, otp, password);
      
      const { user, accessToken, refreshToken } = response.data.data;
      
      // Store tokens and user info
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
      
      this.user = user;
      this.isAuthenticated = true;
      
      toast.success(response.data.message);
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  }

  async login(email, password) {
    try {
      const response = await authAPI.login(email, password);
      
      const { user, accessToken, refreshToken } = response.data.data;
      
      // Store tokens and user info
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
      
      this.user = user;
      this.isAuthenticated = true;
      
      toast.success(response.data.message);
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  }

  async logout() {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await authAPI.logout(refreshToken);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      
      this.user = null;
      this.isAuthenticated = false;
      
      toast.success('Logged out successfully');
    }
  }

  async getProfile() {
    try {
      const response = await authAPI.getProfile();
      console.log('Profile response:', response);
      
      // Fix: The API returns response.data.data.user, not response.data.data
      const userData = response.data.data.user; // Access the actual user object
      console.log('User data extracted:', userData);
      
      // Update local user data
      localStorage.setItem('user', JSON.stringify(userData));
      this.user = userData;
      
      return { data: userData }; // Return the user data directly
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  }

  async updateProfile(profileData) {
    try {
      // Note: You might need to add an update profile endpoint to your API
      // For now, we'll just update the local storage and user object
      const updatedUser = { ...this.user, ...profileData };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      this.user = updatedUser;
      
      toast.success('Profile updated successfully');
      return { data: { data: updatedUser } };
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  }

  getUser() {
    return this.user;
  }

  isLoggedIn() {
    return this.isAuthenticated;
  }

  // Helper method to refresh user data from localStorage
  refreshUserData() {
    const user = localStorage.getItem('user');
    if (user) {
      this.user = JSON.parse(user);
    }
  }
}

// Create singleton instance
const authService = new AuthService();
export default authService;