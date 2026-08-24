const mongoose = require('mongoose');

const lessonProgressSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  lesson: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true },
  lesson_name: String,
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  course_name: String,
  is_complete: { type: Boolean, default: false },
  video_watch_duration: { type: Number, default: 0 },
  doctype: { type: String, default: 'LMS Course Progress' }
}, {
  timestamps: true
});

lessonProgressSchema.index({ student: 1, lesson: 1 }, { unique: true });

module.exports = mongoose.model('LessonProgress', lessonProgressSchema);
