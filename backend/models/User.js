const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  full_name: { type: String, required: true },
  username: { type: String, unique: true, sparse: true },
  password: { type: String, required: true, select: false },
  roles: { type: [String], default: ['LMS Student'] },
  enabled: { type: Boolean, default: true },
  user_image: String,
  bio: String,
  headline: String,
  user_type: { type: String, default: 'Website User' },
  last_active: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

userSchema.virtual('is_moderator').get(function() {
  return this.roles ? this.roles.includes('Moderator') : false;
});
userSchema.virtual('is_instructor').get(function() {
  return this.roles ? this.roles.includes('Course Creator') : false;
});
userSchema.virtual('is_student').get(function() {
  return this.roles ? this.roles.includes('LMS Student') : false;
});
userSchema.virtual('is_system_manager').get(function() {
  return this.roles ? this.roles.includes('System Manager') : false;
});

userSchema.pre('save', async function() {
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
