import PrismaService from './client';

export interface QboProfileSandbox {
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

export interface QboProfileSandboxWithOwner extends QboProfileSandbox {
  owner: {
    id: bigint;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
  };
}

export class QboProfileSandboxService {
  private static instance: QboProfileSandboxService;

  static getInstance(): QboProfileSandboxService {
    if (!QboProfileSandboxService.instance) {
      QboProfileSandboxService.instance = new QboProfileSandboxService();
    }
    return QboProfileSandboxService.instance;
  }

  /**
   * Get QBO sandbox profile by CB ID
   */
  async getQboProfileSandbox(cbId: bigint): Promise<QboProfileSandboxWithOwner | null> {
    const prisma = PrismaService.getInstance();
    
    try {
      return await prisma.qboProfileSandbox.findUnique({
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
      console.error('Error getting QBO sandbox profile:', error);
      throw error;
    }
  }

  /**
   * Get QBO sandbox profiles by owner ID
   */
  async getQboProfileSandboxByOwnerId(ownerId: bigint): Promise<QboProfileSandbox[]> {
    const prisma = PrismaService.getInstance();
    
    try {
      return await prisma.qboProfileSandbox.findMany({
        where: { ownerId },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      console.error('Error getting QBO sandbox profiles by owner ID:', error);
      throw error;
    }
  }

  /**
   * Get QBO sandbox profile by realm ID
   */
  async getQboProfileSandboxByRealmId(realmId: string): Promise<QboProfileSandbox | null> {
    const prisma = PrismaService.getInstance();
    
    try {
      return await prisma.qboProfileSandbox.findFirst({
        where: { realmId },
      });
    } catch (error) {
      console.error('Error getting QBO sandbox profile by realm ID:', error);
      throw error;
    }
  }

  /**
   * Create a new QBO sandbox profile
   */
  async createQboProfileSandbox(data: {
    ownerId: bigint;
    realmId?: string;
    accessToken?: string;
    refreshToken?: string;
    expiresIn?: number;
    refreshTokenExpiresIn?: number;
  }): Promise<QboProfileSandbox> {
    const prisma = PrismaService.getInstance();
    
    try {
      return await prisma.qboProfileSandbox.create({
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
      console.error('Error creating QBO sandbox profile:', error);
      throw error;
    }
  }

  /**
   * Update a QBO sandbox profile
   */
  async updateQboProfileSandbox(
    cbId: bigint,
    data: Partial<{
      realmId: string;
      accessToken: string;
      refreshToken: string;
      expiresIn: number;
      refreshTokenExpiresIn: number;
    }>
  ): Promise<QboProfileSandbox> {
    const prisma = PrismaService.getInstance();
    
    try {
      return await prisma.qboProfileSandbox.update({
        where: { cbId },
        data,
      });
    } catch (error) {
      console.error('Error updating QBO sandbox profile:', error);
      throw error;
    }
  }

  /**
   * Upsert a QBO sandbox profile
   */
  async upsertQboProfileSandbox(data: {
    ownerId: bigint;
    realmId?: string;
    accessToken?: string;
    refreshToken?: string;
    expiresIn?: number;
    refreshTokenExpiresIn?: number;
  }): Promise<QboProfileSandbox> {
    const prisma = PrismaService.getInstance();
    
    try {
      // First try to find existing profile
      const existingProfile = await prisma.qboProfileSandbox.findFirst({
        where: { ownerId: data.ownerId },
      });

      if (existingProfile) {
        // Update existing profile
        return await prisma.qboProfileSandbox.update({
          where: { cbId: existingProfile.cbId },
          data: {
            realmId: data.realmId,
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            expiresIn: data.expiresIn,
            refreshTokenExpiresIn: data.refreshTokenExpiresIn,
          },
        });
      } else {
        // Create new profile
        return await prisma.qboProfileSandbox.create({
          data: {
            ownerId: data.ownerId,
            realmId: data.realmId || null,
            accessToken: data.accessToken || null,
            refreshToken: data.refreshToken || null,
            expiresIn: data.expiresIn || null,
            refreshTokenExpiresIn: data.refreshTokenExpiresIn || null,
          },
        });
      }
    } catch (error) {
      console.error('Error upserting QBO sandbox profile:', error);
      throw error;
    }
  }

  /**
   * Delete a QBO sandbox profile
   */
  async deleteQboProfileSandbox(cbId: bigint): Promise<void> {
    const prisma = PrismaService.getInstance();
    
    try {
      await prisma.qboProfileSandbox.delete({
        where: { cbId },
      });
    } catch (error) {
      console.error('Error deleting QBO sandbox profile:', error);
      throw error;
    }
  }

  /**
   * Get all QBO sandbox profiles
   */
  async getAllQboProfileSandboxes(): Promise<QboProfileSandbox[]> {
    const prisma = PrismaService.getInstance();
    
    try {
      return await prisma.qboProfileSandbox.findMany({
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      console.error('Error getting all QBO sandbox profiles:', error);
      throw error;
    }
  }
} 