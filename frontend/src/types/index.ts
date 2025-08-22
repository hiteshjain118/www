// Frontend-specific types

// User and authentication types
export interface User {
  id: string;
  email: string;
  role: string;
  cbid: string;
}

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  cbid: string;
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
  cbid: string;
}

export interface QBOAuthResponse {
  success: boolean;
  auth_url?: string;
  message?: string;
  user_id?: string;
  cbid?: string;
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

// User Profile types
export interface UserProfile {
  id: string;
  time_zone?: string;
  created_at: string;
  auth_user_id: string;
  cbid: string;
  get_timezone(): string;
  get_full_name(): string;
  get_email(): string;
  get_phone(): string;
} 