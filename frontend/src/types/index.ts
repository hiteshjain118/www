// Frontend-specific types

// User and authentication types
export interface AuthUser {
  id: string;
  email: string;
  role: string;
  cbid: string;
}

// QuickBooks types
export interface QBOCompany {
  qbo_profile_id: string; // Maps to the specific QuickBooks company connection
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