import { PrismaClient, Profile } from '@prisma/client';
import { log } from '../utils/logger';
import { CBUser, RemotePlatform, RemoteProfile, ViewerContext } from '../types';

// Global Prisma instance to avoid multiple connections
declare global {
  var __prisma: PrismaClient | undefined;
}

export class PrismaService {
  private static instance: PrismaService | null = null;

  private constructor() {
    // Private constructor to enforce singleton
  }

  // Singleton pattern to ensure only one instance
  public static getInstance(): PrismaService {
    if (!PrismaService.instance) {
      PrismaService.instance = new PrismaService();
    }
    return PrismaService.instance;
  }

  // Get or create a fresh Prisma client instance to avoid prepared statement conflicts
  private getPrismaClient(): PrismaClient {
    // Always create a fresh client to avoid prepared statement conflicts
    return new PrismaClient({
      log: ['error', 'warn'],
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });
  }

  // Clean disconnect method - private helper
  private async disconnectClient(): Promise<void> {
    if (globalThis.__prisma) {
      await globalThis.__prisma.$disconnect();
      globalThis.__prisma = undefined;
    }
  }

  // Reconnect method with cleanup
  private async reconnectPrisma(): Promise<void> {
    try {
      // Disconnect existing connection
      await this.disconnectClient();
      
      // Wait a moment before reconnecting
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Create new connection
      globalThis.__prisma = new PrismaClient({
        log: ['error', 'warn'],
        datasources: {
          db: {
            url: process.env.DATABASE_URL,
          },
        },
      });
      
      log.info('Prisma client reconnected successfully');
    } catch (error) {
      log.error('Failed to reconnect Prisma client:', error);
    }
  }

  /**
   * Get user profile from the profiles table by cbid
   */
  async getUserProfile(cbid: bigint): Promise<CBUser | null> {
    const prisma = this.getPrismaClient();
    try {
      const profile = await prisma.profile.findUnique({
        where: {
          id: cbid,
        },
      });

      if (!profile) {
        return null;
      }

      // Create CBUser object matching the interface
      const cbUser: CBUser = {
        id: profile.id,
        time_zone: profile.timeZone || undefined,
        created_at: profile.createdAt,
        auth_user_id: profile.authUserId || '',
        viewer_context: {
          cbid: profile.id,
        },
        cbid: profile.id,
        
        // Implement the required methods
        get_connected_remote_user: (platform: RemotePlatform): RemoteProfile => ({
          viewer_context: {
            cbid: profile.id,
          },
          platform,
        }),
        get_timezone: () => profile.timeZone || 'America/New_York',
        get_full_name: () => profile.firstName + ' ' + profile.lastName || '',
        get_email: () => profile.email || '',
        get_phone: () => '',
      };
      
      return cbUser;
            
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      log.error(`Prisma query error: ${errorMessage}`, { error: String(error), cbid: cbid.toString() });
      
      throw error;
    } finally {
      // Always disconnect the client to avoid connection leaks
      await prisma.$disconnect();
    }
  }

  /**
   * Get user profile from the profiles table by Supabase user ID
   */
  async getUserProfileBySupabaseUserId(supabaseUserId: string): Promise<{ cbid: bigint }> {
    try {
      const prisma = this.getPrismaClient();
      const profile = await prisma.profile.findFirst({
        where: {
          authUserId: supabaseUserId,
        },
      });

      if (!profile) {
        throw new Error(`No profile found for Supabase user ID: ${supabaseUserId}`);
      }

      return {
        cbid: profile.id,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      log.error(`Prisma query error: ${errorMessage}`, { error: String(error), supabaseUserId });
      
      // If it's a connection error, try to reconnect
      if (errorMessage.includes('prepared statement') || errorMessage.includes('connection')) {
        log.info('Attempting to reconnect Prisma client...');
        await this.reconnectPrisma();
        
        // Retry the query once
        try {
          const prisma = this.getPrismaClient();
          const retryProfile = await prisma.profile.findFirst({
            where: {
              authUserId: supabaseUserId,
            },
          });

          if (!retryProfile) {
            throw new Error(`No profile found for Supabase user ID: ${supabaseUserId}`);
          }

          return {
            cbid: retryProfile.id,
          };
        } catch (retryError) {
          throw new Error(`Failed to fetch profile after retry: ${retryError instanceof Error ? retryError.message : 'Unknown error'}`);
        }
      }
      
      throw error;
    }
  }

  /**
   * Get all profiles (for testing/debugging)
   */
  async getAllProfiles(): Promise<Profile[]> {
    try {
      const prisma = this.getPrismaClient();
      return await prisma.profile.findMany();
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
  }): Promise<Profile> {
    const prisma = this.getPrismaClient();
    try {
      return await prisma.profile.upsert({
        where: {
          authUserId: data.authUserId,
        },
        update: {
          timeZone: data.timeZone,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
        },
        create: {
          timeZone: data.timeZone,
          authUserId: data.authUserId,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
        },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      log.error(`Prisma upsert error: ${errorMessage}`, { error: String(error), data });
      throw error;
    } finally {
      // Always disconnect the client to avoid connection leaks
      await prisma.$disconnect();
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
  ): Promise<Profile | null> {
    try {
      const prisma = this.getPrismaClient();
      return await prisma.profile.update({
        where: { id: cbid },
        data,
      });
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
    await this.disconnectClient();
  }

  /**
   * Static method to close the global Prisma instance
   */
  static async disconnectGlobal(): Promise<void> {
    if (globalThis.__prisma) {
      await globalThis.__prisma.$disconnect();
      globalThis.__prisma = undefined;
    }
  }
} 