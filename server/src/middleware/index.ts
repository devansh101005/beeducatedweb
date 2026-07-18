// Middleware barrel export

export { errorHandler, notFoundHandler } from './error.middleware.js';

// Auth middleware
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
