// Payment Routes - /api/v2/payments
// Handles payment processing and tracking

import { Router, Request, Response } from 'express';
import { requireAuth, attachUser, requireAdmin, requireTeacherOrAdmin } from '../../middleware/auth.js';
import { paymentService, PaymentMethod } from '../../services/paymentService.js';
import { razorpayService } from '../../services/razorpayService.js';
import { studentService } from '../../services/studentService.js';
import { feeService, PaymentStatus } from '../../services/feeService.js';
import {
  sendSuccess,
  sendCreated,
  sendNotFound,
  sendError,
  sendBadRequest,
  sendForbidden,
  sendPaginated,
} from '../../shared/utils/response.js';

const router = Router();

// ============================================
// RAZORPAY CONFIG
// ============================================

/**
 * GET /api/v2/payments/razorpay/config
 * Get Razorpay public configuration
 */
router.get('/razorpay/config', requireAuth, attachUser, async (_req: Request, res: Response) => {
  try {
    sendSuccess(res, {
      keyId: razorpayService.getKeyId(),
      isConfigured: razorpayService.isConfigured(),
    });
  } catch (error) {
    console.error('Error getting Razorpay config:', error);
    sendError(res, 'Failed to get Razorpay config');
  }
});

// ============================================
// STUDENT PAYMENT ENDPOINTS
// ============================================

/**
 * GET /api/v2/payments/my-payments
 * Get current student's payments
 */
router.get('/my-payments', requireAuth, attachUser, async (req: Request, res: Response) => {
  try {
    const student = await studentService.getByUserId(req.user!.id);
    if (!student) {
      return sendBadRequest(res, 'Student profile not found');
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as PaymentStatus | undefined;

    const result = await paymentService.listPayments({
      page,
      limit,
      studentId: student.id,
      status,
    });

    sendPaginated(res, result.payments, result.total, page, limit);
  } catch (error) {
    console.error('Error getting my payments:', error);
    sendError(res, 'Failed to get payments');
  }
});

/**
 * GET /api/v2/payments/my-summary
 * Get current student's payment summary
 */
router.get('/my-summary', requireAuth, attachUser, async (req: Request, res: Response) => {
  try {
    const student = await studentService.getByUserId(req.user!.id);
    if (!student) {
      return sendBadRequest(res, 'Student profile not found');
    }

    const summary = await paymentService.getPaymentSummary(student.id);
    sendSuccess(res, summary);
  } catch (error) {
    console.error('Error getting payment summary:', error);
    sendError(res, 'Failed to get payment summary');
  }
});

/**
 * POST /api/v2/payments/initiate
 * Initiate Razorpay payment
 */
router.post('/initiate', requireAuth, attachUser, async (req: Request, res: Response) => {
  try {
    const { studentFeeId, discountCode, notes } = req.body;

    if (!studentFeeId) {
      return sendBadRequest(res, 'studentFeeId is required');
    }

    const student = await studentService.getByUserId(req.user!.id);
    if (!student) {
      return sendBadRequest(res, 'Student profile not found');
    }

    // Look up the actual fee from the database — never trust client-provided amounts
    const fee = await feeService.getStudentFeeById(studentFeeId);
    if (!fee) {
      return sendNotFound(res, 'Fee record');
    }

    // Verify this fee belongs to the authenticated student
    if (fee.student_id !== student.id) {
      return sendForbidden(res, 'Not authorized to pay this fee');
    }

    // Calculate the correct amount from the DB record
    const serverAmount = Number(fee.amount_due);
    if (serverAmount <= 0) {
      return sendBadRequest(res, 'This fee has already been fully paid');
    }

    const result = await paymentService.initiateRazorpayPayment({
      student_id: student.id,
      student_fee_id: studentFeeId,
      amount: serverAmount,
      payer_email: req.user?.email,
      discount_code: discountCode,
      notes,
      created_by: req.user?.id,
    });

    sendSuccess(res, result, 'Payment initiated');
  } catch (error) {
    console.error('Error initiating payment:', error);
    sendError(res, (error as Error).message || 'Failed to initiate payment');
  }
});

/**
 * POST /api/v2/payments/complete
 * Complete Razorpay payment after successful transaction
 */
router.post('/complete', requireAuth, attachUser, async (req: Request, res: Response) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return sendBadRequest(res, 'Missing payment verification parameters');
    }

    const payment = await paymentService.completeRazorpayPayment({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });

    sendSuccess(res, payment, 'Payment completed successfully');
  } catch (error) {
    console.error('Error completing payment:', error);
    sendError(res, (error as Error).message || 'Failed to complete payment');
  }
});

/**
 * GET /api/v2/payments/:id
 * Get payment details
 */
router.get('/:id', requireAuth, attachUser, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const payment = await paymentService.getPaymentById(id);
    if (!payment) {
      return sendNotFound(res, 'Payment');
    }

    // Check authorization
    if (req.user?.role !== 'admin' && req.user?.role !== 'teacher') {
      const student = await studentService.getByUserId(req.user!.id);
      if (!student || payment.student_id !== student.id) {
        return sendForbidden(res, 'Not authorized to view this payment');
      }
    }

    sendSuccess(res, payment);
  } catch (error) {
    console.error('Error getting payment:', error);
    sendError(res, 'Failed to get payment');
  }
});

// ============================================
// ADMIN PAYMENT ENDPOINTS
// ============================================

/**
 * GET /api/v2/payments
 * List all payments (admin/teacher)
 */
router.get('/', requireAuth, attachUser, requireTeacherOrAdmin, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const studentId = req.query.studentId as string | undefined;
    const status = req.query.status as PaymentStatus | undefined;
    const paymentMethod = req.query.paymentMethod as PaymentMethod | undefined;
    const dateFrom = req.query.dateFrom as string | undefined;
    const dateTo = req.query.dateTo as string | undefined;

    const result = await paymentService.listPayments({
      page,
      limit,
      studentId,
      status,
      paymentMethod,
      dateFrom,
      dateTo,
    });

    sendPaginated(res, result.payments, result.total, page, limit);
  } catch (error) {
    console.error('Error listing payments:', error);
    sendError(res, 'Failed to list payments');
  }
});

/**
 * POST /api/v2/payments/manual
 * Record manual payment (cash, cheque, bank transfer)
 */
router.post('/manual', requireAuth, attachUser, requireAdmin, async (req: Request, res: Response) => {
  try {
    const {
      studentId,
      studentFeeId,
      amount,
      paymentMethod,
      transactionId,
      bankName,
      bankReference,
      chequeNumber,
      chequeDate,
      chequeBank,
      payerName,
      payerEmail,
      payerPhone,
      notes,
    } = req.body;

    if (!studentId || !amount || !paymentMethod) {
      return sendBadRequest(res, 'studentId, amount, and paymentMethod are required');
    }

    const validMethods: PaymentMethod[] = ['cash', 'cheque', 'bank_transfer', 'upi', 'other'];
    if (!validMethods.includes(paymentMethod)) {
      return sendBadRequest(res, `Invalid payment method. Must be one of: ${validMethods.join(', ')}`);
    }

    const payment = await paymentService.recordManualPayment({
      student_id: studentId,
      student_fee_id: studentFeeId,
      amount,
      payment_method: paymentMethod,
      transaction_id: transactionId,
      bank_name: bankName,
      bank_reference: bankReference,
      cheque_number: chequeNumber,
      cheque_date: chequeDate,
      cheque_bank: chequeBank,
      payer_name: payerName,
      payer_email: payerEmail,
      payer_phone: payerPhone,
      notes,
      created_by: req.user?.id,
    });

    sendCreated(res, payment, 'Payment recorded');
  } catch (error) {
    console.error('Error recording manual payment:', error);
    sendError(res, 'Failed to record payment');
  }
});

/**
 * POST /api/v2/payments/:id/refund
 * Initiate refund
 */
router.post('/:id/refund', requireAuth, attachUser, requireAdmin, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { amount, reason } = req.body;

    const payment = await paymentService.getPaymentById(id);
    if (!payment) {
      return sendNotFound(res, 'Payment');
    }

    const refundedPayment = await paymentService.initiateRefund(id, amount, reason);

    sendSuccess(res, refundedPayment, 'Refund initiated');
  } catch (error) {
    console.error('Error initiating refund:', error);
    sendError(res, (error as Error).message || 'Failed to initiate refund');
  }
});

/**
 * PUT /api/v2/payments/:id/status
 * Update payment status
 */
router.put('/:id/status', requireAuth, attachUser, requireAdmin, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { status, statusReason } = req.body;

    if (!status) {
      return sendBadRequest(res, 'status is required');
    }

    const payment = await paymentService.getPaymentById(id);
    if (!payment) {
      return sendNotFound(res, 'Payment');
    }

    const updatedPayment = await paymentService.updatePaymentStatus(id, status, statusReason);
    sendSuccess(res, updatedPayment, 'Payment status updated');
  } catch (error) {
    console.error('Error updating payment status:', error);
    sendError(res, 'Failed to update payment status');
  }
});

/**
 * GET /api/v2/payments/student/:studentId
 * Get payments for a specific student
 */
router.get('/student/:studentId', requireAuth, attachUser, requireTeacherOrAdmin, async (req: Request, res: Response) => {
  try {
    const studentId = req.params.studentId as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await paymentService.listPayments({
      page,
      limit,
      studentId,
    });

    sendPaginated(res, result.payments, result.total, page, limit);
  } catch (error) {
    console.error('Error getting student payments:', error);
    sendError(res, 'Failed to get student payments');
  }
});

/**
 * GET /api/v2/payments/student/:studentId/summary
 * Get payment summary for a specific student
 */
router.get('/student/:studentId/summary', requireAuth, attachUser, requireTeacherOrAdmin, async (req: Request, res: Response) => {
  try {
    const studentId = req.params.studentId as string;

    const summary = await paymentService.getPaymentSummary(studentId);
    sendSuccess(res, summary);
  } catch (error) {
    console.error('Error getting student payment summary:', error);
    sendError(res, 'Failed to get payment summary');
  }
});

/**
 * GET /api/v2/payments/analytics
 * Get payment analytics
 */
router.get('/analytics', requireAuth, attachUser, requireAdmin, async (req: Request, res: Response) => {
  try {
    const dateFrom = req.query.dateFrom as string | undefined;
    const dateTo = req.query.dateTo as string | undefined;

    const analytics = await paymentService.getPaymentAnalytics({
      dateFrom,
      dateTo,
    });

    sendSuccess(res, analytics);
  } catch (error) {
    console.error('Error getting payment analytics:', error);
    sendError(res, 'Failed to get analytics');
  }
});

export default router;
