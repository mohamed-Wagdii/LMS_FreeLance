const express = require('express');
const router = express.Router();
const { optionalAuth, protect } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const lessonController = require('../controllers/lessonController');

router.post('/api/method/lms.lms.utils.get_lesson', optionalAuth, lessonController.getLesson);
router.post('/api/method/lms.lms.utils.get_lesson_creation_details', protect, lessonController.getCreationDetails);
router.post('/api/method/lms.lms.api.create_lesson', protect, requireRole('Moderator', 'Course Creator'), lessonController.createLesson);
router.post('/api/method/lms.lms.api.delete_lesson', protect, requireRole('Moderator', 'Course Creator'), lessonController.deleteLesson);
router.post('/api/method/lms.lms.api.update_lesson_index', protect, requireRole('Moderator', 'Course Creator'), lessonController.updateLessonIndex);
router.post('/api/method/lms.lms.doctype.course_lesson.course_lesson.save_progress', protect, lessonController.saveProgress);
router.post('/api/method/lms.lms.api.mark_lesson_progress', protect, lessonController.markProgress);
router.post('/api/method/lms.lms.api.track_video_watch_duration', protect, lessonController.trackVideo);

module.exports = router;
