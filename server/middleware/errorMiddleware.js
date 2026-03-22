export const errorMiddleware = (err, req, res, next) => {
  const status = err.statusCode || err.status || 500;
  const message = err.message || 'Server error';
  if (process.env.NODE_ENV !== 'production') {
    console.error(err);
  }
  res.status(status).json({
    message,
    ...(process.env.NODE_ENV !== 'production' && err.stack && { stack: err.stack }),
  });
};
