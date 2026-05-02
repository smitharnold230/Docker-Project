CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  category VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

TRUNCATE TABLE products RESTART IDENTITY;

INSERT INTO products (name, price, category, description, created_at)
SELECT
  'Product ' || gs,
  ROUND((15 + (gs * 2.11))::numeric, 2),
  CASE
    WHEN gs % 6 = 0 THEN 'Electronics'
    WHEN gs % 6 = 1 THEN 'Books'
    WHEN gs % 6 = 2 THEN 'Home'
    WHEN gs % 6 = 3 THEN 'Fashion'
    WHEN gs % 6 = 4 THEN 'Sports'
    ELSE 'Beauty'
  END,
  'Redis demo product ' || gs || ': high-quality catalog item.',
  NOW() - (gs || ' hours')::INTERVAL
FROM generate_series(1, 90) AS gs;
