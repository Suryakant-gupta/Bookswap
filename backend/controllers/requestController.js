// controllers/requestController.js
const Request = require('../models/Request');
const Book = require('../models/Book');
const User = require('../models/User');
const emailService = require('../utils/email');
const { ValidationError, NotFoundError, AuthorizationError, ConflictError } = require('../utils/errors');
const { asyncCatch } = require('../middleware/errorHandler');
const logger = require('../utils/logger');
const { body, validationResult } = require('express-validator');

// Validation rules
const createRequestValidation = [
  body('bookId').notEmpty().withMessage('Book ID is required')
    .isMongoId().withMessage('Invalid book ID'),
  body('message').optional().trim()
    .isLength({ max: 500 }).withMessage('Message cannot exceed 500 characters')
];

const updateRequestValidation = [
  body('status').isIn(['accepted', 'declined', 'completed'])
    .withMessage('Status must be one of: accepted, declined, completed'),
  body('responseMessage').optional().trim()
    .isLength({ max: 500 }).withMessage('Response message cannot exceed 500 characters')
];

// Controllers
const createRequest = asyncCatch(async (req, res, next) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ValidationError(errors.array()[0].msg));
  }

  const { bookId, message } = req.body;

  // Find the book
  const book = await Book.findById(bookId).populate('owner', 'name email');
  
  if (!book) {
    return next(new NotFoundError('Book not found'));
  }

  // Check if book is available
  if (!book.isAvailable) {
    return next(new ValidationError('This book is no longer available'));
  }

  // Check if user is trying to request their own book
  if (book.owner._id.toString() === req.user._id.toString()) {
    return next(new ValidationError('You cannot request your own book'));
  }

  // Check if user has already requested this book
  const existingRequest = await Request.findOne({
    book: bookId,
    requester: req.user._id
  });

  if (existingRequest) {
    return next(new ConflictError('You have already requested this book'));
  }

  // Create the request
  const request = new Request({
    book: bookId,
    requester: req.user._id,
    owner: book.owner._id,
    message
  });

  await request.save();

  // Populate the request with book and user details
  await request.populate([
    { path: 'book', select: 'title author condition image' },
    { path: 'requester', select: 'name email' },
    { path: 'owner', select: 'name email' }
  ]);

  // Send email notification to book owner
  try {
    await emailService.sendRequestNotification(
      book.owner.email,
      req.user.name,
      book.title,
      message
    );
  } catch (emailError) {
    // Log error but don't fail the request creation
    logger.error('Failed to send request notification email:', emailError);
  }

  logger.info('Book request created successfully', {
    requestId: request._id,
    bookId,
    requesterId: req.user._id,
    ownerId: book.owner._id
  });

  res.status(201).json({
    status: 'success',
    message: 'Book request sent successfully',
    data: {
      request
    }
  });
});

const getSentRequests = asyncCatch(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const query = { requester: req.user._id };

  // Add status filter
  if (req.query.status) {
    query.status = req.query.status;
  }

  const requests = await Request.find(query)
    .populate([
      { path: 'book', select: 'title author condition image' },
      { path: 'owner', select: 'name email' }
    ])
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const totalRequests = await Request.countDocuments(query);
  const totalPages = Math.ceil(totalRequests / limit);

  res.status(200).json({
    status: 'success',
    data: {
      requests,
      pagination: {
        currentPage: page,
        totalPages,
        totalRequests,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    }
  });
});

const getReceivedRequests = asyncCatch(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const query = { owner: req.user._id };

  // Add status filter
  if (req.query.status) {
    query.status = req.query.status;
  }

  const requests = await Request.find(query)
    .populate([
      { path: 'book', select: 'title author condition image' },
      { path: 'requester', select: 'name email' }
    ])
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const totalRequests = await Request.countDocuments(query);
  const totalPages = Math.ceil(totalRequests / limit);

  res.status(200).json({
    status: 'success',
    data: {
      requests,
      pagination: {
        currentPage: page,
        totalPages,
        totalRequests,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    }
  });
});

const getRequestById = asyncCatch(async (req, res, next) => {
  const request = await Request.findById(req.params.id)
    .populate([
      { path: 'book', select: 'title author condition image' },
      { path: 'requester', select: 'name email' },
      { path: 'owner', select: 'name email' }
    ]);

  if (!request) {
    return next(new NotFoundError('Request not found'));
  }

  // Check if user is involved in this request
  if (
    request.requester._id.toString() !== req.user._id.toString() &&
    request.owner._id.toString() !== req.user._id.toString()
  ) {
    return next(new AuthorizationError('You are not authorized to view this request'));
  }

  res.status(200).json({
    status: 'success',
    data: {
      request
    }
  });
});

const updateRequest = asyncCatch(async (req, res, next) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ValidationError(errors.array()[0].msg));
  }

  const { status, responseMessage } = req.body;

  const request = await Request.findById(req.params.id)
    .populate([
      { path: 'book', select: 'title author condition image' },
      { path: 'requester', select: 'name email' },
      { path: 'owner', select: 'name email' }
    ]);

  if (!request) {
    return next(new NotFoundError('Request not found'));
  }

  // Check if user is the owner of the book
  if (request.owner._id.toString() !== req.user._id.toString()) {
    return next(new AuthorizationError('You can only update requests for your own books'));
  }

  // Check if request is still pending
  if (request.status !== 'pending') {
    return next(new ValidationError('Request has already been processed'));
  }

  // Update request
  request.status = status;
  if (responseMessage) {
    request.responseMessage = responseMessage;
  }
  request.respondedAt = new Date();

  await request.save();

  // If request is accepted, mark the book as unavailable
  if (status === 'accepted') {
    await Book.findByIdAndUpdate(request.book._id, { isAvailable: false });
  }

  // Send email notification to the requester based on the status
  try {
    if (status === 'accepted') {
      await emailService.sendRequestAccepted(
        request.requester.email,
        request.requester.name,
        request.book.title,
        request.owner.name,
        responseMessage
      );
    } else if (status === 'declined') {
      await emailService.sendRequestDeclined(
        request.requester.email,
        request.requester.name,
        request.book.title,
        request.owner.name,
        responseMessage
      );
    }
  } catch (emailError) {
    // Log error but don't fail the request update
    logger.error(`Failed to send request ${status} email:`, emailError);
  }

  logger.info('Book request updated successfully', {
    requestId: request._id,
    status,
    userId: req.user._id
  });

  res.status(200).json({
    status: 'success',
    message: `Request ${status} successfully`,
    data: {
      request
    }
  });
});

const cancelRequest = asyncCatch(async (req, res, next) => {
  const request = await Request.findById(req.params.id);

  if (!request) {
    return next(new NotFoundError('Request not found'));
  }

  // Check if user is the requester
  if (request.requester.toString() !== req.user._id.toString()) {
    return next(new AuthorizationError('You can only cancel your own requests'));
  }

  // Check if request can be cancelled
  if (request.status !== 'pending') {
    return next(new ValidationError('Only pending requests can be cancelled'));
  }

  // Update request status to cancelled
  request.status = 'cancelled';
  await request.save();

  logger.info('Book request cancelled successfully', {
    requestId: request._id,
    userId: req.user._id
  });

  res.status(200).json({
    status: 'success',
    message: 'Request cancelled successfully'
  });
});

const getRequestStats = asyncCatch(async (req, res, next) => {
  const userId = req.user._id;

  // Get sent requests stats
  const sentStats = await Request.aggregate([
    { $match: { requester: userId } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  // Get received requests stats
  const receivedStats = await Request.aggregate([
    { $match: { owner: userId } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  // Format stats
  const formatStats = (stats) => {
    const result = {
      pending: 0,
      accepted: 0,
      declined: 0,
      cancelled: 0,
      completed: 0
    };

    stats.forEach(stat => {
      result[stat._id] = stat.count;
    });

    return result;
  };

  res.status(200).json({
    status: 'success',
    data: {
      sent: formatStats(sentStats),
      received: formatStats(receivedStats)
    }
  });
});

module.exports = {
  createRequest: [createRequestValidation, createRequest],
  getSentRequests,
  getReceivedRequests,
  getRequestById,
  updateRequest: [updateRequestValidation, updateRequest],
  cancelRequest,
  getRequestStats
};