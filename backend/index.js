const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const path = require('path');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// ---------------------
// Global Middleware
// ---------------------
app.use(cors({
  origin: ['http://localhost:8080', 'http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// Serve uploaded files
app.use('/files', express.static(path.join(__dirname, 'uploads')));

// ---------------------
// Import Routes
// ---------------------
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const courseRoutes = require('./routes/courses');
const chapterRoutes = require('./routes/chapters');
const lessonRoutes = require('./routes/lessons');
const settingsRoutes = require('./routes/settings');
const frappeRoutes = require('./routes/frappe');
const uploadRoutes = require('./routes/uploads');

// ---------------------
// Mount Routes
// ---------------------
app.use(authRoutes);
app.use(userRoutes);
app.use(courseRoutes);
app.use(chapterRoutes);
app.use(lessonRoutes);
app.use(settingsRoutes);
app.use(frappeRoutes);
app.use(uploadRoutes);

// ---------------------
// Health Check
// ---------------------
app.get('/', (req, res) => {
  res.json({ message: 'LMS API is running' });
});

// ---------------------
// 404 Handler for unmatched /api/method/* routes
// ---------------------
app.all('/api/method/{*path}', (req, res) => {
  res.status(404).json({
    exc_type: 'DoesNotExistError',
    _server_messages: JSON.stringify([
      JSON.stringify({
        message: `Method ${req.path} not found`,
        indicator: 'red',
      }),
    ]),
  });
});

// ---------------------
// Global Error Handler
// ---------------------
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    exc_type: err.name || 'ServerError',
    _server_messages: JSON.stringify([
      JSON.stringify({
        message: process.env.NODE_ENV === 'development'
          ? err.message
          : 'Internal Server Error',
        indicator: 'red',
      }),
    ]),
  });
});

// ---------------------
// Start Server
// ---------------------
app.listen(PORT, () => {
  console.log(`\n🚀 LMS Backend Server running on port ${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   API Base: http://localhost:${PORT}/api/method/\n`);
});
