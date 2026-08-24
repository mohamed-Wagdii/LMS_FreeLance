const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.roles || !req.user.roles.some(role => allowedRoles.includes(role))) {
      return res.status(403).json({
        exc_type: "PermissionError",
        _server_messages: JSON.stringify([{ message: "Forbidden: insufficient permissions", indicator: "red" }])
      });
    }
    next();
  };
};

module.exports = { requireRole };
