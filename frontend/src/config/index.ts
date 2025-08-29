// Frontend configuration
export interface Config {
  backendApiUrl: string;
  chatWebSocketUrl: string;
  environment: string;
}

// Load environment variables or use defaults
export const config: Config = {
  backendApiUrl: (import.meta as any).env?.VITE_BACKEND_API_URL || 'http://localhost:3000',
  chatWebSocketUrl: (import.meta as any).env?.VITE_CHAT_WEBSOCKET_URL || 'ws://localhost:3004',
  environment: (import.meta as any).env?.VITE_NODE_ENV || 'development',
};

export const isProduction = config.environment === 'production';
export const isDevelopment = config.environment === 'development'; 