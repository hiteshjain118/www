import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

// Global BigInt serialization fix
(BigInt.prototype as any).toJSON = function() {
  return this.toString();
};

import { config, validateConfig } from './config';
import { enhancedLogger as log } from './utils/logger';
import { AuthMiddleware } from './middleware/auth';
// import { startInternalServer } from './internal-server'; // No longer needed - consolidated into main server

// Import routes
import coralbricksAuthRoutes from './routes/coralbricksAuth';
import quickbooksAuthRoutes from './routes/quickbooksAuth';
import coralbricksProfileRoutes from './routes/coralbricksProfile';
import quickbooksProfileRoutes from './routes/quickbooksProfile';
import threadsRoutes from './routes/threads';
import pipelinesRoutes from './routes/pipelines';
// Import internal tools routes (previously on separate server)
import toolsRoutes from './routes/tools';
import internToolsRoutes from './routes/internTools';

// Create Express app
const app = express();

// Initialize middleware
const authMiddleware = new AuthMiddleware();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // In development, allow localhost on any port
    if (config.nodeEnv === 'development' && origin.startsWith('http://localhost:')) {
      return callback(null, true);
    }
    
    // Parse multiple origins from config
    const allowedOrigins = config.corsOrigin.split(',').map(o => o.trim());
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      log.warn(`CORS rejected origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Compression middleware
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMaxRequests,
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const logData: any = {
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  };

  // Include request body for POST/PUT requests to show parameters
  if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body && Object.keys(req.body).length > 0) {
    logData.body = req.body;
  }

  log.info(`${req.method} ${req.path}`, logData);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'coralbricks-auth-service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Status endpoint
app.get('/status', (req, res) => {
  res.json({
    service: 'CoralBricks and QuickBooks Authentication Service',
    status: 'running',
    version: '1.0.0',
    configuration: {
      quickbooks_configured: Boolean(config.qboClientId && config.qboClientSecret),
      supabase_configured: Boolean(config.supabaseUrl && config.supabaseAnonKey),
      authentication_method: 'cbid-based (no sessions)',
      environment: config.nodeEnv
    },
    endpoints_available: [
      '/health',
      '/status',
      '/login',
      '/login/signup',
      '/profile/<cbid>',
      '/quickbooks/login?cbid=<id>',
      '/quickbooks/callback?cbid=<id>&code=<code>&realmId=<id>',
      '/quickbooks/profile/disconnect/<realm_id>?cbid=<id>',
      '/quickbooks/profile/companies?cbid=<id>',
      '/quickbooks/profile/status/<realm_id>?cbid=<id>',
      '/quickbooks/profile/user?cbid=<id>',
      '/threads',
      '/thread/<cbid>',
      '/thread/create'
    ],
    authentication_note: 'All protected endpoints require cbid parameter in URL'
  });
});

// API information endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'CoralBricks and QuickBooks Authentication API',
    version: '1.0.0',
    authentication: 'Uses cbid parameter in URL for user identification',
    endpoints: {
      authentication: {
        'POST /login': 'Login to CoralBricks with email/password',
        'POST /login/signup': 'Sign up new user with email/password/firstName/lastName (all required)',
        'GET /profile/<cbid>': 'Get user profile information'
      },
      quickbooks: {
        'GET /quickbooks/login?cbid=<id>': 'Initiate QuickBooks OAuth flow',
        'GET /quickbooks/callback?cbid=<id>&code=<code>&realmId=<id>': 'Handle QuickBooks OAuth callback',
        'DELETE /quickbooks/profile/disconnect/<realm_id>?cbid=<id>': 'Disconnect QuickBooks company',
        'GET /quickbooks/profile/companies?cbid=<id>': 'Get list of connected QuickBooks companies',
        'GET /quickbooks/profile/status/<realm_id>?cbid=<id>': 'Check QuickBooks company connection status',
        'GET /quickbooks/profile/user?cbid=<id>': 'Get QuickBooks user information'
      },
      internal_tools: {
        'GET /tools': 'Get available tool descriptions for LLM integration',
        'POST /tools/:toolName': 'Execute QuickBooks tools',
        'GET /intern/message/model_events?messageId=<id>': 'Get model events for debugging'
      }
    },
    usage_example: 'All endpoints require cbid parameter: ?cbid=123'
  });
});

// Register route modules
app.use('/login', coralbricksAuthRoutes);
app.use('/quickbooks', quickbooksAuthRoutes);
app.use('/profile', coralbricksProfileRoutes);
app.use('/quickbooks/profile', quickbooksProfileRoutes);
app.use('/', threadsRoutes);
app.use('/', pipelinesRoutes);

// Register internal tools routes (consolidated from internal server)
app.use('/', toolsRoutes);  // Tools router already defines '/tools' path
app.use('/intern', internToolsRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    code: 'ENDPOINT_NOT_FOUND',
    path: req.originalUrl
  });
});

// Global error handler
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  log.error(`Global error handler: ${errorMessage}`, { 
    error: String(error), 
    path: req.path, 
    method: req.method 
  });
  
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    code: 'INTERNAL_ERROR'
  });
});

// Start server
async function startServer() {
  try {
    // Validate configuration
    const configErrors = validateConfig();
    if (configErrors.length > 0) {
      log.error('Configuration validation failed:', { errors: configErrors });
      console.error('Configuration errors:', configErrors);
      process.exit(1);
    }

    // Check if required environment variables are set
    const requiredEnvVars = ['QBO_CLIENT_ID', 'QBO_CLIENT_SECRET', 'SUPABASE_URL', 'SUPABASE_ANON_KEY'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      log.warn(`Missing environment variables: ${missingVars.join(', ')}`);
      log.warn(`Warning: Missing environment variables: ${missingVars.join(', ')}`);
      log.warn('Please set these variables before running the application.');
    }

    if (!config.jwtSecret || config.jwtSecret === 'dev-secret-key-change-in-production') {
      log.warn('Using default JWT secret. Change JWT_SECRET in production.');
      log.warn('Warning: Using default JWT secret. Change JWT_SECRET in production.');
    }

    // Start main API server (now includes internal tools)
    const mainServer = app.listen(config.port, () => {
      log.info(`🚀 CoralBricks Authentication Service started on port ${config.port}`);
      log.info(`📖 API Documentation: http://localhost:${config.port}/`);
      log.info(`🏥 Health Check: http://localhost:${config.port}/health`);
      log.info(`📊 Status: http://localhost:${config.port}/status`);
      log.info(`🛠️  Internal Tools API: http://localhost:${config.port}/tools`);
      log.info(`🔧 Internal Debug API: http://localhost:${config.port}/intern`);
      log.info(`🔐 Note: All endpoints use cbid parameter for authentication`);
      
      if (config.nodeEnv === 'development') {
        log.info(`🌍 Environment: ${config.nodeEnv}`);
        log.info(`📝 Logs: ${config.logFile}`);
      }
    });

    // Store server reference for graceful shutdown
    (global as any).mainServer = mainServer;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    log.error(`Failed to start server: ${errorMessage}`, { error: String(error) });
    log.error(`❌ Failed to start server: ${errorMessage}`);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  log.info('SIGTERM received, shutting down gracefully');
  log.info('🛑 SIGTERM received, shutting down gracefully');
  
  // Close both servers gracefully
  if ((global as any).mainServer) {
    (global as any).mainServer.close(() => {
      log.info('Main server closed');
    });
  }
  if ((global as any).internalServer) {
    (global as any).internalServer.close(() => {
      log.info('Internal server closed');
    });
  }
  
  process.exit(0);
});

process.on('SIGINT', () => {
  log.info('SIGINT received, shutting down gracefully');
  log.info('🛑 SIGINT received, shutting down gracefully');
  
  // Close both servers gracefully
  if ((global as any).mainServer) {
    (global as any).mainServer.close(() => {
      log.info('Main server closed');
    });
  }
  if ((global as any).internalServer) {
    (global as any).internalServer.close(() => {
      log.info('Internal server closed');
    });
  }
  
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  log.error(`Uncaught Exception: ${error.message}`, { error: String(error) });
  log.error(`💥 Uncaught Exception: ${error.message}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`, { reason: String(reason) });
  log.error(`💥 Unhandled Rejection at: ${promise}, reason: ${reason}`);
  process.exit(1);
});

// Start the server
startServer(); 