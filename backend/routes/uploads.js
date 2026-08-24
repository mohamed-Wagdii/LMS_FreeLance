const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const { protect } = require('../middleware/auth');
const { uploadSingle } = require('../middleware/upload');

router.post('/api/method/upload_file', protect, uploadSingle, uploadController.uploadFile);
router.get('/files/:filename', uploadController.serveFile);

module.exports = router;
