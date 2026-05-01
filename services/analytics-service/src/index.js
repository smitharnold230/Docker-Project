require('dotenv').config();

const express = require('express');
const { Kafka } = require('kafkajs');

const app = express();
const port = Number(process.env.PORT || 6002);

const stats = {
  service: 'analytics-service',
  status: 'starting',
  processedEvents: 0,
  signupCount: 0,
  lastEventAt: null,
  lastEvent: null,
  startedAt: new Date().toISOString(),
};

app.get('/health', (req, res) => {
  res.status(200).json({
    service: stats.service,
    status: stats.status,
  });
});

app.get('/stats', (req, res) => {
  res.status(200).json(stats);
});

app.listen(port, () => {
  console.log(`[analytics-service] Status API running on port ${port}`);
});

const brokers = (process.env.KAFKA_BROKER || 'localhost:29092')
  .split(',')
  .map((broker) => broker.trim())
  .filter(Boolean);

const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID || 'analytics-service',
  brokers,
});

const consumer = kafka.consumer({
  groupId: process.env.KAFKA_GROUP_ID || 'analytics-service-group',
});

async function start() {
  await consumer.connect();
  await consumer.subscribe({ topic: 'user-events', fromBeginning: true });

  stats.status = 'running';
  console.log('[analytics-service] Waiting for user_created events...');

  await consumer.run({
    eachMessage: async ({ message }) => {
      const payload = JSON.parse(message.value.toString());

      if (payload.event !== 'user_created') {
        return;
      }

      stats.processedEvents += 1;
      stats.signupCount += 1;
      stats.lastEventAt = new Date().toISOString();
      stats.lastEvent = payload;
      console.log(`[analytics-service] Signup count: ${stats.signupCount}`);
    },
  });
}

async function bootstrap() {
  stats.status = 'connecting';

  while (true) {
    try {
      await start();
      break;
    } catch (error) {
      stats.status = 'retrying';
      console.error('[analytics-service] Kafka connection failed:', error.message);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
}

bootstrap();
