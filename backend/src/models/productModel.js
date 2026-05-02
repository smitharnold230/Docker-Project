const { pool } = require('../config/db');

async function getAllProducts(category) {
  let queryText = 'SELECT id, name, price, category, description, created_at FROM products';
  const values = [];

  if (category) {
    queryText += ' WHERE LOWER(category) = LOWER($1)';
    values.push(category);
  }

  queryText += ' ORDER BY created_at DESC';
  const result = await pool.query(queryText, values);
  console.log('[db] getAllProducts query executed');
  return result.rows;
}

async function getProductById(id) {
  const result = await pool.query(
    'SELECT id, name, price, category, description, created_at FROM products WHERE id = $1',
    [id]
  );
  console.log(`[db] getProductById query executed for id=${id}`);
  return result.rows[0] || null;
}

async function searchProducts(query, category) {
  const values = [`%${query || ''}%`];
  let queryText =
    'SELECT id, name, price, category, description, created_at FROM products WHERE name ILIKE $1';

  if (category) {
    queryText += ' AND LOWER(category) = LOWER($2)';
    values.push(category);
  }

  queryText += ' ORDER BY created_at DESC';
  const result = await pool.query(queryText, values);
  console.log(`[db] searchProducts query executed for q=${query || ''}`);
  return result.rows;
}

async function updateProduct(id, updates) {
  const fields = [];
  const values = [];

  if (updates.name !== undefined) {
    values.push(updates.name);
    fields.push(`name = $${values.length}`);
  }
  if (updates.price !== undefined) {
    values.push(updates.price);
    fields.push(`price = $${values.length}`);
  }
  if (updates.category !== undefined) {
    values.push(updates.category);
    fields.push(`category = $${values.length}`);
  }
  if (updates.description !== undefined) {
    values.push(updates.description);
    fields.push(`description = $${values.length}`);
  }

  if (fields.length === 0) {
    return null;
  }

  values.push(id);
  const queryText = `
    UPDATE products
    SET ${fields.join(', ')}
    WHERE id = $${values.length}
    RETURNING id, name, price, category, description, created_at
  `;

  const result = await pool.query(queryText, values);
  console.log(`[db] updateProduct query executed for id=${id}`);
  return result.rows[0] || null;
}

module.exports = {
  getAllProducts,
  getProductById,
  searchProducts,
  updateProduct,
};
