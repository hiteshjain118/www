import { Router, Request, Response } from 'express';
import { QuickBooksAuthService } from '../qbo/quickbooksAuth';
import { log } from '../utils/logger';
import { CBUser, QBProfile } from '../types/profiles';

const router = Router();
const qboService = new QuickBooksAuthService();

/**
 * DELETE /quickbooks/profile/disconnect/:realmId
 * Disconnect a QuickBooks company
 */
router.delete('/disconnect/:cbid/:qbo_profile_id', async (req: Request, res: Response): Promise<void> => {
  try {
    const ownerId = BigInt(req.params.cbid);
    const qbo_profile_id = BigInt(req.params.qbo_profile_id);
    
    if (!ownerId || !qbo_profile_id) {
      res.status(400).json({
        success: false,
        error: 'cbid and qbo_profile_id parameters are required',
        code: 'MISSING_PARAMETERS'
      });
      return;
    }
    
    log.info(`Disconnecting QuickBooks company for cbid: ${qbo_profile_id} (ownerId: ${ownerId})`);
    
    const qbo_profile = await QBProfile.load_profile({cbid: ownerId}, qbo_profile_id);
    const disconnectResult = await qbo_profile.disconnectCompany();
    
    if (disconnectResult) {
      log.info(`Successfully disconnected from QuickBooks company for cbid: ${qbo_profile_id} (ownerId: ${ownerId})`);
      
      res.json({
        success: true,
        message: 'Successfully disconnected from QuickBooks company',
        qbo_profile_id: qbo_profile_id,
        ownerId: ownerId
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to disconnect from QuickBooks company',
        code: 'QBO_DISCONNECT_ERROR'
      });
    }
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    log.error(`QuickBooks disconnect error: ${errorMessage}`, { error: String(error) });
    
    res.status(500).json({
      success: false,
      error: `Error disconnecting company: ${errorMessage}`,
      code: 'QBO_DISCONNECT_ERROR'
    });
  }
});

/**
 * GET /quickbooks/profile/companies
 * Get list of connected QuickBooks companies
 */
router.get('/companies', async (req: Request, res: Response): Promise<void> => {
  try {
    const ownerId = BigInt(req.query.cbid as string);
    
    if (!ownerId) {
      res.status(400).json({
        success: false,
        error: 'cbid parameter is required',
        code: 'MISSING_PARAMETERS'
      });
      return;
    }

    
    log.info(`Fetching QuickBooks companies for cbid: ${ownerId}`);
    
    const companiesResult = await QBProfile.getCompanies(ownerId);
    
    if (companiesResult) {
      res.json({
        success: true,
        data: companiesResult,
        message: `Found ${companiesResult.length} connected companies`,
        cbid: ownerId.toString()
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch companies',
        code: 'COMPANIES_FETCH_ERROR'
      });
    }
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    log.error(`Fetch companies error: ${errorMessage}`, { error: String(error) });
    
    res.status(500).json({
      success: false,
      error: `Failed to fetch companies: ${errorMessage}`,
      code: 'COMPANIES_FETCH_ERROR'
    });
  }
});

/**
 * GET /quickbooks/profile/status/:realmId
 * Check QuickBooks company connection status
 */
router.get('/status/:cbid/:qbo_profile_id', async (req: Request, res: Response): Promise<void> => {
  try {
    const qbo_profile_id = BigInt(req.params.qbo_profile_id);
    const ownerId = BigInt(req.params.cbid);
    
    if (!ownerId || !qbo_profile_id) {
      res.status(400).json({
        success: false,
        error: 'cbid and qbo_profile_id parameters are required',
        code: 'MISSING_PARAMETERS'
      });
      return;
    }
    
    log.info(`Checking QuickBooks company status for cbid: ${qbo_profile_id} (ownerId: ${ownerId})`);
    
    const qbo_profile = await QBProfile.load_profile({cbid: ownerId}, qbo_profile_id);
    const access_token = await qbo_profile.getValidAccessTokenWithRefresh();
      
    res.json({
      success: true,
      connected: access_token !== null,
      qbo_profile_id: qbo_profile_id,
      ownerId: ownerId
    });
    
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    log.error(`Check company status error: ${errorMessage}`, { error: String(error) });
    
    res.status(500).json({
      success: false,
      error: `Failed to check company status: ${errorMessage}`,
      code: 'STATUS_CHECK_ERROR'
    });
  }
});

/**
 * GET /quickbooks/profile/user
 * Get QuickBooks user information
 */
router.get('/user', async (req: Request, res: Response): Promise<void> => {
  try {
    const ownerId = BigInt(req.query.cbid as string);
    
    if (!ownerId) {
      res.status(400).json({
        success: false,
        error: 'cbid parameter is required',
        code: 'MISSING_CBID'
      });
      return;
    }

    log.info(`Fetching QuickBooks user info for cbid: ${ownerId}`);
    
    const cb_user = await CBUser.load_profile({cbid: ownerId}, ownerId);
    const qbo_profile = await QBProfile.load_any_from_cb_owner({cbid: ownerId}, cb_user);
    if (qbo_profile) {
      const is_connected = await qbo_profile.isCompanyConnected();
      const realmId = qbo_profile.realmId;
        res.json({
          success: true,
          data: {
            realm_id: realmId,
            connected: true,
            has_valid_token: is_connected,
            qbo_profile_id: qbo_profile.cbId.toString(),
            cbid: ownerId.toString()
          }
        });
    } else {
      res.json({
        success: true,
        data: {
          connected: false,
          message: 'No QuickBooks companies connected',
          cbid: ownerId.toString()
        }
      });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    log.error(`Get QuickBooks user info error: ${errorMessage}`, { error: String(error) });
    
    res.status(500).json({
      success: false,
      error: `Failed to get QuickBooks user info: ${errorMessage}`,
      code: 'QBO_USER_INFO_ERROR'
    });
  }
});

export default router; 