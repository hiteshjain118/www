import { config, isProduction } from '../config';
import { log } from '../utils/logger';
import { QBOCompany, ApiResponse } from '../types';
import { QBOProfileService } from '.';
import { QBOProfile } from '../types/profiles';
import axios from 'axios';

export class QuickBooksAuthService {
  private clientId: string;
  private clientSecret: string;
  private authUrl: string;
  private redirectUri: string;

  constructor() {
    this.clientId = config.qboClientId;
    this.clientSecret = config.qboClientSecret;
    this.authUrl = config.qboAuthUrl;
    this.redirectUri = config.qboRedirectUri;
  }

  /**
   * Generate QuickBooks OAuth authorization URL
   */
  generateAuthUrl(state: bigint): string {
    log.info(`Generating QuickBooks OAuth URL with:`, {
      clientId: this.clientId,
      authUrl: this.authUrl,
      redirectUri: this.redirectUri,
      state: state.toString()
    });
    
    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: 'code',
      scope: 'com.intuit.quickbooks.accounting',
      redirect_uri: this.redirectUri,
      state: state.toString(),
      environment: isProduction ? 'production' : 'sandbox'
    });

    const finalUrl = `${this.authUrl}?${params.toString()}`;
    log.info(`Generated OAuth URL: ${finalUrl}`);
    
    return finalUrl;
  }

  /**
   * Exchange authorization code for access tokens
   */
  async exchangeCodeForTokens(code: string, realmId: string): Promise<ApiResponse<any>> {
    try {
      log.info(`Exchanging code for tokens for realm: ${realmId}`);
      
      // Make actual OAuth token exchange request to QuickBooks
      const response = await axios.post(config.qboTokenUrl, {
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: this.redirectUri
      }, {
        auth: {
          username: this.clientId,
          password: this.clientSecret
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      const tokenData = response.data;
      
      // Validate the response
      if (!tokenData.access_token || !tokenData.refresh_token) {
        throw new Error('Invalid token response from QuickBooks');
      }

      log.info(`Successfully exchanged code for tokens for realm: ${realmId}`);
      return {
        success: true,
        data: {
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_in: tokenData.expires_in || 3600,
          token_type: tokenData.token_type || 'bearer',
          refresh_token_expires_in: tokenData.refresh_token_expires_in || (tokenData.expires_in || 3600) * 2
        }
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      log.error(`Error exchanging code for tokens: ${errorMessage}`, { code, realmId, error: String(error) });
      
      // Handle specific HTTP errors
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 400) {
          return {
            success: false,
            error: 'Invalid authorization code or redirect URI',
            code: 'INVALID_AUTHORIZATION_CODE'
          };
        } else if (error.response?.status === 401) {
          return {
            success: false,
            error: 'Invalid client credentials',
            code: 'INVALID_CLIENT_CREDENTIALS'
          };
        } else if (error.response?.status === 500) {
          return {
            success: false,
            error: 'QuickBooks server error',
            code: 'QB_SERVER_ERROR'
          };
        }
      }
      
      return {
        success: false,
        error: `Error exchanging code for tokens: ${errorMessage}`,
        code: 'TOKEN_EXCHANGE_ERROR'
      };
    }
  }

  /**
   * Store OAuth tokens for a company in the appropriate QBO profiles table
   */
  async storeTokens(realmId: string, tokenData: any, cbId: bigint | null, ownerId: bigint): Promise<void> {
    
    log.info(`Storing tokens for realm: ${realmId} in ${isProduction ? 'production' : 'sandbox'} table`);
    
    await QBOProfileService.upsertProfile({
      cbId: cbId || BigInt(0),
      ownerId,
      realmId,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresIn: tokenData.expires_in,
      refreshTokenExpiresIn: tokenData.refresh_token_expires_in || tokenData.expires_in * 2,
      updatedAt: new Date()
    } as any, isProduction);
    
    log.info(`Tokens stored successfully for realm: ${realmId}`);
  }
  /**
   * Get valid access token for a company from QBO profiles
   */
  async getAccessTokenIfValid(qbo_profile: QBOProfile): Promise<string | null> {
    
    log.info(`Getting valid access token for realm: ${qbo_profile.realmId}`);
    
    const token = await QBOProfileService.getAccessTokenIfValid(qbo_profile.cbId, isProduction);
    
    log.info(`Access token for realm ${qbo_profile.realmId}: ${token ? 'valid' : 'not found'}`);
    return token;
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAndStoreTokens(qbo_profile: QBOProfile): Promise<string> {
    try {
      if (!qbo_profile.refreshToken || !qbo_profile.realmId) {
        throw new Error('No refresh token or realmId available');
      }

      log.info(`Refreshing tokens for realm: ${qbo_profile.realmId}`);
      
      // Make OAuth token refresh request to QuickBooks
      const response = await axios.post(config.qboTokenUrl, {
        grant_type: 'refresh_token',
        refresh_token: qbo_profile.refreshToken
      }, {
        auth: {
          username: this.clientId,
          password: this.clientSecret
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      const tokenData = response.data;
      
      await this.storeTokens(qbo_profile.realmId, tokenData, qbo_profile.cbId, qbo_profile.ownerId);
      log.info(`Tokens refreshed successfully for realm: ${qbo_profile.realmId}`);
      return tokenData.access_token;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      log.error(`Error refreshing tokens: ${errorMessage}`, { 
        realmId: qbo_profile.realmId, 
        error: String(error) 
      });
      throw error;
    }
  }
} 