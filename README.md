# The Containerized Application: Consistency Everywhere

This exact Node.js and PostgreSQL backend threw enormous friction in the `project-without-docker` baseline due to OS-specific binary packages, manual SQL routing setups, and node dependency version conflicts.

Notice how those complex, brittle steps are entirely decimated by simply wrapping the components inside a Docker ecosystem. 

## The Elegant Setup Instructions

Because the definitions are tightly coupled structurally (the `Dockerfile` defines exactly how Node boots, the `docker-compose.yml` wires the explicit Postges connection environment variables, and `init.sql` builds the tables upon database start), executing this payload takes **one single generic command**. It does not matter if you are on Windows, macOS, or Ubuntu.

### 1. Boot up the entire stack:
Ensure Docker is installed, optionally open Docker Desktop to visualize it, then simply:

```bash
docker compose up -d --build
```

### 2. Verify:
Done. Wait 5 seconds, open your browser or API tester to checkout your application responding beautifully: 
- `http://localhost:3000/api/health`
- `http://localhost:3000/api/users`

### 3. Cleanup:
When you are done testing, simply run the following. Notice how neither Node package artifacts nor PostgreSQL local binaries are left bleeding onto your host laptop! They were entirely sandboxed. 

```bash
docker compose down
```
