const express = require('express');
const cors = require('cors');

const productRoutes = require('./src/routes/productRoutes');
const responseTimeLogger = require('./src/middleware/responseTimeLogger');
const { notFound, errorHandler } = require('./src/middleware/errorMiddleware');
const { pool } = require('./src/config/db');

const app = express();

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5174,http://localhost:4174')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
  })
);
app.use(express.json());
app.use(responseTimeLogger);

app.get('/', (_req, res) => {
  res.json({ message: 'Product Catalog API with Redis cache is running' });
});

app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    return res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    return res.status(500).json({ status: 'error', database: 'disconnected', error: error.message });
  }
});

app.use('/', productRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
