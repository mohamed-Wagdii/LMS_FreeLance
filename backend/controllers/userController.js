const User = require('../models/User');
const Enrollment = require('../models/Enrollment');
const { sendSuccess, sendFrappeError } = require('../utils/frappeResponse');

const getAllUsers = async (req, res) => {
  try {
    const { text, role, page_length = 20, start = 0 } = req.body;
    
    let query = {};
    if (text) {
      query.$or = [
        { email: { $regex: text, $options: 'i' } },
        { full_name: { $regex: text, $options: 'i' } },
        { username: { $regex: text, $options: 'i' } }
      ];
    }
    if (role) {
      query.roles = role;
    }

    const users = await User.find(query)
      .select('-password')
      .skip(Number(start))
      .limit(Number(page_length))
      .sort({ createdAt: -1 });

    return sendSuccess(res, users);
  } catch (error) {
    return sendFrappeError(res, error, "GetAllUsersError");
  }
};

const saveRole = async (req, res) => {
  try {
    const { user: userEmail, role, action } = req.body;
    
    if (!userEmail || !role || !action) {
      return res.status(400).json({
        exc_type: "ValidationError",
        _server_messages: JSON.stringify([{ message: "user, role, and action are required", indicator: "red" }])
      });
    }

    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return res.status(404).json({
        exc_type: "NotFoundError",
        _server_messages: JSON.stringify([{ message: "User not found", indicator: "red" }])
      });
    }

    if (action === 'add') {
      if (!user.roles.includes(role)) {
        user.roles.push(role);
      }
    } else if (action === 'remove') {
      user.roles = user.roles.filter(r => r !== role);
    } else {
      return res.status(400).json({
        exc_type: "ValidationError",
        _server_messages: JSON.stringify([{ message: "Invalid action", indicator: "red" }])
      });
    }

    await user.save();
    return sendSuccess(res, user);
  } catch (error) {
    return sendFrappeError(res, error, "SaveRoleError");
  }
};

const deleteMember = async (req, res) => {
  try {
    const { user: userEmail } = req.body;
    
    if (!userEmail) {
      return res.status(400).json({
        exc_type: "ValidationError",
        _server_messages: JSON.stringify([{ message: "User email is required", indicator: "red" }])
      });
    }

    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return res.status(404).json({
        exc_type: "NotFoundError",
        _server_messages: JSON.stringify([{ message: "User not found", indicator: "red" }])
      });
    }

    if (Enrollment) {
        await Enrollment.deleteMany({ member: user._id });
    }
    
    await User.findByIdAndDelete(user._id);

    return sendSuccess(res, { message: 'Member deleted successfully' });
  } catch (error) {
    return sendFrappeError(res, error, "DeleteMemberError");
  }
};

const getProfileInfo = async (req, res) => {
  try {
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({
        exc_type: "ValidationError",
        _server_messages: JSON.stringify([{ message: "Username is required", indicator: "red" }])
      });
    }

    const user = await User.findOne({ username }).select('-password');
    if (!user) {
      return res.status(404).json({
        exc_type: "NotFoundError",
        _server_messages: JSON.stringify([{ message: "User not found", indicator: "red" }])
      });
    }

    let enrollmentsCount = 0;
    if (Enrollment) {
        enrollmentsCount = await Enrollment.countDocuments({ member: user._id });
    }

    return sendSuccess(res, {
      ...user.toObject(),
      enrollmentsCount,
      coursesCreated: 0 
    });
  } catch (error) {
    return sendFrappeError(res, error, "GetProfileInfoError");
  }
};

const searchByRole = async (req, res) => {
  try {
    const { role, search_term } = req.body;
    
    if (!role) {
      return res.status(400).json({
        exc_type: "ValidationError",
        _server_messages: JSON.stringify([{ message: "Role is required", indicator: "red" }])
      });
    }

    let query = { roles: role };
    if (search_term) {
      query.$or = [
        { email: { $regex: search_term, $options: 'i' } },
        { full_name: { $regex: search_term, $options: 'i' } },
        { username: { $regex: search_term, $options: 'i' } }
      ];
    }

    const users = await User.find(query).select('-password');
    return sendSuccess(res, users);
  } catch (error) {
    return sendFrappeError(res, error, "SearchByRoleError");
  }
};

const capturePersona = async (req, res) => {
  try {
    const personaData = req.body;
    
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

    // Update user with persona data
    Object.assign(user, personaData);
    await user.save();

    return sendSuccess(res, user);
  } catch (error) {
    return sendFrappeError(res, error, "CapturePersonaError");
  }
};

module.exports = {
  getAllUsers,
  saveRole,
  deleteMember,
  getProfileInfo,
  searchByRole,
  capturePersona
};
