// Frontend configuration
export interface Config {
  backendApiUrl: string;
  environment: string;
}

// Load environment variables or use defaults
export const config: Config = {
  backendApiUrl: (import.meta as any).env?.VITE_BACKEND_API_URL || 'http://localhost:3001',
  environment: (import.meta as any).env?.VITE_NODE_ENV || 'development',
};

export const isProduction = config.environment === 'production';
export const isDevelopment = config.environment === 'development'; 