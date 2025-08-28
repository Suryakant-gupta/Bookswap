
// models/Request.js
const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: true
  },
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: {
      values: ['pending', 'accepted', 'declined', 'cancelled', 'completed'],
      message: 'Status must be one of: pending, accepted, declined, cancelled, completed'
    },
    default: 'pending'
  },
  message: {
    type: String,
    maxlength: [500, 'Message cannot exceed 500 characters'],
    trim: true
  },
  responseMessage: {
    type: String,
    maxlength: [500, 'Response message cannot exceed 500 characters'],
    trim: true
  },
  requestedAt: {
    type: Date,
    default: Date.now
  },
  respondedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate requests
requestSchema.index({ book: 1, requester: 1 }, { unique: true });

// Index for better query performance
requestSchema.index({ requester: 1 });
requestSchema.index({ owner: 1 });
requestSchema.index({ status: 1 });

// Middleware to set respondedAt when status changes
requestSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status !== 'pending' && !this.respondedAt) {
    this.respondedAt = new Date();
  }
  next();
});

module.exports = mongoose.model('Request', requestSchema);