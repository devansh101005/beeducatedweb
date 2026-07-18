// Admin parent management routes — mounted under /api/v2/admin
// Admin auth (requireAuth + attachUser + requireAdmin) is enforced by the parent router.

import { Router, Request, Response } from 'express';
import { clerkClient } from '@clerk/clerk-sdk-node';
import { userService } from '../../../services/userService.js';
import { studentService } from '../../../services/studentService.js';
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
 * POST /api/v2/admin/parents
 * Create a new parent account (user + parent profile)
 */
router.post('/parents', async (req: Request, res: Response) => {
  try {
    const {
      email,
      firstName,
      lastName,
      phone,
      password,
      occupation,
      address,
      city,
      state,
      pincode,
      studentId,        // Optional: Link to a student immediately
      relationship,     // Optional: Relationship type (father, mother, guardian)
    } = req.body;

    // Validate required fields
    if (!email || !firstName || !lastName) {
      return sendBadRequest(res, 'Email, firstName, and lastName are required');
    }

    // Check if email already exists
    const existingUser = await userService.getByEmail(email);
    if (existingUser) {
      return sendBadRequest(res, 'A user with this email already exists');
    }

    // Create user in Clerk first
    let clerkUser;
    try {
      clerkUser = await clerkClient.users.createUser({
        emailAddress: [email],
        firstName,
        lastName,
        password: password || `Parent@${Date.now()}`, // Generate temp password if not provided
        publicMetadata: { role: 'parent' },
      });
    } catch (clerkError: any) {
      console.error('Clerk user creation error:', clerkError);
      return sendBadRequest(res, `Failed to create user in Clerk: ${clerkError.message}`);
    }

    // Create user in our database
    const user = await userService.create({
      clerk_id: clerkUser.id,
      email,
      first_name: firstName,
      last_name: lastName,
      phone: phone || null,
      role: 'parent',
    });

    // Create parent profile
    const parent = await parentService.create({
      user_id: user.id,
      occupation: occupation || null,
      address: address || null,
      city: city || null,
      state: state || null,
      pincode: pincode || null,
    });

    // If studentId is provided, link the parent to the student
    let linkedStudent = null;
    if (studentId) {
      const student = await studentService.getById(studentId);
      if (student) {
        await parentService.linkChild(parent.id, studentId, relationship || 'parent', true);
        linkedStudent = student;
      }
    }

    sendCreated(res, {
      user,
      parent,
      linkedStudent,
      tempPassword: password ? undefined : 'A temporary password was generated. Ask parent to reset via forgot password.',
    }, 'Parent account created successfully');
  } catch (error: any) {
    console.error('Error creating parent:', error);
    sendError(res, error.message || 'Failed to create parent');
  }
});

/**
 * GET /api/v2/admin/parents/:id
 * Get a specific parent with user details
 */
router.get('/parents/:id', async (req: Request, res: Response) => {
  try {
    const parentId = getParam(req.params.id);

    const result = await parentService.getWithUser(parentId);
    if (!result) {
      return sendNotFound(res, 'Parent');
    }

    // Also get linked children
    const children = await parentService.getChildren(parentId);

    sendSuccess(res, {
      ...result.parent,
      user: result.user,
      children,
    });
  } catch (error) {
    console.error('Error fetching parent:', error);
    sendError(res, 'Failed to fetch parent');
  }
});

/**
 * GET /api/v2/admin/parents/:id/children
 * Get parent's linked children (students)
 */
router.get('/parents/:id/children', async (req: Request, res: Response) => {
  try {
    const parentId = getParam(req.params.id);

    const parent = await parentService.getById(parentId);
    if (!parent) {
      return sendNotFound(res, 'Parent');
    }

    const children = await parentService.getChildren(parentId);
    sendSuccess(res, children);
  } catch (error) {
    console.error('Error fetching parent children:', error);
    sendError(res, 'Failed to fetch children');
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

/**
 * DELETE /api/v2/admin/parents/:id/children/:studentId
 * Unlink a parent from a student
 */
router.delete('/parents/:id/children/:studentId', async (req: Request, res: Response) => {
  try {
    const parentId = getParam(req.params.id);
    const studentId = getParam(req.params.studentId);

    const parent = await parentService.getById(parentId);
    if (!parent) {
      return sendNotFound(res, 'Parent');
    }

    await parentService.unlinkChild(parentId, studentId);

    sendSuccess(res, null, 'Parent unlinked from student successfully');
  } catch (error) {
    console.error('Error unlinking parent from student:', error);
    sendError(res, 'Failed to unlink parent from student');
  }
});

/**
 * GET /api/v2/admin/students-for-linking
 * Get list of students available for linking to parents
 */
router.get('/students-for-linking', async (req: Request, res: Response) => {
  try {
    const search = req.query.search as string | undefined;
    const limit = parseInt(req.query.limit as string) || 50;

    const result = await studentService.list({ limit, search, isActive: true });

    // Return simplified list for dropdown/search
    const students = result.students.map((s: any) => ({
      id: s.id,
      studentId: s.student_id,
      name: s.user ? `${s.user.first_name} ${s.user.last_name}` : 'Unknown',
      email: s.user?.email,
      classGrade: s.class_grade,
    }));

    sendSuccess(res, students);
  } catch (error) {
    console.error('Error fetching students for linking:', error);
    sendError(res, 'Failed to fetch students');
  }
});


export default router;
