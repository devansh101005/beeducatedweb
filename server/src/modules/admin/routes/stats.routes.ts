// Admin statistics routes — mounted under /api/v2/admin
// Admin auth (requireAuth + attachUser + requireAdmin) is enforced by the parent router.

import { Router, Request, Response } from 'express';
import { userService } from '../../../services/userService.js';
import { studentService } from '../../../services/studentService.js';
import { teacherService } from '../../../services/teacherService.js';
import { parentService } from '../../../services/parentService.js';
import {
  sendSuccess,
  sendError,
} from '../../../shared/utils/response.js';

const router = Router();

// ============================================
// STATISTICS
// ============================================

/**
 * GET /api/v2/admin/stats
 * Get admin dashboard statistics
 */
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const [
      { total: totalUsers },
      { total: totalStudents },
      { total: totalTeachers },
      { total: totalParents },
      { total: totalAdmins },
    ] = await Promise.all([
      userService.list({ limit: 1 }),
      studentService.list({ limit: 1 }),
      teacherService.list({ limit: 1 }),
      parentService.list({ limit: 1 }),
      userService.list({ limit: 1, role: 'admin' }),
    ]);

    sendSuccess(res, {
      users: totalUsers,
      students: totalStudents,
      teachers: totalTeachers,
      parents: totalParents,
      admins: totalAdmins,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    sendError(res, 'Failed to fetch statistics');
  }
});


export default router;
