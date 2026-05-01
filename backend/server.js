const express = require('express');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3000;

// This relies entirely on the local host machine explicitly having these ENV vars set
// OR a PostgreSQL server running natively on port 5432 with these *exact* credentials.
const pool = new Pool({
    user: process.env.PGUSER || 'baremetal_admin',
    host: process.env.PGHOST || 'localhost',
    database: process.env.PGDATABASE || 'application_db',
    password: process.env.PGPASSWORD || 'super_secret123',
    port: process.env.PGPORT || 5432,
});

app.use(express.json());

// A simple health check establishing OS dependency brittleness
app.get('/api/health', (req, res) => {
    res.json({ status: 'UP', os_architecture: process.arch, node_version: process.version });
});

// A route that instantly fails if Postgres is not perfectly set up locally
app.get('/api/users', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM users');
        res.json({ users: result.rows });
    } catch (err) {
        console.error("FATAL BARE-METAL ERROR:", err.message);
        res.status(500).json({ error: "Database Connection Failed. Did you setup Postgres locally?" });
    }
});

app.listen(port, () => {
    console.log(`Backend spinning up on port ${port}...`);
    console.log(`Database routing targeted at ${process.env.PGHOST || 'localhost'}!`);
});
