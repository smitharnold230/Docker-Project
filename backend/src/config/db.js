const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function connectDatabase() {
  await pool.query('SELECT 1');
}

module.exports = {
  pool,
  connectDatabase,
};
