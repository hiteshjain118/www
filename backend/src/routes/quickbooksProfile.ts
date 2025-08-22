import { Router, Request, Response } from 'express';
import { QuickBooksAuthService } from '../services/quickbooksAuth';
import { log } from '../utils/logger';

const router = Router();
const qboService = new QuickBooksAuthService();

/**
 * DELETE /quickbooks/profile/disconnect/:realmId
 * Disconnect a QuickBooks company
 */
router.delete('/disconnect/:realmId', async (req: Request, res: Response): Promise<void> => {
  try {
    const realmId = req.params.realmId;
    const cbid = req.query.cbid as string;
    
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
    
    log.info(`Disconnecting QuickBooks company for cbid: ${cbidBigInt} (realm: ${realmId})`);
    
    const disconnectResult = await qboService.disconnectCompany(realmId);
    
    if (disconnectResult.success) {
      log.info(`Successfully disconnected from QuickBooks company for cbid: ${cbidBigInt} (realm: ${realmId})`);
      
      res.json({
        success: true,
        message: 'Successfully disconnected from QuickBooks company',
        realm_id: realmId,
        cbid: cbidBigInt
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
    const cbid = req.query.cbid as string;
    
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

    log.info(`Fetching QuickBooks companies for cbid: ${cbidBigInt}`);
    
    const companiesResult = await qboService.getCompanies(cbidBigInt);
    
    if (companiesResult.success && companiesResult.data) {
      res.json({
        success: true,
        data: companiesResult.data,
        message: `Found ${companiesResult.data.length} connected companies`,
        cbid: cbidBigInt.toString()
      });
    } else {
      res.status(500).json({
        success: false,
        error: companiesResult.error || 'Failed to fetch companies',
        code: companiesResult.code
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
router.get('/status/:realmId', async (req: Request, res: Response): Promise<void> => {
  try {
    const realmId = req.params.realmId;
    const cbid = req.query.cbid as string;
    
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
    
    log.info(`Checking QuickBooks company status for cbid: ${cbidBigInt} (realm: ${realmId})`);
    
    const connectionResult = await qboService.isCompanyConnected(realmId);
    
    if (connectionResult.success) {
      const isConnected = connectionResult.data;
      
      if (isConnected) {
        const tokenResult = await qboService.getValidAccessToken(realmId);
        const hasValidToken = tokenResult.success && tokenResult.data !== null;
        
        res.json({
          success: true,
          connected: true,
          has_valid_token: hasValidToken,
          realm_id: realmId,
          cbid: cbidBigInt
        });
      } else {
        res.json({
          success: true,
          connected: false,
          realm_id: realmId,
          cbid: cbidBigInt
        });
      }
    } else {
      res.status(500).json({
        success: false,
        error: connectionResult.error || 'Failed to check connection status',
        code: connectionResult.code
      });
    }
    
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
    const cbid = req.query.cbid as string;
    
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

    log.info(`Fetching QuickBooks user info for cbid: ${cbidBigInt}`);
    
    // Check if user has any QuickBooks connections
    const companiesResult = await qboService.getCompanies(cbidBigInt);
    
    if (companiesResult.success && companiesResult.data && companiesResult.data.length > 0) {
      // Get the first connected company
      const realmId = companiesResult.data[0].realm_id;
      const connectionResult = await qboService.isCompanyConnected(realmId);
      
      if (connectionResult.success && connectionResult.data) {
        const tokenResult = await qboService.getValidAccessToken(realmId);
        const hasValidToken = tokenResult.success && tokenResult.data !== null;
        
        res.json({
          success: true,
          data: {
            realm_id: realmId,
            connected: true,
            has_valid_token: hasValidToken,
            cbid: cbidBigInt.toString()
          }
        });
      } else {
        res.json({
          success: true,
          data: {
            realm_id: realmId,
            connected: false,
            cbid: cbidBigInt.toString()
          }
        });
      }
    } else {
      res.json({
        success: true,
        data: {
          connected: false,
          message: 'No QuickBooks companies connected',
          cbid: cbidBigInt.toString()
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