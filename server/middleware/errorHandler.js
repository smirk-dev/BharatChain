const errorHandler = (err, req, res, next) => {
  console.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
  });

  // Default error response
  let error = {
    success: false,
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  };

  // Handle specific error types
  
  // Validation errors (express-validator)
  if (err.name === 'ValidationError' || err.errors) {
    error.message = 'Validation failed';
    error.errors = err.errors || err.message;
    return res.status(400).json(error);
  }

  // Sequelize validation errors
  if (err.name === 'SequelizeValidationError') {
    error.message = 'Database validation failed';
    error.errors = err.errors.map(e => ({
      field: e.path,
      message: e.message,
      value: e.value,
    }));
    return res.status(400).json(error);
  }

  // Sequelize unique constraint errors
  if (err.name === 'SequelizeUniqueConstraintError') {
    error.message = 'Duplicate entry detected';
    error.field = err.errors[0]?.path;
    return res.status(409).json(error);
  }

  // Sequelize foreign key constraint errors
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    error.message = 'Referenced record not found';
    return res.status(404).json(error);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error.message = 'Invalid token';
    return res.status(401).json(error);
  }

  if (err.name === 'TokenExpiredError') {
    error.message = 'Token expired';
    return res.status(401).json(error);
  }

  // Multer errors (file upload)
  if (err.code === 'LIMIT_FILE_SIZE') {
    error.message = 'File size too large';
    return res.status(413).json(error);
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    error.message = 'Unexpected file field';
    return res.status(400).json(error);
  }

  // Blockchain/Web3 errors
  if (err.message && err.message.includes('execution reverted')) {
    error.message = 'Blockchain transaction failed';
    error.details = err.message;
    return res.status(400).json(error);
  }

  if (err.message && err.message.includes('insufficient funds')) {
    error.message = 'Insufficient funds for transaction';
    return res.status(400).json(error);
  }

  // IPFS errors
  if (err.message && err.message.includes('IPFS')) {
    error.message = 'File storage service unavailable';
    return res.status(503).json(error);
  }

  // Network/timeout errors
  if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
    error.message = 'External service unavailable';
    return res.status(503).json(error);
  }

  // Cast errors (invalid ObjectId, etc.)
  if (err.name === 'CastError') {
    error.message = 'Invalid ID format';
    return res.status(400).json(error);
  }

  // Rate limiting errors
  if (err.status === 429) {
    error.message = 'Too many requests';
    return res.status(429).json(error);
  }

  // Handle custom application errors
  if (err.statusCode && err.statusCode < 500) {
    error.message = err.message;
    return res.status(err.statusCode).json(error);
  }

  // Default to 500 server error
  const statusCode = err.statusCode || err.status || 500;
  
  if (statusCode >= 500) {
    error.message = 'Internal server error';
    // Don't expose internal error details in production
    if (process.env.NODE_ENV !== 'production') {
      error.details = err.message;
    }
  } else {
    error.message = err.message || 'Bad request';
  }

  res.status(statusCode).json(error);
};

// Handle 404 errors for unmatched routes
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
    method: req.method,
  });
};

// Async error wrapper to catch async/await errors
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler,
};
