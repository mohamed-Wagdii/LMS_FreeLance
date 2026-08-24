const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');

router.post('/api/method/lms.lms.api.get_all_users', protect, userController.getAllUsers);
router.post('/api/method/lms.lms.api.save_role', protect, requireRole('Moderator', 'System Manager'), userController.saveRole);
router.post('/api/method/lms.lms.api.delete_member', protect, requireRole('Moderator', 'System Manager'), userController.deleteMember);
router.post('/api/method/lms.lms.api.get_profile_info', userController.getProfileInfo);
router.post('/api/method/lms.lms.api.search_users_by_role', protect, userController.searchByRole);
router.post('/api/method/lms.lms.api.capture_user_persona', protect, userController.capturePersona);

module.exports = router;
