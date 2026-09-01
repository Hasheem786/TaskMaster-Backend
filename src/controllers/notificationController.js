const Notification = require('../models/Notification');
const { addSseClient } = require('../services/notificationService');
const AppError = require('../utils/appError');

const streamNotifications = (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', message: 'Connected to TaskMaster real-time notification stream' })}\n\n`);

  addSseClient(req.user.id, res);
};

const getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.getByUserId(req.user.id);
    res.status(200).json({
      status: 'success',
      results: notifications.length,
      data: { notifications }
    });
  } catch (error) {
    next(error);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const notification = await Notification.markAsRead(id, req.user.id);
    if (!notification) {
      return next(new AppError('Notification not found', 404));
    }

    res.status(200).json({
      status: 'success',
      message: 'Notification marked as read',
      data: { notification }
    });
  } catch (error) {
    next(error);
  }
};

const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.markAllAsRead(req.user.id);
    res.status(200).json({
      status: 'success',
      message: 'All notifications marked as read'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  streamNotifications,
  getNotifications,
  markAsRead,
  markAllAsRead
};
