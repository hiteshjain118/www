import { Router, Request, Response } from 'express';
import { QuickBooksAuthService } from '../qbo/quickbooksAuth';
import { AuthMiddleware } from '../middleware/auth';
import { enhancedLogger as log } from '../utils/logger';
import { config } from '../config';
import { QBProfile } from '../types/profiles';

const router = Router();
const qboService = new QuickBooksAuthService();
const authMiddleware = new AuthMiddleware();

/**
 * GET /quickbooks/login
 * Initiate QuickBooks OAuth flow
 */
router.get('/login', authMiddleware.requireCoralBricksAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated',
        code: 'USER_NOT_AUTHENTICATED'
      });
      return;
    }

    // Generate OAuth authorization URL
    const authUrl = qboService.generateAuthUrl(BigInt(req.user.cbid));
    
    log.info(`QuickBooks OAuth initiated for user: ${req.user.email} (cbid: ${req.user.cbid})`);
    
    res.json({
      success: true,
      data: {
        auth_url: authUrl
      },
      message: 'Redirect user to this URL for QuickBooks authorization',
      user_id: req.user.id || 'unknown', // Handle optional id field
      cbid: req.user.cbid.toString()
    });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    log.error(`QuickBooks OAuth initiation error: ${errorMessage}`, { error: String(error) });
    
    res.status(500).json({
      success: false,
      error: `Error initiating QuickBooks authentication: ${errorMessage}`,
      code: 'QBO_INIT_ERROR'
    });
  }
});

/**
 * GET /quickbooks/callback
 * Handle OAuth callback from QuickBooks
 */
router.get('/callback', async (req: Request, res: Response): Promise<void> => {
  try {
    const code = req.query.code as string;
    const state = req.query.state as string;
    const realmId = req.query.realmId as string;
    
    if (!code) {
      res.redirect(`${config.frontendUrl}/profile?error=missing_auth_code`);
      return;
    }
    
    if (!realmId) {
      res.redirect(`${config.frontendUrl}/profile?error=missing_realm_id`);
      return;
    }
    
    if (!state) {
      res.redirect(`${config.frontendUrl}/profile?error=missing_state`);
      return;
    }
    
    // Extract cbid from state parameter
    const ownerId = BigInt(state);
    
    log.info(`QuickBooks OAuth callback received for ownerId: ${ownerId} (realm: ${realmId})`);
    
    // Exchange code for tokens
    const tokenResult = await qboService.exchangeCodeForTokens(code, realmId);
    
    if (tokenResult.success && tokenResult.data) {
      // Store tokens
      // get logged in coralbricks user here 
      const profile = await QBProfile.upsert_from_realm_id(
        {
          cbid: ownerId
        },
        realmId, 
        tokenResult.data,         
      );
      
      log.info(`Successfully connected to QuickBooks company for ownerId: ${ownerId} (realm: ${realmId}), qbProfile: ${profile.cbId.toString()}`);
      
      // Redirect back to frontend profile page with success message
      res.redirect(`${config.frontendUrl}/profile?connected=true&realm_id=${realmId}`);
    } else {
      // Redirect back to frontend profile page with connection error
      res.redirect(`${config.frontendUrl}/profile?error=connection_failed`);
    }
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    log.error(`QuickBooks OAuth callback error: ${errorMessage}`, { error: String(error) });
    
    // Redirect back to frontend profile page with general error
    res.redirect(`${config.frontendUrl}/profile?error=callback_error`);
  }
});

export default router; 