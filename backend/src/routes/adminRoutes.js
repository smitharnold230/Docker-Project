const express = require('express');

const { getStatus } = require('../controllers/adminController');

const router = express.Router();

router.get('/admin/status', getStatus);

module.exports = router;
