import dotenv from 'dotenv';
import { Config } from '../types';

// Load environment variables
dotenv.config();

export const config: Config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-key-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  supabaseRedirectUrl: process.env.SUPABASE_REDIRECT_URL || 'http://localhost:3002',
  qboClientId: process.env.QBO_CLIENT_ID || '',
  qboClientSecret: process.env.QBO_CLIENT_SECRET || '',
  qboAuthUrl: process.env.QBO_AUTH_URL || 'https://appcenter.intuit.com/connect/oauth2',
  qboRedirectUri: process.env.QBO_REDIRECT_URI || 'http://localhost:3000/auth/quickbooks/callback',
  databaseUrl: process.env.DATABASE_URL,
  logLevel: process.env.LOG_LEVEL || 'info',
  logFile: process.env.LOG_FILE || 'logs/auth-service.log',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:3002,http://localhost:3004',
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || (process.env.NODE_ENV === 'development' ? '500' : '100'), 10)
};

// Validation function
export function validateConfig(): string[] {
  const errors: string[] = [];
  
  // Only require these in production
  if (config.nodeEnv === 'production') {
    if (!config.supabaseUrl) {
      errors.push('SUPABASE_URL is required in production');
    }
    
    if (!config.supabaseAnonKey) {
      errors.push('SUPABASE_ANON_KEY is required in production');
    }
    
    if (!config.qboClientId) {
      errors.push('QBO_CLIENT_ID is required in production');
    }
    
    if (!config.qboClientSecret) {
      errors.push('QBO_CLIENT_SECRET is required in production');
    }
  } else {
    // In development, just warn about missing values
    if (!config.supabaseUrl) {
      console.warn('Warning: SUPABASE_URL not set. Some features may not work.');
    }
    
    if (!config.supabaseAnonKey) {
      console.warn('Warning: SUPABASE_ANON_KEY not set. Some features may not work.');
    }
    
    if (!config.qboClientId) {
      console.warn('Warning: QBO_CLIENT_ID not set. Some features may not work.');
    }
    
    if (!config.qboClientSecret) {
      console.warn('Warning: QBO_CLIENT_SECRET not set. Some features may not work.');
    }
  }
  
  if (!config.jwtSecret || config.jwtSecret === 'dev-secret-key-change-in-production') {
    console.warn('Warning: Using default JWT secret. Change JWT_SECRET in production.');
  }
  
  return errors;
}

// Check if running in production
export const isProduction = config.nodeEnv === 'production';
export const isDevelopment = config.nodeEnv === 'development'; 