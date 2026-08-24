const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
  name: { type: String, unique: true, required: true },
  title: { type: String, required: true },
  content: { type: mongoose.Schema.Types.Mixed },
  body: String,
  instructor_notes: { type: mongoose.Schema.Types.Mixed },
  chapter: { type: mongoose.Schema.Types.ObjectId, ref: 'Chapter', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  idx: { type: Number, default: 0 },
  include_in_preview: { type: Boolean, default: false },
  youtube_video_id: String,
  video_link: String,
  doctype: { type: String, default: 'Course Lesson' }
}, {
  timestamps: true
});

module.exports = mongoose.model('Lesson', lessonSchema);
