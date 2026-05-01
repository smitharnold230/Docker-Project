function notFound(req, res, next) {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
}

function errorHandler(err, req, res, next) {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  res.status(statusCode).json({
    message: err.message || 'Internal server error',
  });
}

module.exports = {
  notFound,
  errorHandler,
};
