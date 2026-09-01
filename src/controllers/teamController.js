const Team = require('../models/Team');
const User = require('../models/User');
const AppError = require('../utils/appError');
const crypto = require('crypto');

const generateInviteCode = () => {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
};

const createTeam = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const inviteCode = generateInviteCode();

    const team = await Team.create({
      name,
      description,
      inviteCode,
      ownerId: req.user.id
    });

    res.status(201).json({
      status: 'success',
      message: 'Team created successfully',
      data: { team }
    });
  } catch (error) {
    next(error);
  }
};

const joinTeam = async (req, res, next) => {
  try {
    const { inviteCode } = req.body;
    if (!inviteCode) {
      return next(new AppError('Invite code is required', 400));
    }

    const team = await Team.findByInviteCode(inviteCode.toUpperCase());
    if (!team) {
      return next(new AppError('Invalid or expired team invite code', 404));
    }

    const member = await Team.addMember(team.id, req.user.id, 'MEMBER');

    res.status(200).json({
      status: 'success',
      message: `Successfully joined team "${team.name}"`,
      data: { team, member }
    });
  } catch (error) {
    next(error);
  }
};

const addMember = async (req, res, next) => {
  try {
    const { teamId } = req.params;
    const { email, role = 'MEMBER' } = req.body;

    const team = await Team.findById(teamId);
    if (!team) {
      return next(new AppError('Team not found', 404));
    }

    const isMember = await Team.isMember(teamId, req.user.id);
    if (!isMember) {
      return next(new AppError('Only team members can invite new members', 403));
    }

    const targetUser = await User.findByEmail(email);
    if (!targetUser) {
      return next(new AppError(`User with email "${email}" not found`, 404));
    }

    const member = await Team.addMember(teamId, targetUser.id, role);

    res.status(200).json({
      status: 'success',
      message: `User ${targetUser.name} added to team successfully`,
      data: { member }
    });
  } catch (error) {
    next(error);
  }
};

const getMyTeams = async (req, res, next) => {
  try {
    const teams = await Team.getUserTeams(req.user.id);
    res.status(200).json({
      status: 'success',
      results: teams.length,
      data: { teams }
    });
  } catch (error) {
    next(error);
  }
};

const getTeamById = async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) {
      return next(new AppError('Team not found', 404));
    }

    const isMember = await Team.isMember(team.id, req.user.id);
    if (!isMember) {
      return next(new AppError('You are not a member of this team', 403));
    }

    const members = await Team.getTeamMembers(team.id);

    res.status(200).json({
      status: 'success',
      data: { team, members }
    });
  } catch (error) {
    next(error);
  }
};

const getTeamMembers = async (req, res, next) => {
  try {
    const { teamId } = req.params;
    const isMember = await Team.isMember(teamId, req.user.id);
    if (!isMember) {
      return next(new AppError('You are not a member of this team', 403));
    }

    const members = await Team.getTeamMembers(teamId);

    res.status(200).json({
      status: 'success',
      results: members.length,
      data: { members }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTeam,
  joinTeam,
  addMember,
  getMyTeams,
  getTeamById,
  getTeamMembers
};
