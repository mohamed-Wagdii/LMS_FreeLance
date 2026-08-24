const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/api/method/login', authController.login);
router.post('/api/method/logout', authController.logout);
router.all('/api/method/frappe.sessions.clear', authController.clearSession);
router.post('/api/method/lms.lms.api.get_user_info', protect, authController.getUserInfo);
router.post('/api/method/register', authController.register);

module.exports = router;
