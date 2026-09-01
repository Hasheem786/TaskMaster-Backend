const Attachment = require('../models/Attachment');
const Task = require('../models/Task');
const AppError = require('../utils/appError');
const fs = require('fs');
const path = require('path');

const uploadAttachment = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    if (!req.file) {
      return next(new AppError('Please select a file to upload', 400));
    }

    const task = await Task.findById(taskId);
    if (!task) {
      // Clean up uploaded file if task invalid
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return next(new AppError('Task not found', 404));
    }

    const attachment = await Attachment.create({
      taskId,
      uploaderId: req.user.id,
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      filepath: req.file.path
    });

    res.status(201).json({
      status: 'success',
      message: 'Attachment uploaded successfully',
      data: { attachment }
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};

const getAttachments = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const task = await Task.findById(taskId);
    if (!task) {
      return next(new AppError('Task not found', 404));
    }

    const attachments = await Attachment.getByTaskId(taskId);

    res.status(200).json({
      status: 'success',
      results: attachments.length,
      data: { attachments }
    });
  } catch (error) {
    next(error);
  }
};

const downloadAttachment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const attachment = await Attachment.findById(id);
    if (!attachment) {
      return next(new AppError('Attachment not found', 404));
    }

    if (!fs.existsSync(attachment.filepath)) {
      return next(new AppError('Physical file not found on server storage', 404));
    }

    res.setHeader('Content-Type', attachment.mime_type || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${attachment.original_name}"`);
    fs.createReadStream(attachment.filepath).pipe(res);
  } catch (error) {
    next(error);
  }
};

const deleteAttachment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const attachment = await Attachment.findById(id);
    if (!attachment) {
      return next(new AppError('Attachment not found', 404));
    }

    if (attachment.uploader_id !== req.user.id) {
      return next(new AppError('You can only delete attachments you uploaded', 403));
    }

    if (fs.existsSync(attachment.filepath)) {
      fs.unlinkSync(attachment.filepath);
    }

    await Attachment.delete(id);

    res.status(200).json({
      status: 'success',
      message: 'Attachment deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadAttachment,
  getAttachments,
  downloadAttachment,
  deleteAttachment
};
