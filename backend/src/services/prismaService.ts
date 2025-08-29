import { ProfileService } from 'coralbricks-common';
import { log } from '../utils/logger';

// Re-export the ProfileService for backward compatibility
export class PrismaService {
  private static instance: PrismaService | null = null;
  private profileService: ProfileService;

  private constructor() {
    // Private constructor to enforce singleton
    this.profileService = ProfileService.getInstance();
  }

  // Singleton pattern to ensure only one instance
  public static getInstance(): PrismaService {
    if (!PrismaService.instance) {
      PrismaService.instance = new PrismaService();
    }
    return PrismaService.instance;
  }

  /**
   * Get user profile from the profiles table by cbid
   */
  async getUserProfile(cbid: bigint) {
    try {
      return await this.profileService.getUserProfile(cbid);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      log.error(`Prisma query error: ${errorMessage}`, { error: String(error), cbid: cbid.toString() });
      throw error;
    }
  }

  /**
   * Get user profile from the profiles table by Supabase user ID
   */
  async getUserProfileBySupabaseUserId(supabaseUserId: string): Promise<{ cbid: bigint }> {
    try {
      return await this.profileService.getUserProfileBySupabaseUserId(supabaseUserId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      log.error(`Prisma query error: ${errorMessage}`, { error: String(error), supabaseUserId });
      throw error;
    }
  }

  /**
   * Get all profiles (for testing/debugging)
   */
  async getAllProfiles() {
    try {
      return await this.profileService.getAllProfiles();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      log.error(`Prisma query error: ${errorMessage}`, { error: String(error) });
      throw error;
    }
  }

  /**
   * Create a new profile
   */
  async upsertProfile(data: {
    timeZone: string;
    authUserId: string;
    firstName: string;
    lastName: string;
    email: string;
  }) {
    try {
      return await this.profileService.upsertProfile(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      log.error(`Prisma upsert error: ${errorMessage}`, { error: String(error), data });
      throw error;
    }
  }

  /**
   * Update an existing profile
   */
  async updateProfile(
    cbid: bigint,
    data: {
      timeZone?: string;
      authUserId?: string;
    }
  ) {
    try {
      return await this.profileService.updateProfile(cbid, data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      log.error(`Prisma update error: ${errorMessage}`, { error: String(error), cbid: cbid.toString(), data });
      throw error;
    }
  }

  /**
   * Close the Prisma client (public method for external use)
   */
  async disconnect(): Promise<void> {
    // This is handled by the common service
  }

  /**
   * Static method to close the global Prisma instance
   */
  static async disconnectGlobal(): Promise<void> {
    // This is handled by the common service
  }
} 