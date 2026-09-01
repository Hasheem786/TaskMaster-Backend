const AppError = require('../utils/appError');

const validateRegister = (req, res, next) => {
  const { name, email, password } = req.body;
  if (!name || name.trim() === '') {
    return next(new AppError('Name is required', 400));
  }
  if (!email || !email.includes('@')) {
    return next(new AppError('A valid email address is required', 400));
  }
  if (!password || password.length < 6) {
    return next(new AppError('Password must be at least 6 characters long', 400));
  }
  next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new AppError('Email and password are required', 400));
  }
  next();
};

const validateTask = (req, res, next) => {
  const { title } = req.body;
  if (!title || title.trim() === '') {
    return next(new AppError('Task title is required', 400));
  }
  next();
};

const validateTeam = (req, res, next) => {
  const { name } = req.body;
  if (!name || name.trim() === '') {
    return next(new AppError('Team name is required', 400));
  }
  next();
};

const validateComment = (req, res, next) => {
  const { content } = req.body;
  if (!content || content.trim() === '') {
    return next(new AppError('Comment content cannot be empty', 400));
  }
  next();
};

module.exports = {
  validateRegister,
  validateLogin,
  validateTask,
  validateTeam,
  validateComment
};
