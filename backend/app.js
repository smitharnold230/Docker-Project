const express = require('express');
const cors = require('cors');

const authRoutes = require('./src/routes/authRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const { notFound, errorHandler } = require('./src/middleware/errorMiddleware');

const app = express();
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
  })
);
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Kafka auth API is running' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/', adminRoutes);
app.use('/', authRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
