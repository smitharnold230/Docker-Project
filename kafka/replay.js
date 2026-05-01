require('dotenv').config();

const { Kafka } = require('kafkajs');

const brokers = (process.env.KAFKA_BROKER || 'localhost:29092')
  .split(',')
  .map((broker) => broker.trim())
  .filter(Boolean);

const kafka = new Kafka({
  clientId: 'kafka-replay-tool',
  brokers,
});

const consumer = kafka.consumer({
  groupId: `replay-${Date.now()}`,
});

async function main() {
  await consumer.connect();
  await consumer.subscribe({ topic: 'user-events', fromBeginning: true });

  console.log('[kafka-replay] Reading user-events from the beginning...');

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const value = message.value ? message.value.toString() : '';
      console.log(`[kafka-replay] ${topic}[${partition}] offset ${message.offset}: ${value}`);
    },
  });
}

main().catch((error) => {
  console.error('[kafka-replay] Failed:', error.message);
  process.exit(1);
});
