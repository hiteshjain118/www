import { Router, Request, Response } from 'express';
import { ProfileService } from 'coralbricks-common';
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

    // Get user profile using ProfileService singleton
    const profileService = ProfileService.getInstance();
    
    try {
      const cbUser = await profileService.getUserProfile(cbidBigInt);
      
      if (cbUser) {
        // Convert BigInt values to strings for JSON serialization
        const profileResponse = {
          success: true,
          data: {
            cbid: cbUser.id.toString(),
            time_zone: cbUser.timeZone,
            created_at: cbUser.createdAt,
            auth_user_id: cbUser.authUserId,
            viewer_context: {
              cbid: cbUser.id.toString(),
            },
            // Include the profile data as static properties for JSON response
            full_name: `${cbUser.firstName || ''} ${cbUser.lastName || ''}`.trim(),
            email: cbUser.email || '',
            phone: '', // Not available in Profile
            timezone: cbUser.timeZone || 'UTC'
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