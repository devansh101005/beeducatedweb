// Auth Routes - /api/v2/auth
// Handles user authentication and profile endpoints

import { Router, Request, Response } from 'express';
import { requireAuth, attachUser } from '../../middleware/auth.js';
import { userService } from '../../services/userService.js';
import { sendSuccess, sendNotFound, sendError } from '../../shared/utils/response.js';

const router = Router();

/**
 * GET /api/v2/auth/me
 * Get current authenticated user with their profile
 */
router.get('/me', requireAuth, attachUser, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return sendNotFound(res, 'User');
    }

    const result = await userService.getWithProfile(req.user.clerkId);

    if (!result) {
      return sendNotFound(res, 'User');
    }

    sendSuccess(res, {
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.first_name,
        lastName: result.user.last_name,
        phone: result.user.phone,
        avatarUrl: result.user.avatar_url,
        role: result.user.role,
        isActive: result.user.is_active,
        emailVerified: result.user.email_verified,
        phoneVerified: result.user.phone_verified,
        createdAt: result.user.created_at,
      },
      profile: result.profile,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    sendError(res, 'Failed to fetch user');
  }
});

/**
 * GET /api/v2/auth/session
 * Get current session info (lighter than /me)
 */
router.get('/session', requireAuth, attachUser, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return sendNotFound(res, 'Session');
    }

    sendSuccess(res, {
      userId: req.user.id,
      email: req.user.email,
      role: req.user.role,
      isActive: req.user.isActive,
    });
  } catch (error) {
    console.error('Error fetching session:', error);
    sendError(res, 'Failed to fetch session');
  }
});

/**
 * POST /api/v2/auth/sync-user
 * Manually trigger user sync from Clerk (for edge cases)
 */
router.post('/sync-user', requireAuth, attachUser, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return sendNotFound(res, 'User');
    }

    // User already exists if authenticate passed
    const user = await userService.getByClerkId(req.user.clerkId);

    sendSuccess(res, {
      synced: true,
      user: user,
    });
  } catch (error) {
    console.error('Error syncing user:', error);
    sendError(res, 'Failed to sync user');
  }
});

export default router;
