// Admin application review routes — mounted under /api/v2/admin
// Admin auth (requireAuth + attachUser + requireAdmin) is enforced by the parent router.

import { Router, Request, Response } from 'express';
import { userService } from '../../../services/userService.js';
import { studentService } from '../../../services/studentService.js';
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
// APPLICATIONS MANAGEMENT
// ============================================

/**
 * GET /api/v2/admin/applications/pending
 * Get all pending applications (users with role='user')
 */
router.get('/applications/pending', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    const result = await userService.list({ page, limit, role: 'user', isActive: true });

    sendPaginated(res, result.users, result.total, page, limit);
  } catch (error) {
    console.error('Error fetching pending applications:', error);
    sendError(res, 'Failed to fetch pending applications');
  }
});

/**
 * POST /api/v2/admin/applications/:userId/approve-student
 * Approve application and create student record
 */
router.post('/applications/:userId/approve-student', async (req: Request, res: Response) => {
  try {
    const userId = getParam(req.params.userId);
    const {
      studentId,
      studentType,
      classGrade,
      board,
      targetExam,
      targetYear,
      parentName,
      parentPhone,
      parentEmail,
      dateOfBirth,
      gender,
      address,
      city,
      state,
      pincode,
      schoolName,
    } = req.body;

    if (!studentId || !studentType) {
      return sendBadRequest(res, 'studentId and studentType are required');
    }

    // Check if user exists
    const user = await userService.getById(userId);
    if (!user) {
      return sendNotFound(res, 'User');
    }

    // Check if user is already a student
    const existingStudent = await studentService.getByUserId(userId);
    if (existingStudent) {
      return sendBadRequest(res, 'User is already a student');
    }

    // Create student record
    const student = await studentService.create({
      user_id: userId,
      student_id: studentId,
      student_type: studentType,
      class_grade: classGrade,
      board,
      target_exam: targetExam,
      target_year: targetYear,
      parent_name: parentName,
      parent_phone: parentPhone,
      parent_email: parentEmail,
      date_of_birth: dateOfBirth,
      gender,
      address,
      city,
      state,
      pincode,
      school_name: schoolName,
      subscription_status: 'pending',
    });

    // Update user role to student
    await userService.updateRole(userId, 'student');

    sendCreated(res, { student, user }, 'Application approved and student created successfully');
  } catch (error: unknown) {
    console.error('Error approving application:', error);
    const message = error instanceof Error ? error.message : 'Failed to approve application';
    sendError(res, message);
  }
});

/**
 * POST /api/v2/admin/applications/:userId/reject
 * Reject application (optionally delete user or mark inactive)
 */
router.post('/applications/:userId/reject', async (req: Request, res: Response) => {
  try {
    const userId = getParam(req.params.userId);
    const { reason } = req.body;

    const user = await userService.getById(userId);
    if (!user) {
      return sendNotFound(res, 'User');
    }

    // Mark user as inactive
    await userService.update(userId, {
      is_active: false,
      metadata: {
        ...user.metadata,
        rejected_at: new Date().toISOString(),
        rejection_reason: reason || 'Application rejected by admin',
      },
    });

    sendSuccess(res, { userId }, 'Application rejected successfully');
  } catch (error) {
    console.error('Error rejecting application:', error);
    sendError(res, 'Failed to reject application');
  }
});


export default router;
