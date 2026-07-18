// Admin user management routes — mounted under /api/v2/admin
// Admin auth (requireAuth + attachUser + requireAdmin) is enforced by the parent router.

import { Router, Request, Response } from 'express';
import { clerkClient } from '@clerk/clerk-sdk-node';
import { userService, UserRole } from '../../../services/userService.js';
import { studentService } from '../../../services/studentService.js';
import { teacherService } from '../../../services/teacherService.js';
import { parentService } from '../../../services/parentService.js';
import { getParam } from '../../../shared/utils/params.js';
import {
  sendSuccess,
  sendCreated,
  sendNotFound,
  sendError,
  sendBadRequest,
  sendPaginated,
} from '../../../shared/utils/response.js';

const router = Router();

// ============================================
// USER MANAGEMENT
// ============================================

/**
 * GET /api/v2/admin/users
 * List all users with pagination and filters
 */
router.get('/users', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const role = req.query.role as UserRole | undefined;
    const isActive = req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined;
    const search = req.query.search as string | undefined;

    const result = await userService.list({ page, limit, role, isActive, search });

    sendPaginated(res, result.users, result.total, page, limit);
  } catch (error) {
    console.error('Error listing users:', error);
    sendError(res, 'Failed to list users');
  }
});

/**
 * GET /api/v2/admin/users/:id
 * Get user by ID with profile
 */
router.get('/users/:id', async (req: Request, res: Response) => {
  try {
    const userId = getParam(req.params.id);
    const user = await userService.getById(userId);

    if (!user) {
      return sendNotFound(res, 'User');
    }

    // Get profile based on role
    let profile = null;
    switch (user.role) {
      case 'student':
        profile = await studentService.getByUserId(user.id);
        break;
      case 'teacher':
        profile = await teacherService.getByUserId(user.id);
        break;
      case 'parent':
        profile = await parentService.getByUserId(user.id);
        break;
    }

    sendSuccess(res, { user, profile });
  } catch (error) {
    console.error('Error fetching user:', error);
    sendError(res, 'Failed to fetch user');
  }
});

/**
 * POST /api/v2/admin/users
 * Create a new user (creates in Clerk first, then syncs to Supabase)
 */
router.post('/users', async (req: Request, res: Response) => {
  try {
    const { email, firstName, lastName, phone, password, role = 'student' } = req.body;

    if (!email || !password) {
      return sendBadRequest(res, 'Email and password are required');
    }

    // Create user in Clerk
    const clerkUser = await clerkClient.users.createUser({
      emailAddress: [email],
      firstName,
      lastName,
      password,
    });

    // Create user in Supabase
    const user = await userService.create({
      clerk_id: clerkUser.id,
      email,
      first_name: firstName,
      last_name: lastName,
      phone,
      role: role as UserRole,
    });

    sendCreated(res, user, 'User created successfully');
  } catch (error: unknown) {
    console.error('Error creating user:', error);

    // Handle Clerk errors
    if (error && typeof error === 'object' && 'errors' in error) {
      const clerkError = error as { errors: Array<{ message: string }> };
      const messages = clerkError.errors.map((e) => e.message).join(', ');
      return sendBadRequest(res, messages);
    }

    sendError(res, 'Failed to create user');
  }
});

/**
 * PUT /api/v2/admin/users/:id
 * Update user details
 */
router.put('/users/:id', async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, phone, role, isActive } = req.body;
    const userId = getParam(req.params.id);

    const existingUser = await userService.getById(userId);
    if (!existingUser) {
      return sendNotFound(res, 'User');
    }

    // Update in Clerk (name and/or role)
    const clerkUpdate: Record<string, any> = {};
    if (firstName !== undefined) clerkUpdate.firstName = firstName;
    if (lastName !== undefined) clerkUpdate.lastName = lastName;
    if (role !== undefined) {
      clerkUpdate.publicMetadata = { ...((await clerkClient.users.getUser(existingUser.clerk_id)).publicMetadata || {}), role };
    }
    if (Object.keys(clerkUpdate).length > 0) {
      await clerkClient.users.updateUser(existingUser.clerk_id, clerkUpdate);
    }

    // Update in Supabase
    const user = await userService.update(userId, {
      first_name: firstName,
      last_name: lastName,
      phone,
      role,
      is_active: isActive,
    });

    sendSuccess(res, user, 'User updated successfully');
  } catch (error) {
    console.error('Error updating user:', error);
    sendError(res, 'Failed to update user');
  }
});

/**
 * PUT /api/v2/admin/users/:id/role
 * Update user role
 */
router.put('/users/:id/role', async (req: Request, res: Response) => {
  try {
    const { role } = req.body;
    const userId = getParam(req.params.id);

    if (!role || !['admin', 'student', 'parent', 'teacher', 'batch_manager'].includes(role)) {
      return sendBadRequest(res, 'Invalid role');
    }

    const existingUser = await userService.getById(userId);
    if (!existingUser) {
      return sendNotFound(res, 'User');
    }

    // Sync role to Clerk publicMetadata
    const clerkUser = await clerkClient.users.getUser(existingUser.clerk_id);
    await clerkClient.users.updateUser(existingUser.clerk_id, {
      publicMetadata: { ...(clerkUser.publicMetadata || {}), role },
    });

    const user = await userService.updateRole(userId, role as UserRole);

    sendSuccess(res, user, 'Role updated successfully');
  } catch (error) {
    console.error('Error updating role:', error);
    sendError(res, 'Failed to update role');
  }
});

/**
 * DELETE /api/v2/admin/users/:id
 * Deactivate user (soft delete)
 */
router.delete('/users/:id', async (req: Request, res: Response) => {
  try {
    const userId = getParam(req.params.id);
    const user = await userService.getById(userId);
    if (!user) {
      return sendNotFound(res, 'User');
    }

    // Prevent self-deactivation
    if (user.id === req.user?.id) {
      return sendBadRequest(res, 'Cannot deactivate your own account');
    }

    await userService.deactivate(userId);

    sendSuccess(res, null, 'User deactivated successfully');
  } catch (error) {
    console.error('Error deactivating user:', error);
    sendError(res, 'Failed to deactivate user');
  }
});

/**
 * POST /api/v2/admin/users/:id/reactivate
 * Reactivate a deactivated user
 */
router.post('/users/:id/reactivate', async (req: Request, res: Response) => {
  try {
    const userId = getParam(req.params.id);
    const user = await userService.getById(userId);
    if (!user) {
      return sendNotFound(res, 'User');
    }

    await userService.reactivate(userId);

    sendSuccess(res, null, 'User reactivated successfully');
  } catch (error) {
    console.error('Error reactivating user:', error);
    sendError(res, 'Failed to reactivate user');
  }
});

/**
 * POST /api/v2/admin/users/:id/reset-password
 * Note: Clerk doesn't support programmatic password reset.
 * Users should use the forgot password flow.
 */
router.post('/users/:id/reset-password', async (req: Request, res: Response) => {
  try {
    const userId = getParam(req.params.id);
    const user = await userService.getById(userId);
    if (!user) {
      return sendNotFound(res, 'User');
    }

    // Note: Clerk doesn't have a direct "send password reset" API from backend
    // The user should use the forgot password flow on the frontend
    sendSuccess(res, null, 'User should use the forgot password option on the sign-in page.');
  } catch (error) {
    console.error('Error resetting password:', error);
    sendError(res, 'Failed to reset password');
  }
});


export default router;
