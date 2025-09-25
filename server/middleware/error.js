/**
 * Error Handling Middleware for BharatChain
 * Centralized error handling with proper logging and user-friendly responses
 */

const path = require('path');
const fs = require('fs');

/**
 * Custom Error Classes
 */
class ValidationError extends Error {
  constructor(message, field = null, code = 'VALIDATION_ERROR') {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
    this.field = field;
    this.code = code;
  }
}

class AuthenticationError extends Error {
  constructor(message, code = 'AUTHENTICATION_ERROR') {
    super(message);
    this.name = 'AuthenticationError';
    this.statusCode = 401;
    this.code = code;
  }
}

class AuthorizationError extends Error {
  constructor(message, code = 'AUTHORIZATION_ERROR') {
    super(message);
    this.name = 'AuthorizationError';
    this.statusCode = 403;
    this.code = code;
  }
}

class NotFoundError extends Error {
  constructor(message, resource = null, code = 'NOT_FOUND') {
    super(message);
    this.name = 'NotFoundError';
    this.statusCode = 404;
    this.resource = resource;
    this.code = code;
  }
}

class ConflictError extends Error {
  constructor(message, resource = null, code = 'CONFLICT') {
    super(message);
    this.name = 'ConflictError';
    this.statusCode = 409;
    this.resource = resource;
    this.code = code;
  }
}

class BlockchainError extends Error {
  constructor(message, txHash = null, code = 'BLOCKCHAIN_ERROR') {
    super(message);
    this.name = 'BlockchainError';
    this.statusCode = 500;
    this.txHash = txHash;
    this.code = code;
  }
}

class DatabaseError extends Error {
  constructor(message, query = null, code = 'DATABASE_ERROR') {
    super(message);
    this.name = 'DatabaseError';
    this.statusCode = 500;
    this.query = query;
    this.code = code;
  }
}

/**
 * Error Logger
 */
const logError = (error, req = null) => {
  const timestamp = new Date().toISOString();
  const errorId = require('crypto').randomBytes(8).toString('hex');
  
  let logMessage = `[${timestamp}] [ERROR-${errorId}] ${error.name}: ${error.message}\n`;
  
  if (req) {
    logMessage += `  Request: ${req.method} ${req.originalUrl}\n`;
    logMessage += `  IP: ${req.ip}\n`;
    logMessage += `  User-Agent: ${req.get('User-Agent') || 'Unknown'}\n`;
    if (req.user) {
      logMessage += `  User: ${req.user.address}\n`;
    }
  }
  
  if (error.stack) {
    logMessage += `  Stack: ${error.stack}\n`;
  }
  
  logMessage += `  Additional Data: ${JSON.stringify({
    statusCode: error.statusCode,
    code: error.code,
    field: error.field,
    resource: error.resource,
    txHash: error.txHash,
    query: error.query
  }, null, 2)}\n`;
  
  logMessage += '---\n';
  
  // Console logging
  console.error(logMessage);
  
  // File logging (ensure logs directory exists)
  try {
    const logsDir = path.join(__dirname, '../../logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    const logFile = path.join(logsDir, `error-${new Date().toISOString().split('T')[0]}.log`);
    fs.appendFileSync(logFile, logMessage);
  } catch (logError) {
    console.error('Failed to write to log file:', logError);
  }
  
  return errorId;
};

/**
 * Development Error Response
 * Includes full error details for debugging
 */
const sendDevelopmentError = (error, req, res, errorId) => {
  const response = {
    error: error.name || 'Error',
    message: error.message,
    code: error.code || 'UNKNOWN_ERROR',
    statusCode: error.statusCode,
    errorId,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method
  };

  // Add additional error-specific data
  if (error.field) response.field = error.field;
  if (error.resource) response.resource = error.resource;
  if (error.txHash) response.txHash = error.txHash;
  if (error.query) response.query = error.query;

  // Include stack trace in development
  if (error.stack) {
    response.stack = error.stack.split('\n');
  }

  res.status(error.statusCode || 500).json(response);
};

/**
 * Production Error Response
 * Limited error details for security
 */
const sendProductionError = (error, req, res, errorId) => {
  const isOperationalError = error.statusCode && error.statusCode < 500;

  const response = {
    error: isOperationalError ? (error.name || 'Error') : 'Internal Server Error',
    message: isOperationalError ? error.message : 'An internal error occurred. Please try again later.',
    code: isOperationalError ? (error.code || 'UNKNOWN_ERROR') : 'INTERNAL_ERROR',
    errorId,
    timestamp: new Date().toISOString()
  };

  // Only include additional data for operational errors
  if (isOperationalError) {
    if (error.field) response.field = error.field;
    if (error.resource) response.resource = error.resource;
  }

  res.status(error.statusCode || 500).json(response);
};

/**
 * Main Error Handler Middleware
 */
const errorHandler = (error, req, res, next) => {
  // Log the error
  const errorId = logError(error, req);

  // Handle specific error types
  if (error.name === 'SequelizeValidationError') {
    const validationError = new ValidationError(
      'Database validation failed',
      error.errors?.[0]?.path || null,
      'DATABASE_VALIDATION_ERROR'
    );
    validationError.details = error.errors?.map(err => ({
      field: err.path,
      message: err.message,
      value: err.value
    }));
    return sendResponse(validationError, req, res, errorId);
  }

  if (error.name === 'SequelizeUniqueConstraintError') {
    const conflictError = new ConflictError(
      'Resource already exists',
      error.errors?.[0]?.path || null,
      'DUPLICATE_RESOURCE'
    );
    return sendResponse(conflictError, req, res, errorId);
  }

  if (error.name === 'SequelizeForeignKeyConstraintError') {
    const validationError = new ValidationError(
      'Referenced resource does not exist',
      error.fields?.[0] || null,
      'FOREIGN_KEY_CONSTRAINT'
    );
    return sendResponse(validationError, req, res, errorId);
  }

  if (error.name === 'MulterError') {
    let message = 'File upload error';
    let code = 'FILE_UPLOAD_ERROR';
    
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        message = 'File size too large';
        code = 'FILE_TOO_LARGE';
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Too many files';
        code = 'TOO_MANY_FILES';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Unexpected file field';
        code = 'UNEXPECTED_FILE_FIELD';
        break;
    }
    
    const fileError = new ValidationError(message, 'file', code);
    return sendResponse(fileError, req, res, errorId);
  }

  // Handle JSON parsing errors
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    const jsonError = new ValidationError(
      'Invalid JSON format in request body',
      'body',
      'INVALID_JSON'
    );
    return sendResponse(jsonError, req, res, errorId);
  }

  // Default error response
  sendResponse(error, req, res, errorId);
};

/**
 * Send appropriate error response based on environment
 */
const sendResponse = (error, req, res, errorId) => {
  if (process.env.NODE_ENV === 'development') {
    sendDevelopmentError(error, req, res, errorId);
  } else {
    sendProductionError(error, req, res, errorId);
  }
};

/**
 * 404 Not Found Handler
 */
const notFoundHandler = (req, res, next) => {
  const error = new NotFoundError(
    `Route ${req.method} ${req.originalUrl} not found`,
    'route',
    'ROUTE_NOT_FOUND'
  );
  next(error);
};

/**
 * Async Error Wrapper
 * Catches async errors and passes them to error handler
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Request Timeout Handler
 */
const timeoutHandler = (timeoutMs = 30000) => {
  return (req, res, next) => {
    res.setTimeout(timeoutMs, () => {
      const error = new Error('Request timeout');
      error.statusCode = 408;
      error.code = 'REQUEST_TIMEOUT';
      next(error);
    });
    next();
  };
};

/**
 * Health Check Error Handler
 * Special handler for health check endpoints
 */
const healthCheckErrorHandler = (error, req, res, next) => {
  res.status(503).json({
    status: 'unhealthy',
    error: error.message,
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
};

module.exports = {
  // Error Classes
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  BlockchainError,
  DatabaseError,
  
  // Middleware
  errorHandler,
  notFoundHandler,
  asyncHandler,
  timeoutHandler,
  healthCheckErrorHandler,
  
  // Utilities
  logError
};