import { Request } from 'express';
import { CBUser, RemoteProfile } from './profiles';

// Re-export profile types
export { CBUser, RemoteProfile };

// HTTP Connection interface - translated from Python IHTTPConnection
export interface IRemoteHTTPConnection {
  authenticate(): Promise<string>;
  get_cbid(): bigint;
  get_platform_name(): string;
  get_remote_user(): RemoteProfile;

  get_headers(): Promise<Record<string, string>>;
}

// HTTP Retriever interface
export interface IRetriever {
  retrieve(): Promise<any>;
}

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  cbid: string; // Changed from bigint to string since backend sends it as string
}

export interface SupabaseAuthResponse {
  access_token: string;
  user: {
    id: string;
    email: string;
  };
}

export interface SupabaseTokenData {
  token: string;
  user_id: string;
  email: string;
  role: string;
  cbid: bigint;
}

// QuickBooks types
export interface QBOCompany {
  qbo_profile_id: bigint;
  realm_id: string;
  company_name?: string;
  last_connected: string;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  code?: string;
}

export interface ErrorResponse {
  success: false;
  error: string;
  code: string;
  details?: any;
}

// Request types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AuthRequest {
  cbid: bigint;
}

// Middleware types
export interface AuthenticatedRequest extends Request {
  user: AuthUser;
}

// Environment configuration
export interface Config {
  port: number;
  internalPort: number;
  nodeEnv: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceRoleKey: string;
  supabaseRedirectUrl: string;
  qboClientId: string;
  qboClientSecret: string;
  qboAuthUrl: string;
  qboTokenUrl: string;
  qboRedirectUri: string;
  frontendUrl: string;
  databaseUrl?: string;
  logLevel: string;
  logFile: string;
  corsOrigin: string;
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
} 