const jwt = require('jsonwebtoken');
const User = require('../models/user');

// Middleware to authenticate JWT tokens
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
      return res.status(401).json({
        error: 'Access token required',
        code: 'TOKEN_MISSING'
      });
    }
    
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user still exists
    const user = await User.findById(decoded.userId).select('+security.loginAttempts +security.lockUntil');
    
    if (!user) {
      return res.status(401).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }
    
    // Check if account is locked
    if (user.isLocked) {
      return res.status(423).json({
        error: 'Account is temporarily locked due to too many failed login attempts',
        code: 'ACCOUNT_LOCKED',
        lockUntil: user.security.lockUntil
      });
    }
    
    // Add user info to request
    req.user = {
      id: user._id,
      username: user.username,
      email: user.email,
      displayName: user.displayName,
      avatar: user.avatar,
      publicKey: user.publicKey,
      isVerified: user.isVerified,
      preferences: user.preferences
    };
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token has expired',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid token',
        code: 'TOKEN_INVALID'
      });
    }
    
    console.error('Authentication error:', error);
    res.status(500).json({
      error: 'Authentication error',
      code: 'AUTH_ERROR'
    });
  }
};

// Middleware to check if user is verified (optional)
const requireVerification = (req, res, next) => {
  if (!req.user.isVerified) {
    return res.status(403).json({
      error: 'Email verification required',
      code: 'VERIFICATION_REQUIRED'
    });
  }
  next();
};

// Middleware to refresh user data (for long-running connections)
const refreshUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(401).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }
    
    // Update user info in request
    req.user = {
      id: user._id,
      username: user.username,
      email: user.email,
      displayName: user.displayName,
      avatar: user.avatar,
      publicKey: user.publicKey,
      isVerified: user.isVerified,
      preferences: user.preferences
    };
    
    next();
  } catch (error) {
    console.error('User refresh error:', error);
    res.status(500).json({
      error: 'Failed to refresh user data',
      code: 'USER_REFRESH_ERROR'
    });
  }
};

// Generate JWT token
const generateToken = (user, expiresIn = '24h') => {
  const payload = {
    userId: user._id,
    username: user.username,
    email: user.email
  };
  
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: expiresIn,
    issuer: 'sniffguard',
    audience: 'sniffguard-users'
  });
};

// Generate refresh token (longer expiration)
const generateRefreshToken = (user) => {
  const payload = {
    userId: user._id,
    username: user.username,
    type: 'refresh'
  };
  
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, {
    expiresIn: '7d',
    issuer: 'sniffguard',
    audience: 'sniffguard-users'
  });
};

// Verify refresh token
const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
};

// Rate limiting for authentication endpoints
const createAuthLimiter = (windowMs, max, message) => {
  const rateLimit = require('express-rate-limit');
  
  return rateLimit({
    windowMs: windowMs,
    max: max,
    message: {
      error: message,
      code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      // Skip rate limiting in development
      return process.env.NODE_ENV === 'development';
    }
  });
};

// Specific rate limiters
const loginLimiter = createAuthLimiter(
  15 * 60 * 1000, // 15 minutes
  5, // 5 attempts per window
  'Too many login attempts, please try again later'
);

const registerLimiter = createAuthLimiter(
  60 * 60 * 1000, // 1 hour
  3, // 3 registrations per hour per IP
  'Too many registration attempts, please try again later'
);

const passwordResetLimiter = createAuthLimiter(
  60 * 60 * 1000, // 1 hour
  3, // 3 password reset attempts per hour
  'Too many password reset attempts, please try again later'
);

// Extract user ID from token (without full authentication)
const extractUserId = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.userId = decoded.userId;
    }
    
    next();
  } catch (error) {
    // Continue without user ID if token is invalid
    next();
  }
};

module.exports = {
  authenticateToken,
  requireVerification,
  refreshUser,
  generateToken,
  generateRefreshToken,
  verifyRefreshToken,
  loginLimiter,
  registerLimiter,
  passwordResetLimiter,
  extractUserId
};