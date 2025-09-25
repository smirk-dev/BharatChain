/**
 * Authentication Middleware for BharatChain
 * Provides JWT token verification and user context
 */

const jwt = require('jsonwebtoken');
const { User } = require('../models');

/**
 * Verify JWT token middleware
 * Extracts and verifies the JWT token from the Authorization header
 */
const verifyToken = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        error: 'No Authorization Header',
        message: 'Access denied. No authorization header provided.',
        code: 'NO_AUTH_HEADER'
      });
    }

    // Check if the header starts with 'Bearer '
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Invalid Authorization Format',
        message: 'Authorization header must start with "Bearer "',
        code: 'INVALID_AUTH_FORMAT'
      });
    }

    // Extract the token
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token || token.trim() === '') {
      return res.status(401).json({
        error: 'No Token',
        message: 'Access denied. No token provided.',
        code: 'NO_TOKEN'
      });
    }

    try {
      // Verify the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Add decoded token data to request object
      req.user = {
        address: decoded.address,
        timestamp: decoded.timestamp,
        tokenId: decoded.nonce,
        exp: decoded.exp,
        iat: decoded.iat
      };

      // Check if token is close to expiration (within 1 hour)
      const now = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = decoded.exp - now;
      
      if (timeUntilExpiry < 3600) { // Less than 1 hour
        res.setHeader('X-Token-Expiry-Warning', 'Token expires soon');
        res.setHeader('X-Token-Expires-In', timeUntilExpiry.toString());
      }

      next();

    } catch (jwtError) {
      let errorMessage = 'Token verification failed';
      let errorCode = 'TOKEN_VERIFICATION_FAILED';

      // Handle specific JWT errors
      switch (jwtError.name) {
        case 'TokenExpiredError':
          errorMessage = 'Token has expired';
          errorCode = 'TOKEN_EXPIRED';
          break;
        case 'JsonWebTokenError':
          errorMessage = 'Invalid token format';
          errorCode = 'INVALID_TOKEN';
          break;
        case 'NotBeforeError':
          errorMessage = 'Token not active yet';
          errorCode = 'TOKEN_NOT_ACTIVE';
          break;
        default:
          errorMessage = jwtError.message || 'Token verification failed';
      }

      return res.status(401).json({
        error: 'Authentication Failed',
        message: errorMessage,
        code: errorCode,
        details: process.env.NODE_ENV === 'development' ? jwtError.message : undefined
      });
    }

  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Authentication middleware encountered an error',
      code: 'AUTH_MIDDLEWARE_ERROR'
    });
  }
};

/**
 * Optional authentication middleware
 * Sets user context if token is provided, but doesn't require it
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    // If no auth header, continue without authentication
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.substring(7);
    
    if (!token || token.trim() === '') {
      req.user = null;
      return next();
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = {
        address: decoded.address,
        timestamp: decoded.timestamp,
        tokenId: decoded.nonce,
        exp: decoded.exp,
        iat: decoded.iat
      };
    } catch (jwtError) {
      // Token invalid but not required, continue without user context
      req.user = null;
    }

    next();

  } catch (error) {
    console.error('Optional auth middleware error:', error);
    req.user = null;
    next();
  }
};

/**
 * Database user context middleware
 * Fetches user data from database and adds to request context
 * Requires verifyToken middleware to run first
 */
const attachUserContext = async (req, res, next) => {
  try {
    if (!req.user || !req.user.address) {
      return res.status(401).json({
        error: 'No User Context',
        message: 'User authentication context not found',
        code: 'NO_USER_CONTEXT'
      });
    }

    try {
      // Find user in database
      const user = await User.findOne({
        where: { walletAddress: req.user.address.toLowerCase() },
        attributes: ['id', 'walletAddress', 'name', 'email', 'phoneNumber', 'isVerified', 'createdAt', 'updatedAt']
      });

      if (!user) {
        // Create user if doesn't exist (first time login)
        const newUser = await User.create({
          walletAddress: req.user.address.toLowerCase(),
          name: `User ${req.user.address.substring(0, 8)}`,
          isVerified: false
        });

        req.dbUser = newUser;
      } else {
        req.dbUser = user;
      }

      // Update last login timestamp
      await User.update(
        { lastLoginAt: new Date() },
        { where: { walletAddress: req.user.address.toLowerCase() } }
      );

      next();

    } catch (dbError) {
      console.error('Database user context error:', dbError);
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to fetch user context from database',
        code: 'DB_USER_CONTEXT_ERROR'
      });
    }

  } catch (error) {
    console.error('User context middleware error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'User context middleware encountered an error',
      code: 'USER_CONTEXT_MIDDLEWARE_ERROR'
    });
  }
};

/**
 * Role-based access control middleware
 * Checks if user has required role/permission
 */
const requireRole = (requiredRole) => {
  return async (req, res, next) => {
    try {
      if (!req.dbUser) {
        return res.status(401).json({
          error: 'No User Context',
          message: 'Database user context required for role check',
          code: 'NO_DB_USER_CONTEXT'
        });
      }

      const userRole = req.dbUser.role || 'citizen';
      
      // Define role hierarchy
      const roleHierarchy = {
        'super_admin': 100,
        'admin': 80,
        'government_official': 60,
        'verified_citizen': 40,
        'citizen': 20
      };

      const userRoleLevel = roleHierarchy[userRole] || 0;
      const requiredRoleLevel = roleHierarchy[requiredRole] || 0;

      if (userRoleLevel < requiredRoleLevel) {
        return res.status(403).json({
          error: 'Insufficient Permissions',
          message: `Access denied. Required role: ${requiredRole}, Your role: ${userRole}`,
          code: 'INSUFFICIENT_ROLE'
        });
      }

      next();

    } catch (error) {
      console.error('Role check middleware error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Role check middleware encountered an error',
        code: 'ROLE_CHECK_MIDDLEWARE_ERROR'
      });
    }
  };
};

/**
 * Verification status check middleware
 * Ensures user account is verified
 */
const requireVerification = async (req, res, next) => {
  try {
    if (!req.dbUser) {
      return res.status(401).json({
        error: 'No User Context',
        message: 'Database user context required for verification check',
        code: 'NO_DB_USER_CONTEXT'
      });
    }

    if (!req.dbUser.isVerified) {
      return res.status(403).json({
        error: 'Account Not Verified',
        message: 'Your account must be verified to access this resource',
        code: 'ACCOUNT_NOT_VERIFIED',
        data: {
          verificationRequired: true,
          userStatus: 'unverified'
        }
      });
    }

    next();

  } catch (error) {
    console.error('Verification check middleware error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Verification check middleware encountered an error',
      code: 'VERIFICATION_CHECK_MIDDLEWARE_ERROR'
    });
  }
};

/**
 * Rate limiting middleware (simple in-memory implementation)
 * For production, use Redis-based rate limiting
 */
const rateLimitMap = new Map();

const rateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  return (req, res, next) => {
    try {
      const identifier = req.user ? req.user.address : req.ip;
      const now = Date.now();
      const windowStart = now - windowMs;

      // Clean up old entries
      if (rateLimitMap.has(identifier)) {
        const requests = rateLimitMap.get(identifier);
        rateLimitMap.set(identifier, requests.filter(timestamp => timestamp > windowStart));
      }

      // Get current request count
      const currentRequests = rateLimitMap.get(identifier) || [];
      
      if (currentRequests.length >= maxRequests) {
        const oldestRequest = Math.min(...currentRequests);
        const resetTime = new Date(oldestRequest + windowMs);
        
        return res.status(429).json({
          error: 'Rate Limit Exceeded',
          message: `Too many requests. Maximum ${maxRequests} requests per ${windowMs / 1000} seconds.`,
          code: 'RATE_LIMIT_EXCEEDED',
          data: {
            limit: maxRequests,
            windowMs,
            resetTime: resetTime.toISOString()
          }
        });
      }

      // Add current request
      currentRequests.push(now);
      rateLimitMap.set(identifier, currentRequests);

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', maxRequests - currentRequests.length);
      res.setHeader('X-RateLimit-Reset', new Date(now + windowMs).toISOString());

      next();

    } catch (error) {
      console.error('Rate limit middleware error:', error);
      next(); // Continue on error to avoid blocking requests
    }
  };
};

// Clean up rate limit map every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [identifier, requests] of rateLimitMap.entries()) {
    const validRequests = requests.filter(timestamp => now - timestamp < 15 * 60 * 1000);
    if (validRequests.length === 0) {
      rateLimitMap.delete(identifier);
    } else {
      rateLimitMap.set(identifier, validRequests);
    }
  }
}, 5 * 60 * 1000);

module.exports = {
  verifyToken,
  optionalAuth,
  attachUserContext,
  requireRole,
  requireVerification,
  rateLimit
};