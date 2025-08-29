import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';

// Global BigInt serialization fix
(BigInt.prototype as any).toJSON = function() {
  return this.toString();
};

import { config } from './config';
import { log } from './utils/logger';

// Import internal routes
import toolsRoutes from './routes/tools';

// Create Express app for internal services
const internalApp = express();

// Minimal security middleware for internal use
internalApp.use(helmet({
  contentSecurityPolicy: false // Disable CSP for internal API
}));

// CORS configuration - more permissive for internal services
internalApp.use(cors({
  origin: true, // Allow all origins for internal services
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Internal-Service']
}));

// Compression middleware
internalApp.use(compression());

// Body parsing middleware
internalApp.use(express.json({ limit: '50mb' })); // Larger limit for tool responses
internalApp.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging middleware
internalApp.use((req, res, next) => {
  // Generate a unique request ID for tracking
  const requestId = Math.random().toString(36).substring(2, 15);
  req.headers['x-request-id'] = requestId;
  
  const logData: any = {
    requestId,
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

  log.info(`[INTERNAL] ${req.method} ${req.path}`, logData);
  next();
});

// Health check endpoint
internalApp.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'coralbricks-internal-tools-api',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Status endpoint
internalApp.get('/status', (req, res) => {
  res.json({
    service: 'CoralBricks Internal Tools API',
    status: 'running',
    version: '1.0.0',
    purpose: 'Internal tool execution for chat_js and other services',
    configuration: {
      environment: config.nodeEnv,
      port: config.internalPort
    },
    endpoints_available: [
      '/health',
      '/status',
      '/',
      '/tools',
      '/:toolName'
    ],
    security_note: 'This is an internal API - not exposed publicly'
  });
});

// Register tool routes
internalApp.use('/', toolsRoutes);

// 404 handler
internalApp.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Internal API endpoint not found',
    code: 'ENDPOINT_NOT_FOUND',
    path: req.originalUrl,
    available_endpoints: ['/health', '/status', '/', '/tools', '/:toolName']
  });
});

// Global error handler
internalApp.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  log.error(`[INTERNAL] Global error handler: ${errorMessage}`, { 
    error: String(error), 
    path: req.path, 
    method: req.method 
  });
  
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
    service: 'internal-tools-api'
  });
});

// Start internal server
export async function startInternalServer() {
  try {
    // Start listening on internal port
    const server = internalApp.listen(config.internalPort, '127.0.0.1', () => {
      log.info(`CoralBricks Internal Tools API started on port ${config.internalPort}`);
      console.log(`🔧 CoralBricks Internal Tools API started on port ${config.internalPort}`);
      console.log(`📖 Internal API Documentation: http://localhost:${config.internalPort}/`);
      console.log(`🏥 Internal Health Check: http://localhost:${config.internalPort}/health`);
      console.log(`🛠️  Available Tools: http://localhost:${config.internalPort}/tools`);
      console.log(`🔒 Note: Internal API bound to localhost only`);
    });

    return server;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    log.error(`Failed to start internal server: ${errorMessage}`, { error: String(error) });
    console.error(`❌ Failed to start internal server: ${errorMessage}`);
    throw error;
  }
}

export { internalApp }; 