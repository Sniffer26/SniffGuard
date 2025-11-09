const express = require('express')
const http = require('http')
const socketIo = require('socket.io')
const cors = require('cors')
const helmet = require('helmet')
const compression = require('compression')
const rateLimit = require('express-rate-limit')
const path = require('path')
const mongoSanitize = require('express-mongo-sanitize')
require('dotenv').config()

// Import database connection
const connectDB = require('./src/config/database')

// Import routes
const authRoutes = require('./src/routes/auth')

// Import middleware
const { authenticateToken } = require('./src/middleware/auth')

// Import socket handler
const { socketHandler } = require('./src/services/socketService')

const app = express()
const server = http.createServer(app)

// Socket.io setup with enhanced configuration
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket'], // More secure, websocket only
  pingTimeout: 60000,
  pingInterval: 25000,
  maxHttpBufferSize: 1e6, // 1MB
  allowEIO3: false, // Disable Engine.IO v3 for security
  serveClient: false, // Don't serve client files
  cookie: false // Don't use cookies for session
})

// Connect to MongoDB
connectDB()

// Trust proxy for rate limiting
app.set('trust proxy', 1)

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}))

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      process.env.FRONTEND_URL
    ].filter(Boolean)
    
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true)
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-requested-with'],
  optionsSuccessStatus: 200
}

app.use(cors(corsOptions))

// Compression
app.use(compression())

// Body parsing middleware with limits
app.use(express.json({ 
  limit: '10mb',
  strict: true
}))
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb',
  parameterLimit: 100
}))

// Sanitize data against NoSQL injection
app.use(mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    console.warn(`Sanitized potentially malicious input: ${key}`)
  }
}))

// Request logging middleware (development only)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`)
    next()
  })
}

// Rate limiting
const createRateLimit = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      error: message,
      code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      // Skip rate limiting in development for easier testing
      return process.env.NODE_ENV === 'development'
    }
  })
}

// General API rate limiting
app.use('/api/', createRateLimit(
  15 * 60 * 1000, // 15 minutes
  100, // requests per window
  'Too many requests from this IP, please try again later'
))

// Health check endpoint (before rate limiting)
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    memory: process.memoryUsage()
  })
})

// API Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'SniffGuard API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  })
})

// API Routes
app.use('/api/auth', authRoutes)

// Protected routes (add when ready)
// app.use('/api/messages', authenticateToken, messageRoutes)
// app.use('/api/users', authenticateToken, userRoutes)
// app.use('/api/chats', authenticateToken, chatRoutes)

// Socket.io authentication middleware
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth.token
    
    if (!token) {
      return next(new Error('Authentication error: No token provided'))
    }
    
    const jwt = require('jsonwebtoken')
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    
    socket.userId = decoded.userId
    socket.username = decoded.username
    socket.email = decoded.email
    
    next()
  } catch (err) {
    console.error('Socket authentication error:', err.message)
    next(new Error('Authentication error: Invalid token'))
  }
})

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`🔗 User ${socket.username} connected (ID: ${socket.id})`)
  
  // Join user to their personal room
  socket.join(`user_${socket.userId}`)
  
  // Handle socket events
  socketHandler(io, socket)
  
  // Handle disconnection
  socket.on('disconnect', (reason) => {
    console.log(`👋 User ${socket.username} disconnected: ${reason}`)
  })
  
  // Handle socket errors
  socket.on('error', (error) => {
    console.error(`🚨 Socket error for user ${socket.username}:`, error)
  })
})

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')))
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build/index.html'))
  })
}

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('🚨 Global error handler:', err)
  
  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      message: err.message,
      code: 'VALIDATION_ERROR'
    })
  }
  
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Invalid token',
      code: 'INVALID_TOKEN'
    })
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token has expired',
      code: 'TOKEN_EXPIRED'
    })
  }
  
  if (err.name === 'MongoError' || err.name === 'MongooseError') {
    return res.status(500).json({
      error: 'Database error',
      message: process.env.NODE_ENV === 'development' ? err.message : 'Database operation failed',
      code: 'DATABASE_ERROR'
    })
  }
  
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      error: 'CORS error',
      message: 'Origin not allowed',
      code: 'CORS_ERROR'
    })
  }
  
  // Generic error response
  const statusCode = err.statusCode || err.status || 500
  res.status(statusCode).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    code: 'INTERNAL_ERROR',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  })
})

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'API endpoint not found',
    path: req.originalUrl,
    method: req.method,
    code: 'ENDPOINT_NOT_FOUND'
  })
})

// Generic 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method,
    code: 'ROUTE_NOT_FOUND'
  })
})

// Start server
const PORT = process.env.PORT || 5000;
const HOST = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';

server.listen(PORT, HOST, () => {
  console.log('🚀 ========================================');
  console.log(`🛡️  SniffGuard Backend Server Started`);
  console.log('🚀 ========================================');
  console.log(`📡 Server running on ${HOST}:${PORT}`);
  console.log(`🌐 Local URL: http://${HOST}:${PORT}`);
  console.log(`🔗 Health check: http://${HOST}:${PORT}/health`);
  console.log(`🔒 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📱 Socket.io server ready for connections`);
  console.log(`🗄️  Database: ${process.env.MONGODB_URI ? 'Connected' : 'Not configured'}`);
  console.log('🚀 ========================================');
});

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`)
  
  server.close(() => {
    console.log('✅ HTTP server closed')
    
    // Close database connection
    const mongoose = require('mongoose')
    mongoose.connection.close()
      .then(() => {
        console.log('✅ Database connection closed')
        process.exit(0)
      })
      .catch((err) => {
        console.error('❌ Error closing database:', err)
        process.exit(1)
      })
  })
  
  // Force close after 10 seconds
  setTimeout(() => {
    console.log('⚠️  Forcing shutdown after timeout')
    process.exit(1)
  }, 10000)
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('🚨 Uncaught Exception:', err)
  gracefulShutdown('uncaughtException')
})

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason)
  gracefulShutdown('unhandledRejection')
})
