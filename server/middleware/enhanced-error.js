/**
 * Enhanced Error Handling Middleware for BharatChain
 * Comprehensive error handling with logging, validation, and user-friendly responses
 */

const fs = require('fs');
const path = require('path');

/**
 * Custom Error Classes
 */
class BharatChainError extends Error {
    constructor(message, statusCode = 500, errorCode = 'INTERNAL_ERROR', details = null) {
        super(message);
        this.name = 'BharatChainError';
        this.statusCode = statusCode;
        this.errorCode = errorCode;
        this.details = details;
        this.timestamp = new Date().toISOString();
        
        // Capture stack trace
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, BharatChainError);
        }
    }
}

class ValidationError extends BharatChainError {
    constructor(message, field = null, value = null) {
        super(message, 400, 'VALIDATION_ERROR', { field, value });
        this.name = 'ValidationError';
    }
}

class AuthenticationError extends BharatChainError {
    constructor(message = 'Authentication required') {
        super(message, 401, 'AUTH_ERROR');
        this.name = 'AuthenticationError';
    }
}

class AuthorizationError extends BharatChainError {
    constructor(message = 'Insufficient permissions') {
        super(message, 403, 'AUTHORIZATION_ERROR');
        this.name = 'AuthorizationError';
    }
}

class NotFoundError extends BharatChainError {
    constructor(message = 'Resource not found', resource = null) {
        super(message, 404, 'NOT_FOUND', { resource });
        this.name = 'NotFoundError';
    }
}

class ConflictError extends BharatChainError {
    constructor(message = 'Resource conflict', resource = null) {
        super(message, 409, 'CONFLICT_ERROR', { resource });
        this.name = 'ConflictError';
    }
}

class RateLimitError extends BharatChainError {
    constructor(message = 'Rate limit exceeded') {
        super(message, 429, 'RATE_LIMIT_ERROR');
        this.name = 'RateLimitError';
    }
}

class DatabaseError extends BharatChainError {
    constructor(message = 'Database operation failed', operation = null) {
        super(message, 500, 'DATABASE_ERROR', { operation });
        this.name = 'DatabaseError';
    }
}

class BlockchainError extends BharatChainError {
    constructor(message = 'Blockchain operation failed', transactionHash = null) {
        super(message, 500, 'BLOCKCHAIN_ERROR', { transactionHash });
        this.name = 'BlockchainError';
    }
}

class PaymentError extends BharatChainError {
    constructor(message = 'Payment processing failed', orderId = null) {
        super(message, 402, 'PAYMENT_ERROR', { orderId });
        this.name = 'PaymentError';
    }
}

/**
 * Error Logger
 */
class ErrorLogger {
    constructor() {
        this.logDir = path.join(__dirname, '../logs');
        this.ensureLogDirectory();
    }

    ensureLogDirectory() {
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }

    log(error, request = null, additional = {}) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            error: {
                name: error.name,
                message: error.message,
                statusCode: error.statusCode,
                errorCode: error.errorCode,
                stack: error.stack,
                details: error.details
            },
            request: request ? {
                method: request.method,
                url: request.url,
                ip: request.ip,
                userAgent: request.get('User-Agent'),
                userId: request.user?.id,
                sessionId: request.sessionId
            } : null,
            additional
        };

        // Write to error log file
        const logFile = path.join(this.logDir, `error-${new Date().toISOString().split('T')[0]}.log`);
        const logLine = JSON.stringify(logEntry) + '\n';

        fs.appendFileSync(logFile, logLine, 'utf8');

        // Console logging for development
        if (process.env.NODE_ENV !== 'production') {
            console.error('🚨 Error Logged:', {
                error: error.message,
                code: error.errorCode,
                status: error.statusCode,
                url: request?.url,
                method: request?.method,
                user: request?.user?.id
            });
        }
    }

    getErrorStats() {
        try {
            const files = fs.readdirSync(this.logDir).filter(f => f.startsWith('error-'));
            let totalErrors = 0;
            const errorCounts = {};
            const recentErrors = [];

            files.forEach(file => {
                const content = fs.readFileSync(path.join(this.logDir, file), 'utf8');
                const lines = content.trim().split('\n').filter(line => line);
                
                lines.forEach(line => {
                    try {
                        const entry = JSON.parse(line);
                        totalErrors++;
                        
                        const errorCode = entry.error.errorCode || 'UNKNOWN';
                        errorCounts[errorCode] = (errorCounts[errorCode] || 0) + 1;
                        
                        // Keep recent errors (last 10)
                        if (recentErrors.length < 10) {
                            recentErrors.push({
                                timestamp: entry.timestamp,
                                error: entry.error.message,
                                code: errorCode,
                                url: entry.request?.url
                            });
                        }
                    } catch (parseError) {
                        // Skip malformed log entries
                    }
                });
            });

            return {
                totalErrors,
                errorCounts,
                recentErrors: recentErrors.sort((a, b) => 
                    new Date(b.timestamp) - new Date(a.timestamp)
                )
            };
        } catch (error) {
            console.error('Failed to get error stats:', error);
            return { totalErrors: 0, errorCounts: {}, recentErrors: [] };
        }
    }
}

const errorLogger = new ErrorLogger();

/**
 * Request Validation Middleware
 */
const validateRequest = (schema) => {
    return (req, res, next) => {
        try {
            const { error, value } = schema.validate(req.body, { 
                abortEarly: false,
                stripUnknown: true
            });

            if (error) {
                const validationErrors = error.details.map(detail => ({
                    field: detail.path.join('.'),
                    message: detail.message,
                    value: detail.context?.value
                }));

                throw new ValidationError(
                    'Request validation failed',
                    validationErrors[0]?.field,
                    validationErrors[0]?.value
                );
            }

            req.validatedData = value;
            next();
        } catch (err) {
            next(err);
        }
    };
};

/**
 * Async Handler Wrapper
 */
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

/**
 * Not Found Handler
 */
const notFoundHandler = (req, res, next) => {
    const error = new NotFoundError(`Route ${req.originalUrl} not found`);
    next(error);
};

/**
 * Main Error Handler Middleware
 */
const errorHandler = (error, req, res, next) => {
    // Ensure error is instance of BharatChainError
    let processedError = error;

    if (!(error instanceof BharatChainError)) {
        // Handle common error types
        if (error.name === 'ValidationError') {
            processedError = new ValidationError(error.message);
        } else if (error.name === 'CastError') {
            processedError = new ValidationError('Invalid data format', error.path, error.value);
        } else if (error.code === 'ENOENT') {
            processedError = new NotFoundError('File not found');
        } else if (error.code === 'EACCES') {
            processedError = new AuthorizationError('Access denied');
        } else if (error.code === 11000) { // MongoDB duplicate key
            processedError = new ConflictError('Duplicate resource');
        } else {
            // Generic error
            processedError = new BharatChainError(
                process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message,
                error.statusCode || 500,
                'INTERNAL_ERROR'
            );
        }
    }

    // Log the error
    errorLogger.log(processedError, req);

    // Prepare response
    const response = {
        success: false,
        error: {
            code: processedError.errorCode,
            message: processedError.message,
            statusCode: processedError.statusCode,
            timestamp: processedError.timestamp
        }
    };

    // Add details in development mode
    if (process.env.NODE_ENV !== 'production') {
        response.error.details = processedError.details;
        response.error.stack = processedError.stack;
    }

    // Send response
    res.status(processedError.statusCode).json(response);
};

/**
 * Database Error Handler
 */
const handleDatabaseError = (error, operation = 'database operation') => {
    if (error.code === 'SQLITE_CONSTRAINT') {
        return new ConflictError('Data constraint violation', operation);
    } else if (error.code === 'SQLITE_BUSY') {
        return new DatabaseError('Database is busy, please try again', operation);
    } else if (error.code === 'SQLITE_CORRUPT') {
        return new DatabaseError('Database corruption detected', operation);
    } else {
        return new DatabaseError(`Database ${operation} failed: ${error.message}`, operation);
    }
};

/**
 * API Response Helper
 */
const sendResponse = (res, data, message = 'Success', statusCode = 200) => {
    res.status(statusCode).json({
        success: true,
        message,
        data,
        timestamp: new Date().toISOString()
    });
};

const sendError = (res, error, statusCode = 500) => {
    const response = {
        success: false,
        error: {
            code: error.errorCode || 'INTERNAL_ERROR',
            message: error.message,
            timestamp: new Date().toISOString()
        }
    };

    if (process.env.NODE_ENV !== 'production' && error.details) {
        response.error.details = error.details;
    }

    res.status(statusCode).json(response);
};

/**
 * Health Check Helper
 */
const healthCheck = () => {
    return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        errorStats: errorLogger.getErrorStats()
    };
};

module.exports = {
    // Error Classes
    BharatChainError,
    ValidationError,
    AuthenticationError,
    AuthorizationError,
    NotFoundError,
    ConflictError,
    RateLimitError,
    DatabaseError,
    BlockchainError,
    PaymentError,

    // Middleware
    asyncHandler,
    errorHandler,
    notFoundHandler,
    validateRequest,

    // Helpers
    handleDatabaseError,
    sendResponse,
    sendError,
    healthCheck,

    // Logger
    errorLogger
};