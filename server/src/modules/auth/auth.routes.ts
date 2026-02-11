// Auth Routes - /api/v2/auth
// Handles user authentication and profile endpoints

import { Router, Request, Response } from 'express';
import { requireAuth, attachUser } from '../../middleware/auth.js';
import { userService } from '../../services/userService.js';
import { sendSuccess, sendNotFound, sendError, sendBadRequest } from '../../shared/utils/response.js';

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

/**
 * PATCH /api/v2/auth/role (DEV ONLY)
 * Change current user's role for testing
 * Only available in development environment
 */
router.patch('/role', requireAuth, attachUser, async (req: Request, res: Response) => {
  try {
    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ success: false, message: 'Not available in production' });
    }

    const { role } = req.body;
    const validRoles = ['admin', 'student', 'teacher', 'parent', 'batch_manager'];

    if (!role || !validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role. Must be one of: ${validRoles.join(', ')}`,
      });
    }

    if (!req.user) {
      return sendNotFound(res, 'User');
    }

    const updatedUser = await userService.updateRole(req.user.id, role);

    sendSuccess(res, {
      message: `Role updated to ${role}`,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role,
      },
    });
  } catch (error) {
    console.error('Error updating role:', error);
    sendError(res, 'Failed to update role');
  }
});

/**
 * PUT /api/v2/auth/profile
 * Update current user's profile (first_name, last_name, phone)
 */
router.put('/profile', requireAuth, attachUser, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return sendNotFound(res, 'User');
    }

    const { first_name, last_name, phone } = req.body;

    const updateData: Record<string, string> = {};
    if (first_name !== undefined) updateData.first_name = String(first_name).trim();
    if (last_name !== undefined) updateData.last_name = String(last_name).trim();
    if (phone !== undefined) updateData.phone = String(phone).trim();

    if (Object.keys(updateData).length === 0) {
      return sendBadRequest(res, 'No fields to update');
    }

    const updated = await userService.update(req.user.id, updateData);

    sendSuccess(res, {
      user: {
        id: updated.id,
        firstName: updated.first_name,
        lastName: updated.last_name,
        phone: updated.phone,
      },
    }, 'Profile updated successfully');
  } catch (error) {
    console.error('Error updating profile:', error);
    sendError(res, 'Failed to update profile');
  }
});

export default router;
