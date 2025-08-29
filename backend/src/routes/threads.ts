import { Router, Request, Response } from 'express';
import { AuthMiddleware } from '../middleware/auth';
import { threadsService } from '../services/threadsService';
import { PrismaService } from '../services/prismaService';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const router = Router();
const authMiddleware = new AuthMiddleware();
const prisma = new PrismaClient();

// Apply auth middleware to all routes
router.use(authMiddleware.requireCoralBricksAuth);

/**
 * GET /threads
 * Get all threads for the authenticated user
 */
router.get('/threads', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user?.cbid) {
      res.status(401).json({ 
        success: false, 
        error: 'User not authenticated' 
      });
      return;
    }

    // Use the cbid directly from the authenticated user
    const userCbid = BigInt(req.user.cbid);

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
    if (!req.user?.cbid) {
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
    const userCbid = BigInt(req.user.cbid);

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
    if (!req.user?.cbid) {
      res.status(401).json({ 
        success: false, 
        error: 'User not authenticated' 
      });
      return;
    }

    // Use the cbid directly from the authenticated user
    const userCbid = BigInt(req.user.cbid);

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

/**
 * POST /thread/:cbid/message
 * Create a new message in a thread
 */
router.post('/thread/:cbid/message', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user?.cbid) {
      res.status(401).json({ 
        success: false, 
        error: 'User not authenticated' 
      });
      return;
    }

    const threadCbid = req.params.cbid;
    const { body, receiverId } = req.body;

    if (!threadCbid || !body) {
      res.status(400).json({ 
        success: false, 
        error: 'Thread ID and message body are required' 
      });
      return;
    }

    // Use the cbid directly from the authenticated user as sender
    const senderCbid = BigInt(req.user.cbid);
    const receiverCbid = receiverId ? BigInt(receiverId) : BigInt(0); // Use 0 for AI messages

    const newMessage = await prisma.message.create({
      data: {
        threadId: BigInt(threadCbid),
        senderId: senderCbid,
        receiverId: receiverCbid,
        body: body
      }
    });

    logger.info(`Created new message ${newMessage.cbId} in thread ${threadCbid}`);
    
    res.status(201).json({
      success: true,
      data: { cbId: newMessage.cbId.toString() }
    });
    
  } catch (error) {
    logger.error('Error in POST /thread/:cbid/message:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

export default router; 