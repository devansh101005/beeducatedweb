// Course Types Routes - /api/v2/course-types
// Handles course types, classes, and enrollment APIs

import { Router, Request, Response } from 'express';
import { requireAuth, attachUser } from '../../middleware/auth.js';
import { courseTypeService } from '../../services/courseTypeService.js';
import { enrollmentService } from '../../services/enrollmentService.js';
import { studentService } from '../../services/studentService.js';
import {
  sendSuccess,
  sendNotFound,
  sendBadRequest,
  sendError,
  sendCreated,
} from '../../shared/utils/response.js';

const router = Router();

// ============================================
// PUBLIC ROUTES (No auth required)
// ============================================

/**
 * GET /api/v2/course-types
 * Get all course types
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    const courseTypes = await courseTypeService.getAll();

    // Transform for frontend
    const transformed = courseTypes.map((ct) => ({
      id: ct.id,
      slug: ct.slug,
      name: ct.name,
      shortName: ct.short_name,
      description: ct.description,
      icon: ct.icon,
      color: ct.color,
      imageUrl: ct.image_url,
      isActive: ct.is_active,
      comingSoonMessage: ct.coming_soon_message,
      features: ct.features,
      displayOrder: ct.display_order,
    }));

    sendSuccess(res, transformed);
  } catch (error) {
    console.error('Error fetching course types:', error);
    sendError(res, 'Failed to fetch course types');
  }
});

/**
 * GET /api/v2/course-types/:slug
 * Get course type by slug with classes
 */
router.get('/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    const courseType = await courseTypeService.getBySlug(slug);
    if (!courseType) {
      return sendNotFound(res, 'Course type');
    }

    sendSuccess(res, {
      id: courseType.id,
      slug: courseType.slug,
      name: courseType.name,
      shortName: courseType.short_name,
      description: courseType.description,
      longDescription: courseType.long_description,
      icon: courseType.icon,
      color: courseType.color,
      imageUrl: courseType.image_url,
      isActive: courseType.is_active,
      comingSoonMessage: courseType.coming_soon_message,
      features: courseType.features,
    });
  } catch (error) {
    console.error('Error fetching course type:', error);
    sendError(res, 'Failed to fetch course type');
  }
});

/**
 * GET /api/v2/course-types/:slug/classes
 * Get classes for a course type (with optional enrollment status for authenticated users)
 */
router.get('/:slug/classes', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    // Try to get student ID if authenticated
    let studentId: string | undefined;
    try {
      // This is a hacky way to check if user is authenticated without requiring it
      // We'll use optional auth in a cleaner way
      const authHeader = req.headers.authorization;
      if (authHeader) {
        // If there's an auth header, we'll need to verify and get student
        // For now, skip student-specific data for unauthenticated requests
      }
    } catch {
      // Not authenticated, continue without student data
    }

    const result = await courseTypeService.getClassesByCourseType(slug, studentId);

    // Transform for frontend
    const transformed = {
      courseType: {
        id: result.courseType.id,
        slug: result.courseType.slug,
        name: result.courseType.name,
        isActive: result.courseType.is_active,
      },
      classes: result.classes.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        duration: c.duration,
        imageUrl: c.image_url,
        features: c.features,
        syllabus: c.syllabus,
        targetBoard: c.target_board,
        targetExam: c.target_exam,
        maxStudents: c.max_students,
        currentStudents: c.current_students,
        enrollmentOpen: c.enrollment_open,
        isEnrolled: c.is_enrolled || false,
        enrollmentStatus: c.enrollment_status || null,
        feePlan: c.fee_plan
          ? {
              id: c.fee_plan.id,
              name: c.fee_plan.name,
              registrationFee: c.fee_plan.registration_fee,
              tuitionFee: c.fee_plan.tuition_fee,
              materialFee: c.fee_plan.material_fee,
              examFee: c.fee_plan.exam_fee,
              discountAmount: c.fee_plan.discount_amount,
              discountLabel: c.fee_plan.discount_label,
              totalAmount: c.fee_plan.total_amount,
              validityMonths: c.fee_plan.validity_months,
            }
          : null,
      })),
    };

    sendSuccess(res, transformed);
  } catch (error: any) {
    console.error('Error fetching classes:', error);
    if (error.message === 'Course type not found') {
      return sendNotFound(res, 'Course type');
    }
    sendError(res, 'Failed to fetch classes');
  }
});

/**
 * GET /api/v2/course-types/classes/:classId
 * Get single class details
 */
router.get('/classes/:classId', async (req: Request, res: Response) => {
  try {
    const { classId } = req.params;

    const classInfo = await courseTypeService.getClassById(classId);
    if (!classInfo) {
      return sendNotFound(res, 'Class');
    }

    sendSuccess(res, {
      id: classInfo.id,
      name: classInfo.name,
      slug: classInfo.slug,
      description: classInfo.description,
      longDescription: classInfo.long_description,
      duration: classInfo.duration,
      imageUrl: classInfo.image_url,
      features: classInfo.features,
      syllabus: classInfo.syllabus,
      targetBoard: classInfo.target_board,
      targetExam: classInfo.target_exam,
      maxStudents: classInfo.max_students,
      currentStudents: classInfo.current_students,
      enrollmentOpen: classInfo.enrollment_open,
      courseType: classInfo.course_type
        ? {
            id: classInfo.course_type.id,
            slug: classInfo.course_type.slug,
            name: classInfo.course_type.name,
          }
        : null,
      feePlan: classInfo.fee_plan
        ? {
            id: classInfo.fee_plan.id,
            name: classInfo.fee_plan.name,
            registrationFee: classInfo.fee_plan.registration_fee,
            tuitionFee: classInfo.fee_plan.tuition_fee,
            materialFee: classInfo.fee_plan.material_fee,
            examFee: classInfo.fee_plan.exam_fee,
            discountAmount: classInfo.fee_plan.discount_amount,
            discountLabel: classInfo.fee_plan.discount_label,
            totalAmount: classInfo.fee_plan.total_amount,
            validityMonths: classInfo.fee_plan.validity_months,
          }
        : null,
    });
  } catch (error) {
    console.error('Error fetching class:', error);
    sendError(res, 'Failed to fetch class');
  }
});

// ============================================
// PROTECTED ROUTES (Auth required)
// ============================================

/**
 * POST /api/v2/course-types/enrollments/initiate
 * Initiate enrollment - creates Razorpay order
 */
router.post(
  '/enrollments/initiate',
  requireAuth,
  attachUser,
  async (req: Request, res: Response) => {
    try {
      const { classId, feePlanId } = req.body;

      if (!classId || !feePlanId) {
        return sendBadRequest(res, 'classId and feePlanId are required');
      }

      // Check if user is a student
      if (!req.user || req.user.role !== 'student') {
        return sendBadRequest(res, 'Only students can enroll in classes');
      }

      // Get student record
      const student = await studentService.getByUserId(req.user.id);
      if (!student) {
        return sendBadRequest(res, 'Student profile not found. Please complete your profile first.');
      }

      // Initiate enrollment
      const result = await enrollmentService.initiateEnrollment({
        studentId: student.id,
        classId,
        feePlanId,
        studentName: `${student.first_name || ''} ${student.last_name || ''}`.trim() || 'Student',
        studentEmail: req.user.email,
        studentPhone: student.phone || undefined,
      });

      sendCreated(res, result, 'Enrollment initiated');
    } catch (error: any) {
      console.error('Error initiating enrollment:', error);
      if (error.message.includes('already enrolled')) {
        return sendBadRequest(res, error.message);
      }
      if (error.message.includes('not available') || error.message.includes('not found')) {
        return sendBadRequest(res, error.message);
      }
      if (error.message.includes('full')) {
        return sendBadRequest(res, error.message);
      }
      sendError(res, 'Failed to initiate enrollment. Please try again.');
    }
  }
);

/**
 * POST /api/v2/course-types/enrollments/verify
 * Verify payment and complete enrollment
 */
router.post(
  '/enrollments/verify',
  requireAuth,
  attachUser,
  async (req: Request, res: Response) => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return sendBadRequest(res, 'Payment details are required');
      }

      const enrollment = await enrollmentService.verifyPayment({
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      });

      sendSuccess(res, {
        enrollment: {
          id: enrollment.id,
          enrollmentNumber: enrollment.enrollment_number,
          status: enrollment.status,
          enrolledAt: enrollment.enrolled_at,
          expiresAt: enrollment.expires_at,
        },
        message: 'Successfully enrolled! Welcome to the class.',
      });
    } catch (error: any) {
      console.error('Error verifying payment:', error);
      if (error.message.includes('verification failed')) {
        return sendBadRequest(res, 'Payment verification failed. Please contact support.');
      }
      sendError(res, 'Failed to complete enrollment. Please contact support.');
    }
  }
);

/**
 * POST /api/v2/course-types/enrollments/failure
 * Handle payment failure
 */
router.post(
  '/enrollments/failure',
  requireAuth,
  attachUser,
  async (req: Request, res: Response) => {
    try {
      const { razorpay_order_id, error_code, error_description } = req.body;

      if (!razorpay_order_id) {
        return sendBadRequest(res, 'Order ID is required');
      }

      await enrollmentService.handlePaymentFailure(
        razorpay_order_id,
        error_code || 'UNKNOWN',
        error_description || 'Payment failed'
      );

      sendSuccess(res, { message: 'Payment failure recorded' });
    } catch (error) {
      console.error('Error handling payment failure:', error);
      sendError(res, 'Failed to record payment failure');
    }
  }
);

/**
 * GET /api/v2/course-types/enrollments/my
 * Get current user's enrollments
 */
router.get(
  '/enrollments/my',
  requireAuth,
  attachUser,
  async (req: Request, res: Response) => {
    try {
      if (!req.user || req.user.role !== 'student') {
        return sendBadRequest(res, 'Only students can view enrollments');
      }

      const student = await studentService.getByUserId(req.user.id);
      if (!student) {
        return sendSuccess(res, []);
      }

      const enrollments = await enrollmentService.getStudentEnrollments(student.id);

      const transformed = enrollments.map((e) => ({
        id: e.id,
        enrollmentNumber: e.enrollment_number,
        status: e.status,
        enrolledAt: e.enrolled_at,
        expiresAt: e.expires_at,
        className: e.class_name,
        courseTypeName: e.course_type_name,
        feePlanName: e.fee_plan_name,
        totalAmount: e.total_amount,
        amountPaid: e.amount_paid,
        payment: e.payment
          ? {
              id: e.payment.id,
              razorpayPaymentId: e.payment.razorpay_payment_id,
              amount: e.payment.amount,
              status: e.payment.status,
              paidAt: e.payment.paid_at,
              paymentMethod: e.payment.payment_method,
            }
          : null,
      }));

      sendSuccess(res, transformed);
    } catch (error) {
      console.error('Error fetching enrollments:', error);
      sendError(res, 'Failed to fetch enrollments');
    }
  }
);

/**
 * GET /api/v2/course-types/enrollments/:id
 * Get enrollment by ID
 */
router.get(
  '/enrollments/:id',
  requireAuth,
  attachUser,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const enrollment = await enrollmentService.getEnrollmentById(id);
      if (!enrollment) {
        return sendNotFound(res, 'Enrollment');
      }

      // Verify ownership
      const student = await studentService.getByUserId(req.user?.id || '');
      if (!student || (enrollment.student_id !== student.id && req.user?.role !== 'admin')) {
        return sendNotFound(res, 'Enrollment');
      }

      sendSuccess(res, {
        id: enrollment.id,
        enrollmentNumber: enrollment.enrollment_number,
        status: enrollment.status,
        enrolledAt: enrollment.enrolled_at,
        expiresAt: enrollment.expires_at,
        className: enrollment.class_name,
        courseTypeName: enrollment.course_type_name,
        feePlanName: enrollment.fee_plan_name,
        totalAmount: enrollment.total_amount,
        amountPaid: enrollment.amount_paid,
        payment: enrollment.payment
          ? {
              id: enrollment.payment.id,
              razorpayPaymentId: enrollment.payment.razorpay_payment_id,
              amount: enrollment.payment.amount,
              status: enrollment.payment.status,
              paidAt: enrollment.payment.paid_at,
              paymentMethod: enrollment.payment.payment_method,
            }
          : null,
      });
    } catch (error) {
      console.error('Error fetching enrollment:', error);
      sendError(res, 'Failed to fetch enrollment');
    }
  }
);

export default router;
