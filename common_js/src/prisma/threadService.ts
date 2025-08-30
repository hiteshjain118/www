import PrismaService from './client';

export interface Thread {
  cbId: bigint;
  ownerId: bigint;
  createdAt: Date;
}

export interface ThreadWithPipelines extends Thread {
  owner: {
    id: bigint;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
  };
  pipelines: Array<{
    cbId: bigint;
    name: string | null;
    createdAt: Date;
  }>;
}

export class ThreadService {
  private static instance: ThreadService;

  static getInstance(): ThreadService {
    if (!ThreadService.instance) {
      ThreadService.instance = new ThreadService();
    }
    return ThreadService.instance;
  }

  /**
   * Get thread by CB ID
   */
  async getThread(cbId: bigint): Promise<ThreadWithPipelines | null> {
    const prisma = PrismaService.getInstance();
    
    try {
      return await prisma.thread.findUnique({
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
          pipelines: {
            select: {
              cbId: true,
              name: true,
              createdAt: true,
            },
          },
          messages: {
            select: {
              cbId: true,
              body: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'asc' },
          },
        },
      });
    } catch (error) {
      console.error('Error getting thread:', error);
      throw error;
    }
  }

  /**
   * Get threads by owner ID
   */
  async getThreadsByOwnerId(ownerId: bigint): Promise<ThreadWithPipelines[]> {
    const prisma = PrismaService.getInstance();
    
    try {
      return await prisma.thread.findMany({
        where: { ownerId },
        include: {
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          pipelines: {
            select: {
              cbId: true,
              name: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      console.error('Error getting threads by owner ID:', error);
      throw error;
    }
  }

  /**
   * Create a new thread
   */
  async createThread(data: {
    ownerId: bigint;
  }): Promise<Thread> {
    const prisma = PrismaService.getInstance();
    
    try {
      return await prisma.thread.create({
        data: {
          ownerId: data.ownerId,
        },
      });
    } catch (error) {
      console.error('Error creating thread:', error);
      throw error;
    }
  }

  /**
   * Update a thread
   */
  async updateThread(
    cbId: bigint,
    data: Partial<{
      ownerId: bigint;
    }>
  ): Promise<Thread> {
    const prisma = PrismaService.getInstance();
    
    try {
      return await prisma.thread.update({
        where: { cbId },
        data,
      });
    } catch (error) {
      console.error('Error updating thread:', error);
      throw error;
    }
  }

  /**
   * Delete a thread
   */
  async deleteThread(cbId: bigint): Promise<void> {
    const prisma = PrismaService.getInstance();
    
    try {
      await prisma.thread.delete({
        where: { cbId },
      });
    } catch (error) {
      console.error('Error deleting thread:', error);
      throw error;
    }
  }

  /**
   * Get all threads
   */
  async getAllThreads(): Promise<Thread[]> {
    const prisma = PrismaService.getInstance();
    
    try {
      return await prisma.thread.findMany({
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      console.error('Error getting all threads:', error);
      throw error;
    }
  }

  /**
   * Get thread count by owner ID
   */
  async getThreadCountByOwnerId(ownerId: bigint): Promise<number> {
    const prisma = PrismaService.getInstance();
    
    try {
      return await prisma.thread.count({
        where: { ownerId },
      });
    } catch (error) {
      console.error('Error getting thread count by owner ID:', error);
      throw error;
    }
  }
} 