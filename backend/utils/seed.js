require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const seedUsers = async () => {
    try {
        const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/lms';
        await mongoose.connect(mongoURI);
        console.log('MongoDB connected for seeding');

        const adminExists = await User.findOne({ email: 'admin@lms.com' });
        
        if (!adminExists) {
            await User.create({
                email: 'admin@lms.com',
                full_name: 'Admin User',
                username: 'admin',
                password: 'admin123',
                roles: ['System Manager', 'Moderator', 'Course Creator', 'LMS Student']
            });
            console.log('Admin user created (admin@lms.com / admin123)');
        } else {
            console.log('Admin user already exists');
        }

        const teacherExists = await User.findOne({ email: 'teacher@lms.com' });
        if (!teacherExists) {
            await User.create({
                email: 'teacher@lms.com',
                full_name: 'Teacher User',
                username: 'teacher',
                password: 'teacher123',
                roles: ['Course Creator', 'LMS Student']
            });
            console.log('Teacher user created (teacher@lms.com / teacher123)');
        } else {
            console.log('Teacher user already exists');
        }

        const studentExists = await User.findOne({ email: 'student@lms.com' });
        if (!studentExists) {
            await User.create({
                email: 'student@lms.com',
                full_name: 'Student User',
                username: 'student',
                password: 'student123',
                roles: ['LMS Student']
            });
            console.log('Student user created (student@lms.com / student123)');
        } else {
            console.log('Student user already exists');
        }

        console.log('\nSeeding completed successfully!');
        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('Error during seeding:', error);
        process.exit(1);
    }
};

seedUsers();
