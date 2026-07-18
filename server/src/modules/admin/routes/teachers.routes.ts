// Admin teacher management routes — mounted under /api/v2/admin
// Admin auth (requireAuth + attachUser + requireAdmin) is enforced by the parent router.

import { Router, Request, Response } from 'express';
import { userService } from '../../../services/userService.js';
import { teacherService } from '../../../services/teacherService.js';
import {
  sendCreated,
  sendNotFound,
  sendError,
  sendBadRequest,
  sendPaginated,
} from '../../../shared/utils/response.js';

const router = Router();

// ============================================
// TEACHER MANAGEMENT
// ============================================

/**
 * GET /api/v2/admin/teachers
 * List all teachers
 */
router.get('/teachers', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const isActive = req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined;
    const search = req.query.search as string | undefined;

    const result = await teacherService.list({ page, limit, isActive, search });

    sendPaginated(res, result.teachers, result.total, page, limit);
  } catch (error) {
    console.error('Error listing teachers:', error);
    sendError(res, 'Failed to list teachers');
  }
});

/**
 * POST /api/v2/admin/teachers
 * Create a teacher profile for an existing user
 */
router.post('/teachers', async (req: Request, res: Response) => {
  try {
    const { userId, specialization, subjects, qualification, experienceYears, bio } = req.body;

    if (!userId) {
      return sendBadRequest(res, 'userId is required');
    }

    // Verify user exists
    const user = await userService.getById(userId);
    if (!user) {
      return sendNotFound(res, 'User');
    }

    // Update role to teacher
    if (user.role !== 'teacher') {
      await userService.updateRole(userId, 'teacher');
    }

    const teacher = await teacherService.create({
      user_id: userId,
      specialization,
      subjects,
      qualification,
      experience_years: experienceYears,
      bio,
    });

    sendCreated(res, teacher, 'Teacher profile created');
  } catch (error) {
    console.error('Error creating teacher:', error);
    sendError(res, 'Failed to create teacher profile');
  }
});


export default router;
