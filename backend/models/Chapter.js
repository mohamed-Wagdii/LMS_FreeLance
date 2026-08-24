const mongoose = require('mongoose');

const chapterSchema = new mongoose.Schema({
  name: { type: String, unique: true, required: true },
  title: { type: String, required: true },
  description: String,
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  course_name: String,
  idx: { type: Number, default: 0 },
  is_scorm_package: { type: Boolean, default: false },
  scorm_package: String,
  doctype: { type: String, default: 'Course Chapter' }
}, {
  timestamps: true
});

module.exports = mongoose.model('Chapter', chapterSchema);
