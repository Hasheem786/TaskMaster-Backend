const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/generate-description', aiController.generateTaskDescription);
router.get('/summarize/:taskId', aiController.summarizeTask);

module.exports = router;
