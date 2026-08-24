const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'secret', {
    expiresIn: '30d',
  });
};

const setAuthCookies = (res, userId, userEmail) => {
  const token = generateToken(userId);
  
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'Lax',
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  });

  res.cookie('user_id', userEmail, {
    httpOnly: false,
    sameSite: 'Lax',
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  });

  res.cookie('sid', 'node-session', {
    httpOnly: false,
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  });
};

const protect = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({
        exc_type: "AuthenticationError",
        _server_messages: JSON.stringify([{ message: "Not authorized, no token", indicator: "red" }])
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) {
       return res.status(401).json({
        exc_type: "AuthenticationError",
        _server_messages: JSON.stringify([{ message: "Not authorized, user not found", indicator: "red" }])
      });
    }
    next();
  } catch (error) {
    return res.status(401).json({
      exc_type: "AuthenticationError",
      _server_messages: JSON.stringify([{ message: "Not authorized, token failed", indicator: "red" }])
    });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
      req.user = await User.findById(decoded.id).select('-password');
    } else {
      req.user = null;
    }
  } catch (error) {
    req.user = null;
  }
  next();
};

module.exports = {
  protect,
  optionalAuth,
  generateToken,
  setAuthCookies
};
