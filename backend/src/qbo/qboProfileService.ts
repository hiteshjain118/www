import { PrismaService, PrismaClient } from 'coralbricks-common';
import { QBOProfile } from '../types/profiles';

const prisma = PrismaService.getInstance();


export class QBOProfileService {
  /**
   * Get QBO profile by CB ID for production environment
   */
  static async getProductionProfile(cbId: bigint) {
    return await prisma.qboProfile.findUnique({
      where: { cbId },
      include: { owner: true }
    });
  }

  /**
   * Get QBO profile by CB ID for sandbox environment
   */
  static async getSandboxProfile(cbId: bigint) {
    return await prisma.qboProfileSandbox.findUnique({
      where: { cbId },
      include: { owner: true }
    });
  }

  /**
   * Get QBO profile by CB ID based on environment
   */
  static async getProfile(cbId: bigint, isProduction: boolean = false) {
    if (isProduction) {
      return await this.getProductionProfile(cbId);
    } else {
      return await this.getSandboxProfile(cbId);
    }
  }

  /**
   * Create or update QBO profile for production environment
   */
  static async upsertProductionProfile(data: QBOProfile) {
    // Check if cbId is 0 or if a row is not found in the database table
    if (data.cbId === BigInt(0)) {
      // Create new profile
      return await prisma.qboProfile.create({
        data: {
          ownerId: data.ownerId,
          realmId: data.realmId,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          expiresIn: data.expiresIn,
          refreshTokenExpiresIn: data.refreshTokenExpiresIn,
          updatedAt: new Date(),
          createdAt: new Date()
        }
      });
    }

    // Check if row exists in database
    const existingProfile = await prisma.qboProfile.findUnique({
      where: { cbId: data.cbId }
    });

    if (!existingProfile) {
      // Row not found, create new profile
      return await prisma.qboProfile.create({
        data: {
          ownerId: data.ownerId,
          realmId: data.realmId,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          expiresIn: data.expiresIn,
          refreshTokenExpiresIn: data.refreshTokenExpiresIn,
          updatedAt: new Date(),
          createdAt: new Date()
        }
      });
    } else {
      // Row found, update existing profile
      return await prisma.qboProfile.update({
        where: { cbId: data.cbId },
        data: {
          ownerId: data.ownerId,
          realmId: data.realmId,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          expiresIn: data.expiresIn,
          refreshTokenExpiresIn: data.refreshTokenExpiresIn,
          updatedAt: new Date()
        }
      });
    }
  }

  /**
   * Create or update QBO profile for sandbox environment
   */
  static async upsertSandboxProfile(data: QBOProfile) {
    // Check if cbId is 0 or if a row is not found in the database table
    if (data.cbId === BigInt(0)) {
      // Create new profile
      return await prisma.qboProfileSandbox.create({
        data: {
          ownerId: data.ownerId,
          realmId: data.realmId,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          expiresIn: data.expiresIn,
          refreshTokenExpiresIn: data.refreshTokenExpiresIn,
          updatedAt: new Date(),
          createdAt: new Date()
        }
      });
    }

    // Check if row exists in database
    const existingProfile = await prisma.qboProfileSandbox.findUnique({
      where: { cbId: data.cbId }
    });

    if (!existingProfile) {
      // Row not found, create new profile
      return await prisma.qboProfileSandbox.create({
        data: {
          ownerId: data.ownerId,
          realmId: data.realmId,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          expiresIn: data.expiresIn,
          refreshTokenExpiresIn: data.refreshTokenExpiresIn,
          updatedAt: new Date(),
          createdAt: new Date()
        }
      });
    } else {
      // Row found, update existing profile
      return await prisma.qboProfileSandbox.update({
        where: { cbId: data.cbId },
        data: {
          ownerId: data.ownerId,
          realmId: data.realmId,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          expiresIn: data.expiresIn,
          refreshTokenExpiresIn: data.refreshTokenExpiresIn,
          updatedAt: new Date()
        }
      });
    }
  }

  /**
   * Create or update QBO profile based on environment
   */
  static async upsertProfile(data: QBOProfile, isProduction: boolean = false) {
    if (isProduction) {
      return await this.upsertProductionProfile(data);
    } else {
      return await this.upsertSandboxProfile(data);
    }
  }

  /**
   * Delete QBO profile for production environment
   */
  static async deleteProductionProfile(cbId: bigint) {
    return await prisma.qboProfile.delete({
      where: { cbId }
    });
  }

  /**
   * Delete QBO profile for sandbox environment
   */
  static async deleteSandboxProfile(cbId: bigint) {
    return await prisma.qboProfileSandbox.delete({
      where: { cbId }
    });
  }

  /**
   * Delete QBO profile based on environment
   */
  static async deleteProfile(cbId: bigint, isProduction: boolean = false) {
    if (isProduction) {
      return await this.deleteProductionProfile(cbId);
    } else {
      return await this.deleteSandboxProfile(cbId);
    }
  }

  /**
   * Get all QBO profiles for a user (owner) in production environment
   */
  static async getProductionProfilesByOwner(ownerId: bigint) {
    return await prisma.qboProfile.findMany({
      where: { ownerId },
      include: { owner: true }
    });
  }

  /**
   * Get all QBO profiles for a user (owner) in sandbox environment
   */
  static async getSandboxProfilesByOwner(ownerId: bigint) {
    return await prisma.qboProfileSandbox.findMany({
      where: { ownerId },
      include: { owner: true }
    });
  }

  /**
   * Get all QBO profiles for a user (owner) based on environment
   */
  static async getProfilesByOwner(ownerId: bigint, isProduction: boolean = false) {
    if (isProduction) {
      return await this.getProductionProfilesByOwner(ownerId);
    } else {
      return await this.getSandboxProfilesByOwner(ownerId);
    }
  }

  /**
   * Check if a QBO profile exists and is connected
   */
  static async isProfileConnected(cbId: bigint, isProduction: boolean = false) {
    const profile = await this.getProfile(cbId, isProduction);
    return profile && profile.accessToken && profile.realmId;
  }

  /**
   * Get valid access token for a QBO profile
   */
  static async getAccessTokenIfValid(cbId: bigint, isProduction: boolean = false) {
    const profile = await this.getProfile(cbId, isProduction);
    if (!profile || !profile.accessToken) {
      return null;
    }

    // Check if token is expired (basic check)
    if (profile.expiresIn && profile.createdAt) {
      const expirationTime = new Date(profile.createdAt.getTime() + profile.expiresIn * 1000);
      if (new Date() > expirationTime) {
        return null; // Token expired
      }
    }

    return profile.accessToken;
  }
}

export default QBOProfileService; 