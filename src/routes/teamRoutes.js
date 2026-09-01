const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');
const { protect } = require('../middleware/authMiddleware');
const { validateTeam } = require('../middleware/validationMiddleware');

router.use(protect);

router.post('/', validateTeam, teamController.createTeam);
router.post('/join', teamController.joinTeam);
router.get('/', teamController.getMyTeams);
router.get('/:id', teamController.getTeamById);
router.post('/:teamId/members', teamController.addMember);
router.get('/:teamId/members', teamController.getTeamMembers);

module.exports = router;
