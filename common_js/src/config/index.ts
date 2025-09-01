import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export interface Config {
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceRoleKey: string;
  nodeEnv: string;
  logLevel: string;
  logFile: string;
}

export const config: Config = {
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  nodeEnv: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',
  logFile: process.env.LOG_FILE || 'logs/common.log'
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
    
    if (!config.supabaseServiceRoleKey) {
      errors.push('SUPABASE_SERVICE_ROLE_KEY is required in production');
    }
  } else {
    // In development, just warn about missing values
    if (!config.supabaseUrl) {
      console.warn('Warning: SUPABASE_URL not set. Some features may not work.');
    }
    
    if (!config.supabaseAnonKey) {
      console.warn('Warning: SUPABASE_ANON_KEY not set. Some features may not work.');
    }
    
    if (!config.supabaseServiceRoleKey) {
      console.warn('Warning: SUPABASE_SERVICE_ROLE_KEY not set. Some features may not work.');
    }
  }
  
  return errors;
}

// Check if running in production
export const isProduction = config.nodeEnv === 'production';
export const isDevelopment = config.nodeEnv === 'development'; 