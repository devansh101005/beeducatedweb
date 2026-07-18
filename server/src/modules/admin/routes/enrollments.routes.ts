// Admin enrollment management & maintenance routes — mounted under /api/v2/admin
// Admin auth (requireAuth + attachUser + requireAdmin) is enforced by the parent router.

import { Router, Request, Response } from 'express';
import { studentService } from '../../../services/studentService.js';
import { enrollmentService, PaymentType } from '../../../services/enrollmentService.js';
import { courseTypeService } from '../../../services/courseTypeService.js';
import {
  sendSuccess,
  sendCreated,
  sendError,
  sendBadRequest,
  sendPaginated,
} from '../../../shared/utils/response.js';

const router = Router();

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
