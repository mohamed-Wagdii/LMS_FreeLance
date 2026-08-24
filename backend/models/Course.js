const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  name: { type: String, unique: true, required: true },
  title: { type: String, required: true },
  short_introduction: String,
  description: String,
  image: String,
  video_link: String,
  tags: String,
  category: String,
  published: { type: Boolean, default: false },
  upcoming: { type: Boolean, default: false },
  paid_course: { type: Boolean, default: false },
  course_price: { type: Number, default: 0 },
  currency: { type: String, default: 'USD' },
  enable_certification: { type: Boolean, default: false },
  paid_certificate: { type: Boolean, default: false },
  certificate_price: { type: Number, default: 0 },
  enforce_lesson_completion: { type: Boolean, default: false },
  instructors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctype: { type: String, default: 'LMS Course' }
}, {
  timestamps: true
});

courseSchema.pre('save', function(next) {
  if (!this.name && this.title) {
    this.name = this.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  }
  next();
});

module.exports = mongoose.model('Course', courseSchema);
