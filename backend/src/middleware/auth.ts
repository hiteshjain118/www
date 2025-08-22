import { Request, Response, NextFunction } from 'express';
import { CoralBricksAuthService } from '../services/coralbricksAuth';
import { User, ApiResponse } from '../types';
import { log } from '../utils/logger';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export class AuthMiddleware {
  private authService: CoralBricksAuthService;

  constructor() {
    this.authService = new CoralBricksAuthService();
  }

  /**
   * Middleware to require CoralBricks authentication using cbid
   */
  requireCoralBricksAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const cbid = req.query.cbid as string;
      
      // Validate cbid parameter
      const cbidValidation = this.authService.validateCbid(cbid);
      if (!cbidValidation.success || !cbidValidation.data) {
        log.warn(`Invalid cbid parameter: ${cbidValidation.error}`, { cbid });
        res.status(400).json({
          success: false,
          error: cbidValidation.error || 'Invalid cbid',
          code: cbidValidation.code
        });
        return;
      }

      // Get user info from profiles table
      const userResult = await this.authService.getUserFromProfiles(cbidValidation.data);
      if (!userResult.success || !userResult.data) {
        log.warn(`User not found for cbid: ${cbidValidation.data}`, { error: userResult.error });
        res.status(404).json({
          success: false,
          error: userResult.error || 'User not found',
          code: userResult.code
        });
        return;
      }

      // Add user info to request context
      req.user = userResult.data;
      log.info(`User authenticated: ${userResult.data.email} (cbid: ${cbidValidation.data})`);
      
      next();
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      log.error(`Authentication middleware error: ${errorMessage}`, { error: String(error) });
      
      res.status(500).json({
        success: false,
        error: 'Internal authentication error',
        code: 'AUTH_MIDDLEWARE_ERROR'
      });
    }
  };

  /**
   * Optional authentication middleware - sets user if cbid is provided
   */
  optionalCoralBricksAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const cbid = req.query.cbid as string;
      
      if (!cbid) {
        // No cbid provided, continue without authentication
        next();
        return;
      }

      // Validate cbid parameter
      const cbidValidation = this.authService.validateCbid(cbid);
      if (!cbidValidation.success || !cbidValidation.data) {
        // Invalid cbid, continue without authentication
        log.warn(`Invalid cbid parameter in optional auth: ${cbidValidation.error}`, { cbid });
        next();
        return;
      }

      // Get user info from profiles table
      const userResult = await this.authService.getUserFromProfiles(cbidValidation.data);
      if (userResult.success && userResult.data) {
        // Add user info to request context
        req.user = userResult.data;
        log.info(`User authenticated (optional): ${userResult.data.email} (cbid: ${cbidValidation.data})`);
      } else {
        log.warn(`User not found for cbid in optional auth: ${cbidValidation.data}`, { error: userResult.error });
      }
      
      next();
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      log.error(`Optional authentication middleware error: ${errorMessage}`, { error: String(error) });
      
      // Continue without authentication on error
      next();
    }
  };

  /**
   * Rate limiting middleware
   */
  rateLimit = (req: Request, res: Response, next: NextFunction): void => {
    // TODO: Implement actual rate limiting
    // For now, just continue
    next();
  };

  /**
   * CORS middleware
   */
  cors = (req: Request, res: Response, next: NextFunction): void => {
    // TODO: Implement actual CORS handling
    // For now, just continue
    next();
  };
} 