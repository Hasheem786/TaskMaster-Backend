const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');
const AppError = require('../utils/appError');

const protect = async (req, res, next) => {
  try {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.query && req.query.token) {
      token = req.query.token; // Support SSE streams query token
    }

    if (!token) {
      return next(new AppError('Authentication failed: No access token provided', 401));
    }

    const decoded = await verifyToken(token);
    const currentUser = await User.findById(decoded.id);

    if (!currentUser) {
      return next(new AppError('The user belonging to this token no longer exists', 401));
    }

    req.user = currentUser;
    next();
  } catch (error) {
    return next(new AppError('Authentication failed: Invalid or expired token', 401));
  }
};

module.exports = {
  protect
};
