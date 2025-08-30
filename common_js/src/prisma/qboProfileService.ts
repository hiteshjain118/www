import PrismaService from './client';

export interface QboProfile {
  cbId: bigint;
  ownerId: bigint;
  realmId: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  expiresIn: number | null;
  refreshTokenExpiresIn: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface QboProfileWithOwner extends QboProfile {
  owner: {
    id: bigint;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
  };
}

export class QboProfileService {
  private static instance: QboProfileService;

  static getInstance(): QboProfileService {
    if (!QboProfileService.instance) {
      QboProfileService.instance = new QboProfileService();
    }
    return QboProfileService.instance;
  }

  /**
   * Get QBO profile by CB ID
   */
  async getQboProfile(cbId: bigint): Promise<QboProfileWithOwner | null> {
    const prisma = PrismaService.getInstance();
    
    try {
      return await prisma.qboProfile.findUnique({
        where: { cbId },
        include: {
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });
    } catch (error) {
      console.error('Error getting QBO profile:', error);
      throw error;
    }
  }

  /**
   * Get QBO profile by owner ID
   */
  async getQboProfileByOwnerId(ownerId: bigint): Promise<QboProfile | null> {
    const prisma = PrismaService.getInstance();
    
    try {
      return await prisma.qboProfile.findFirst({
        where: { ownerId },
      });
    } catch (error) {
      console.error('Error getting QBO profile by owner ID:', error);
      throw error;
    }
  }

  /**
   * Get QBO profiles by owner ID
   */
  async getQboProfilesByOwnerId(ownerId: bigint): Promise<QboProfile[]> {
    const prisma = PrismaService.getInstance();
    
    try {
      return await prisma.qboProfile.findMany({
        where: { ownerId },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      console.error('Error getting QBO profiles by owner ID:', error);
      throw error;
    }
  }

  /**
   * Get QBO profile by realm ID
   */
  async getQboProfileByRealmId(realmId: string): Promise<QboProfile | null> {
    const prisma = PrismaService.getInstance();
    
    try {
      return await prisma.qboProfile.findFirst({
        where: { realmId },
      });
    } catch (error) {
      console.error('Error getting QBO profile by realm ID:', error);
      throw error;
    }
  }

  /**
   * Create a new QBO profile
   */
  async createQboProfile(data: {
    ownerId: bigint;
    realmId?: string;
    accessToken?: string;
    refreshToken?: string;
    expiresIn?: number;
    refreshTokenExpiresIn?: number;
  }): Promise<QboProfile> {
    const prisma = PrismaService.getInstance();
    
    try {
      return await prisma.qboProfile.create({
        data: {
          ownerId: data.ownerId,
          realmId: data.realmId || null,
          accessToken: data.accessToken || null,
          refreshToken: data.refreshToken || null,
          expiresIn: data.expiresIn || null,
          refreshTokenExpiresIn: data.refreshTokenExpiresIn || null,
        },
      });
    } catch (error) {
      console.error('Error creating QBO profile:', error);
      throw error;
    }
  }

  /**
   * Update a QBO profile
   */
  async updateQboProfile(
    cbId: bigint,
    data: Partial<{
      realmId: string;
      accessToken: string;
      refreshToken: string;
      expiresIn: number;
      refreshTokenExpiresIn: number;
    }>
  ): Promise<QboProfile> {
    const prisma = PrismaService.getInstance();
    
    try {
      return await prisma.qboProfile.update({
        where: { cbId },
        data,
      });
    } catch (error) {
      console.error('Error updating QBO profile:', error);
      throw error;
    }
  }

  /**
   * Upsert a QBO profile
   */
  async upsertQboProfile(data: {
    ownerId: bigint;
    realmId: string;
    accessToken?: string;
    refreshToken?: string;
    expiresIn?: number;
    refreshTokenExpiresIn?: number;
  }): Promise<QboProfile> {
    const prisma = PrismaService.getInstance();
    
    try {
      // First try to find existing profile
      const existingProfile = await prisma.qboProfile.findFirst({
        where: { ownerId: data.ownerId, realmId: data.realmId },
      });

      if (existingProfile) {
        // Update existing profile
        return await prisma.qboProfile.update({
          where: { cbId: existingProfile.cbId },
          data: {
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            expiresIn: data.expiresIn,
            refreshTokenExpiresIn: data.refreshTokenExpiresIn,
          },
        });
      } else {
        // Create new profile
        return await prisma.qboProfile.create({
          data: {
            ownerId: data.ownerId,
            realmId: data.realmId,
            accessToken: data.accessToken || null,
            refreshToken: data.refreshToken || null,
            expiresIn: data.expiresIn || null,
            refreshTokenExpiresIn: data.refreshTokenExpiresIn || null,
          },
        });
      }
    } catch (error) {
      console.error('Error upserting QBO profile:', error);
      throw error;
    }
  }

  /**
   * Delete a QBO profile
   */
  async deleteQboProfile(cbId: bigint): Promise<void> {
    const prisma = PrismaService.getInstance();
    
    try {
      await prisma.qboProfile.delete({
        where: { cbId },
      });
    } catch (error) {
      console.error('Error deleting QBO profile:', error);
      throw error;
    }
  }

  /**
   * Get all QBO profiles
   */
  async getAllQboProfiles(): Promise<QboProfile[]> {
    const prisma = PrismaService.getInstance();
    
    try {
      return await prisma.qboProfile.findMany({
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      console.error('Error getting all QBO profiles:', error);
      throw error;
    }
  }
} 