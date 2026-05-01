require('dotenv').config();

const app = require('./app');
const { connectDatabase } = require('./src/config/db');
const { connectProducer } = require('./src/config/kafka');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDatabase();
    await connectProducer();

    app.listen(PORT, () => {
      console.log(`Backend running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start backend:', error.message);
    process.exit(1);
  }
}

startServer();
