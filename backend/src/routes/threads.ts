import { Router, Request, Response } from 'express';
import { AuthMiddleware } from '../middleware/auth';
import { ThreadService, PrismaService, MessageService } from 'coralbricks-common';
import { enhancedLogger as logger } from '../utils/logger';

const router = Router();
const authMiddleware = new AuthMiddleware();
const prisma = PrismaService.getInstance();

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

    const result = await ThreadService.getInstance().getThreadsByOwnerId(userCbid);

    res.json(result);
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

    const messages = await MessageService.getInstance().getMessagesByThreadId(BigInt(cbid));
    
    // Get thread info
    const thread = await ThreadService.getInstance().getThread(BigInt(cbid));
    
    if (!thread) {
      res.status(404).json({ 
        success: false, 
        error: 'Thread not found' 
      });
      return;
    }
    
    // Return in the expected format: Thread with messages array
    const result = {
      success: true,
      data: {
        cbId: thread.cbId.toString(),
        ownerId: thread.ownerId.toString(),
        createdAt: thread.createdAt.toISOString(),
        messages: messages.map(msg => ({
          cbId: msg.cbId.toString(),
          threadId: msg.threadId.toString(),
          sender_id: msg.senderId.toString(),
          receiverId: msg.receiverId.toString(),
          body: msg.body,
          createdAt: msg.createdAt.toISOString()
        }))
      }
    };
    
    res.json(result);
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

    const result = await ThreadService.getInstance().createThread({
      ownerId: userCbid
    });
    
    res.status(201).json({
      success: true,
      data: { cbId: result.cbId.toString() }
    });
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