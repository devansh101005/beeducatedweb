// Parent Routes - /api/v2/parents
// Handles parent profile and child management operations

import { Router, Request, Response } from 'express';
import { requireAuth, attachUser, requireAdmin } from '../../middleware/auth.js';
import { parentService } from '../../services/parentService.js';
import { studentService } from '../../services/studentService.js';
import {
  sendSuccess,
  sendCreated,
  sendNotFound,
  sendError,
  sendBadRequest,
  sendPaginated,
} from '../../shared/utils/response.js';

// Helper to get string param (Express 5 can return string | string[])
const getParam = (param: string | string[] | undefined): string => {
  if (Array.isArray(param)) return param[0];
  return param || '';
};

const router = Router();

// ============================================
// PARENT PROFILE
// ============================================

/**
 * GET /api/v2/parents
 * List parents (admin only)
 */
router.get('/', requireAuth, attachUser, requireAdmin, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string | undefined;

    const result = await parentService.list({ page, limit, search });

    sendPaginated(res, result.parents, result.total, page, limit);
  } catch (error) {
    console.error('Error listing parents:', error);
    sendError(res, 'Failed to list parents');
  }
});

/**
 * GET /api/v2/parents/me
 * Get current parent's own profile
 */
router.get('/me', requireAuth, attachUser, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return sendBadRequest(res, 'User not authenticated');
    }

    const parent = await parentService.getByUserId(req.user.id);
    if (!parent) {
      return sendNotFound(res, 'Parent profile');
    }

    sendSuccess(res, parent);
  } catch (error) {
    console.error('Error fetching own profile:', error);
    sendError(res, 'Failed to fetch profile');
  }
});

/**
 * GET /api/v2/parents/:id
 * Get parent by ID
 */
router.get('/:id', requireAuth, attachUser, async (req: Request, res: Response) => {
  try {
    const parentId = getParam(req.params.id);

    const parent = await parentService.getById(parentId);
    if (!parent) {
      return sendNotFound(res, 'Parent');
    }

    // Parents can only view their own profile, admins can view any
    const isOwner = req.user?.role === 'parent' && parent.user_id === req.user.id;
    const isAdmin = req.user?.role === 'admin';

    if (!isOwner && !isAdmin) {
      return sendBadRequest(res, 'Not authorized to view this parent');
    }

    sendSuccess(res, parent);
  } catch (error) {
    console.error('Error fetching parent:', error);
    sendError(res, 'Failed to fetch parent');
  }
});

/**
 * PUT /api/v2/parents/:id
 * Update parent profile
 */
router.put('/:id', requireAuth, attachUser, async (req: Request, res: Response) => {
  try {
    const parentId = getParam(req.params.id);
    const { occupation, address, city, state, pincode, metadata } = req.body;

    const existingParent = await parentService.getById(parentId);
    if (!existingParent) {
      return sendNotFound(res, 'Parent');
    }

    // Check permissions - parents can update their own, admins can update any
    const isOwner = req.user?.role === 'parent' && existingParent.user_id === req.user.id;
    const isAdmin = req.user?.role === 'admin';

    if (!isOwner && !isAdmin) {
      return sendBadRequest(res, 'Not authorized to update this parent');
    }

    const parent = await parentService.update(parentId, {
      occupation,
      address,
      city,
      state,
      pincode,
      metadata,
    });

    sendSuccess(res, parent, 'Profile updated successfully');
  } catch (error) {
    console.error('Error updating parent:', error);
    sendError(res, 'Failed to update parent');
  }
});

// ============================================
// CHILDREN MANAGEMENT
// ============================================

/**
 * GET /api/v2/parents/:id/children
 * Get parent's linked children (students)
 */
router.get('/:id/children', requireAuth, attachUser, async (req: Request, res: Response) => {
  try {
    const parentId = getParam(req.params.id);

    const parent = await parentService.getById(parentId);
    if (!parent) {
      return sendNotFound(res, 'Parent');
    }

    // Parents can only view their own children, admins can view any
    const isOwner = req.user?.role === 'parent' && parent.user_id === req.user.id;
    const isAdmin = req.user?.role === 'admin';

    if (!isOwner && !isAdmin) {
      return sendBadRequest(res, 'Not authorized to view this parent\'s children');
    }

    const children = await parentService.getChildren(parentId);
    sendSuccess(res, children);
  } catch (error) {
    console.error('Error fetching children:', error);
    sendError(res, 'Failed to fetch children');
  }
});

/**
 * POST /api/v2/parents/:id/link-child
 * Link a parent to a student
 */
router.post('/:id/link-child', requireAuth, attachUser, async (req: Request, res: Response) => {
  try {
    const parentId = getParam(req.params.id);
    const { studentId, relationship = 'parent', isPrimary = false } = req.body;

    if (!studentId) {
      return sendBadRequest(res, 'studentId is required');
    }

    const parent = await parentService.getById(parentId);
    if (!parent) {
      return sendNotFound(res, 'Parent');
    }

    // Only admins can link parents to students
    if (req.user?.role !== 'admin') {
      return sendBadRequest(res, 'Only admins can link parents to students');
    }

    const student = await studentService.getById(studentId);
    if (!student) {
      return sendNotFound(res, 'Student');
    }

    const link = await parentService.linkChild(parentId, studentId, relationship, isPrimary);
    sendCreated(res, link, 'Parent linked to student successfully');
  } catch (error: unknown) {
    console.error('Error linking parent to student:', error);
    const message = error instanceof Error ? error.message : 'Failed to link parent to student';
    sendError(res, message);
  }
});

/**
 * DELETE /api/v2/parents/:id/children/:studentId
 * Unlink a parent from a student (admin only)
 */
router.delete('/:id/children/:studentId', requireAuth, attachUser, requireAdmin, async (req: Request, res: Response) => {
  try {
    const parentId = getParam(req.params.id);
    const studentId = getParam(req.params.studentId);

    await parentService.unlinkChild(parentId, studentId);
    sendSuccess(res, null, 'Parent unlinked from student');
  } catch (error: unknown) {
    console.error('Error unlinking parent from student:', error);
    const message = error instanceof Error ? error.message : 'Failed to unlink parent from student';
    sendError(res, message);
  }
});

/**
 * PUT /api/v2/parents/:id/children/:studentId/primary
 * Set a parent as primary contact for a student (admin only)
 */
router.put('/:id/children/:studentId/primary', requireAuth, attachUser, requireAdmin, async (req: Request, res: Response) => {
  try {
    const parentId = getParam(req.params.id);
    const studentId = getParam(req.params.studentId);

    await parentService.setPrimaryContact(parentId, studentId);
    sendSuccess(res, null, 'Primary contact updated');
  } catch (error) {
    console.error('Error setting primary contact:', error);
    sendError(res, 'Failed to set primary contact');
  }
});

// ============================================
// STUDENT'S PARENTS
// ============================================

/**
 * GET /api/v2/parents/student/:studentId
 * Get parents of a specific student
 */
router.get('/student/:studentId', requireAuth, attachUser, async (req: Request, res: Response) => {
  try {
    const studentId = getParam(req.params.studentId);

    const student = await studentService.getById(studentId);
    if (!student) {
      return sendNotFound(res, 'Student');
    }

    // Check permissions - students can view their own parents, admins/teachers can view any
    const isStudent = req.user?.role === 'student' && student.user_id === req.user.id;
    const isAdminOrTeacher = req.user?.role === 'admin' || req.user?.role === 'teacher';

    if (!isStudent && !isAdminOrTeacher) {
      return sendBadRequest(res, 'Not authorized to view this student\'s parents');
    }

    const parents = await parentService.getParentsOfStudent(studentId);
    sendSuccess(res, parents);
  } catch (error) {
    console.error('Error fetching student parents:', error);
    sendError(res, 'Failed to fetch student parents');
  }
});

export default router;
