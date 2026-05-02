# Product Catalog and Search (With Redis Cache)

Full-stack app with:
- Frontend: React (Vite)
- Backend: Node.js + Express
- Database (source of truth): PostgreSQL
- Cache layer: Redis

Architecture:
Frontend -> Backend -> Redis (cache) -> PostgreSQL (fallback/source of truth)

## Folder Structure

```text
project-with-redis/
  frontend/
  backend/
  redis/
  database/
```

## APIs

- GET /products
- GET /products/:id
- GET /search?q=keyword
- PUT /products/:id (bonus: cache invalidation demo)

## Caching Behavior

Read flow:
1. Check Redis key first.
2. Cache hit -> return cached payload.
3. Cache miss -> query PostgreSQL, store in Redis with TTL, return payload.

Example keys:
- products:all
- products:category:{category}
- product:{id}
- search:{query}:category:{category}

TTL:
- Controlled by `CACHE_TTL_SECONDS` (default: 120)

Redis down behavior:
- API still works by querying PostgreSQL directly.
- Redis errors are logged as warnings.

## Run Instructions

## 1) Start Redis + PostgreSQL using Docker

```bash
cd project-with-redis
docker compose up -d
```

This starts:
- PostgreSQL on localhost:5433
- Redis on localhost:6379

## 2) Seed the database

```bash
cd database
Get-Content init.sql | docker exec -i product_catalog_redis_db psql -U postgres -d product_catalog_redis
```

## 3) Start backend

```bash
cd backend
copy .env.example .env
npm install
npm run dev
```

Backend runs at:
- http://localhost:5001

## 4) Start frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at:
- http://localhost:5174

## Performance Demonstration (Cache MISS vs HIT)

Call the same endpoint twice:

```bash
Invoke-WebRequest -Uri "http://localhost:5001/products" -UseBasicParsing | Select-Object -ExpandProperty Content
Invoke-WebRequest -Uri "http://localhost:5001/products" -UseBasicParsing | Select-Object -ExpandProperty Content
```

Backend logs show clear difference:
- First request: cache=MISS source=postgres (slower)
- Second request: cache=HIT source=redis (faster)

Example log lines:

```text
GET /products - 200 - 18.66ms cache=MISS source=postgres
GET /products - 200 - 2.31ms cache=HIT source=redis
```

## Bonus: Cache Invalidation

Update a product:

```bash
Invoke-WebRequest -Method PUT -Uri "http://localhost:5001/products/1" -ContentType "application/json" -Body '{"name":"Product 1 Updated"}' -UseBasicParsing
```

This invalidates:
- products:all
- product:1
- products:category:{productCategory}
- search:* keys

## Notes

- Redis is used only as cache.
- PostgreSQL is the source of truth.
- Every cache miss queries DB directly.
- Cache hit/miss and response times are logged for visibility.
