const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const commentController = require('../controllers/commentController');
const attachmentController = require('../controllers/attachmentController');
const { protect } = require('../middleware/authMiddleware');
const { validateTask, validateComment } = require('../middleware/validationMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.use(protect);

// Task CRUD
router.post('/', validateTask, taskController.createTask);
router.get('/', taskController.getTasks);
router.get('/my-tasks', taskController.getMyTasks);
router.get('/:id', taskController.getTaskById);
router.put('/:id', taskController.updateTask);
router.patch('/:id/status', taskController.updateTaskStatus);
router.patch('/:id/assign', taskController.assignTask);
router.delete('/:id', taskController.deleteTask);

// Task Comments
router.post('/:taskId/comments', validateComment, commentController.addComment);
router.get('/:taskId/comments', commentController.getComments);
router.delete('/comments/:commentId', commentController.deleteComment);

// Task Attachments
router.post('/:taskId/attachments', upload.single('file'), attachmentController.uploadAttachment);
router.get('/:taskId/attachments', attachmentController.getAttachments);
router.get('/attachments/:id/download', attachmentController.downloadAttachment);
router.delete('/attachments/:id', attachmentController.deleteAttachment);

module.exports = router;
