# Event-Driven Authentication Project With Kafka

This project demonstrates a simple event-driven authentication flow:

Frontend -> Backend API -> Kafka -> Multiple Consumers

It includes:

- React frontend with Signup and Login pages
- Node.js + Express backend acting as the Kafka producer
- PostgreSQL database for user storage
- Apache Kafka with Zookeeper using Docker Compose
- Three independent consumers:
  - Email service
  - Analytics service
  - Logging service
- A replay helper for reading stored Kafka events again

## Folder Structure

```text
project-with-kafka/
  frontend/
  backend/
  kafka/
  services/
    email-service/
    analytics-service/
    logging-service/
  database/
```

## Architecture

1. The frontend submits signup or login requests to the backend.
2. The backend validates input and stores users in PostgreSQL.
3. On signup, the backend publishes a `user_created` event to Kafka topic `user-events`.
4. The consumer services process the same event independently.

No service calls another service directly. Kafka is the only communication layer between producer and consumers.

## Requirements

- Docker Desktop
- Node.js 18+ if you want to run the replay helper outside Docker

## Run Everything

Start the full stack from the project root:

```bash
docker compose up --build
```

This starts:

- PostgreSQL on port `5432`
- Zookeeper on port `2181`
- Kafka on port `29092` for host access and `9092` for internal service access
- Backend on port `5000`
- Frontend on port `5173`
- Email, analytics, and logging consumers

## Local URLs

- Frontend: http://localhost:5173
- Backend: http://localhost:5000
- Kafka host port: localhost:29092
- Service status page: http://localhost:5173/status
- Admin status API: http://localhost:5000/admin/status

## Beginner Guide: What You Can See vs What Runs in Background

In this project, only the frontend has a browser UI.

- You can see and interact with the frontend at `http://localhost:5173`.
- The backend, Kafka, PostgreSQL, and consumer services run in containers in the background.
- Their activity appears in terminal logs, not in the browser.

### What `auth_kafka` means in docker-compose

`auth_kafka` is the PostgreSQL database name.

- It is not a separate service.
- It is the database used by the backend to store users.
- You will see it in `POSTGRES_DB`, `DATABASE_URL`, and the database health check.

### How to check services are running

From the project root:

```bash
docker compose ps
```

You should see these services up:

- `frontend`
- `backend`
- `postgres`
- `zookeeper`
- `kafka`
- `email-service`
- `analytics-service`
- `logging-service`

### How to watch consumer services

Use logs to verify the event-driven part:

```bash
docker compose logs -f email-service analytics-service logging-service
```

When you sign up a user, you should see:

- Email service logs a welcome email message
- Analytics service increments signup count
- Logging service prints the `user_created` event payload

### Beginner dashboard for service activity

Open this page in the browser:

- `http://localhost:5173/status`

This page calls backend endpoint `GET /admin/status` and shows:

- Backend health
- Database status and total user count
- Kafka health and topics
- Consumer service stats (processed events and last event time)

### Quick beginner test

1. Open frontend and sign up a new user.
2. Keep the consumer logs open in terminal.
3. Confirm all three services react to the same signup event.
4. Log in with the same user to verify normal auth flow.

## Database Schema

The PostgreSQL schema is loaded automatically from `database/schema.sql` when the database volume is first created.

## Backend API

- `POST /signup`
- `POST /login`

### Signup flow

1. Validate input
2. Hash the password with bcrypt
3. Save the user in PostgreSQL
4. Publish a Kafka event to `user-events`

### Login flow

1. Validate input
2. Find the user in PostgreSQL
3. Compare the password hash
4. Return a JWT

### Event example

```json
{
  "event": "user_created",
  "user_id": "1",
  "email": "user@example.com",
  "created_at": "2026-04-21T00:00:00.000Z"
}
```

## Example Consumer Output

Email service:

```text
[email-service] Sending welcome email to user@example.com
```

Analytics service:

```text
[analytics-service] Signup count: 1
```

Logging service:

```text
[logging-service] user_created event received: { ... }
```

## Replay Events

The replay helper reads the topic again from the beginning using a fresh consumer group.

```bash
cd kafka
npm install
npm run replay
```

You can also point it at the Kafka broker running in Docker:

```bash
KAFKA_BROKER=localhost:29092 npm run replay
```

## Consumer Down Scenario

Kafka retains events even if one consumer is stopped.

- Stop one consumer container.
- Create more signups.
- Restart the consumer.
- It resumes from its committed offset and catches up.

If you want a full replay instead of offset-based catch-up, run the replay helper with a new group id.

## Stop Everything

```bash
docker compose down -v
```
