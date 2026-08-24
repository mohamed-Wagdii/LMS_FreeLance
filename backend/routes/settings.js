const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { optionalAuth } = require('../middleware/auth');

router.post('/api/method/lms.lms.api.get_branding', settingsController.getBranding);
router.post('/api/method/lms.lms.api.get_lms_settings', settingsController.getSettings);
router.post('/api/method/lms.lms.api.get_sidebar_settings', optionalAuth, settingsController.getSidebarSettings);
router.post('/api/method/lms.lms.api.get_notifications', optionalAuth, settingsController.getNotifications);
router.post('/api/method/lms.lms.api.get_doc_permissions_many', optionalAuth, settingsController.getPermissions);

module.exports = router;
