import { QboProfile, QboProfileService, QboProfileSandboxService } from "coralbricks-common";
import { PrismaService, ProfileService } from "coralbricks-common";
import { QuickBooksAuthService } from "../qbo/quickbooksAuth";
import { ApiResponse, QBOCompany } from ".";
import { log } from "../utils/logger";
import { isProduction } from "../config";

// Translated from builder/builder_package/core/cb_user.py
export enum RemotePlatform {
    QBO = "qbo"
  }
  
  export interface ViewerContext {
    cbid: bigint;
  }
  
  export class CBUser {
    time_zone?: string | null;
    created_at?: Date;
    auth_user_id?: string | null;
    viewer_context?: ViewerContext;
    cbid?: bigint;
    first_name?: string | null;
    last_name?: string | null;
    email?: string | null;
    phone?: string | null;
    private constructor() {
    }
    
    get_full_name(): string {
        return `${this.first_name || ''} ${this.last_name || ''}`.trim();
    }
    
    get_email(): string {
        return this.email || '';
    }
    
    get_phone(): string {
        return this.phone || '';
    }
    
    get_timezone(): string {
        return this.time_zone || 'UTC';
    }
        
    static init(
        time_zone: string, 
        created_at: Date,
        auth_user_id: string,
        cbid: bigint,
        first_name: string, 
        last_name: string, 
        email: string, 
        phone: string
    ): CBUser {
        const to_ret = new CBUser();
        to_ret.time_zone = time_zone;
        to_ret.created_at = created_at;
        to_ret.auth_user_id = auth_user_id;
        to_ret.cbid = cbid;
        to_ret.first_name = first_name;
        to_ret.last_name = last_name;
        to_ret.email = email;
        to_ret.phone = phone;
        to_ret.viewer_context = {
            cbid: cbid
        };
        return to_ret;
    }

    static async load_profile(viewer_context: ViewerContext, cbid: bigint): Promise<CBUser> {
        if (viewer_context.cbid !== cbid) {
            throw new Error("Cant load profile for another user");
        }
        const profile = await ProfileService.getInstance().getUserProfile(cbid);
        if (!profile) {
            throw new Error("Profile not found");
        }
        const to_ret = new CBUser();
        to_ret.time_zone = profile.timeZone;
        to_ret.created_at = profile.createdAt;
        to_ret.auth_user_id = profile.authUserId;
        to_ret.cbid = profile.id;
        to_ret.first_name = profile.firstName;
        to_ret.last_name = profile.lastName;
        to_ret.email = profile.email;
        to_ret.phone = null;
        to_ret.viewer_context = viewer_context;
        return to_ret;
    }
}
  
  export abstract class RemoteProfile {
    viewer_context: ViewerContext;
    platform: RemotePlatform;
    cbId: bigint;
    ownerId: bigint;
    protected constructor(viewer_context: ViewerContext, platform: RemotePlatform, cbId: bigint, ownerId: bigint) {
        this.viewer_context = viewer_context;
        this.platform = platform; 
        this.cbId = cbId;
        this.ownerId = ownerId;
    }
    abstract get_base_url(): string;
  }
  
  export class QBProfile extends RemoteProfile {
    realmId: string;
    accessToken?: string;
    refreshToken?: string;
    expiresIn?: number;
    refreshTokenExpiresIn?: number;
    isSandbox: boolean;
    updatedAt: Date;
    private constructor(
        viewer_context: ViewerContext, 
        cbId: bigint, 
        ownerId: bigint,
        realmId: string,
        accessToken: string,
        refreshToken: string,
        expiresIn: number,
        refreshTokenExpiresIn: number,
        isSandbox: boolean,
        updatedAt: Date,
    ) {
        super(viewer_context, RemotePlatform.QBO, cbId, ownerId);
        this.realmId = realmId;
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.expiresIn = expiresIn;
        this.refreshTokenExpiresIn = refreshTokenExpiresIn;
        this.isSandbox = isSandbox;
        this.updatedAt = updatedAt;
    }

    get_base_url(): string {
        const url = this.isSandbox ? "https://sandbox-quickbooks.api.intuit.com/v3/company" 
        : "https://quickbooks.api.intuit.com/v3/company";
        return `${url}/${this.realmId}`;
    }

    static async load_profile(viewer_context: ViewerContext, qbo_profile_id: bigint): Promise<QBProfile> {
        if (this.is_sandbox()) {
            const profile = await QboProfileSandboxService.getInstance().getQboProfileSandbox(viewer_context.cbid);
            return new QBProfile(
                viewer_context, 
                qbo_profile_id, 
                profile!.ownerId, 
                profile!.realmId!, 
                profile!.accessToken!, 
                profile!.refreshToken!, 
                profile!.expiresIn!,  
                profile!.refreshTokenExpiresIn!, 
                true,
                profile!.updatedAt
            );
        }
        const profile = await QboProfileService.getInstance().getQboProfile(qbo_profile_id);
        return new QBProfile(
            viewer_context, 
            qbo_profile_id, 
            profile!.ownerId, 
            profile!.realmId!, 
            profile!.accessToken!, 
            profile!.refreshToken!, 
            profile!.expiresIn!,  
            profile!.refreshTokenExpiresIn!, 
            false,
            profile!.updatedAt
        );
    }

    static async upsert_from_realm_id(
        viewer_context: ViewerContext, 
        realm_id: string, 
        token_data: any, 
    ): Promise<QBProfile> {
        if (QBProfile.is_sandbox()) {
            const profile = await QboProfileSandboxService.getInstance().upsertQboProfileSandbox({
                ownerId: viewer_context.cbid,
                realmId: realm_id,
                accessToken: token_data.access_token,
                refreshToken: token_data.refresh_token,
                expiresIn: token_data.expires_in,
                refreshTokenExpiresIn: token_data.refresh_token_expires_in || token_data.expires_in * 2
            });
            return new QBProfile(
                viewer_context,
                profile.cbId,
                profile.ownerId,
                profile.realmId!,
                profile.accessToken!,
                profile.refreshToken!,
                profile.expiresIn!,
                profile.refreshTokenExpiresIn!,
                true,
                profile.updatedAt
            );
        }   
        const profile = await QboProfileService.getInstance().upsertQboProfile({
            ownerId: viewer_context.cbid,
            realmId: realm_id,
            accessToken: token_data.access_token,
            refreshToken: token_data.refresh_token,
            expiresIn: token_data.expires_in,
            refreshTokenExpiresIn: token_data.refresh_token_expires_in || token_data.expires_in * 2
        });
        return new QBProfile(
            viewer_context,
            profile.cbId,
            profile.ownerId,
            profile.realmId!,
            profile.accessToken!,
            profile.refreshToken!,
            profile.expiresIn!,
            profile.refreshTokenExpiresIn!,
            false,
            profile.updatedAt
        );
    }
    static async load_any_from_cb_owner(viewer_context: ViewerContext, cb_owner: CBUser): Promise<QBProfile> {
        if (this.is_sandbox()) {
            const profiles = await QboProfileSandboxService.getInstance().getQboProfileSandboxByOwnerId(cb_owner.cbid as bigint);
            if (profiles.length === 0) {
                throw new Error("No profiles found");
            }
            const profile = profiles[0]; // Take the first profile
            return new QBProfile(
                viewer_context, 
                profile.cbId, 
                profile.ownerId, 
                profile.realmId!, 
                profile.accessToken!, 
                profile.refreshToken!, 
                profile.expiresIn!,  
                profile.refreshTokenExpiresIn!, 
                false,
                profile.updatedAt
            );
        }
        const profiles = await QboProfileService.getInstance().getQboProfilesByOwnerId(cb_owner.cbid as bigint);
        if (profiles.length === 0) {
            throw new Error("No profiles found");
        }
        const profile = profiles[0]; // Take the first profile
        return new QBProfile(
            viewer_context, 
            profile.cbId, 
            profile.ownerId, 
            profile.realmId!, 
            profile.accessToken!, 
            profile.refreshToken!, 
            profile.expiresIn!,  
            profile.refreshTokenExpiresIn!, 
            false,
            profile.updatedAt
        );
    }

    private static is_sandbox(): boolean {
        return process.env.QBO_SANDBOX === "true";
    }

    async load_authenticated_profile(viewer_context: ViewerContext, qbo_profile_id: bigint): Promise<QBProfile> {
        const profile = await QBProfile.load_profile(viewer_context, qbo_profile_id);
        const quickbooks_auth_service = new QuickBooksAuthService();
        const refreshed_tokens = await quickbooks_auth_service.refreshAndStoreTokens(profile);
        profile.accessToken = refreshed_tokens;
        return profile;
    }

        /**
   * Get list of connected QuickBooks companies from QBO profiles
   */
    static async getCompanies(ownerId: bigint): Promise<QBOCompany[]> {
        log.info('Fetching connected QuickBooks companies from QBO profiles');
        let profiles: QboProfile[] | any[];
        if (this.is_sandbox()) {
            profiles = await QboProfileSandboxService.getInstance().getQboProfileSandboxByOwnerId(ownerId);
        } else {
            profiles = await QboProfileService.getInstance().getQboProfilesByOwnerId(ownerId);
        }
        if (!profiles || profiles.length === 0) {
            return [];
        }
        const companies: QBOCompany[] = profiles.map(profile => ({
            qbo_profile_id: profile.cbId,
            realm_id: profile.realmId || '',
            company_name: `Company ${profile.realmId}`,
            last_connected: profile.updatedAt.toISOString()
        }));
    
        log.info(`Found ${companies.length} connected companies`);
        return companies;
        }
        
    /**
     * Check if a company is connected by looking up in QBO profiles
     */
    async isCompanyConnected(): Promise<boolean> {
        log.info(`Checking connection status for realm: ${this.realmId}`);
        const access_token = await this.getValidAccessTokenWithRefresh();
        return access_token !== null;
    }
        
    /**
     * Check if a token needs refreshing and refresh if necessary
     */
    async getValidAccessTokenWithRefresh(): Promise<string> {
        log.info(`Getting valid access token with refresh for realm: ${this.realmId}`);
        
        if (this.expiresIn && this.updatedAt) {
            const expirationTime = new Date(this.updatedAt.getTime() + this.expiresIn * 1000);
            if (new Date() < expirationTime) {
                return this.accessToken as string;
            }
        }
  
        if (this.refreshToken) {
            this.accessToken = await new QuickBooksAuthService().refreshAndStoreTokens(this);
            
            log.info(`Token refreshed successfully for realm: ${this.realmId}`);
            return this.accessToken as string;
            
        } else {
            throw new Error('No refresh token available');
        }
        throw new Error('No refresh token available');
    }
      
    /**
     * Disconnect a QuickBooks company by removing from QBO profiles
     */
    async disconnectCompany(): Promise<boolean> {
        log.info(`Disconnecting company: ${this.realmId}`);
        if (this.isSandbox) {
            await QboProfileSandboxService.getInstance().deleteQboProfileSandbox(this.cbId);
        } else {
            await QboProfileService.getInstance().deleteQboProfile(this.cbId);
        }
        log.info(`Company ${this.realmId} disconnected successfully`);
        return true;
    }

      /**
   * Store OAuth tokens for a company in the appropriate QBO profiles table
   */
  async storeTokens(realmId: string, tokenData: any, cbId: bigint | null, ownerId: bigint): Promise<void> {
    
    log.info(`Storing tokens for realm: ${realmId} in ${isProduction ? 'production' : 'sandbox'} table`);
    
    await QBProfile.upsert_from_realm_id(
        this.viewer_context, 
        realmId, 
        tokenData,
    );
    
    
    log.info(`Tokens stored successfully for realm: ${realmId}`);
  }

}