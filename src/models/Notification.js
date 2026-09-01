const { dbAsync } = require('../config/database');

class Notification {
  static async create({ userId, title, message, type = 'INFO' }) {
    const result = await dbAsync.run(
      `INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)`,
      [userId, title, message, type]
    );
    return this.findById(result.lastID);
  }

  static async findById(id) {
    return dbAsync.get(`SELECT * FROM notifications WHERE id = ?`, [id]);
  }

  static async getByUserId(userId, limit = 50) {
    return dbAsync.all(
      `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`,
      [userId, limit]
    );
  }

  static async markAsRead(id, userId) {
    await dbAsync.run(
      `UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?`,
      [id, userId]
    );
    return this.findById(id);
  }

  static async markAllAsRead(userId) {
    await dbAsync.run(
      `UPDATE notifications SET is_read = 1 WHERE user_id = ?`,
      [userId]
    );
    return true;
  }
}

module.exports = Notification;
