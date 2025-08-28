// middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { AuthenticationError, ValidationError } = require('../utils/errors');
const logger = require('../utils/logger');

const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      throw new AuthenticationError('Access token required');
    }

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    
    const user = await User.findById(decoded.userId).select('-password -otp -refreshTokens');
    if (!user) {
      throw new AuthenticationError('Invalid token - user not found');
    }

    if (!user.isVerified) {
      throw new AuthenticationError('Please verify your email first');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new AuthenticationError('Invalid token'));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new AuthenticationError('Token expired'));
    }
    next(error);
  }
};

const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId }, 
    process.env.JWT_ACCESS_SECRET, 
    { expiresIn: '15m' }
  );
  
  const refreshToken = jwt.sign(
    { userId }, 
    process.env.JWT_REFRESH_SECRET, 
    { expiresIn: '7d' }
  );
  
  return { accessToken, refreshToken };
};

const verifyRefreshToken = async (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    
    const user = await User.findById(decoded.userId);
    if (!user) {
      throw new AuthenticationError('Invalid refresh token - user not found');
    }

    const tokenExists = user.refreshTokens.some(t => t.token === token);
    if (!tokenExists) {
      throw new AuthenticationError('Invalid refresh token');
    }

    return user;
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      throw new AuthenticationError('Invalid or expired refresh token');
    }
    throw error;
  }
};

module.exports = {
  authenticate,
  generateTokens,
  verifyRefreshToken
};
