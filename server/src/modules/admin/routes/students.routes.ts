// Admin student management routes — mounted under /api/v2/admin
// Admin auth (requireAuth + attachUser + requireAdmin) is enforced by the parent router.

import { Router, Request, Response } from 'express';
import { clerkClient } from '@clerk/clerk-sdk-node';
import { userService, UserRole } from '../../../services/userService.js';
import { studentService } from '../../../services/studentService.js';
import { enrollmentService, PaymentType } from '../../../services/enrollmentService.js';
import { courseTypeService } from '../../../services/courseTypeService.js';
import { emailService } from '../../../services/emailService.js';
import { env } from '../../../config/env.js';
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
      // Welcome email opt-out (defaults to true)
      sendWelcomeEmail = true,
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

    // Step 5: Send welcome email with credentials (non-fatal — don't block creation if email fails)
    let welcomeEmailSent = false;
    if (sendWelcomeEmail) {
      try {
        await emailService.sendStudentWelcome({
          email,
          firstName,
          studentId,
          tempPassword: password,
          loginUrl: `${env.FRONTEND_URL}/sign-in`,
        });
        welcomeEmailSent = true;
      } catch (emailError: any) {
        console.error('Welcome email failed (non-fatal):', emailError?.message);
      }
    }

    sendCreated(res, { user, student, enrollment, welcomeEmailSent }, 'Student created successfully');
  } catch (error: any) {
    console.error('Error creating student with user:', error);
    sendError(res, error.message || 'Failed to create student');
  }
});


export default router;
