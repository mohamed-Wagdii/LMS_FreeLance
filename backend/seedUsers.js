require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/lms_freelance');

    const users = [
      {
        email: 'admin@test.com',
        full_name: 'Admin User',
        username: 'admin',
        password: 'password123',
        roles: ['System Manager', 'Moderator']
      },
      {
        email: 'instructor@test.com',
        full_name: 'Instructor User',
        username: 'instructor',
        password: 'password123',
        roles: ['Course Creator']
      },
      {
        email: 'student@test.com',
        full_name: 'Student User',
        username: 'student',
        password: 'password123',
        roles: ['LMS Student']
      }
    ];

    for (const u of users) {
      // Check if user exists
      const exists = await User.findOne({ email: u.email });
      if (exists) {
        console.log(`User ${u.email} already exists.`);
        continue;
      }
      
      const newUser = new User(u);
      await newUser.save();
      console.log(`User ${u.email} created.`);
    }

    mongoose.disconnect();
    console.log("Done seeding users.");
  } catch (err) {
    console.error(err);
    mongoose.disconnect();
  }
};

seed();
