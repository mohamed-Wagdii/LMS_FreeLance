const express = require('express');
const router = express.Router();
const { optionalAuth, protect } = require('../middleware/auth');
const courseController = require('../controllers/courseController');

router.post('/api/method/lms.lms.utils.get_courses', optionalAuth, courseController.getCourses);
router.post('/api/method/lms.lms.utils.get_course_count', optionalAuth, courseController.getCourseCount);
router.post('/api/method/lms.lms.utils.get_course_details', optionalAuth, courseController.getCourseDetails);
router.post('/api/method/lms.lms.utils.get_course_outline', optionalAuth, courseController.getCourseOutline);
router.post('/api/method/lms.lms.utils.get_course_categories', courseController.getCategories);

module.exports = router;
