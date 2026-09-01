const { dbAsync } = require('../config/database');

class Team {
  static async create({ name, description = '', inviteCode, ownerId }) {
    const result = await dbAsync.run(
      `INSERT INTO teams (name, description, invite_code, owner_id) VALUES (?, ?, ?, ?)`,
      [name, description, inviteCode, ownerId]
    );
    const teamId = result.lastID;
    
    // Automatically add owner as team member with role 'OWNER'
    await this.addMember(teamId, ownerId, 'OWNER');
    return this.findById(teamId);
  }

  static async findById(id) {
    return dbAsync.get(`SELECT t.*, u.name as owner_name, u.email as owner_email FROM teams t JOIN users u ON t.owner_id = u.id WHERE t.id = ?`, [id]);
  }

  static async findByInviteCode(inviteCode) {
    return dbAsync.get(`SELECT * FROM teams WHERE invite_code = ?`, [inviteCode]);
  }

  static async addMember(teamId, userId, role = 'MEMBER') {
    const existing = await dbAsync.get(
      `SELECT * FROM team_members WHERE team_id = ? AND user_id = ?`,
      [teamId, userId]
    );
    if (existing) return existing;

    const result = await dbAsync.run(
      `INSERT INTO team_members (team_id, user_id, role) VALUES (?, ?, ?)`,
      [teamId, userId, role]
    );
    return dbAsync.get(`SELECT * FROM team_members WHERE id = ?`, [result.lastID]);
  }

  static async isMember(teamId, userId) {
    const row = await dbAsync.get(
      `SELECT 1 FROM team_members WHERE team_id = ? AND user_id = ?`,
      [teamId, userId]
    );
    return !!row;
  }

  static async getUserTeams(userId) {
    return dbAsync.all(
      `SELECT t.*, tm.role, tm.joined_at 
       FROM teams t 
       JOIN team_members tm ON t.id = tm.team_id 
       WHERE tm.user_id = ? 
       ORDER BY t.created_at DESC`,
      [userId]
    );
  }

  static async getTeamMembers(teamId) {
    return dbAsync.all(
      `SELECT u.id, u.name, u.email, u.avatar, tm.role, tm.joined_at 
       FROM team_members tm 
       JOIN users u ON tm.user_id = u.id 
       WHERE tm.team_id = ? 
       ORDER BY tm.joined_at ASC`,
      [teamId]
    );
  }
}

module.exports = Team;
