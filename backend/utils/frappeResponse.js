const sendSuccess = (res, data, statusCode = 200) => {
  return res.status(statusCode).json({ message: data });
};

const sendError = (res, message, statusCode = 400, excType = 'ValidationError') => {
  const errorObj = {
    message,
    indicator: 'red'
  };
  return res.status(statusCode).json({
    exc_type: excType,
    _server_messages: JSON.stringify([JSON.stringify(errorObj)])
  });
};

const sendFrappeError = (res, error) => {
  console.error(error);
  if (error.name === 'ValidationError') {
    const messages = Object.values(error.errors).map(val => val.message);
    return sendError(res, messages.join(', '), 400, 'ValidationError');
  }
  
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    return sendError(res, `Duplicate field value entered for ${field}`, 400, 'DuplicateEntryError');
  }

  return sendError(res, error.message || 'Server Error', 500, 'ServerError');
};

module.exports = {
  sendSuccess,
  sendError,
  sendFrappeError
};
