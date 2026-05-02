const express = require('express');

const {
  listProducts,
  getProductDetails,
  searchProductCatalog,
  updateProductById,
} = require('../controllers/productController');

const router = express.Router();

router.get('/products', listProducts);
router.get('/products/:id', getProductDetails);
router.get('/search', searchProductCatalog);
router.put('/products/:id', updateProductById);

module.exports = router;
