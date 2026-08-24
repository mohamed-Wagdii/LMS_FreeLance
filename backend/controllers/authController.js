const User = require('../models/User');
const { setAuthCookies } = require('../middleware/auth');
const { sendSuccess, sendFrappeError } = require('../utils/frappeResponse');

const login = async (req, res) => {
  try {
    const { usr, pwd } = req.body;
    
    if (!usr || !pwd) {
      return res.status(400).json({
        exc_type: "ValidationError",
        _server_messages: JSON.stringify([{ message: "Please provide email and password", indicator: "red" }])
      });
    }

    const user = await User.findOne({ email: usr }).select('+password');
    if (!user) {
      return res.status(401).json({
        exc_type: "AuthenticationError",
        _server_messages: JSON.stringify([{ message: "Invalid credentials", indicator: "red" }])
      });
    }

    const isMatch = await user.matchPassword(pwd);
    if (!isMatch) {
      return res.status(401).json({
        exc_type: "AuthenticationError",
        _server_messages: JSON.stringify([{ message: "Invalid credentials", indicator: "red" }])
      });
    }

    setAuthCookies(res, user._id, user.email);

    return sendSuccess(res, {
      full_name: user.full_name,
      email: user.email,
      user_image: user.user_image,
      roles: user.roles,
      is_moderator: user.is_moderator,
      is_instructor: user.is_instructor,
      is_student: user.is_student,
      is_system_manager: user.is_system_manager
    });
  } catch (error) {
    return sendFrappeError(res, error, "LoginError");
  }
};

const logout = async (req, res) => {
  try {
    res.clearCookie('token');
    res.clearCookie('user_id');
    res.clearCookie('sid');
    return sendSuccess(res, { message: 'Logged out' });
  } catch (error) {
    return sendFrappeError(res, error, "LogoutError");
  }
};

const clearSession = async (req, res) => {
  try {
    res.clearCookie('token');
    res.clearCookie('user_id');
    res.clearCookie('sid');
    return sendSuccess(res, { message: 'Session cleared' });
  } catch (error) {
    return sendFrappeError(res, error, "SessionClearError");
  }
};

const getUserInfo = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        exc_type: "AuthenticationError",
        _server_messages: JSON.stringify([{ message: "Not authorized", indicator: "red" }])
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
       return res.status(404).json({
        exc_type: "NotFoundError",
        _server_messages: JSON.stringify([{ message: "User not found", indicator: "red" }])
      });
    }

    return sendSuccess(res, {
      name: user.email,
      email: user.email,
      full_name: user.full_name,
      username: user.username,
      user_image: user.user_image,
      bio: user.bio,
      headline: user.headline,
      roles: user.roles,
      is_moderator: user.is_moderator,
      is_instructor: user.is_instructor,
      is_student: user.is_student,
      is_system_manager: user.is_system_manager,
      is_evaluator: false,
      is_autocomplete_enabled: false,
      user_type: user.user_type
    });
  } catch (error) {
    return sendFrappeError(res, error, "GetUserInfoError");
  }
};

const register = async (req, res) => {
  try {
    const { email, full_name, password } = req.body;

    if (!email || !full_name || !password) {
      return res.status(400).json({
        exc_type: "ValidationError",
        _server_messages: JSON.stringify([{ message: "Please provide email, full_name and password", indicator: "red" }])
      });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        exc_type: "ValidationError",
        _server_messages: JSON.stringify([{ message: "User already exists", indicator: "red" }])
      });
    }

    const username = email.split('@')[0];

    const user = await User.create({
      email,
      full_name,
      password,
      username,
      roles: ['LMS Student']
    });

    setAuthCookies(res, user._id, user.email);

    return sendSuccess(res, {
      full_name: user.full_name,
      email: user.email,
      user_image: user.user_image,
      roles: user.roles,
      is_moderator: user.is_moderator,
      is_instructor: user.is_instructor,
      is_student: user.is_student,
      is_system_manager: user.is_system_manager
    });
  } catch (error) {
    return sendFrappeError(res, error, "RegistrationError");
  }
};

module.exports = {
  login,
  logout,
  clearSession,
  getUserInfo,
  register
};
