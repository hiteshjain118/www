import { config, isProduction } from '../config';
import { log } from '../utils/logger';
import { QBOCompany, QBOUserInfo, QBOAuthResponse, ApiResponse } from '../types';
import QBOProfileService from './qboProfileService';

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
   * This is a mock implementation - in production, you'd make the actual OAuth call
   */
  async exchangeCodeForTokens(code: string, realmId: string): Promise<ApiResponse<any>> {
    try {
      log.info(`Exchanging code for tokens for realm: ${realmId}`);
      
      // TODO: Implement actual OAuth token exchange
      // For now, return mock token data
      const mockTokenData = {
        access_token: `mock_access_token_${Date.now()}`,
        refresh_token: `mock_refresh_token_${Date.now()}`,
        expires_in: 3600,
        token_type: 'bearer'
      };

      log.info(`Successfully exchanged code for tokens for realm: ${realmId}`);
      return {
        success: true,
        data: mockTokenData
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      log.error(`Error exchanging code for tokens: ${errorMessage}`, { code, realmId, error: String(error) });
      
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
  async storeTokens(realmId: string, tokenData: any, cbId: bigint, ownerId: bigint): Promise<ApiResponse<boolean>> {
    try {
      log.info(`Storing tokens for realm: ${realmId} in ${isProduction ? 'production' : 'sandbox'} table`);
      
      // Store tokens in the appropriate QBO profiles table
      const profileData = {
        cbId,
        ownerId,
        realmId,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresIn: tokenData.expires_in,
        refreshTokenExpiresIn: tokenData.refresh_token_expires_in || tokenData.expires_in * 2
      };

      await QBOProfileService.upsertProfile(profileData, isProduction);
      
      log.info(`Tokens stored successfully for realm: ${realmId}`);
      
      return {
        success: true,
        data: true
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      log.error(`Error storing tokens: ${errorMessage}`, { realmId, error: String(error) });
      
      return {
        success: false,
        error: `Error storing tokens: ${errorMessage}`,
        code: 'TOKEN_STORAGE_ERROR'
      };
    }
  }

  /**
   * Get list of connected QuickBooks companies from QBO profiles
   */
  async getCompanies(ownerId: bigint): Promise<ApiResponse<QBOCompany[]>> {
    try {
      log.info('Fetching connected QuickBooks companies from QBO profiles');
      
      const profiles = await QBOProfileService.getProfilesByOwner(ownerId, isProduction);
      
      const companies: QBOCompany[] = profiles.map((profile: any) => ({
        realm_id: profile.realmId || '',
        company_name: `Company ${profile.realmId}`,
        connected: !!(profile.accessToken && profile.realmId),
        last_connected: profile.updatedAt.toISOString()
      }));

      log.info(`Found ${companies.length} connected companies`);
      return {
        success: true,
        data: companies
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      log.error(`Error fetching companies: ${errorMessage}`, { error: String(error) });
      
      return {
        success: false,
        error: `Error fetching companies: ${errorMessage}`,
        code: 'COMPANIES_FETCH_ERROR'
      };
    }
  }

  /**
   * Check if a company is connected by looking up in QBO profiles
   */
  async isCompanyConnected(realmId: string, cbId: bigint): Promise<ApiResponse<boolean>> {
    try {
      log.info(`Checking connection status for realm: ${realmId}`);
      
      const isConnected = await QBOProfileService.isProfileConnected(cbId, isProduction);
      
      log.info(`Company ${realmId} connection status: ${isConnected}`);
      return {
        success: true,
        data: isConnected
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      log.error(`Error checking company connection: ${errorMessage}`, { realmId, error: String(error) });
      
      return {
        success: false,
        error: `Error checking company connection: ${errorMessage}`,
        code: 'CONNECTION_CHECK_ERROR'
      };
    }
  }

  /**
   * Get valid access token for a company from QBO profiles
   */
  async getValidAccessToken(realmId: string, cbId: bigint): Promise<ApiResponse<string | null>> {
    try {
      log.info(`Getting valid access token for realm: ${realmId}`);
      
      const token = await QBOProfileService.getValidAccessToken(cbId, isProduction);
      
      log.info(`Access token for realm ${realmId}: ${token ? 'valid' : 'not found'}`);
      return {
        success: true,
        data: token
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      log.error(`Error getting access token: ${errorMessage}`, { realmId, error: String(error) });
      
      return {
        success: false,
        error: `Error getting access token: ${errorMessage}`,
        code: 'TOKEN_FETCH_ERROR'
      };
    }
  }

  /**
   * Disconnect a QuickBooks company by removing from QBO profiles
   */
  async disconnectCompany(realmId: string, cbId: bigint): Promise<ApiResponse<boolean>> {
    try {
      log.info(`Disconnecting company: ${realmId}`);
      
      await QBOProfileService.deleteProfile(cbId, isProduction);
      
      log.info(`Company ${realmId} disconnected successfully`);
      return {
        success: true,
        data: true
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      log.error(`Error disconnecting company: ${errorMessage}`, { realmId, error: String(error) });
      
      return {
        success: false,
        error: `Error disconnecting company: ${errorMessage}`,
        code: 'DISCONNECT_ERROR'
      };
    }
  }
} 