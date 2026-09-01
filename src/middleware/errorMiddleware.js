const AppError = require('../utils/appError');

const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack
    });
  }

  // Operational error: send message to client
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
  }

  // Programming or unknown error: don't leak details
  console.error('UNHANDLED ERROR 💥:', err);
  return res.status(500).json({
    status: 'error',
    message: 'An unexpected internal server error occurred.'
  });
};

module.exports = globalErrorHandler;
