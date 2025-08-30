import { Router, Request, Response } from 'express';
import { CoralBricksAuthService } from '../services/coralbricksAuth';
import { AuthMiddleware } from '../middleware/auth';
import { LoginRequest, SignupRequest, ApiResponse } from '../types';
import { enhancedLogger as log } from '../utils/logger';

const router = Router();
const authService = new CoralBricksAuthService();
const authMiddleware = new AuthMiddleware();

/**
 * POST /login
 * Login to CoralBricks with email/password
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password }: LoginRequest = req.body;
    
    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: 'Email and password are required',
        code: 'MISSING_CREDENTIALS'
      });
      return;
    }

    log.info(`Login attempt for email: ${email}`);
    
    // Authenticate with Supabase
    const userData = await authService.getSupabaseToken(email, password);
    
    if (userData.success && userData.data) {
      res.json({
        success: true,
        message: 'Login successful',
        user: {
          id: userData.data.user_id,
          email: userData.data.email,
          role: userData.data.role,
          cbid: userData.data.cbid.toString() // Convert BigInt to string
        }
      });
    } else {
      res.status(401).json({
        success: false,
        error: userData.error || 'Authentication failed',
        code: userData.code
      });
    }
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    log.error(`Login error: ${errorMessage}`, { error: String(error) });
    
    res.status(500).json({
      success: false,
      error: `Login failed: ${errorMessage}`,
      code: 'LOGIN_ERROR'
    });
  }
});

/**
 * POST /signup
 * Sign up new user to CoralBricks with email/password
 */
router.post('/signup', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, firstName, lastName }: SignupRequest = req.body;
    
    if (!email || !password || !firstName || !lastName) {
      res.status(400).json({
        success: false,
        error: 'Email, password, first name, and last name are required',
        code: 'MISSING_CREDENTIALS'
      });
      return;
    }

    log.info(`Signup attempt for email: ${email}`);
    
    // Create user in Supabase
    const signupResult = await authService.createSupabaseUser(email, password, firstName, lastName);
    
    if (signupResult.success && signupResult.data) {
              // Check if email verification is required
        if (signupResult.data.role === 'pending_verification') {
          res.json({
            success: true,
            message: 'Account created successfully! Please check your email to verify your account before signing in.',
            user: {
              id: signupResult.data.user_id,
              email: signupResult.data.email,
              role: signupResult.data.role,
              cbid: signupResult.data.cbid.toString() // Convert BigInt to string
            },
            requiresVerification: true
          });
        } else {
          // User is immediately authenticated
          res.json({
            success: true,
            message: 'Signup successful',
            user: {
              id: signupResult.data.user_id,
              email: signupResult.data.email,
              role: signupResult.data.role,
              cbid: signupResult.data.cbid.toString() // Convert BigInt to string
            }
          });
        }
    } else {
      res.status(400).json({
        success: false,
        error: signupResult.error || 'Signup failed',
        code: signupResult.code
      });
    }
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    log.error(`Signup error: ${errorMessage}`, { error: String(error) });
    
    res.status(500).json({
      success: false,
      error: `Signup failed: ${errorMessage}`,
      code: 'SIGNUP_ERROR'
    });
  }
});

/**
 * GET /profile/:cbid/qbo
 * Get QuickBooks profile and companies for a user
 */
router.get('/profile/:cbid/qbo', async (req: Request, res: Response): Promise<void> => {
  try {
    const cbid = BigInt(req.params.cbid);
    
    log.info(`Fetching QuickBooks profile for cbid: ${cbid}`);
    
    // TODO: Replace with actual database queries to get QB profile and companies
    // For now, return mock data - in production this would query your database
    
    const mockQbProfile = {
      realm_id: 'mock-realm-123',
      connected: true,
      has_valid_token: true,
      user_id: 'mock-qb-user-456',
      cbid: cbid.toString() // Convert BigInt to string
    };
    
    const mockQbCompanies = [
      {
        realm_id: 'mock-realm-123',
        company_name: 'Mock Company Inc.',
        connected: true,
        last_connected: new Date().toISOString()
      },
      {
        realm_id: 'mock-realm-456',
        company_name: 'Another Company LLC',
        connected: false,
        last_connected: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days ago
      }
    ];
    
    res.json({
      success: true,
      profile: mockQbProfile,
      companies: mockQbCompanies
    });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    log.error(`Error fetching QuickBooks profile: ${errorMessage}`, { error: String(error) });
    
    res.status(500).json({
      success: false,
      error: `Failed to fetch QuickBooks profile: ${errorMessage}`,
      code: 'QBO_PROFILE_FETCH_ERROR'
    });
  }
});

export default router; 