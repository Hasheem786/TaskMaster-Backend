const User = require('../models/User');
const { hashPassword, comparePassword } = require('../utils/password');
const { generateToken } = require('../utils/jwt');
const AppError = require('../utils/appError');

const register = async (req, res, next) => {
  try {
    const { name, email, password, avatar } = req.body;

    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return next(new AppError('An account with this email already exists', 400));
    }

    const hashedPassword = await hashPassword(password);
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      avatar
    });

    const token = generateToken({ id: newUser.id, email: newUser.email });

    res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      token,
      data: {
        user: User.toPublicJSON(newUser)
      }
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findByEmail(email);
    if (!user) {
      return next(new AppError('Invalid email or password', 401));
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return next(new AppError('Invalid email or password', 401));
    }

    const token = generateToken({ id: user.id, email: user.email });

    res.status(200).json({
      status: 'success',
      message: 'Login successful',
      token,
      data: {
        user: User.toPublicJSON(user)
      }
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    res.status(200).json({
      status: 'success',
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};

const getProfile = async (req, res, next) => {
  try {
    res.status(200).json({
      status: 'success',
      data: {
        user: User.toPublicJSON(req.user)
      }
    });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { name, email, password, avatar } = req.body;
    const updates = {};

    if (name) updates.name = name;
    if (email) {
      if (email !== req.user.email) {
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
          return next(new AppError('Email address is already in use', 400));
        }
      }
      updates.email = email;
    }
    if (password) {
      if (password.length < 6) {
        return next(new AppError('Password must be at least 6 characters long', 400));
      }
      updates.password = await hashPassword(password);
    }
    if (avatar !== undefined) updates.avatar = avatar;

    const updatedUser = await User.update(req.user.id, updates);

    res.status(200).json({
      status: 'success',
      message: 'Profile updated successfully',
      data: {
        user: User.toPublicJSON(updatedUser)
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  logout,
  getProfile,
  updateProfile
};
