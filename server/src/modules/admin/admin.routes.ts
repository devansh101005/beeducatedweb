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
import { enrollmentService, PaymentType } from '../../services/enrollmentService.js';
import { courseTypeService } from '../../services/courseTypeService.js';
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

    // Update in Clerk (name and/or role)
    const clerkUpdate: Record<string, any> = {};
    if (firstName !== undefined) clerkUpdate.firstName = firstName;
    if (lastName !== undefined) clerkUpdate.lastName = lastName;
    if (role !== undefined) {
      clerkUpdate.publicMetadata = { ...((await clerkClient.users.getUser(existingUser.clerk_id)).publicMetadata || {}), role };
    }
    if (Object.keys(clerkUpdate).length > 0) {
      await clerkClient.users.updateUser(existingUser.clerk_id, clerkUpdate);
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

    const existingUser = await userService.getById(userId);
    if (!existingUser) {
      return sendNotFound(res, 'User');
    }

    // Sync role to Clerk publicMetadata
    const clerkUser = await clerkClient.users.getUser(existingUser.clerk_id);
    await clerkClient.users.updateUser(existingUser.clerk_id, {
      publicMetadata: { ...(clerkUser.publicMetadata || {}), role },
    });

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

    // Fetch manual enrollment info for all students (with error handling)
    const studentIds = result.students.map((s: any) => s.id);
    let enrollmentMap: Record<string, { id: string; status: string; class_name: string; payment_type: string }> = {};

    if (studentIds.length > 0) {
      try {
        const enrollments = await enrollmentService.getManualEnrollmentsForStudents(studentIds);
        enrollmentMap = enrollments.reduce((acc: Record<string, any>, e: any) => {
          acc[e.student_id] = {
            id: e.id,
            status: e.status,
            class_name: e.class_name,
            payment_type: e.payment_type,
          };
          return acc;
        }, {});
      } catch (enrollmentError) {
        // Log but don't fail - enrollment data is optional
        console.warn('Failed to fetch enrollment info:', enrollmentError);
      }
    }

    // Add enrollment info to each student
    const studentsWithEnrollment = result.students.map((s: any) => ({
      ...s,
      enrollment: enrollmentMap[s.id] || null,
    }));

    sendPaginated(res, studentsWithEnrollment, result.total, page, limit);
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

/**
 * DELETE /api/v2/admin/students/:id
 * Delete a student and optionally their user account
 */
router.delete('/students/:id', async (req: Request, res: Response) => {
  try {
    const studentId = getParam(req.params.id);
    const deleteUser = req.query.deleteUser === 'true';

    // Get student to find user_id
    const student = await studentService.getById(studentId);
    if (!student) {
      return sendNotFound(res, 'Student');
    }

    // Cancel any active enrollments first
    try {
      await enrollmentService.cancelAllEnrollmentsForStudent(studentId, 'Student deleted by admin');
    } catch (enrollmentError) {
      console.warn('Failed to cancel enrollments:', enrollmentError);
    }

    // Delete student profile
    await studentService.delete(studentId);

    // Optionally delete user account as well
    if (deleteUser && student.user_id) {
      try {
        // Delete from Clerk
        await clerkClient.users.deleteUser(student.user_id);
      } catch (clerkError) {
        console.warn('Failed to delete Clerk user:', clerkError);
      }

      // Delete from database
      await userService.delete(student.user_id);
    }

    sendSuccess(res, { deleted: true }, 'Student deleted successfully');
  } catch (error) {
    console.error('Error deleting student:', error);
    sendError(res, 'Failed to delete student');
  }
});

/**
 * DELETE /api/v2/admin/students/:id/enrollment
 * Unenroll a student (cancel their enrollment without deleting the student)
 */
router.delete('/students/:id/enrollment', async (req: Request, res: Response) => {
  try {
    const studentId = getParam(req.params.id);

    // Get student
    const student = await studentService.getById(studentId);
    if (!student) {
      return sendNotFound(res, 'Student');
    }

    // Cancel all active enrollments
    const cancelled = await enrollmentService.cancelAllEnrollmentsForStudent(studentId, 'Unenrolled by admin');

    sendSuccess(res, { cancelled }, 'Student unenrolled successfully');
  } catch (error) {
    console.error('Error unenrolling student:', error);
    sendError(res, 'Failed to unenroll student');
  }
});

/**
 * POST /api/v2/admin/students/create-with-user
 * Create a new user AND student profile in one request
 * This avoids timing issues with separate API calls
 */
router.post('/students/create-with-user', async (req: Request, res: Response) => {
  try {
    const {
      // User fields
      email,
      password,
      firstName,
      lastName,
      phone,
      // Student fields
      studentId,
      studentType,
      classGrade,
      board,
      targetExam,
      targetYear,
      parentName,
      parentPhone,
      parentEmail,
      // Enrollment fields (optional - for manual enrollment)
      classId,
    } = req.body;

    // Validate required fields
    if (!email || !password || !firstName) {
      return sendBadRequest(res, 'Email, password, and first name are required');
    }
    if (!studentId || !studentType) {
      return sendBadRequest(res, 'Student ID and student type are required');
    }

    // Check if student ID is already taken
    const existingStudent = await studentService.getByStudentId(studentId);
    if (existingStudent) {
      return sendBadRequest(res, 'Student ID is already in use');
    }

    // Check if email is already in use in our database
    const existingUser = await userService.getByEmail(email);
    if (existingUser) {
      return sendBadRequest(res, 'A user with this email already exists');
    }

    // Check if email exists in Clerk (could be orphaned from previous attempt)
    try {
      const existingClerkUsers = await clerkClient.users.getUserList({
        emailAddress: [email],
      });
      if (existingClerkUsers.data && existingClerkUsers.data.length > 0) {
        // User exists in Clerk but not in our database - use existing Clerk user
        const existingClerkUser = existingClerkUsers.data[0];
        console.log('Found existing Clerk user, syncing to database:', existingClerkUser.id);

        // Create user in our database with existing Clerk user
        const user = await userService.create({
          clerk_id: existingClerkUser.id,
          email,
          first_name: firstName || existingClerkUser.firstName || null,
          last_name: lastName || existingClerkUser.lastName || null,
          phone,
          role: 'student' as UserRole,
        });

        // Create student profile
        const student = await studentService.create({
          user_id: user.id,
          student_id: studentId,
          student_type: studentType,
          class_grade: classGrade,
          board,
          target_exam: targetExam,
          target_year: targetYear,
          parent_name: parentName,
          parent_phone: parentPhone,
          parent_email: parentEmail,
          subscription_status: 'pending',
        });

        return sendCreated(res, { user, student }, 'Student created successfully (synced from existing account)');
      }
    } catch (clerkCheckError) {
      console.log('Could not check Clerk for existing user, proceeding with creation:', clerkCheckError);
    }

    // Helper function to create Clerk user with retry
    const createClerkUserWithRetry = async (retries = 3, delay = 2000): Promise<any> => {
      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          const user = await clerkClient.users.createUser({
            emailAddress: [email],
            firstName,
            lastName,
            password,
            // Skip email verification for admin-created users
            skipPasswordChecks: true,
            skipPasswordRequirement: false,
          });
          return user;
        } catch (error: any) {
          const isRetryableError = error?.errors?.some((e: any) =>
            e.message?.includes('wait a moment') ||
            e.message?.includes('being set up') ||
            e.code === 'user_locked'
          );

          if (isRetryableError && attempt < retries) {
            console.log(`Clerk user creation attempt ${attempt} failed, retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          throw error;
        }
      }
    };

    // Step 1: Create user in Clerk with retry logic
    let clerkUser;
    try {
      clerkUser = await createClerkUserWithRetry();
    } catch (clerkError: any) {
      console.error('Clerk error after retries:', clerkError);
      // Handle specific Clerk errors
      if (clerkError?.errors) {
        const messages = clerkError.errors.map((e: any) => e.message || e.longMessage).join(', ');
        return sendBadRequest(res, messages);
      }
      return sendError(res, 'Failed to create user account. Please try again later.');
    }

    // Step 2: Create user in Supabase
    let user;
    try {
      user = await userService.create({
        clerk_id: clerkUser.id,
        email,
        first_name: firstName,
        last_name: lastName,
        phone,
        role: 'student' as UserRole,
      });
    } catch (dbError) {
      // If Supabase fails, try to delete the Clerk user to avoid orphaned accounts
      console.error('Database error, cleaning up Clerk user:', dbError);
      try {
        await clerkClient.users.deleteUser(clerkUser.id);
      } catch (cleanupError) {
        console.error('Failed to cleanup Clerk user:', cleanupError);
      }
      return sendError(res, 'Failed to create user record');
    }

    // Step 3: Create student profile
    let student;
    try {
      student = await studentService.create({
        user_id: user.id,
        student_id: studentId,
        student_type: studentType,
        class_grade: classGrade,
        board,
        target_exam: targetExam,
        target_year: targetYear,
        parent_name: parentName,
        parent_phone: parentPhone,
        parent_email: parentEmail,
        subscription_status: 'pending',
      });
    } catch (studentError: any) {
      // Log detailed error for debugging
      console.error('Student creation error details:', {
        message: studentError?.message,
        code: studentError?.code,
        details: studentError?.details,
        hint: studentError?.hint,
        fullError: studentError,
      });

      // Extract the actual error message from Supabase error
      const errorMessage = studentError?.message || studentError?.details || 'Unknown error creating student profile';

      // User is created but student profile failed - return error with details
      return sendBadRequest(res, `User created but student profile failed: ${errorMessage}. Please check the student data and try again.`);
    }

    // Step 4: Create manual enrollment if classId is provided
    let enrollment = null;
    if (classId) {
      try {
        // Get the manual fee plan for this class
        const manualFeePlan = await courseTypeService.getManualFeePlanByClassId(classId);

        if (manualFeePlan) {
          // Create manual enrollment with ₹0 amount
          const enrollmentResult = await enrollmentService.createManualEnrollment({
            studentId: student.id,
            classId,
            feePlanId: manualFeePlan.id,
            paymentType: 'cash' as Exclude<PaymentType, 'razorpay'>,
            amountReceived: 0,
            receivedBy: req.user?.id || 'admin',
            notes: 'Manual enrollment created by admin during student registration',
          });
          enrollment = enrollmentResult.enrollment;
          console.log('Manual enrollment created:', enrollment.id);
        } else {
          console.warn(`No manual fee plan found for class ${classId}. Skipping enrollment creation.`);
        }
      } catch (enrollmentError: any) {
        // Log but don't fail the whole request - student is already created
        console.error('Failed to create manual enrollment:', enrollmentError?.message);
        // Continue without enrollment - admin can create it later
      }
    }

    sendCreated(res, { user, student, enrollment }, 'Student created successfully');
  } catch (error: any) {
    console.error('Error creating student with user:', error);
    sendError(res, error.message || 'Failed to create student');
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

// ============================================
// ENROLLMENT MANAGEMENT
// ============================================

/**
 * GET /api/v2/admin/enrollments
 * List all enrollments with pagination
 */
router.get('/enrollments', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string | undefined;
    const classId = req.query.classId as string | undefined;

    const result = await enrollmentService.listAllEnrollments({
      page,
      limit,
      status: status as any,
      classId,
    });

    sendPaginated(res, result.enrollments, result.total, page, limit);
  } catch (error) {
    console.error('Error listing enrollments:', error);
    sendError(res, 'Failed to list enrollments');
  }
});

/**
 * POST /api/v2/admin/enrollments/manual
 * Create manual enrollment for cash/offline payments
 */
router.post('/enrollments/manual', async (req: Request, res: Response) => {
  try {
    const {
      studentId,
      classId,
      feePlanId,
      paymentType,
      amountReceived,
      receiptNumber,
      notes,
    } = req.body;

    // Validate required fields
    if (!studentId || !classId || !feePlanId || !paymentType || !amountReceived) {
      return sendBadRequest(res, 'studentId, classId, feePlanId, paymentType, and amountReceived are required');
    }

    // Validate payment type (must not be razorpay for manual enrollment)
    const validPaymentTypes: PaymentType[] = ['cash', 'bank_transfer', 'cheque', 'upi_direct'];
    if (!validPaymentTypes.includes(paymentType)) {
      return sendBadRequest(res, `Invalid payment type. Must be one of: ${validPaymentTypes.join(', ')}`);
    }

    // Validate amount
    const amount = parseFloat(amountReceived);
    if (isNaN(amount) || amount <= 0) {
      return sendBadRequest(res, 'Amount received must be a positive number');
    }

    // Get admin user ID from request (set by auth middleware)
    const adminUserId = (req as any).user?.id;
    if (!adminUserId) {
      return sendBadRequest(res, 'Admin user not found');
    }

    const result = await enrollmentService.createManualEnrollment({
      studentId,
      classId,
      feePlanId,
      paymentType,
      amountReceived: amount,
      receivedBy: adminUserId,
      receiptNumber,
      notes,
    });

    sendCreated(res, {
      enrollment: result.enrollment,
      payment: result.payment,
      message: `Student enrolled successfully. Receipt: ${result.payment.receipt_number}`,
    }, 'Manual enrollment created successfully');
  } catch (error: any) {
    console.error('Error creating manual enrollment:', error);
    sendError(res, error.message || 'Failed to create manual enrollment');
  }
});

/**
 * GET /api/v2/admin/enrollments/classes
 * Get all classes available for enrollment (with fee plans)
 */
router.get('/enrollments/classes', async (req: Request, res: Response) => {
  try {
    const courseTypeSlug = req.query.courseType as string | undefined;

    const classes = await courseTypeService.getClassesWithFeePlans(courseTypeSlug);

    sendSuccess(res, classes);
  } catch (error) {
    console.error('Error fetching classes:', error);
    sendError(res, 'Failed to fetch classes');
  }
});

/**
 * GET /api/v2/admin/enrollments/students/search
 * Search students for enrollment (returns students without active enrollment in specified class)
 */
router.get('/enrollments/students/search', async (req: Request, res: Response) => {
  try {
    const search = req.query.search as string;
    const classId = req.query.classId as string | undefined;
    const limit = parseInt(req.query.limit as string) || 10;

    if (!search || search.length < 2) {
      return sendSuccess(res, []);
    }

    // Get students matching search
    const { students } = await studentService.list({ search, limit: 50 });

    // If classId provided, filter out students already enrolled
    let eligibleStudents = students;
    if (classId) {
      const enrollmentChecks = await Promise.all(
        students.map(async (student: any) => {
          const enrollment = await enrollmentService.getEnrollmentByStudentAndClass(student.id, classId);
          return {
            student,
            hasActiveEnrollment: enrollment?.status === 'active',
          };
        })
      );
      eligibleStudents = enrollmentChecks
        .filter(({ hasActiveEnrollment }) => !hasActiveEnrollment)
        .map(({ student }) => student)
        .slice(0, limit);
    } else {
      eligibleStudents = students.slice(0, limit);
    }

    sendSuccess(res, eligibleStudents);
  } catch (error) {
    console.error('Error searching students:', error);
    sendError(res, 'Failed to search students');
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

// ============================================
// ENROLLMENT MAINTENANCE
// ============================================

/**
 * POST /api/v2/admin/enrollments/process-expired
 * Process and mark expired enrollments
 * Can be called manually or via cron job
 */
router.post('/enrollments/process-expired', async (_req: Request, res: Response) => {
  try {
    const result = await enrollmentService.processExpiredEnrollments();

    sendSuccess(res, {
      expiredCount: result.expiredCount,
      message: `Processed ${result.expiredCount} expired enrollments`,
    });
  } catch (error) {
    console.error('Error processing expired enrollments:', error);
    sendError(res, 'Failed to process expired enrollments');
  }
});

export default router;
