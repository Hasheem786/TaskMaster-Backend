const { dbAsync } = require('../config/database');

class Attachment {
  static async create({ taskId, uploaderId, filename, originalName, mimeType, size, filepath }) {
    const result = await dbAsync.run(
      `INSERT INTO attachments (task_id, uploader_id, filename, original_name, mime_type, size, filepath)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [taskId, uploaderId, filename, originalName, mimeType, size, filepath]
    );
    return this.findById(result.lastID);
  }

  static async findById(id) {
    return dbAsync.get(
      `SELECT a.*, u.name as uploader_name
       FROM attachments a
       JOIN users u ON a.uploader_id = u.id
       WHERE a.id = ?`,
      [id]
    );
  }

  static async getByTaskId(taskId) {
    return dbAsync.all(
      `SELECT a.*, u.name as uploader_name
       FROM attachments a
       JOIN users u ON a.uploader_id = u.id
       WHERE a.task_id = ?
       ORDER BY a.uploaded_at DESC`,
      [taskId]
    );
  }

  static async delete(id) {
    const result = await dbAsync.run(`DELETE FROM attachments WHERE id = ?`, [id]);
    return result.changes > 0;
  }
}

module.exports = Attachment;
