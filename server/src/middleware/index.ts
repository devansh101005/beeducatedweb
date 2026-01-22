// Middleware barrel export
// Created in Phase 0

export { errorHandler, notFoundHandler } from './error.middleware.js';

// Auth middleware (Phase 1)
export {
  requireAuth,
  attachUser,
  requireRole,
  requireAdmin,
  requireTeacherOrAdmin,
  requireBatchAccess,
  requireOwnerOrAdmin,
  authenticate,
  authenticateAdmin,
  authenticateTeacher,
} from './auth.js';
