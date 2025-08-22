import { Router, Request, Response } from 'express';
import { PrismaService } from '../services/prismaService';
import { log } from '../utils/logger';

const router = Router();

/**
 * GET /profile/:cbid
 * Get user profile information using cbid parameter
 */
router.get('/:cbid', async (req: Request, res: Response): Promise<void> => {
  try {
    const { cbid } = req.params;
    
    if (!cbid) {
      res.status(400).json({
        success: false,
        error: 'cbid parameter is required',
        code: 'MISSING_CBID'
      });
      return;
    }

    // Parse cbid as bigint
    let cbidBigInt: bigint;
    try {
      cbidBigInt = BigInt(cbid);
    } catch (error) {
      res.status(400).json({
        success: false,
        error: 'cbid parameter must be a valid integer',
        code: 'INVALID_CBID'
      });
      return;
    }

    // Get user profile using PrismaService singleton
    const prismaService = PrismaService.getInstance();
    
    try {
      const cbUser = await prismaService.getUserProfile(cbidBigInt);
      
      if (cbUser) {
        // Convert BigInt values to strings for JSON serialization
        const profileResponse = {
          success: true,
          data: {
            id: cbUser.id.toString(),
            cbid: cbUser.cbid.toString(),
            time_zone: cbUser.time_zone,
            created_at: cbUser.created_at,
            auth_user_id: cbUser.auth_user_id,
            viewer_context: {
              cbid: cbUser.viewer_context.cbid.toString(),
            },
            // Include the method results as static properties for JSON response
            full_name: cbUser.get_full_name(),
            email: cbUser.get_email(),
            phone: cbUser.get_phone(),
            timezone: cbUser.get_timezone()
          }
        };
        
        res.json(profileResponse);
      } else {
        res.status(404).json({
          success: false,
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }
    } catch (error) {
      // Don't disconnect here since we're using singleton
      throw error;
    }
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    log.error(`Get profile error: ${errorMessage}`, { error: String(error) });
    
    res.status(500).json({
      success: false,
      error: `Failed to get profile: ${errorMessage}`,
      code: 'PROFILE_ERROR'
    });
  }
});

export default router; 