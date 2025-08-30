import axios from 'axios';
import { config } from '../config';
import { enhancedLogger as log } from '../utils/logger';
import { AuthUser, SupabaseAuthResponse, SupabaseTokenData, ApiResponse } from '../types';
import { ProfileService } from 'coralbricks-common';
import { createClient } from '@supabase/supabase-js';

export class CoralBricksAuthService {
  private supabaseUrl: string;
  private supabaseAnonKey: string;
  private supabaseServiceKey: string;
  private static profileService: ProfileService | null = null;

  constructor() {
    this.supabaseUrl = config.supabaseUrl;
    this.supabaseAnonKey = config.supabaseAnonKey;
    this.supabaseServiceKey = config.supabaseServiceRoleKey;
    
    // Use singleton pattern for ProfileService
    if (!CoralBricksAuthService.profileService) {
      CoralBricksAuthService.profileService = ProfileService.getInstance();
    }
  }

  private getProfileService(): ProfileService {
    if (!CoralBricksAuthService.profileService) {
      throw new Error('ProfileService not initialized');
    }
    return CoralBricksAuthService.profileService;
  }

  /**
   * Cleanup method to disconnect Prisma client
   */
  async disconnect(): Promise<void> {
    // ProfileService doesn't have a disconnect method, so we'll skip this for now
    // In a real implementation, you might want to disconnect the underlying Prisma client
  }

  /**
   * Get user information from the profiles table using cbid
   * This is a mock implementation - in production, you'd connect to your database
   */
  async getUserFromProfiles(cbid: bigint): Promise<ApiResponse<AuthUser>> {
    try {
      log.info(`Fetching user profile for cbid: ${cbid}`);
      
      // TODO: Replace with actual database query
      // For now, return a mock user
      // Note: cbid is string in AuthUser interface
      const mockUser: AuthUser = {
        id: cbid.toString(), // cbid as string for AuthUser
        email: `user-${cbid}@example.com`,
        role: 'authenticated',
        cbid: cbid.toString()
      };

      log.info(`User profile found for cbid: ${cbid}`);
      return {
        success: true,
        data: mockUser
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      log.error(`Error fetching user from profiles table: ${errorMessage}`, { cbid, error: String(error) });
      
      return {
        success: false,
        error: `Error fetching user from profiles table: ${errorMessage}`,
        code: 'USER_FETCH_ERROR'
      };
    }
  }

  /**
   * Get user profile by Supabase user_id from the profiles table
   */
  async getUserProfileByUserId(userId: string): Promise<ApiResponse<{ cbid: bigint }>> {
    log.info(`Fetching user profile for Supabase user_id: ${userId}`);
    
          // Use ProfileService to query the profiles table
      const profile = await this.getProfileService().getUserProfileBySupabaseUserId(userId);

    log.info(`User profile found for user_id: ${userId}, cbid: ${profile.cbid}`);
    return {
      success: true,
      data: profile
    };
  }

  /**
   * Get authentication token from Supabase using email and password
   */
  async getSupabaseToken(email: string, password: string): Promise<ApiResponse<SupabaseTokenData>> {
    
    try {
      log.info(`Attempting Supabase authentication for email: ${email}`);
      
      // Use Supabase client for authentication instead of direct API calls
      const supabase = createClient(this.supabaseUrl, this.supabaseServiceKey);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        log.error(`Supabase authentication failed: ${error.message}`);
        return {
          success: false,
          error: error.message,
          code: 'SUPABASE_AUTH_ERROR'
        };
      }
      
      if (data.user && data.session) {
        const token = data.session.access_token;
        const userInfo = data.user;
        
        // Get user profile to fetch cbid
        const profileResult = await this.getUserProfileByUserId(userInfo.id);
        
        if (profileResult.success && profileResult.data) {
          const tokenData: SupabaseTokenData = {
            token: token,
            user_id: userInfo.id,
            email: userInfo.email || email,
            role: userInfo.role || 'authenticated',
            cbid: profileResult.data.cbid
          };
          
          log.info(`Supabase authentication successful for email: ${email}, cbid: ${profileResult.data.cbid}`);
          
          return {
            success: true,
            data: tokenData
          };
        } else {
          log.error(`Profile not found for user: ${userInfo.id}`);
          return {
            success: false,
            error: 'User authenticated but profile not found',
            code: 'PROFILE_NOT_FOUND',
            data: {
              token: token,
              user_id: userInfo.id,
              email: userInfo.email || email,
              role: userInfo.role || 'authenticated',
              cbid: BigInt(0) // Use BigInt(0) as placeholder when profile not found
            }
          };
        }
      } else {
        log.error('Supabase authentication returned no user or session');
        return {
          success: false,
          error: 'Authentication failed - no user data returned',
          code: 'NO_USER_DATA'
        };
      }
      
    } catch (error: any) {
      log.error('Supabase authentication error:', error);
      return {
        success: false,
        error: error.message || 'Authentication failed',
        code: 'SUPABASE_ERROR'
      };
    }
  }

  /**
   * Create a new user in Supabase
   */
  async createSupabaseUser(email: string, password: string, firstName: string, lastName: string): Promise<ApiResponse<SupabaseTokenData>> {
    try {
      if (!this.supabaseUrl || !this.supabaseAnonKey) {
        return {
          success: false,
          error: 'Supabase configuration missing',
          code: 'CONFIG_ERROR'
        };
      }

      const signupUrl = `${this.supabaseUrl}/auth/v1/signup`;
      
      const headers = {
        'Content-Type': 'application/json',
        'apikey': this.supabaseAnonKey,
        'Authorization': `Bearer ${this.supabaseAnonKey}`
      };
      
      const payload = {
        email,
        password,
        data: { 
          first_name: firstName,
          last_name: lastName,
          full_name: `${firstName} ${lastName}`.trim()
        }
      };
      
      log.info(`Attempting Supabase signup for email: ${email}`);
      
      const response = await axios.post<any>(signupUrl, payload, { 
        headers, 
        timeout: 30000 
      });
      
      if (response.status === 200) {
        const data = response.data;
        
        // Log the full response for debugging
        log.info(`Supabase signup response: ${JSON.stringify(data)}`);
        
        // Supabase signup response structure - user data is directly in the response
        if (data.id && data.email) {
          log.info(`Successfully created user: ${data.email}`);
          
          // create profile in the profiles table with the user id
          await this.getProfileService().upsertProfile({
            authUserId: data.id,
            email: data.email,
            firstName: firstName,
            lastName: lastName,
            timeZone: 'America/New_York'
          });
          
          // Check if email verification is required
          if (data.confirmation_sent_at && !data.email_confirmed_at) {
            // Email verification required - get profile for cbid
            const profileResult = await this.getUserProfileByUserId(data.id);
            
            if (profileResult.success && profileResult.data) {
              return {
                success: true,
                data: {
                  user_id: data.id,
                  email: data.email,
                  role: 'pending_verification',
                  token: '', // No token until email is verified
                  cbid: profileResult.data.cbid
                } as SupabaseTokenData
              };
            } else {
              return {
                success: false,
                error: 'User created but profile not found',
                code: 'PROFILE_NOT_FOUND'
              };
            }
          } else {
            // User is immediately authenticated - get profile for cbid
            const profileResult = await this.getUserProfileByUserId(data.id);
            
            if (profileResult.success && profileResult.data) {
              return {
                success: true,
                data: {
                  user_id: data.id,
                  email: data.email,
                  role: 'authenticated',
                  token: '', // No token in signup response
                  cbid: profileResult.data.cbid
                } as SupabaseTokenData
              };
            } else {
              return {
                success: false,
                error: 'User created but profile not found',
                code: 'PROFILE_NOT_FOUND'
              };
            }
          }
        } else {
          return {
            success: false,
            error: 'User created but missing required user information',
            code: 'INVALID_USER_DATA'
          };
        }
      } else {
        try {
          const errorData = response.data as any;
          const errorMsg = errorData?.error_description || errorData?.error || 'Unknown error';
          return {
            success: false,
            error: `Signup failed: ${errorMsg}`,
            code: 'SIGNUP_FAILED'
          };
        } catch {
          return {
            success: false,
            error: `Signup failed: ${response.status}`,
            code: 'SIGNUP_FAILED'
          };
        }
      }
      
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNREFUSED') {
          return {
            success: false,
            error: 'Connection Error: Could not connect to Supabase',
            code: 'CONNECTION_ERROR'
          };
        } else if (error.code === 'ECONNABORTED') {
          return {
            success: false,
            error: 'Timeout Error: Signup request took too long',
            code: 'TIMEOUT_ERROR'
          };
        } else {
          return {
            success: false,
            error: `Request Error: ${error.message}`,
            code: 'REQUEST_ERROR'
          };
        }
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        error: `Unexpected Error: ${errorMessage}`,
        code: 'UNEXPECTED_ERROR'
      };
    }
  }

  /**
   * Validate cbid parameter from request
   */
  validateCbid(cbid: string | undefined): ApiResponse<bigint> {
    if (!cbid) {
      return {
        success: false,
        error: 'cbid parameter required',
        code: 'CBID_REQUIRED'
      };
    }

    // Try to parse as bigint
    try {
      const cbidBigInt = BigInt(cbid);
      return {
        success: true,
        data: cbidBigInt
      };
    } catch (error) {
      return {
        success: false,
        error: 'cbid parameter must be a valid integer',
        code: 'INVALID_CBID'
      };
    }
  }
} 