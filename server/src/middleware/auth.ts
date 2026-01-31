// Authentication & Authorization Middleware
// Uses Clerk for JWT verification and role-based access control

import { Request, Response, NextFunction, RequestHandler } from 'express';
import { ClerkExpressRequireAuth, clerkClient } from '@clerk/clerk-sdk-node';
import { userService, UserRole } from '../services/userService.js';
import { env } from '../config/env.js';

// Extend Express Request to include user data and auth
declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
        sessionId?: string;
      };
      user?: {
        id: string;
        clerkId: string;
        email: string;
        role: UserRole;
        isActive: boolean;
      };
    }
  }
}

/**
 * Middleware to require authentication
 * Uses Clerk's built-in JWT verification
 */
export const requireAuth: RequestHandler = ClerkExpressRequireAuth() as unknown as RequestHandler;

/**
 * Middleware to attach user data from database to request
 * Should be used after requireAuth
 */
export const attachUser: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const clerkId = req.auth?.userId;

    if (!clerkId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    let user = await userService.getByClerkId(clerkId);

    if (!user) {
      // User exists in Clerk but not in our database
      // Auto-create the user from Clerk data
      console.log('User not found in DB, fetching from Clerk:', clerkId);

      try {
        const clerkUser = await clerkClient.users.getUser(clerkId);
        const email = clerkUser.emailAddresses[0]?.emailAddress;

        if (!email) {
          res.status(400).json({
            error: 'Invalid user',
            message: 'User has no email address in Clerk.',
          });
          return;
        }

        // Check if this is an admin email
        const adminEmails = env.ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()) || [];
        const isAdmin = adminEmails.includes(email.toLowerCase());

        // Create user in our database
        user = await userService.create({
          clerk_id: clerkId,
          email,
          first_name: clerkUser.firstName || undefined,
          last_name: clerkUser.lastName || undefined,
          phone: clerkUser.phoneNumbers[0]?.phoneNumber || undefined,
          role: isAdmin ? 'admin' : 'student',
        });

        console.log('Auto-created user from Clerk:', user.id, 'role:', user.role);
      } catch (clerkError) {
        console.error('Failed to auto-create user from Clerk:', clerkError);
        res.status(404).json({
          error: 'User not found',
          message: 'Please wait a moment and try again. Your account is being set up.',
        });
        return;
      }
    }

    if (!user.is_active) {
      res.status(403).json({
        error: 'Account deactivated',
        message: 'Your account has been deactivated. Please contact support.',
      });
      return;
    }

    // Attach user to request
    req.user = {
      id: user.id,
      clerkId: user.clerk_id,
      email: user.email,
      role: user.role,
      isActive: user.is_active,
    };

    next();
  } catch (error) {
    console.error('Error attaching user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Middleware to require specific roles
 * Usage: requireRole('admin', 'teacher')
 */
export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `This action requires one of these roles: ${allowedRoles.join(', ')}`,
      });
    }

    next();
  };
};

/**
 * Middleware to require admin role
 */
export const requireAdmin = requireRole('admin');

/**
 * Middleware to require teacher or admin role
 */
export const requireTeacherOrAdmin = requireRole('admin', 'teacher');

/**
 * Middleware to require batch manager, teacher, or admin
 */
export const requireBatchAccess = requireRole('admin', 'teacher', 'batch_manager');

/**
 * Middleware to allow only the owner or admin
 * Useful for profile updates
 */
export const requireOwnerOrAdmin = (
  getOwnerId: (req: Request) => string | undefined
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const ownerId = getOwnerId(req);

    if (req.user.role === 'admin' || req.user.id === ownerId) {
      return next();
    }

    return res.status(403).json({
      error: 'Forbidden',
      message: 'You can only access your own resources',
    });
  };
};

/**
 * Combined middleware: requireAuth + attachUser
 * Use this for most protected routes
 */
export const authenticate = [requireAuth, attachUser];

/**
 * Combined middleware: authenticate + requireAdmin
 */
export const authenticateAdmin = [...authenticate, requireAdmin];

/**
 * Combined middleware: authenticate + requireTeacherOrAdmin
 */
export const authenticateTeacher = [...authenticate, requireTeacherOrAdmin];
