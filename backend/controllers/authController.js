
// controllers/authController.js
const User = require('../models/User');
const emailService = require('../utils/email');
const { generateTokens, verifyRefreshToken } = require('../middleware/auth');
const { ValidationError, AuthenticationError, ConflictError } = require('../utils/errors');
const { asyncCatch } = require('../middleware/errorHandler');
const logger = require('../utils/logger');
const { body, validationResult } = require('express-validator');

// Generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Validation rules
const signupValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters long'),
];

const verifyOTPValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
];

// Controllers
const signup = asyncCatch(async (req, res, next) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ValidationError(errors.array()[0].msg));
  }

  const { email, name } = req.body;

  // Check if user already exists and is verified
  const existingUser = await User.findOne({ email });
  if (existingUser && existingUser.isVerified) {
    return next(new ConflictError('User already exists with this email'));
  }

  // Generate OTP
  const otp = generateOTP();
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  try {
    // Send OTP email
    await emailService.sendOTP(email, otp, name);

    // Save or update user with OTP
    let user;
    if (existingUser) {
      user = await User.findOneAndUpdate(
        { email },
        {
          name,
          otp: { code: otp, expiresAt: otpExpires },
          isVerified: false
        },
        { new: true }
      );
    } else {
      user = new User({
        email,
        name,
        password: 'temp123', // Will be updated when OTP is verified
        otp: { code: otp, expiresAt: otpExpires },
        isVerified: false
      });
      await user.save();
    }

    logger.info('OTP sent successfully', { email, userId: user._id });

    res.status(200).json({
      status: 'success',
      message: 'OTP sent to your email address. Please verify to complete signup.',
      data: {
        email,
        otpExpiresAt: otpExpires
      }
    });
  } catch (error) {
    logger.error('Signup error:', error);
    return next(new Error('Failed to send OTP. Please try again.'));
  }
});

const verifyOTP = asyncCatch(async (req, res, next) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ValidationError(errors.array()[0].msg));
  }

  const { email, otp, password } = req.body;

  // Find user with email and valid OTP
  const user = await User.findOne({
    email,
    'otp.code': otp,
    'otp.expiresAt': { $gt: new Date() }
  });

  if (!user) {
    return next(new ValidationError('Invalid or expired OTP'));
  }

  // Update user with password and verify
  user.password = password;
  user.isVerified = true;
  user.otp = undefined;
  await user.save();

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user._id);

  // Save refresh token
  user.refreshTokens.push({ token: refreshToken });
  await user.save();

  logger.info('User verified and registered successfully', { 
    email, 
    userId: user._id 
  });

  res.status(201).json({
    status: 'success',
    message: 'Account created successfully',
    data: {
      user,
      accessToken,
      refreshToken
    }
  });
});

const login = asyncCatch(async (req, res, next) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ValidationError(errors.array()[0].msg));
  }

  const { email, password } = req.body;

  // Find user with email
  const user = await User.findOne({ email }).select('+password');
  
  if (!user) {
    return next(new AuthenticationError('Invalid email or password'));
  }

  if (!user.isVerified) {
    return next(new AuthenticationError('Please verify your email first'));
  }

  // Check password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    return next(new AuthenticationError('Invalid email or password'));
  }

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user._id);

  // Save refresh token
  user.refreshTokens.push({ token: refreshToken });
  await user.save();

  // Remove password from response
  user.password = undefined;

  logger.info('User logged in successfully', { 
    email, 
    userId: user._id 
  });

  res.status(200).json({
    status: 'success',
    message: 'Login successful',
    data: {
      user,
      accessToken,
      refreshToken
    }
  });
});

const refreshToken = asyncCatch(async (req, res, next) => {
  const { refreshToken: token } = req.body;

  if (!token) {
    return next(new ValidationError('Refresh token is required'));
  }

  try {
    const user = await verifyRefreshToken(token);

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id);

    // Replace old refresh token with new one
    user.refreshTokens = user.refreshTokens.filter(t => t.token !== token);
    user.refreshTokens.push({ token: newRefreshToken });
    await user.save();

    logger.info('Token refreshed successfully', { userId: user._id });

    res.status(200).json({
      status: 'success',
      message: 'Token refreshed successfully',
      data: {
        accessToken,
        refreshToken: newRefreshToken
      }
    });
  } catch (error) {
    return next(error);
  }
});

const logout = asyncCatch(async (req, res, next) => {
  const { refreshToken: token } = req.body;

  if (token) {
    // Remove refresh token from user
    const user = await User.findById(req.user._id);
    if (user) {
      user.refreshTokens = user.refreshTokens.filter(t => t.token !== token);
      await user.save();
    }
  }

  logger.info('User logged out successfully', { userId: req.user._id });

  res.status(200).json({
    status: 'success',
    message: 'Logout successful'
  });
});

const getProfile = asyncCatch(async (req, res, next) => {
  res.status(200).json({
    status: 'success',
    data: {
      user: req.user
    }
  });
});

module.exports = {
  signup: [signupValidation, signup],
  verifyOTP: [verifyOTPValidation, verifyOTP],
  login: [loginValidation, login],
  refreshToken,
  logout,
  getProfile
};