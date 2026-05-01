require('dotenv').config();

const express = require('express');
const { Kafka } = require('kafkajs');

const app = express();
const port = Number(process.env.PORT || 6003);

const stats = {
  service: 'logging-service',
  status: 'starting',
  processedEvents: 0,
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
  console.log(`[logging-service] Status API running on port ${port}`);
});

const brokers = (process.env.KAFKA_BROKER || 'localhost:29092')
  .split(',')
  .map((broker) => broker.trim())
  .filter(Boolean);

const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID || 'logging-service',
  brokers,
});

const consumer = kafka.consumer({
  groupId: process.env.KAFKA_GROUP_ID || 'logging-service-group',
});

async function start() {
  await consumer.connect();
  await consumer.subscribe({ topic: 'user-events', fromBeginning: true });

  stats.status = 'running';
  console.log('[logging-service] Waiting for events...');

  await consumer.run({
    eachMessage: async ({ message }) => {
      const payload = JSON.parse(message.value.toString());

      if (payload.event === 'user_created') {
        stats.processedEvents += 1;
        stats.lastEventAt = new Date().toISOString();
        stats.lastEvent = payload;
        console.log(`[logging-service] user_created event received: ${JSON.stringify(payload)}`);
      }
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
      console.error('[logging-service] Kafka connection failed:', error.message);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
}

bootstrap();
