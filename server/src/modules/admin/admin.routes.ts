// Admin Routes - /api/v2/admin
// Handles admin-only operations for user management

import { Router, Request, Response } from 'express';
import { clerkClient } from '@clerk/clerk-sdk-node';
import { requireAuth, attachUser, requireAdmin } from '../../middleware/auth.js';

// Helper to get string param (Express 5 can return string | string[])
const getParam = (param: string | string[] | undefined): string => {
  if (Array.isArray(param)) return param[0];
  return param || '';
};
import { userService, UserRole } from '../../services/userService.js';
import { studentService } from '../../services/studentService.js';
import { teacherService } from '../../services/teacherService.js';
import { parentService } from '../../services/parentService.js';
import {
  sendSuccess,
  sendCreated,
  sendNotFound,
  sendError,
  sendBadRequest,
  sendPaginated,
} from '../../shared/utils/response.js';

const router = Router();

// All routes require admin authentication
router.use(requireAuth, attachUser, requireAdmin);

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

    // Update in Clerk if name changed
    if (firstName !== undefined || lastName !== undefined) {
      await clerkClient.users.updateUser(existingUser.clerk_id, {
        firstName: firstName ?? existingUser.first_name ?? undefined,
        lastName: lastName ?? existingUser.last_name ?? undefined,
      });
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

// ============================================
// STUDENT MANAGEMENT
// ============================================

/**
 * GET /api/v2/admin/students
 * List all students with pagination
 */
router.get('/students', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const studentType = req.query.studentType as string | undefined;
    const isActive = req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined;
    const search = req.query.search as string | undefined;

    const result = await studentService.list({ page, limit, studentType, isActive, search });

    sendPaginated(res, result.students, result.total, page, limit);
  } catch (error) {
    console.error('Error listing students:', error);
    sendError(res, 'Failed to list students');
  }
});

/**
 * POST /api/v2/admin/students
 * Create a student profile for an existing user
 */
router.post('/students', async (req: Request, res: Response) => {
  try {
    const { userId, studentType, ...profileData } = req.body;

    if (!userId || !studentType) {
      return sendBadRequest(res, 'userId and studentType are required');
    }

    // Verify user exists and has student role
    const user = await userService.getById(userId);
    if (!user) {
      return sendNotFound(res, 'User');
    }

    // Update role to student if not already
    if (user.role !== 'student') {
      await userService.updateRole(userId, 'student');
    }

    const student = await studentService.create({
      user_id: userId,
      student_type: studentType,
      ...profileData,
    });

    sendCreated(res, student, 'Student profile created');
  } catch (error) {
    console.error('Error creating student:', error);
    sendError(res, 'Failed to create student profile');
  }
});

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

// ============================================
// PARENT MANAGEMENT
// ============================================

/**
 * GET /api/v2/admin/parents
 * List all parents
 */
router.get('/parents', async (req: Request, res: Response) => {
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
 * POST /api/v2/admin/parents/:id/link-child
 * Link a parent to a student
 */
router.post('/parents/:id/link-child', async (req: Request, res: Response) => {
  try {
    const { studentId, relationship = 'parent', isPrimary = false } = req.body;
    const parentId = getParam(req.params.id);

    if (!studentId) {
      return sendBadRequest(res, 'studentId is required');
    }

    const parent = await parentService.getById(parentId);
    if (!parent) {
      return sendNotFound(res, 'Parent');
    }

    const student = await studentService.getById(studentId);
    if (!student) {
      return sendNotFound(res, 'Student');
    }

    await parentService.linkChild(parentId, studentId, relationship, isPrimary);

    sendSuccess(res, null, 'Parent linked to student successfully');
  } catch (error) {
    console.error('Error linking parent to student:', error);
    sendError(res, 'Failed to link parent to student');
  }
});

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
    ] = await Promise.all([
      userService.list({ limit: 1 }),
      studentService.list({ limit: 1 }),
      teacherService.list({ limit: 1 }),
      parentService.list({ limit: 1 }),
    ]);

    sendSuccess(res, {
      users: totalUsers,
      students: totalStudents,
      teachers: totalTeachers,
      parents: totalParents,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    sendError(res, 'Failed to fetch statistics');
  }
});

export default router;
