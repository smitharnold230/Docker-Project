const { Kafka } = require('kafkajs');

const brokers = (process.env.KAFKA_BROKER || 'localhost:29092')
  .split(',')
  .map((broker) => broker.trim())
  .filter(Boolean);

const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID || 'auth-backend',
  brokers,
});

const producer = kafka.producer();
let producerConnected = false;

async function connectProducer() {
  if (!producerConnected) {
    await producer.connect();
    producerConnected = true;
  }
}

async function publishUserCreatedEvent(user) {
  const event = {
    event: 'user_created',
    user_id: String(user.id),
    email: user.email,
    created_at: user.created_at,
  };

  await connectProducer();

  await producer.send({
    topic: 'user-events',
    messages: [
      {
        key: String(user.id),
        value: JSON.stringify(event),
      },
    ],
  });

  return event;
}

async function getKafkaHealth() {
  const admin = kafka.admin();

  try {
    await admin.connect();
    const topics = await admin.listTopics();

    return {
      healthy: true,
      topics,
    };
  } catch (error) {
    return {
      healthy: false,
      error: error.message,
      topics: [],
    };
  } finally {
    try {
      await admin.disconnect();
    } catch (error) {
      // Ignore disconnect failures in health checks.
    }
  }
}

module.exports = {
  kafka,
  producer,
  connectProducer,
  publishUserCreatedEvent,
  getKafkaHealth,
};
