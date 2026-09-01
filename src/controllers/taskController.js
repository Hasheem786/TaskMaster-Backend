const Task = require('../models/Task');
const Team = require('../models/Team');
const User = require('../models/User');
const Comment = require('../models/Comment');
const Attachment = require('../models/Attachment');
const { notifyUser } = require('../services/notificationService');
const AppError = require('../utils/appError');

const createTask = async (req, res, next) => {
  try {
    const { title, description, status, priority, dueDate, assigneeId, teamId } = req.body;

    // Check team membership if teamId provided
    if (teamId) {
      const isMember = await Team.isMember(teamId, req.user.id);
      if (!isMember) {
        return next(new AppError('You are not a member of this team/project', 403));
      }
    }

    // Check assignee if assigneeId provided
    if (assigneeId) {
      const assignee = await User.findById(assigneeId);
      if (!assignee) {
        return next(new AppError('Assignee user does not exist', 404));
      }
    }

    const task = await Task.create({
      title,
      description,
      status: status || 'OPEN',
      priority: priority || 'MEDIUM',
      dueDate,
      creatorId: req.user.id,
      assigneeId: assigneeId || null,
      teamId: teamId || null
    });

    // Notify assignee if assigned to someone else
    if (assigneeId && parseInt(assigneeId, 10) !== req.user.id) {
      await notifyUser({
        userId: assigneeId,
        title: 'New Task Assigned',
        message: `${req.user.name} assigned you a new task: "${task.title}"`,
        type: 'ASSIGNMENT'
      });
    }

    res.status(201).json({
      status: 'success',
      message: 'Task created successfully',
      data: { task }
    });
  } catch (error) {
    next(error);
  }
};

const getTasks = async (req, res, next) => {
  try {
    const { status, priority, teamId, assigneeId, search, sortBy, order } = req.query;

    const tasks = await Task.findAll({
      status,
      priority,
      teamId: teamId ? parseInt(teamId, 10) : undefined,
      assigneeId: assigneeId ? parseInt(assigneeId, 10) : undefined,
      search,
      sortBy,
      order
    });

    res.status(200).json({
      status: 'success',
      results: tasks.length,
      data: { tasks }
    });
  } catch (error) {
    next(error);
  }
};

const getMyTasks = async (req, res, next) => {
  try {
    const { status, priority, search, sortBy, order } = req.query;

    const tasks = await Task.findAll({
      assigneeId: req.user.id,
      status,
      priority,
      search,
      sortBy,
      order
    });

    res.status(200).json({
      status: 'success',
      results: tasks.length,
      data: { tasks }
    });
  } catch (error) {
    next(error);
  }
};

const getTaskById = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return next(new AppError('Task not found', 404));
    }

    const comments = await Comment.getByTaskId(task.id);
    const attachments = await Attachment.getByTaskId(task.id);

    res.status(200).json({
      status: 'success',
      data: {
        task,
        comments,
        attachments
      }
    });
  } catch (error) {
    next(error);
  }
};

const updateTask = async (req, res, next) => {
  try {
    const existingTask = await Task.findById(req.params.id);
    if (!existingTask) {
      return next(new AppError('Task not found', 404));
    }

    const { title, description, status, priority, dueDate, assigneeId, teamId } = req.body;

    const updatedTask = await Task.update(req.params.id, {
      title,
      description,
      status,
      priority,
      dueDate,
      assigneeId,
      teamId
    });

    // Notify assignee if newly assigned or changed
    if (assigneeId && parseInt(assigneeId, 10) !== existingTask.assignee_id && parseInt(assigneeId, 10) !== req.user.id) {
      await notifyUser({
        userId: assigneeId,
        title: 'Task Assigned',
        message: `${req.user.name} assigned task "${updatedTask.title}" to you`,
        type: 'ASSIGNMENT'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Task updated successfully',
      data: { task: updatedTask }
    });
  } catch (error) {
    next(error);
  }
};

const updateTaskStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ['OPEN', 'IN_PROGRESS', 'COMPLETED'];

    if (!status || !allowedStatuses.includes(status.toUpperCase())) {
      return next(new AppError('Valid status required: OPEN, IN_PROGRESS, or COMPLETED', 400));
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return next(new AppError('Task not found', 404));
    }

    const updatedTask = await Task.update(req.params.id, { status: status.toUpperCase() });

    // Send notification to creator if updated by assignee
    if (task.creator_id !== req.user.id) {
      await notifyUser({
        userId: task.creator_id,
        title: 'Task Status Updated',
        message: `${req.user.name} marked task "${task.title}" as ${status.toUpperCase()}`,
        type: 'UPDATE'
      });
    }

    res.status(200).json({
      status: 'success',
      message: `Task marked as ${status.toUpperCase()}`,
      data: { task: updatedTask }
    });
  } catch (error) {
    next(error);
  }
};

const assignTask = async (req, res, next) => {
  try {
    const { assigneeId } = req.body;
    if (!assigneeId) {
      return next(new AppError('assigneeId is required', 400));
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return next(new AppError('Task not found', 404));
    }

    const assignee = await User.findById(assigneeId);
    if (!assignee) {
      return next(new AppError('Assignee user not found', 404));
    }

    const updatedTask = await Task.update(req.params.id, { assigneeId });

    if (parseInt(assigneeId, 10) !== req.user.id) {
      await notifyUser({
        userId: assigneeId,
        title: 'Task Assigned',
        message: `${req.user.name} assigned task "${task.title}" to you`,
        type: 'ASSIGNMENT'
      });
    }

    res.status(200).json({
      status: 'success',
      message: `Task assigned to ${assignee.name}`,
      data: { task: updatedTask }
    });
  } catch (error) {
    next(error);
  }
};

const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return next(new AppError('Task not found', 404));
    }

    await Task.delete(req.params.id);

    res.status(200).json({
      status: 'success',
      message: 'Task deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTask,
  getTasks,
  getMyTasks,
  getTaskById,
  updateTask,
  updateTaskStatus,
  assignTask,
  deleteTask
};
