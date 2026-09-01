const { dbAsync } = require('../config/database');

class Comment {
  static async create({ taskId, userId, content }) {
    const result = await dbAsync.run(
      `INSERT INTO comments (task_id, user_id, content) VALUES (?, ?, ?)`,
      [taskId, userId, content]
    );
    return this.findById(result.lastID);
  }

  static async findById(id) {
    return dbAsync.get(
      `SELECT c.*, u.name as user_name, u.email as user_email, u.avatar as user_avatar
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.id = ?`,
      [id]
    );
  }

  static async getByTaskId(taskId) {
    return dbAsync.all(
      `SELECT c.*, u.name as user_name, u.email as user_email, u.avatar as user_avatar
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.task_id = ?
       ORDER BY c.created_at ASC`,
      [taskId]
    );
  }

  static async delete(id) {
    const result = await dbAsync.run(`DELETE FROM comments WHERE id = ?`, [id]);
    return result.changes > 0;
  }
}

module.exports = Comment;
