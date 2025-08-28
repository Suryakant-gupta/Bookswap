
const express = require('express');
const requestController = require('../controllers/requestController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(authenticate);

// Request routes
router.post('/', requestController.createRequest);
router.get('/sent', requestController.getSentRequests);
router.get('/received', requestController.getReceivedRequests);
router.get('/stats', requestController.getRequestStats);
router.get('/:id', requestController.getRequestById);
router.put('/:id', requestController.updateRequest);
router.delete('/:id', requestController.cancelRequest);

module.exports = router;