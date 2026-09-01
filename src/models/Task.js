const { dbAsync } = require('../config/database');

class Task {
  static async create({
    title,
    description = '',
    status = 'OPEN',
    priority = 'MEDIUM',
    dueDate = null,
    creatorId,
    assigneeId = null,
    teamId = null
  }) {
    const result = await dbAsync.run(
      `INSERT INTO tasks (title, description, status, priority, due_date, creator_id, assignee_id, team_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, description, status, priority, dueDate, creatorId, assigneeId, teamId]
    );
    return this.findById(result.lastID);
  }

  static async findById(id) {
    return dbAsync.get(
      `SELECT t.*, 
              cu.name as creator_name, cu.email as creator_email,
              au.name as assignee_name, au.email as assignee_email,
              tm.name as team_name
       FROM tasks t
       LEFT JOIN users cu ON t.creator_id = cu.id
       LEFT JOIN users au ON t.assignee_id = au.id
       LEFT JOIN teams tm ON t.team_id = tm.id
       WHERE t.id = ?`,
      [id]
    );
  }

  static async findAll({
    status,
    priority,
    teamId,
    assigneeId,
    creatorId,
    search,
    sortBy = 'created_at',
    order = 'DESC'
  } = {}) {
    let sql = `
      SELECT t.*, 
             cu.name as creator_name, cu.email as creator_email,
             au.name as assignee_name, au.email as assignee_email,
             tm.name as team_name
      FROM tasks t
      LEFT JOIN users cu ON t.creator_id = cu.id
      LEFT JOIN users au ON t.assignee_id = au.id
      LEFT JOIN teams tm ON t.team_id = tm.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      sql += ` AND t.status = ?`;
      params.push(status);
    }
    if (priority) {
      sql += ` AND t.priority = ?`;
      params.push(priority);
    }
    if (teamId) {
      sql += ` AND t.team_id = ?`;
      params.push(teamId);
    }
    if (assigneeId) {
      sql += ` AND t.assignee_id = ?`;
      params.push(assigneeId);
    }
    if (creatorId) {
      sql += ` AND t.creator_id = ?`;
      params.push(creatorId);
    }
    if (search) {
      sql += ` AND (t.title LIKE ? OR t.description LIKE ?)`;
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern);
    }

    const allowedSortFields = ['created_at', 'due_date', 'title', 'priority', 'status'];
    const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
    const validOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    sql += ` ORDER BY t.${validSortBy} ${validOrder}`;

    return dbAsync.all(sql, params);
  }

  static async update(id, updates) {
    const fields = [];
    const values = [];

    const allowedFields = ['title', 'description', 'status', 'priority', 'due_date', 'assignee_id', 'team_id'];
    const dbKeyMap = { dueDate: 'due_date', assigneeId: 'assignee_id', teamId: 'team_id' };

    for (const key of Object.keys(updates)) {
      const dbKey = dbKeyMap[key] || key;
      if (allowedFields.includes(dbKey) && updates[key] !== undefined) {
        fields.push(`${dbKey} = ?`);
        values.push(updates[key]);
      }
    }

    if (fields.length === 0) return this.findById(id);

    fields.push("updated_at = CURRENT_TIMESTAMP");
    values.push(id);

    const sql = `UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`;
    await dbAsync.run(sql, values);
    return this.findById(id);
  }

  static async delete(id) {
    const result = await dbAsync.run(`DELETE FROM tasks WHERE id = ?`, [id]);
    return result.changes > 0;
  }
}

module.exports = Task;
