const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const chapterController = require('../controllers/chapterController');

router.post('/api/method/lms.lms.api.upsert_chapter', protect, requireRole('Moderator', 'Course Creator'), chapterController.upsertChapter);
router.post('/api/method/lms.lms.api.delete_chapter', protect, requireRole('Moderator', 'Course Creator'), chapterController.deleteChapter);
router.post('/api/method/lms.lms.api.update_chapter_index', protect, requireRole('Moderator', 'Course Creator'), chapterController.updateChapterIndex);

module.exports = router;
