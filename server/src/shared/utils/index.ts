// Shared utilities barrel export

// Error classes
export {
  AppError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  BadRequestError,
  ValidationError,
  ConflictError,
  DatabaseError,
} from './errors.js';

// Response helpers
export {
  sendSuccess,
  sendCreated,
  sendError,
  sendNotFound,
  sendUnauthorized,
  sendForbidden,
  sendBadRequest,
  sendValidationError,
  sendPaginated,
} from './response.js';
export type { ApiResponse, PaginatedData } from './response.js';

// Supabase helpers
export {
  unwrapJoinOne,
  unwrapJoinMany,
  isSupabaseError,
  castJoinResult,
  createJoinMapper,
} from './supabaseHelpers.js';
