
const express = require('express');
const bookController = require('../controllers/bookController');
const { authenticate } = require('../middleware/auth');
const { upload, handleUploadError } = require('../middleware/upload');

const router = express.Router();

// All routes are protected
router.use(authenticate);

// Book routes
router.post('/', upload.single('image'), handleUploadError, bookController.createBook);
router.get('/my-books', bookController.getMyBooks);
router.get('/:id', bookController.getBookById);
router.get('/', bookController.getAllBooks);
router.put('/:id', upload.single('image'), handleUploadError, bookController.updateBook);
router.delete('/:id', bookController.deleteBook);

module.exports = router;    