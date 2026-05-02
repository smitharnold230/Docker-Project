require('dotenv').config();

const app = require('./app');
const { pool } = require('./src/config/db');
const { connectRedis } = require('./src/config/redis');

const PORT = process.env.PORT || 5001;

async function startServer() {
  try {
    await pool.query('SELECT 1');
    await connectRedis();

    app.listen(PORT, () => {
      console.log(`Backend running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();
