import { IRemoteHTTPConnection } from '../types';
import { QBProfile } from '../types/profiles';
import { log } from '../utils/logger';

export class QBHttpConnection implements IRemoteHTTPConnection {
  qbo_profile: QBProfile;
  constructor(qbo_profile: QBProfile) {
    this.qbo_profile = qbo_profile;
  }

  async authenticate(): Promise<string> {
    // throws if a connection to local db or QB fails
    return await this.qbo_profile.getValidAccessTokenWithRefresh();
  }

  async is_authorized(): Promise<boolean> {
    return await this.qbo_profile.isCompanyConnected();
  }

  get_cbid(): bigint {
    return this.qbo_profile.cbId;
  }

  get_platform_name(): string {
    return this.qbo_profile.platform;
  }

  async get_valid_access_token(): Promise<string> {
    return await this.qbo_profile.getValidAccessTokenWithRefresh();
  }

  get_remote_user(): QBProfile {
    return this.qbo_profile;
  }

  async get_headers(): Promise<Record<string, string>> {
    const access_token = await this.get_valid_access_token();
    if (!access_token) {
      throw new Error(`No valid access token for entity ${this.get_cbid()}`);
    }

    return {
      'Authorization': `Bearer ${access_token}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };
  }
} 