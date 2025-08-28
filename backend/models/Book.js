
// models/Book.js
const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Book title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  author: {
    type: String,
    required: [true, 'Author name is required'],
    trim: true,
    maxlength: [100, 'Author name cannot exceed 100 characters']
  },
  condition: {
    type: String,
    required: [true, 'Book condition is required'],
    enum: {
      values: ['New', 'Like New', 'Good', 'Fair', 'Poor'],
      message: 'Condition must be one of: New, Like New, Good, Fair, Poor'
    }
  },
  description: {
    type: String,
    maxlength: [1000, 'Description cannot exceed 1000 characters'],
    trim: true
  },
  image: {
    type: String,
    default: null
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  genre: {
    type: String,
    trim: true,
    maxlength: [50, 'Genre cannot exceed 50 characters']
  },
  isbn: {
    type: String,
    trim: true,
    match: [/^(?:\d{10}|\d{13})$/, 'Please enter a valid ISBN (10 or 13 digits)']
  }
}, {
  timestamps: true
});

// Index for better query performance
bookSchema.index({ owner: 1 });
bookSchema.index({ isAvailable: 1 });
bookSchema.index({ title: 'text', author: 'text', description: 'text' });

module.exports = mongoose.model('Book', bookSchema);