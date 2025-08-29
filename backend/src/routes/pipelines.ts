import { Router, Request, Response } from 'express';
import { AuthMiddleware } from '../middleware/auth';
import { PrismaService } from 'coralbricks-common';
import { logger } from '../utils/logger';

const router = Router();
const authMiddleware = new AuthMiddleware();
const prisma = PrismaService.getInstance();

// Apply auth middleware to all routes
router.use(authMiddleware.requireCoralBricksAuth);

/**
 * GET /pipelines
 * Get all pipelines for the authenticated user
 */
router.get('/pipelines', async (req: Request, res: Response): Promise<void> => {
  try {
    const authUserId = req.user?.id;
    if (!authUserId) {
      res.status(401).json({ 
        success: false, 
        error: 'User not authenticated' 
      });
      return;
    }

    // Use the cbid directly from the authenticated user
    const userCbid = BigInt(req.user!.cbid);

    const pipelines = await prisma.pipeline.findMany({
      where: {
        ownerId: userCbid
      },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        parentThread: true
      }
    });

    logger.info(`Retrieved ${pipelines.length} pipelines for owner ${userCbid}`);
    
    res.json({
      success: true,
      data: pipelines
    });
    
  } catch (error) {
    logger.error('Error in GET /pipelines:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

/**
 * GET /pipeline/:cbid
 * Get a specific pipeline by cbid for the authenticated user
 */
router.get('/pipeline/:cbid', async (req: Request, res: Response): Promise<void> => {
  try {
    const authUserId = req.user?.id;
    if (!authUserId) {
      res.status(401).json({ 
        success: false, 
        error: 'User not authenticated' 
      });
      return;
    }

    const cbid = req.params.cbid;
    if (!cbid) {
      res.status(400).json({ 
        success: false, 
        error: 'Pipeline ID is required' 
      });
      return;
    }

    // Use the cbid directly from the authenticated user
    const userCbid = BigInt(req.user!.cbid);

    const pipeline = await prisma.pipeline.findFirst({
      where: {
        cbId: BigInt(cbid),
        ownerId: userCbid
      },
      include: {
        parentThread: true
      }
    });

    if (!pipeline) {
      res.status(404).json({
        success: false,
        error: 'Pipeline not found or access denied'
      });
      return;
    }

    logger.info(`Retrieved pipeline ${cbid} for owner ${userCbid}`);
    
    res.json({
      success: true,
      data: pipeline
    });
    
  } catch (error) {
    logger.error('Error in GET /pipeline/:cbid:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

/**
 * POST /pipeline/create
 * Create a new pipeline for the authenticated user
 */
router.post('/pipeline/create', async (req: Request, res: Response): Promise<void> => {
  try {
    const authUserId = req.user?.id;
    if (!authUserId) {
      res.status(401).json({ 
        success: false, 
        error: 'User not authenticated' 
      });
      return;
    }

    const { parentThreadId, name } = req.body;
    const userCbid = BigInt(req.user!.cbid);

    // Set default name if not provided
    const pipelineName = name || `Pipeline ${Date.now()}`;

    const newPipeline = await prisma.pipeline.create({
      data: {
        ownerId: userCbid,
        parentThreadId: parentThreadId ? BigInt(parentThreadId) : null,
        name: pipelineName
      },
      include: {
        parentThread: true
      }
    });

    logger.info(`Created new pipeline ${newPipeline.cbId} for owner ${userCbid}`);
    
    res.status(201).json({
      success: true,
      data: { cbId: newPipeline.cbId.toString() }
    });
    
  } catch (error) {
    logger.error('Error in POST /pipeline/create:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

/**
 * PUT /pipeline/:cbid
 * Update a pipeline for the authenticated user
 */
router.put('/pipeline/:cbid', async (req: Request, res: Response): Promise<void> => {
  try {
    const authUserId = req.user?.id;
    if (!authUserId) {
      res.status(401).json({ 
        success: false, 
        error: 'User not authenticated' 
      });
      return;
    }

    const cbid = req.params.cbid;
    const { parentThreadId, name } = req.body;
    
    if (!cbid) {
      res.status(400).json({ 
        success: false, 
        error: 'Pipeline ID is required' 
      });
      return;
    }

    const userCbid = BigInt(req.user!.cbid);

    // First check if pipeline exists and belongs to user
    const existingPipeline = await prisma.pipeline.findFirst({
      where: {
        cbId: BigInt(cbid),
        ownerId: userCbid
      }
    });

    if (!existingPipeline) {
      res.status(404).json({
        success: false,
        error: 'Pipeline not found or access denied'
      });
      return;
    }

    // Update the pipeline
    const updateData: any = {};
    if (parentThreadId !== undefined) {
      updateData.parentThreadId = parentThreadId ? BigInt(parentThreadId) : null;
    }
    if (name !== undefined) {
      updateData.name = name;
    }

    const updatedPipeline = await prisma.pipeline.update({
      where: {
        cbId: BigInt(cbid)
      },
      data: updateData,
      include: {
        parentThread: true
      }
    });

    logger.info(`Updated pipeline ${cbid} for owner ${userCbid}`);
    
    res.json({
      success: true,
      data: updatedPipeline
    });
    
  } catch (error) {
    logger.error('Error in PUT /pipeline/:cbid:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

/**
 * DELETE /pipeline/:cbid
 * Delete a pipeline for the authenticated user
 */
router.delete('/pipeline/:cbid', async (req: Request, res: Response): Promise<void> => {
  try {
    const authUserId = req.user?.id;
    if (!authUserId) {
      res.status(401).json({ 
        success: false, 
        error: 'User not authenticated' 
      });
      return;
    }

    const cbid = req.params.cbid;
    if (!cbid) {
      res.status(400).json({ 
        success: false, 
        error: 'Pipeline ID is required' 
      });
      return;
    }

    const userCbid = BigInt(req.user!.cbid);

    // First check if pipeline exists and belongs to user
    const existingPipeline = await prisma.pipeline.findFirst({
      where: {
        cbId: BigInt(cbid),
        ownerId: userCbid
      }
    });

    if (!existingPipeline) {
      res.status(404).json({
        success: false,
        error: 'Pipeline not found or access denied'
      });
      return;
    }

    // Delete the pipeline
    await prisma.pipeline.delete({
      where: {
        cbId: BigInt(cbid)
      }
    });

    logger.info(`Deleted pipeline ${cbid} for owner ${userCbid}`);
    
    res.json({
      success: true,
      message: 'Pipeline deleted successfully'
    });
    
  } catch (error) {
    logger.error('Error in DELETE /pipeline/:cbid:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

export default router; 