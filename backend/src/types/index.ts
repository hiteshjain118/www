import { Request } from 'express';

// User and authentication types
export interface User {
  id: string;
  email: string;
  role: string;
  cbid: bigint;
}

// Translated from builder/builder_package/core/cb_user.py
export enum RemotePlatform {
  QBO = "qbo"
}

export interface ViewerContext {
  cbid: bigint;
}

export interface CBUser {
  id: bigint;
  time_zone?: string;
  created_at: Date;
  auth_user_id: string;
  viewer_context: ViewerContext;
  cbid: bigint;
  
  get_connected_remote_user(platform: RemotePlatform): RemoteProfile;
  get_timezone(): string;
  get_full_name(): string;
  get_email(): string;
  get_phone(): string;
}

export interface RemoteProfile {
  viewer_context: ViewerContext;
  platform: RemotePlatform;
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
  realm_id: string;
  company_name?: string;
  connected: boolean;
  last_connected?: string;
}

export interface QBOUserInfo {
  realm_id: string;
  connected: boolean;
  has_valid_token: boolean;
  user_id: string;
  cbid: bigint;
}

export interface QBOAuthResponse {
  success: boolean;
  auth_url?: string;
  message?: string;
  user_id?: string;
  cbid?: bigint;
  error?: string;
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
  user: User;
}

// Environment configuration
export interface Config {
  port: number;
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
  qboRedirectUri: string;
  databaseUrl?: string;
  logLevel: string;
  logFile: string;
  corsOrigin: string;
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
} 