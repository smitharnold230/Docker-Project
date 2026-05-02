const {
  getAllProducts,
  getProductById,
  searchProducts,
  updateProduct,
} = require('../models/productModel');
const { safeGet, safeSetEx, safeDel, safeKeys, redisClient } = require('../config/redis');

const CACHE_TTL_SECONDS = Number(process.env.CACHE_TTL_SECONDS || 120);

function getProductsCacheKey(category) {
  return category ? `products:category:${category.toLowerCase()}` : 'products:all';
}

function getProductCacheKey(id) {
  return `product:${id}`;
}

function getSearchCacheKey(query, category) {
  const q = (query || '').trim().toLowerCase();
  const c = category ? category.trim().toLowerCase() : 'all';
  return `search:${q}:category:${c}`;
}

async function invalidateProductCaches(productId, category) {
  const exactKeys = ['products:all', getProductCacheKey(productId)];

  if (category) {
    exactKeys.push(`products:category:${category.toLowerCase()}`);
  }

  await safeDel(exactKeys);

  const searchKeys = await safeKeys('search:*');
  if (searchKeys.length > 0) {
    await safeDel(searchKeys);
  }
}

function cacheState(isHit) {
  return isHit ? 'HIT' : 'MISS';
}

async function listProducts(req, res, next) {
  try {
    const { category } = req.query;
    const cacheKey = getProductsCacheKey(category);

    const cached = await safeGet(cacheKey);

    if (cached) {
      const payload = JSON.parse(cached);
      payload.meta = {
        ...(payload.meta || {}),
        cache: 'HIT',
        source: 'redis',
        ttlSeconds: CACHE_TTL_SECONDS,
      };

      res.locals.cacheStatus = cacheState(true);
      res.locals.dataSource = 'redis';
      return res.json(payload);
    }

    const products = await getAllProducts(category);
    const payload = {
      total: products.length,
      products,
      meta: {
        cache: 'MISS',
        source: 'postgres',
        ttlSeconds: CACHE_TTL_SECONDS,
      },
    };

    await safeSetEx(cacheKey, CACHE_TTL_SECONDS, JSON.stringify(payload));

    res.locals.cacheStatus = cacheState(false);
    res.locals.dataSource = 'postgres';
    return res.json(payload);
  } catch (error) {
    next(error);
  }
}

async function getProductDetails(req, res, next) {
  try {
    const { id } = req.params;
    const cacheKey = getProductCacheKey(id);

    const cached = await safeGet(cacheKey);
    if (cached) {
      const payload = JSON.parse(cached);
      payload.meta = {
        ...(payload.meta || {}),
        cache: 'HIT',
        source: 'redis',
        ttlSeconds: CACHE_TTL_SECONDS,
      };

      res.locals.cacheStatus = cacheState(true);
      res.locals.dataSource = 'redis';
      return res.json(payload);
    }

    const product = await getProductById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const payload = {
      ...product,
      meta: {
        cache: 'MISS',
        source: 'postgres',
        ttlSeconds: CACHE_TTL_SECONDS,
      },
    };

    await safeSetEx(cacheKey, CACHE_TTL_SECONDS, JSON.stringify(payload));

    res.locals.cacheStatus = cacheState(false);
    res.locals.dataSource = 'postgres';
    return res.json(payload);
  } catch (error) {
    next(error);
  }
}

async function searchProductCatalog(req, res, next) {
  try {
    const { q = '', category } = req.query;
    const cacheKey = getSearchCacheKey(q, category);

    const cached = await safeGet(cacheKey);
    if (cached) {
      const payload = JSON.parse(cached);
      payload.meta = {
        ...(payload.meta || {}),
        cache: 'HIT',
        source: 'redis',
        ttlSeconds: CACHE_TTL_SECONDS,
      };

      res.locals.cacheStatus = cacheState(true);
      res.locals.dataSource = 'redis';
      return res.json(payload);
    }

    const products = await searchProducts(q, category);
    const payload = {
      total: products.length,
      query: q,
      products,
      meta: {
        cache: 'MISS',
        source: 'postgres',
        ttlSeconds: CACHE_TTL_SECONDS,
      },
    };

    await safeSetEx(cacheKey, CACHE_TTL_SECONDS, JSON.stringify(payload));

    res.locals.cacheStatus = cacheState(false);
    res.locals.dataSource = 'postgres';
    return res.json(payload);
  } catch (error) {
    next(error);
  }
}

async function updateProductById(req, res, next) {
  try {
    const { id } = req.params;
    const { name, price, category, description } = req.body;

    const updated = await updateProduct(id, { name, price, category, description });

    if (!updated) {
      return res.status(404).json({ message: 'Product not found or no fields provided' });
    }

    await invalidateProductCaches(id, updated.category);

    return res.json({
      message: 'Product updated and cache invalidated',
      product: updated,
      meta: {
        redisAvailable: redisClient.isOpen,
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listProducts,
  getProductDetails,
  searchProductCatalog,
  updateProductById,
};
