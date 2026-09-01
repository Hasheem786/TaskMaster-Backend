const { generateTaskDescription: generateAiDesc, summarizeTask: summarizeAiTask } = require('../services/aiService');
const Task = require('../models/Task');
const Comment = require('../models/Comment');
const AppError = require('../utils/appError');

const generateTaskDescription = async (req, res, next) => {
  try {
    const { prompt, priority } = req.body;
    if (!prompt || prompt.trim() === '') {
      return next(new AppError('Prompt or task title is required for AI generation', 400));
    }

    const description = await generateAiDesc(prompt, priority);

    res.status(200).json({
      status: 'success',
      message: 'AI description generated successfully',
      data: {
        prompt,
        generatedDescription: description
      }
    });
  } catch (error) {
    next(error);
  }
};

const summarizeTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const task = await Task.findById(taskId);
    if (!task) {
      return next(new AppError('Task not found', 404));
    }

    const comments = await Comment.getByTaskId(taskId);
    const summary = await summarizeAiTask(task, comments);

    res.status(200).json({
      status: 'success',
      message: 'Task summary generated successfully',
      data: {
        taskId: task.id,
        title: task.title,
        summary
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  generateTaskDescription,
  summarizeTask
};
