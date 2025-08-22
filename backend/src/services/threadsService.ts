import { PrismaClient } from '@prisma/client';

type Threads = {
  cbId: bigint;
  ownerId: bigint;
  createdAt: Date;
};
import { ApiResponse } from '../types';
import { logger } from '../utils/logger';

export class ThreadsService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Get all threads for a specific user
   */
  async getAllThreads(ownerId: bigint): Promise<ApiResponse<Threads[]>> {
    try {
      const threads = await this.prisma.thread.findMany({
        where: {
          ownerId: ownerId
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      logger.info(`Retrieved ${threads.length} threads for owner ${ownerId}`);
      
      return {
        success: true,
        data: threads
      };
    } catch (error) {
      logger.error('Error fetching threads:', error);
      return {
        success: false,
        error: 'Failed to fetch threads'
      };
    } finally {
      await this.prisma.$disconnect();
    }
  }

  /**
   * Get a specific thread by cbid for a specific user
   */
  async getThreadById(cbId: bigint, ownerId: bigint): Promise<ApiResponse<Threads | null>> {
    try {
      const thread = await this.prisma.thread.findFirst({
        where: {
          cbId: cbId,
          ownerId: ownerId
        }
      });

      if (!thread) {
        return {
          success: false,
          error: 'Thread not found or access denied'
        };
      }

      logger.info(`Retrieved thread ${cbId} for owner ${ownerId}`);
      
      return {
        success: true,
        data: thread
      };
    } catch (error) {
      logger.error('Error fetching thread:', error);
      return {
        success: false,
        error: 'Failed to fetch thread'
      };
    } finally {
      await this.prisma.$disconnect();
    }
  }

  /**
   * Create a new thread for a user
   */
  async createThread(ownerId: bigint): Promise<ApiResponse<{ cbId: string }>> {
    try {
      const newThread = await this.prisma.thread.create({
        data: {
          ownerId: ownerId
        }
      });

      logger.info(`Created new thread ${newThread.cbId} for owner ${ownerId}`);
      
      return {
        success: true,
        data: { cbId: newThread.cbId.toString() }
      };
    } catch (error) {
      logger.error('Error creating thread:', error);
      return {
        success: false,
        error: 'Failed to create thread'
      };
    } finally {
      await this.prisma.$disconnect();
    }
  }
}

export const threadsService = new ThreadsService(); 