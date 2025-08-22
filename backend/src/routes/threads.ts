import { Router, Request, Response } from 'express';
import { AuthMiddleware } from '../middleware/auth';
import { threadsService } from '../services/threadsService';
import { PrismaService } from '../services/prismaService';
import { logger } from '../utils/logger';

const router = Router();
const authMiddleware = new AuthMiddleware();

// Apply auth middleware to all routes
router.use(authMiddleware.requireCoralBricksAuth);

/**
 * GET /threads
 * Get all threads for the authenticated user
 */
router.get('/threads', async (req: Request, res: Response): Promise<void> => {
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

    const result = await threadsService.getAllThreads(userCbid);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    logger.error('Error in GET /threads:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

/**
 * GET /thread/:cbid
 * Get a specific thread by cbid for the authenticated user
 */
router.get('/thread/:cbid', async (req: Request, res: Response): Promise<void> => {
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
        error: 'Thread ID is required' 
      });
      return;
    }

    // Use the cbid directly from the authenticated user
    const userCbid = BigInt(req.user!.cbid);

    const result = await threadsService.getThreadById(BigInt(cbid), userCbid);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    logger.error('Error in GET /thread/:cbid:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

/**
 * POST /thread/create
 * Create a new thread for the authenticated user
 */
router.post('/thread/create', async (req: Request, res: Response): Promise<void> => {
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

    const result = await threadsService.createThread(userCbid);
    
    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    logger.error('Error in POST /thread/create:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

export default router; 