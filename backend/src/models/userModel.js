const { pool } = require('../config/db');

async function findUserByEmail(email) {
  const result = await pool.query(
    'SELECT id, email, password, created_at FROM users WHERE email = $1 LIMIT 1',
    [email]
  );

  return result.rows[0] || null;
}

async function createUser(email, hashedPassword) {
  const result = await pool.query(
    'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email, created_at',
    [email, hashedPassword]
  );

  return result.rows[0];
}

module.exports = {
  findUserByEmail,
  createUser,
};
