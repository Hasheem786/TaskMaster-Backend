const Comment = require('../models/Comment');
const Task = require('../models/Task');
const { notifyUser } = require('../services/notificationService');
const AppError = require('../utils/appError');

const addComment = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { content } = req.body;

    const task = await Task.findById(taskId);
    if (!task) {
      return next(new AppError('Task not found', 404));
    }

    const comment = await Comment.create({
      taskId,
      userId: req.user.id,
      content
    });

    // Notify task assignee if someone else comments
    if (task.assignee_id && task.assignee_id !== req.user.id) {
      await notifyUser({
        userId: task.assignee_id,
        title: 'New Comment on Task',
        message: `${req.user.name} commented on "${task.title}": "${content.substring(0, 50)}..."`,
        type: 'COMMENT'
      });
    }

    // Notify task creator if someone else comments
    if (task.creator_id !== req.user.id && task.creator_id !== task.assignee_id) {
      await notifyUser({
        userId: task.creator_id,
        title: 'New Comment on Task',
        message: `${req.user.name} commented on "${task.title}": "${content.substring(0, 50)}..."`,
        type: 'COMMENT'
      });
    }

    res.status(201).json({
      status: 'success',
      message: 'Comment added successfully',
      data: { comment }
    });
  } catch (error) {
    next(error);
  }
};

const getComments = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const task = await Task.findById(taskId);
    if (!task) {
      return next(new AppError('Task not found', 404));
    }

    const comments = await Comment.getByTaskId(taskId);

    res.status(200).json({
      status: 'success',
      results: comments.length,
      data: { comments }
    });
  } catch (error) {
    next(error);
  }
};

const deleteComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return next(new AppError('Comment not found', 404));
    }

    if (comment.user_id !== req.user.id) {
      return next(new AppError('You can only delete your own comments', 403));
    }

    await Comment.delete(commentId);

    res.status(200).json({
      status: 'success',
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addComment,
  getComments,
  deleteComment
};
