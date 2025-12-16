require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');
const { logger, errorLogger } = require('./middleware/logger');

// Import routes
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const customerRoutes = require('./routes/customers');
const orderRoutes = require('./routes/orders');
const shipmentRoutes = require('./routes/shipments');
const branchRoutes = require('./routes/branches');
const userRoutes = require('./routes/users');
const roleRoutes = require('./routes/roles');
const websiteRoutes = require('./routes/website');
const hubRoutes = require('./routes/hubs');
const adminHubRoutes = require('./routes/adminHubs');
const settingsRoutes = require('./routes/settings');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Connect to database
connectDB();

// Security middleware - configure helmet to allow CORS
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'https://nextglobalexpress.com',
      'https://www.nextglobalexpress.com',
      'https://ngebase.vercel.app',
      'http://localhost:3000',
      'http://localhost:3001',
      ...(process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : [])
    ];
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  preflightContinue: false,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

// Body parser middleware (must be before logger to parse body)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request/Response Logger (after body parser to log parsed body)
app.use(logger);

// Serve static files (uploaded images)
app.use('/public', express.static(path.join(__dirname, 'public')));

// General API rate limiting (skip OPTIONS requests for CORS preflight)
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  skip: (req) => req.method === 'OPTIONS', // Skip rate limiting for preflight requests
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later'
    }
  }
});
app.use('/api', apiLimiter);

// File upload rate limiting
const uploadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 uploads per minute
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many upload requests, please try again later'
    }
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/shipments', shipmentRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/website', websiteRoutes);
app.use('/api/hubs', hubRoutes);
app.use('/api/admin/hubs', adminHubRoutes);
app.use('/api/admin/settings', settingsRoutes);

// Root endpoint (for health checks)
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'NGEBASE API Server is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint not found'
    }
  });
});

// Error logger (before error handler)
app.use(errorLogger);

// Error handler middleware (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;

