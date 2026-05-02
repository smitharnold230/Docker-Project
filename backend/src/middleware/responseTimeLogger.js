function responseTimeLogger(req, res, next) {
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const end = process.hrtime.bigint();
    const ms = Number(end - start) / 1_000_000;
    const cacheMeta = res.locals.cacheStatus ? ` cache=${res.locals.cacheStatus}` : '';
    const sourceMeta = res.locals.dataSource ? ` source=${res.locals.dataSource}` : '';
    console.log(`${req.method} ${req.originalUrl} - ${res.statusCode} - ${ms.toFixed(2)}ms${cacheMeta}${sourceMeta}`);
  });

  next();
}

module.exports = responseTimeLogger;
