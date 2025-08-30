import PrismaService from './client';

export interface Pipeline {
  cbId: bigint;
  ownerId: bigint;
  parentThreadId: bigint | null;
  createdAt: Date;
  name: string | null;
}

export interface PipelineWithRelations extends Pipeline {
  owner: {
    id: bigint;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
  };
  parentThread: {
    cbId: bigint;
    ownerId: bigint;
  } | null;
}

export class PipelineService {
  private static instance: PipelineService;

  static getInstance(): PipelineService {
    if (!PipelineService.instance) {
      PipelineService.instance = new PipelineService();
    }
    return PipelineService.instance;
  }

  /**
   * Get pipeline by CB ID
   */
  async getPipeline(cbId: bigint): Promise<PipelineWithRelations | null> {
    const prisma = PrismaService.getInstance();
    
    try {
      return await prisma.pipeline.findUnique({
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
          parentThread: {
            select: {
              cbId: true,
              ownerId: true,
            },
          },
        },
      });
    } catch (error) {
      console.error('Error getting pipeline:', error);
      throw error;
    }
  }

  /**
   * Get pipelines by owner ID
   */
  async getPipelinesByOwnerId(ownerId: bigint): Promise<PipelineWithRelations[]> {
    const prisma = PrismaService.getInstance();
    
    try {
      return await prisma.pipeline.findMany({
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
          parentThread: {
            select: {
              cbId: true,
              ownerId: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      console.error('Error getting pipelines by owner ID:', error);
      throw error;
    }
  }

  /**
   * Get pipelines by parent thread ID
   */
  async getPipelinesByParentThreadId(parentThreadId: bigint): Promise<PipelineWithRelations[]> {
    const prisma = PrismaService.getInstance();
    
    try {
      return await prisma.pipeline.findMany({
        where: { parentThreadId },
        include: {
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          parentThread: {
            select: {
              cbId: true,
              ownerId: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      console.error('Error getting pipelines by parent thread ID:', error);
      throw error;
    }
  }

  /**
   * Create a new pipeline
   */
  async createPipeline(data: {
    ownerId: bigint;
    parentThreadId?: bigint;
    name?: string;
  }): Promise<Pipeline> {
    const prisma = PrismaService.getInstance();
    
    try {
      return await prisma.pipeline.create({
        data: {
          ownerId: data.ownerId,
          parentThreadId: data.parentThreadId || null,
          name: data.name || null,
        },
      });
    } catch (error) {
      console.error('Error creating pipeline:', error);
      throw error;
    }
  }

  /**
   * Update a pipeline
   */
  async updatePipeline(
    cbId: bigint,
    data: Partial<{
      name: string;
      parentThreadId: bigint;
    }>
  ): Promise<Pipeline> {
    const prisma = PrismaService.getInstance();
    
    try {
      return await prisma.pipeline.update({
        where: { cbId },
        data,
      });
    } catch (error) {
      console.error('Error updating pipeline:', error);
      throw error;
    }
  }

  /**
   * Delete a pipeline
   */
  async deletePipeline(cbId: bigint): Promise<void> {
    const prisma = PrismaService.getInstance();
    
    try {
      await prisma.pipeline.delete({
        where: { cbId },
      });
    } catch (error) {
      console.error('Error deleting pipeline:', error);
      throw error;
    }
  }

  /**
   * Get all pipelines
   */
  async getAllPipelines(): Promise<Pipeline[]> {
    const prisma = PrismaService.getInstance();
    
    try {
      return await prisma.pipeline.findMany({
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      console.error('Error getting all pipelines:', error);
      throw error;
    }
  }

  /**
   * Get pipeline count by owner ID
   */
  async getPipelineCountByOwnerId(ownerId: bigint): Promise<number> {
    const prisma = PrismaService.getInstance();
    
    try {
      return await prisma.pipeline.count({
        where: { ownerId },
      });
    } catch (error) {
      console.error('Error getting pipeline count by owner ID:', error);
      throw error;
    }
  }

  /**
   * Search pipelines by name
   */
  async searchPipelinesByName(name: string, ownerId?: bigint): Promise<PipelineWithRelations[]> {
    const prisma = PrismaService.getInstance();
    
    try {
      const where: any = {
        name: {
          contains: name,
          mode: 'insensitive',
        },
      };

      if (ownerId) {
        where.ownerId = ownerId;
      }

      return await prisma.pipeline.findMany({
        where,
        include: {
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          parentThread: {
            select: {
              cbId: true,
              ownerId: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      console.error('Error searching pipelines by name:', error);
      throw error;
    }
  }
} 