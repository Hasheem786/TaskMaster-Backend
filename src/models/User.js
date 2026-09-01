const { dbAsync } = require('../config/database');

class User {
  static async create({ name, email, password, avatar = null }) {
    const result = await dbAsync.run(
      `INSERT INTO users (name, email, password, avatar) VALUES (?, ?, ?, ?)`,
      [name, email.toLowerCase(), password, avatar]
    );
    return this.findById(result.lastID);
  }

  static async findByEmail(email) {
    return dbAsync.get(`SELECT * FROM users WHERE email = ?`, [email.toLowerCase()]);
  }

  static async findById(id) {
    return dbAsync.get(`SELECT * FROM users WHERE id = ?`, [id]);
  }

  static async update(id, updates) {
    const fields = [];
    const values = [];

    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.email !== undefined) {
      fields.push('email = ?');
      values.push(updates.email.toLowerCase());
    }
    if (updates.password !== undefined) {
      fields.push('password = ?');
      values.push(updates.password);
    }
    if (updates.avatar !== undefined) {
      fields.push('avatar = ?');
      values.push(updates.avatar);
    }

    if (fields.length === 0) return this.findById(id);

    values.push(id);
    const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
    await dbAsync.run(sql, values);
    return this.findById(id);
  }

  static toPublicJSON(user) {
    if (!user) return null;
    const { password, ...publicUser } = user;
    return publicUser;
  }
}

module.exports = User;
