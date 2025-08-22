import axios from 'axios';
import { config } from '../config';
import { log } from '../utils/logger';
import { User, SupabaseAuthResponse, SupabaseTokenData, ApiResponse } from '../types';
import { PrismaService } from './prismaService';

export class CoralBricksAuthService {
  private supabaseUrl: string;
  private supabaseAnonKey: string;
  private static prismaService: PrismaService | null = null;

  constructor() {
    this.supabaseUrl = config.supabaseUrl;
    this.supabaseAnonKey = config.supabaseAnonKey;
    
    // Use singleton pattern for PrismaService
    if (!CoralBricksAuthService.prismaService) {
      CoralBricksAuthService.prismaService = PrismaService.getInstance();
    }
  }

  private getPrismaService(): PrismaService {
    if (!CoralBricksAuthService.prismaService) {
      throw new Error('PrismaService not initialized');
    }
    return CoralBricksAuthService.prismaService;
  }

  /**
   * Cleanup method to disconnect Prisma client
   */
  async disconnect(): Promise<void> {
    await this.getPrismaService().disconnect();
  }

  /**
   * Get user information from the profiles table using cbid
   * This is a mock implementation - in production, you'd connect to your database
   */
  async getUserFromProfiles(cbid: bigint): Promise<ApiResponse<User>> {
    try {
      log.info(`Fetching user profile for cbid: ${cbid}`);
      
      // TODO: Replace with actual database query
      // For now, return a mock user
      const mockUser: User = {
        id: cbid.toString(),
        email: `user-${cbid}@example.com`,
        role: 'authenticated',
        cbid: cbid
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
    
          // Use Prisma to query the profiles table
      const profile = await this.getPrismaService().getUserProfileBySupabaseUserId(userId);

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
      if (!this.supabaseUrl || !this.supabaseAnonKey) {
        return {
          success: false,
          error: 'Supabase configuration missing',
          code: 'CONFIG_ERROR'
        };
      }

      const authUrl = `${this.supabaseUrl}/auth/v1/token?grant_type=password`;
      
      const headers = {
        'Content-Type': 'application/json',
        'apikey': this.supabaseAnonKey,
        'Authorization': `Bearer ${this.supabaseAnonKey}`
      };
      
      const payload = {
        email,
        password
      };
      
      log.info(`Attempting Supabase authentication for email: ${email}`);
      
      const response = await axios.post<SupabaseAuthResponse>(authUrl, payload, { 
        headers, 
        timeout: 30000 
      });
      
      if (response.status === 200) {
        const data = response.data;
        const token = data.access_token;
        const userInfo = data.user;
        
        if (token && userInfo) {
          // Get user profile to fetch cbid
          const profileResult = await this.getUserProfileByUserId(userInfo.id);
          
          if (profileResult.success && profileResult.data) {
            const tokenData: SupabaseTokenData = {
              token,
              user_id: userInfo.id,
              email: userInfo.email,
              role: 'authenticated',
              cbid: profileResult.data.cbid
            };
            
            log.info(`Successfully authenticated user: ${userInfo.email} with cbid: ${profileResult.data.cbid}`);
            return {
              success: true,
              data: tokenData
            };
          } else {
            return {
              success: false,
              error: 'User authenticated but profile not found',
              code: 'PROFILE_NOT_FOUND'
            };
          }
        } else {
          return {
            success: false,
            error: 'No access token or user info in response',
            code: 'INVALID_RESPONSE'
          };
        }
      } else {
        try {
          const errorData = response.data as any;
          log.error(`Supabase authentication error: ${JSON.stringify(errorData)}`);
          const errorMsg = errorData?.error_description || errorData?.error || 'Unknown error';
          return {
            success: false,
            error: `Authentication failed: ${errorMsg}`,
            code: 'AUTH_FAILED'
          };
        } catch {
          return {
            success: false,
            error: `Authentication failed: ${response.status}`,
            code: 'AUTH_FAILED'
          };
        }
      }
      
    } catch (error) {
      if (axios.isAxiosError(error)) {
        log.error(`Supabase authentication error: ${JSON.stringify(error)}`);
        if (error.code === 'ECONNREFUSED') {
          return {
            success: false,
            error: 'Connection Error: Could not connect to Supabase',
            code: 'CONNECTION_ERROR'
          };
        } else if (error.code === 'ECONNABORTED') {
          return {
            success: false,
            error: 'Timeout Error: Authentication request took too long',
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
          await this.getPrismaService().upsertProfile({
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