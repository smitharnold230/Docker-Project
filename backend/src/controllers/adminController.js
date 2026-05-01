const { pool } = require('../config/db');
const { getKafkaHealth } = require('../config/kafka');

const serviceTargets = [
  {
    name: 'email-service',
    url: process.env.EMAIL_SERVICE_URL || 'http://email-service:6001',
  },
  {
    name: 'analytics-service',
    url: process.env.ANALYTICS_SERVICE_URL || 'http://analytics-service:6002',
  },
  {
    name: 'logging-service',
    url: process.env.LOGGING_SERVICE_URL || 'http://logging-service:6003',
  },
];

async function fetchWithTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timer);
  }
}

async function getServiceStatus(service) {
  try {
    const response = await fetchWithTimeout(`${service.url}/stats`, 2500);
    if (!response.ok) {
      return {
        name: service.name,
        healthy: false,
        details: {
          statusCode: response.status,
        },
      };
    }

    const stats = await response.json();
    return {
      name: service.name,
      healthy: true,
      details: stats,
    };
  } catch (error) {
    return {
      name: service.name,
      healthy: false,
      details: {
        error: error.message,
      },
    };
  }
}

async function getStatus(req, res, next) {
  try {
    const [dbResult, kafkaStatus, consumerStatuses] = await Promise.all([
      pool.query('SELECT COUNT(*)::int AS total_users FROM users'),
      getKafkaHealth(),
      Promise.all(serviceTargets.map((service) => getServiceStatus(service))),
    ]);

    const totalUsers = dbResult.rows[0] ? dbResult.rows[0].total_users : 0;

    res.status(200).json({
      message: 'Admin service status',
      timestamp: new Date().toISOString(),
      backend: {
        healthy: true,
      },
      database: {
        healthy: true,
        name: 'auth_kafka',
        totalUsers,
      },
      kafka: kafkaStatus,
      consumers: consumerStatuses,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getStatus,
};
