// Student Routes - /api/v2/students
// Handles student profile and enrollment operations

import { Router, Request, Response } from 'express';
import { requireAuth, attachUser, requireTeacherOrAdmin } from '../../middleware/auth.js';
import { studentService } from '../../services/studentService.js';
import { courseService } from '../../services/courseService.js';
import { batchService } from '../../services/batchService.js';
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
// STUDENT ID MANAGEMENT
// ============================================

/**
 * GET /api/v2/students/suggest-id
 * Get suggested next student ID (admin only)
 */
router.get('/suggest-id', requireAuth, attachUser, async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== 'admin') {
      return sendBadRequest(res, 'Admin access required');
    }

    const suggestedId = await studentService.generateSuggestedStudentId();
    sendSuccess(res, { studentId: suggestedId });
  } catch (error) {
    console.error('Error generating suggested student ID:', error);
    sendError(res, 'Failed to generate student ID');
  }
});

/**
 * GET /api/v2/students/check-id/:studentId
 * Check if student ID is available (admin only)
 */
router.get('/check-id/:studentId', requireAuth, attachUser, async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== 'admin') {
      return sendBadRequest(res, 'Admin access required');
    }

    const studentId = getParam(req.params.studentId);
    const available = await studentService.isStudentIdAvailable(studentId);
    sendSuccess(res, { studentId, available });
  } catch (error) {
    console.error('Error checking student ID:', error);
    sendError(res, 'Failed to check student ID');
  }
});

// ============================================
// STUDENT PROFILE
// ============================================

/**
 * POST /api/v2/students
 * Create a new student record (admin only)
 */
router.post('/', requireAuth, attachUser, async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== 'admin') {
      return sendBadRequest(res, 'Admin access required');
    }

    const {
      userId,
      studentId,
      studentType,
      dateOfBirth,
      gender,
      address,
      city,
      state,
      pincode,
      classGrade,
      schoolName,
      board,
      targetExam,
      targetYear,
      parentName,
      parentPhone,
      parentEmail,
      subscriptionStatus,
    } = req.body;

    if (!userId || !studentId || !studentType) {
      return sendBadRequest(res, 'userId, studentId, and studentType are required');
    }

    const student = await studentService.create({
      user_id: userId,
      student_id: studentId,
      student_type: studentType,
      date_of_birth: dateOfBirth,
      gender,
      address,
      city,
      state,
      pincode,
      class_grade: classGrade,
      school_name: schoolName,
      board,
      target_exam: targetExam,
      target_year: targetYear,
      parent_name: parentName,
      parent_phone: parentPhone,
      parent_email: parentEmail,
      subscription_status: subscriptionStatus,
    });

    sendCreated(res, student, 'Student created successfully');
  } catch (error: unknown) {
    console.error('Error creating student:', error);
    const message = error instanceof Error ? error.message : 'Failed to create student';
    sendError(res, message);
  }
});

/**
 * GET /api/v2/students
 * List students with filters (admin/teacher only)
 */
router.get('/', requireAuth, attachUser, requireTeacherOrAdmin, async (req: Request, res: Response) => {
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
 * GET /api/v2/students/me
 * Get current student's own profile
 */
router.get('/me', requireAuth, attachUser, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return sendBadRequest(res, 'User not authenticated');
    }

    const student = await studentService.getByUserId(req.user.id);
    if (!student) {
      return sendNotFound(res, 'Student profile');
    }

    sendSuccess(res, student);
  } catch (error) {
    console.error('Error fetching own profile:', error);
    sendError(res, 'Failed to fetch profile');
  }
});

/**
 * GET /api/v2/students/:id
 * Get student by ID
 */
router.get('/:id', requireAuth, attachUser, async (req: Request, res: Response) => {
  try {
    const studentId = getParam(req.params.id);

    // Students can only view their own profile, admins/teachers can view any
    const student = await studentService.getById(studentId);
    if (!student) {
      return sendNotFound(res, 'Student');
    }

    // Check permissions
    const isOwner = req.user?.role === 'student' && student.user_id === req.user.id;
    const isAdminOrTeacher = req.user?.role === 'admin' || req.user?.role === 'teacher';

    if (!isOwner && !isAdminOrTeacher) {
      return sendBadRequest(res, 'Not authorized to view this student');
    }

    sendSuccess(res, student);
  } catch (error) {
    console.error('Error fetching student:', error);
    sendError(res, 'Failed to fetch student');
  }
});

/**
 * PUT /api/v2/students/:id
 * Update student profile
 */
router.put('/:id', requireAuth, attachUser, async (req: Request, res: Response) => {
  try {
    const studentId = getParam(req.params.id);
    const { targetExam, classGrade, schoolName, city, state, parentPhone, address, dateOfBirth, gender, metadata } = req.body;

    const existingStudent = await studentService.getById(studentId);
    if (!existingStudent) {
      return sendNotFound(res, 'Student');
    }

    // Check permissions - students can update their own, admins can update any
    const isOwner = req.user?.role === 'student' && existingStudent.user_id === req.user.id;
    const isAdmin = req.user?.role === 'admin';

    if (!isOwner && !isAdmin) {
      return sendBadRequest(res, 'Not authorized to update this student');
    }

    const student = await studentService.update(studentId, {
      target_exam: targetExam,
      class_grade: classGrade,
      school_name: schoolName,
      city,
      state,
      parent_phone: parentPhone,
      address,
      date_of_birth: dateOfBirth,
      gender,
      metadata,
    });

    sendSuccess(res, student, 'Profile updated successfully');
  } catch (error) {
    console.error('Error updating student:', error);
    sendError(res, 'Failed to update student');
  }
});

// ============================================
// STUDENT COURSES
// ============================================

/**
 * GET /api/v2/students/:id/courses
 * Get student's enrolled courses
 */
router.get('/:id/courses', requireAuth, attachUser, async (req: Request, res: Response) => {
  try {
    const studentId = getParam(req.params.id);

    const student = await studentService.getById(studentId);
    if (!student) {
      return sendNotFound(res, 'Student');
    }

    // Check permissions
    const isOwner = req.user?.role === 'student' && student.user_id === req.user.id;
    const isAdminOrTeacher = req.user?.role === 'admin' || req.user?.role === 'teacher';
    const isParent = req.user?.role === 'parent';

    if (!isOwner && !isAdminOrTeacher && !isParent) {
      return sendBadRequest(res, 'Not authorized to view this student\'s courses');
    }

    const courses = await courseService.getStudentCourses(studentId);
    sendSuccess(res, courses);
  } catch (error) {
    console.error('Error fetching student courses:', error);
    sendError(res, 'Failed to fetch student courses');
  }
});

/**
 * POST /api/v2/students/:id/courses
 * Enroll student in a course (admin/teacher only or self-enrollment)
 */
router.post('/:id/courses', requireAuth, attachUser, async (req: Request, res: Response) => {
  try {
    const studentId = getParam(req.params.id);
    const { courseId, expiresAt, paymentId } = req.body;

    if (!courseId) {
      return sendBadRequest(res, 'courseId is required');
    }

    const student = await studentService.getById(studentId);
    if (!student) {
      return sendNotFound(res, 'Student');
    }

    // Check permissions - admin/teacher can enroll anyone, students can only self-enroll
    const isOwner = req.user?.role === 'student' && student.user_id === req.user.id;
    const isAdminOrTeacher = req.user?.role === 'admin' || req.user?.role === 'teacher';

    if (!isOwner && !isAdminOrTeacher) {
      return sendBadRequest(res, 'Not authorized to enroll this student');
    }

    const course = await courseService.getById(courseId);
    if (!course) {
      return sendNotFound(res, 'Course');
    }

    const enrollment = await courseService.enrollStudent(studentId, courseId, expiresAt, paymentId);
    sendCreated(res, enrollment, 'Enrolled in course successfully');
  } catch (error: unknown) {
    console.error('Error enrolling in course:', error);
    const message = error instanceof Error ? error.message : 'Failed to enroll in course';
    sendError(res, message);
  }
});

/**
 * PUT /api/v2/students/:id/courses/:courseId/progress
 * Update course progress
 */
router.put('/:id/courses/:courseId/progress', requireAuth, attachUser, async (req: Request, res: Response) => {
  try {
    const studentId = getParam(req.params.id);
    const courseId = getParam(req.params.courseId);
    const { progressPercent } = req.body;

    const student = await studentService.getById(studentId);
    if (!student) {
      return sendNotFound(res, 'Student');
    }

    // Only the student themselves or admin/teacher can update progress
    const isOwner = req.user?.role === 'student' && student.user_id === req.user.id;
    const isAdminOrTeacher = req.user?.role === 'admin' || req.user?.role === 'teacher';

    if (!isOwner && !isAdminOrTeacher) {
      return sendBadRequest(res, 'Not authorized to update progress');
    }

    const enrollment = await courseService.updateProgress(studentId, courseId, {
      progress_percent: progressPercent,
    });

    sendSuccess(res, enrollment, 'Progress updated successfully');
  } catch (error) {
    console.error('Error updating progress:', error);
    sendError(res, 'Failed to update progress');
  }
});

// ============================================
// STUDENT BATCHES
// ============================================

/**
 * GET /api/v2/students/:id/batches
 * Get student's enrolled batches
 */
router.get('/:id/batches', requireAuth, attachUser, async (req: Request, res: Response) => {
  try {
    const studentId = getParam(req.params.id);

    const student = await studentService.getById(studentId);
    if (!student) {
      return sendNotFound(res, 'Student');
    }

    // Check permissions
    const isOwner = req.user?.role === 'student' && student.user_id === req.user.id;
    const isAdminOrTeacher = req.user?.role === 'admin' || req.user?.role === 'teacher';
    const isParent = req.user?.role === 'parent';

    if (!isOwner && !isAdminOrTeacher && !isParent) {
      return sendBadRequest(res, 'Not authorized to view this student\'s batches');
    }

    const batches = await batchService.getStudentBatches(studentId);
    sendSuccess(res, batches);
  } catch (error) {
    console.error('Error fetching student batches:', error);
    sendError(res, 'Failed to fetch student batches');
  }
});

export default router;
