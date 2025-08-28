
// controllers/bookController.js
const Book = require('../models/Book');
const { ValidationError, NotFoundError, AuthorizationError } = require('../utils/errors');
const { asyncCatch } = require('../middleware/errorHandler');
const logger = require('../utils/logger');
const { body, query, validationResult } = require('express-validator');
const path = require('path');
const fs = require('fs');

// Validation rules
const createBookValidation = [
  body('title').trim().notEmpty().withMessage('Book title is required')
    .isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),
  body('author').trim().notEmpty().withMessage('Author name is required')
    .isLength({ max: 100 }).withMessage('Author name cannot exceed 100 characters'),
  body('condition').isIn(['New', 'Like New', 'Good', 'Fair', 'Poor'])
    .withMessage('Condition must be one of: New, Like New, Good, Fair, Poor'),
  body('description').optional().trim()
    .isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),
  body('genre').optional().trim()
    .isLength({ max: 50 }).withMessage('Genre cannot exceed 50 characters'),
  body('isbn').optional().trim()
    .matches(/^(?:\d{10}|\d{13})$/).withMessage('Please enter a valid ISBN (10 or 13 digits)')
];

const updateBookValidation = [
  body('title').optional().trim().notEmpty().withMessage('Book title cannot be empty')
    .isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),
  body('author').optional().trim().notEmpty().withMessage('Author name cannot be empty')
    .isLength({ max: 100 }).withMessage('Author name cannot exceed 100 characters'),
  body('condition').optional().isIn(['New', 'Like New', 'Good', 'Fair', 'Poor'])
    .withMessage('Condition must be one of: New, Like New, Good, Fair, Poor'),
  body('description').optional().trim()
    .isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),
  body('genre').optional().trim()
    .isLength({ max: 50 }).withMessage('Genre cannot exceed 50 characters'),
  body('isbn').optional().trim()
    .matches(/^(?:\d{10}|\d{13})$/).withMessage('Please enter a valid ISBN (10 or 13 digits)')
];

// Helper function to delete uploaded file
const deleteFile = (filename) => {
  if (filename) {
    const filePath = path.join(__dirname, '../uploads', filename);
    fs.unlink(filePath, (err) => {
      if (err && err.code !== 'ENOENT') {
        logger.error('Error deleting file:', { filename, error: err });
      }
    });
  }
};

// Controllers
const createBook = asyncCatch(async (req, res, next) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Delete uploaded file if validation fails
    if (req.file) {
      deleteFile(req.file.filename);
    }
    return next(new ValidationError(errors.array()[0].msg));
  }

  const { title, author, condition, description, genre, isbn } = req.body;

  const bookData = {
    title,
    author,
    condition,
    owner: req.user._id,
    description,
    genre,
    isbn
  };

  // Add image if uploaded
  if (req.file) {
    bookData.image = req.file.filename;
  }

  const book = new Book(bookData);
  await book.save();

  // Populate owner information
  await book.populate('owner', 'name email');

  logger.info('Book created successfully', { 
    bookId: book._id, 
    title,
    userId: req.user._id 
  });

  res.status(201).json({
    status: 'success',
    message: 'Book posted successfully',
    data: {
      book
    }
  });
});

const getAllBooks = asyncCatch(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // Build query - exclude user's own books
  const query = { 
    // owner: { $ne: req.user._id },
    isAvailable: true 
  };

  // Add search functionality
  if (req.query.search) {
    query.$text = { $search: req.query.search };
  }

  // Add genre filter
  if (req.query.genre) {
    query.genre = req.query.genre;
  }

  // Add condition filter
  if (req.query.condition) {
    query.condition = req.query.condition;
  }

  const books = await Book.find(query)
    .populate('owner', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const totalBooks = await Book.countDocuments(query);
  const totalPages = Math.ceil(totalBooks / limit);

  res.status(200).json({
    status: 'success',
    data: {
      books,
      pagination: {
        currentPage: page,
        totalPages,
        totalBooks,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    }
  });
});

const getMyBooks = asyncCatch(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const books = await Book.find({ owner: req.user._id })
    .populate('owner', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const totalBooks = await Book.countDocuments({ owner: req.user._id });
  const totalPages = Math.ceil(totalBooks / limit);

  res.status(200).json({
    status: 'success',
    data: {
      books,
      pagination: {
        currentPage: page,
        totalPages,
        totalBooks,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    }
  });
});

const getBookById = asyncCatch(async (req, res, next) => {
  const book = await Book.findById(req.params.id).populate('owner', 'name email');

  if (!book) {
    return next(new NotFoundError('Book not found'));
  }

  res.status(200).json({
    status: 'success',
    data: {
      book
    }
  });
});

const updateBook = asyncCatch(async (req, res, next) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Delete uploaded file if validation fails
    if (req.file) {
      deleteFile(req.file.filename);
    }
    return next(new ValidationError(errors.array()[0].msg));
  }

  const book = await Book.findById(req.params.id);

  if (!book) {
    if (req.file) {
      deleteFile(req.file.filename);
    }
    return next(new NotFoundError('Book not found'));
  }

  // Check if user owns the book
  if (book.owner.toString() !== req.user._id.toString()) {
    if (req.file) {
      deleteFile(req.file.filename);
    }
    return next(new AuthorizationError('You can only update your own books'));
  }

  const { title, author, condition, description, genre, isbn, isAvailable } = req.body;

  const updateData = {};
  if (title !== undefined) updateData.title = title;
  if (author !== undefined) updateData.author = author;
  if (condition !== undefined) updateData.condition = condition;
  if (description !== undefined) updateData.description = description;
  if (genre !== undefined) updateData.genre = genre;
  if (isbn !== undefined) updateData.isbn = isbn;
  if (isAvailable !== undefined) updateData.isAvailable = isAvailable;

  // Handle image update
  if (req.file) {
    // Delete old image if exists
    if (book.image) {
      deleteFile(book.image);
    }
    updateData.image = req.file.filename;
  }

  const updatedBook = await Book.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  ).populate('owner', 'name email');

  logger.info('Book updated successfully', { 
    bookId: book._id, 
    userId: req.user._id 
  });

  res.status(200).json({
    status: 'success',
    message: 'Book updated successfully',
    data: {
      book: updatedBook
    }
  });
});

const deleteBook = asyncCatch(async (req, res, next) => {
  const book = await Book.findById(req.params.id);

  if (!book) {
    return next(new NotFoundError('Book not found'));
  }

  // Check if user owns the book
  if (book.owner.toString() !== req.user._id.toString()) {
    return next(new AuthorizationError('You can only delete your own books'));
  }

  // Delete associated image file
  if (book.image) {
    deleteFile(book.image);
  }

  await Book.findByIdAndDelete(req.params.id);

  logger.info('Book deleted successfully', { 
    bookId: book._id, 
    userId: req.user._id 
  });

  res.status(200).json({
    status: 'success',
    message: 'Book deleted successfully'
  });
});

module.exports = {
  createBook: [createBookValidation, createBook],
  getAllBooks,
  getMyBooks,
  getBookById,
  updateBook: [updateBookValidation, updateBook],
  deleteBook
};