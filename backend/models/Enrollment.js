const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  course_name: String,
  member: String,
  member_name: String,
  progress: { type: Number, default: 0, min: 0, max: 100 },
  current_lesson: String,
  enrollment_date: { type: Date, default: Date.now },
  doctype: { type: String, default: 'LMS Enrollment' }
}, {
  timestamps: true
});

enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });

module.exports = mongoose.model('Enrollment', enrollmentSchema);
