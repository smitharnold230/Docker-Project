# Database Setup

This project uses PostgreSQL and seeds 90 products.

If Docker PostgreSQL is already running via root `docker-compose.yml`, seed using:

```bash
Get-Content init.sql | docker exec -i product_catalog_redis_db psql -U postgres -d product_catalog_redis
```
