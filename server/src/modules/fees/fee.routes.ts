// Fee Routes - /api/v2/fees
// Handles fee structure management and student fees

import { Router, Request, Response } from 'express';
import { requireAuth, attachUser, requireAdmin, requireTeacherOrAdmin } from '../../middleware/auth.js';
import { feeService, FeeType, FeeFrequency, PaymentStatus } from '../../services/feeService.js';
import { studentService } from '../../services/studentService.js';
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
// FEE STRUCTURES (Admin)
// ============================================

/**
 * GET /api/v2/fees/structures
 * List fee structures
 */
router.get('/structures', requireAuth, attachUser, requireTeacherOrAdmin, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const courseId = req.query.courseId as string | undefined;
    const batchId = req.query.batchId as string | undefined;
    const feeType = req.query.feeType as FeeType | undefined;
    const isActive = req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined;

    const result = await feeService.listFeeStructures({
      page,
      limit,
      courseId,
      batchId,
      feeType,
      isActive,
    });

    sendPaginated(res, result.feeStructures, result.total, page, limit);
  } catch (error) {
    console.error('Error listing fee structures:', error);
    sendError(res, 'Failed to list fee structures');
  }
});

/**
 * GET /api/v2/fees/structures/:id
 * Get fee structure by ID
 */
router.get('/structures/:id', requireAuth, attachUser, requireTeacherOrAdmin, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const feeStructure = await feeService.getFeeStructureById(id);
    if (!feeStructure) {
      return sendNotFound(res, 'Fee structure');
    }

    sendSuccess(res, feeStructure);
  } catch (error) {
    console.error('Error getting fee structure:', error);
    sendError(res, 'Failed to get fee structure');
  }
});

/**
 * POST /api/v2/fees/structures
 * Create fee structure
 */
router.post('/structures', requireAuth, attachUser, requireAdmin, async (req: Request, res: Response) => {
  try {
    const {
      name,
      description,
      feeType,
      courseId,
      batchId,
      amount,
      currency,
      frequency,
      durationMonths,
      validFrom,
      validUntil,
      taxPercentage,
      maxDiscountPercentage,
      earlyBirdDiscountPercentage,
      earlyBirdDeadline,
      lateFeePercentage,
      lateFeeFixed,
      gracePeriodDays,
      allowInstallments,
      maxInstallments,
      installmentFeePercentage,
      isMandatory,
    } = req.body;

    if (!name || !feeType || amount === undefined) {
      return sendBadRequest(res, 'name, feeType, and amount are required');
    }

    const feeStructure = await feeService.createFeeStructure({
      name,
      description,
      fee_type: feeType as FeeType,
      course_id: courseId,
      batch_id: batchId,
      amount,
      currency,
      frequency: frequency as FeeFrequency,
      duration_months: durationMonths,
      valid_from: validFrom,
      valid_until: validUntil,
      tax_percentage: taxPercentage,
      max_discount_percentage: maxDiscountPercentage,
      early_bird_discount_percentage: earlyBirdDiscountPercentage,
      early_bird_deadline: earlyBirdDeadline,
      late_fee_percentage: lateFeePercentage,
      late_fee_fixed: lateFeeFixed,
      grace_period_days: gracePeriodDays,
      allow_installments: allowInstallments,
      max_installments: maxInstallments,
      installment_fee_percentage: installmentFeePercentage,
      is_mandatory: isMandatory,
      created_by: req.user?.id,
    });

    sendCreated(res, feeStructure, 'Fee structure created');
  } catch (error) {
    console.error('Error creating fee structure:', error);
    sendError(res, 'Failed to create fee structure');
  }
});

/**
 * PUT /api/v2/fees/structures/:id
 * Update fee structure
 */
router.put('/structures/:id', requireAuth, attachUser, requireAdmin, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const updates = req.body;

    const existing = await feeService.getFeeStructureById(id);
    if (!existing) {
      return sendNotFound(res, 'Fee structure');
    }

    // Map camelCase to snake_case
    const mappedUpdates: Record<string, unknown> = {};
    const fieldMap: Record<string, string> = {
      feeType: 'fee_type',
      courseId: 'course_id',
      batchId: 'batch_id',
      durationMonths: 'duration_months',
      validFrom: 'valid_from',
      validUntil: 'valid_until',
      taxPercentage: 'tax_percentage',
      maxDiscountPercentage: 'max_discount_percentage',
      earlyBirdDiscountPercentage: 'early_bird_discount_percentage',
      earlyBirdDeadline: 'early_bird_deadline',
      lateFeePercentage: 'late_fee_percentage',
      lateFeeFixed: 'late_fee_fixed',
      gracePeriodDays: 'grace_period_days',
      allowInstallments: 'allow_installments',
      maxInstallments: 'max_installments',
      installmentFeePercentage: 'installment_fee_percentage',
      isMandatory: 'is_mandatory',
      isActive: 'is_active',
    };

    for (const [key, value] of Object.entries(updates)) {
      const mappedKey = fieldMap[key] || key;
      mappedUpdates[mappedKey] = value;
    }

    mappedUpdates.updated_by = req.user?.id;

    const feeStructure = await feeService.updateFeeStructure(id, mappedUpdates);
    sendSuccess(res, feeStructure, 'Fee structure updated');
  } catch (error) {
    console.error('Error updating fee structure:', error);
    sendError(res, 'Failed to update fee structure');
  }
});

/**
 * DELETE /api/v2/fees/structures/:id
 * Delete fee structure
 */
router.delete('/structures/:id', requireAuth, attachUser, requireAdmin, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const existing = await feeService.getFeeStructureById(id);
    if (!existing) {
      return sendNotFound(res, 'Fee structure');
    }

    await feeService.deleteFeeStructure(id);
    sendSuccess(res, null, 'Fee structure deleted');
  } catch (error) {
    console.error('Error deleting fee structure:', error);
    sendError(res, 'Failed to delete fee structure');
  }
});

// ============================================
// STUDENT FEES
// ============================================

/**
 * GET /api/v2/fees/my-fees
 * Get current student's fees
 */
router.get('/my-fees', requireAuth, attachUser, async (req: Request, res: Response) => {
  try {
    const student = await studentService.getByUserId(req.user!.id);
    if (!student) {
      return sendBadRequest(res, 'Student profile not found');
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as PaymentStatus | undefined;

    const result = await feeService.listStudentFees({
      page,
      limit,
      studentId: student.id,
      status,
    });

    sendPaginated(res, result.fees, result.total, page, limit);
  } catch (error) {
    console.error('Error getting my fees:', error);
    sendError(res, 'Failed to get fees');
  }
});

/**
 * GET /api/v2/fees/my-summary
 * Get current student's fee summary
 */
router.get('/my-summary', requireAuth, attachUser, async (req: Request, res: Response) => {
  try {
    const student = await studentService.getByUserId(req.user!.id);
    if (!student) {
      return sendBadRequest(res, 'Student profile not found');
    }

    const summary = await feeService.getStudentFeeSummary(student.id);
    sendSuccess(res, summary);
  } catch (error) {
    console.error('Error getting fee summary:', error);
    sendError(res, 'Failed to get fee summary');
  }
});

/**
 * GET /api/v2/fees/applicable
 * Get applicable fee structures for current student
 */
router.get('/applicable', requireAuth, attachUser, async (req: Request, res: Response) => {
  try {
    const student = await studentService.getByUserId(req.user!.id);
    if (!student) {
      return sendBadRequest(res, 'Student profile not found');
    }

    const structures = await feeService.getApplicableFeeStructures(student.id);
    sendSuccess(res, structures);
  } catch (error) {
    console.error('Error getting applicable fees:', error);
    sendError(res, 'Failed to get applicable fees');
  }
});

/**
 * GET /api/v2/fees
 * List all student fees (admin/teacher)
 */
router.get('/', requireAuth, attachUser, requireTeacherOrAdmin, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const studentId = req.query.studentId as string | undefined;
    const status = req.query.status as PaymentStatus | undefined;
    const feeType = req.query.feeType as FeeType | undefined;
    const academicYear = req.query.academicYear as string | undefined;
    const overdue = req.query.overdue === 'true';
    const search = req.query.search as string | undefined;

    const result = await feeService.listStudentFees({
      page,
      limit,
      studentId,
      status,
      feeType,
      academicYear,
      overdue,
      search,
    });

    sendPaginated(res, result.fees, result.total, page, limit);
  } catch (error) {
    console.error('Error listing fees:', error);
    sendError(res, 'Failed to list fees');
  }
});

/**
 * GET /api/v2/fees/summary
 * Get admin-level fee summary across all students
 */
router.get('/summary', requireAuth, attachUser, requireTeacherOrAdmin, async (_req: Request, res: Response) => {
  try {
    const summary = await feeService.getAdminFeeSummary();
    sendSuccess(res, summary);
  } catch (error) {
    console.error('Error getting fee summary:', error);
    sendError(res, 'Failed to get fee summary');
  }
});

/**
 * GET /api/v2/fees/:id
 * Get student fee by ID
 */
router.get('/:id', requireAuth, attachUser, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const fee = await feeService.getStudentFeeById(id);
    if (!fee) {
      return sendNotFound(res, 'Fee');
    }

    // Check authorization
    if (req.user?.role !== 'admin' && req.user?.role !== 'teacher') {
      const student = await studentService.getByUserId(req.user!.id);
      if (!student || fee.student_id !== student.id) {
        return sendForbidden(res, 'Not authorized to view this fee');
      }
    }

    sendSuccess(res, fee);
  } catch (error) {
    console.error('Error getting fee:', error);
    sendError(res, 'Failed to get fee');
  }
});

/**
 * POST /api/v2/fees
 * Create student fee
 */
router.post('/', requireAuth, attachUser, requireAdmin, async (req: Request, res: Response) => {
  try {
    const {
      studentId,
      feeStructureId,
      feeType,
      description,
      baseAmount,
      discountAmount,
      discountReason,
      taxAmount,
      lateFeeAmount,
      dueDate,
      isInstallment,
      installmentNumber,
      totalInstallments,
      parentFeeId,
      academicYear,
      academicTerm,
      notes,
    } = req.body;

    if (!studentId || !feeType || baseAmount === undefined || !dueDate) {
      return sendBadRequest(res, 'studentId, feeType, baseAmount, and dueDate are required');
    }

    const fee = await feeService.createStudentFee({
      student_id: studentId,
      fee_structure_id: feeStructureId,
      fee_type: feeType as FeeType,
      description,
      base_amount: baseAmount,
      discount_amount: discountAmount,
      discount_reason: discountReason,
      tax_amount: taxAmount,
      late_fee_amount: lateFeeAmount,
      due_date: dueDate,
      is_installment: isInstallment,
      installment_number: installmentNumber,
      total_installments: totalInstallments,
      parent_fee_id: parentFeeId,
      academic_year: academicYear,
      academic_term: academicTerm,
      notes,
      created_by: req.user?.id,
    });

    sendCreated(res, fee, 'Fee created');
  } catch (error) {
    console.error('Error creating fee:', error);
    sendError(res, 'Failed to create fee');
  }
});

/**
 * POST /api/v2/fees/from-structure
 * Create student fee from fee structure
 */
router.post('/from-structure', requireAuth, attachUser, requireAdmin, async (req: Request, res: Response) => {
  try {
    const {
      studentId,
      feeStructureId,
      dueDate,
      discountAmount,
      discountReason,
      academicYear,
      academicTerm,
      createInstallments,
    } = req.body;

    if (!studentId || !feeStructureId || !dueDate) {
      return sendBadRequest(res, 'studentId, feeStructureId, and dueDate are required');
    }

    const fee = await feeService.createStudentFeeFromStructure(studentId, feeStructureId, {
      dueDate,
      discountAmount,
      discountReason,
      academicYear,
      academicTerm,
      createInstallments,
      createdBy: req.user?.id,
    });

    sendCreated(res, fee, 'Fee created');
  } catch (error) {
    console.error('Error creating fee from structure:', error);
    sendError(res, (error as Error).message || 'Failed to create fee');
  }
});

/**
 * PUT /api/v2/fees/:id
 * Update student fee
 */
router.put('/:id', requireAuth, attachUser, requireAdmin, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const updates = req.body;

    const existing = await feeService.getStudentFeeById(id);
    if (!existing) {
      return sendNotFound(res, 'Fee');
    }

    // Map camelCase to snake_case
    const mappedUpdates: Record<string, unknown> = {};
    const fieldMap: Record<string, string> = {
      feeType: 'fee_type',
      baseAmount: 'base_amount',
      discountAmount: 'discount_amount',
      discountReason: 'discount_reason',
      taxAmount: 'tax_amount',
      lateFeeAmount: 'late_fee_amount',
      totalAmount: 'total_amount',
      amountPaid: 'amount_paid',
      amountDue: 'amount_due',
      dueDate: 'due_date',
      academicYear: 'academic_year',
      academicTerm: 'academic_term',
    };

    for (const [key, value] of Object.entries(updates)) {
      const mappedKey = fieldMap[key] || key;
      mappedUpdates[mappedKey] = value;
    }

    mappedUpdates.updated_by = req.user?.id;

    const fee = await feeService.updateStudentFee(id, mappedUpdates);
    sendSuccess(res, fee, 'Fee updated');
  } catch (error) {
    console.error('Error updating fee:', error);
    sendError(res, 'Failed to update fee');
  }
});

/**
 * DELETE /api/v2/fees/:id
 * Delete student fee
 */
router.delete('/:id', requireAuth, attachUser, requireAdmin, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const existing = await feeService.getStudentFeeById(id);
    if (!existing) {
      return sendNotFound(res, 'Fee');
    }

    await feeService.deleteStudentFee(id);
    sendSuccess(res, null, 'Fee deleted');
  } catch (error) {
    console.error('Error deleting fee:', error);
    sendError(res, 'Failed to delete fee');
  }
});

/**
 * GET /api/v2/fees/student/:studentId/summary
 * Get student's fee summary
 */
router.get('/student/:studentId/summary', requireAuth, attachUser, requireTeacherOrAdmin, async (req: Request, res: Response) => {
  try {
    const studentId = req.params.studentId as string;

    const summary = await feeService.getStudentFeeSummary(studentId);
    sendSuccess(res, summary);
  } catch (error) {
    console.error('Error getting student fee summary:', error);
    sendError(res, 'Failed to get fee summary');
  }
});

/**
 * POST /api/v2/fees/apply-late-fees
 * Apply late fees to overdue fees
 */
router.post('/apply-late-fees', requireAuth, attachUser, requireAdmin, async (_req: Request, res: Response) => {
  try {
    const updatedCount = await feeService.applyLateFees();
    sendSuccess(res, { updatedCount }, `Late fees applied to ${updatedCount} fees`);
  } catch (error) {
    console.error('Error applying late fees:', error);
    sendError(res, 'Failed to apply late fees');
  }
});

// ============================================
// INVOICES
// ============================================

/**
 * GET /api/v2/fees/invoices
 * List invoices
 */
router.get('/invoices', requireAuth, attachUser, requireTeacherOrAdmin, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const studentId = req.query.studentId as string | undefined;
    const status = req.query.status as string | undefined;
    const dateFrom = req.query.dateFrom as string | undefined;
    const dateTo = req.query.dateTo as string | undefined;

    const result = await feeService.listInvoices({
      page,
      limit,
      studentId,
      status: status as 'draft' | 'sent' | 'paid' | 'partially_paid' | 'overdue' | 'cancelled' | 'void' | undefined,
      dateFrom,
      dateTo,
    });

    sendPaginated(res, result.invoices, result.total, page, limit);
  } catch (error) {
    console.error('Error listing invoices:', error);
    sendError(res, 'Failed to list invoices');
  }
});

/**
 * GET /api/v2/fees/my-invoices
 * Get current student's invoices
 */
router.get('/my-invoices', requireAuth, attachUser, async (req: Request, res: Response) => {
  try {
    const student = await studentService.getByUserId(req.user!.id);
    if (!student) {
      return sendBadRequest(res, 'Student profile not found');
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await feeService.listInvoices({
      page,
      limit,
      studentId: student.id,
    });

    sendPaginated(res, result.invoices, result.total, page, limit);
  } catch (error) {
    console.error('Error getting my invoices:', error);
    sendError(res, 'Failed to get invoices');
  }
});

/**
 * GET /api/v2/fees/invoices/:id
 * Get invoice by ID
 */
router.get('/invoices/:id', requireAuth, attachUser, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const invoice = await feeService.getInvoiceById(id);
    if (!invoice) {
      return sendNotFound(res, 'Invoice');
    }

    // Check authorization
    if (req.user?.role !== 'admin' && req.user?.role !== 'teacher') {
      const student = await studentService.getByUserId(req.user!.id);
      if (!student || invoice.student_id !== student.id) {
        return sendForbidden(res, 'Not authorized to view this invoice');
      }
    }

    sendSuccess(res, invoice);
  } catch (error) {
    console.error('Error getting invoice:', error);
    sendError(res, 'Failed to get invoice');
  }
});

/**
 * POST /api/v2/fees/invoices
 * Create invoice
 */
router.post('/invoices', requireAuth, attachUser, requireAdmin, async (req: Request, res: Response) => {
  try {
    const {
      studentId,
      paymentId,
      title,
      description,
      lineItems,
      discountAmount,
      taxAmount,
      dueDate,
      billingName,
      billingEmail,
      billingPhone,
      billingAddress,
      billingGstin,
      notes,
      terms,
    } = req.body;

    if (!studentId || !lineItems || !Array.isArray(lineItems) || lineItems.length === 0) {
      return sendBadRequest(res, 'studentId and lineItems are required');
    }

    const invoice = await feeService.createInvoice({
      student_id: studentId,
      payment_id: paymentId,
      title,
      description,
      line_items: lineItems,
      discount_amount: discountAmount,
      tax_amount: taxAmount,
      due_date: dueDate,
      billing_name: billingName,
      billing_email: billingEmail,
      billing_phone: billingPhone,
      billing_address: billingAddress,
      billing_gstin: billingGstin,
      notes,
      terms,
      created_by: req.user?.id,
    });

    sendCreated(res, invoice, 'Invoice created');
  } catch (error) {
    console.error('Error creating invoice:', error);
    sendError(res, 'Failed to create invoice');
  }
});

/**
 * POST /api/v2/fees/invoices/:id/send
 * Send invoice
 */
router.post('/invoices/:id/send', requireAuth, attachUser, requireAdmin, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const existing = await feeService.getInvoiceById(id);
    if (!existing) {
      return sendNotFound(res, 'Invoice');
    }

    const invoice = await feeService.sendInvoice(id);
    sendSuccess(res, invoice, 'Invoice sent');
  } catch (error) {
    console.error('Error sending invoice:', error);
    sendError(res, 'Failed to send invoice');
  }
});

// ============================================
// DISCOUNT CODES
// ============================================

/**
 * GET /api/v2/fees/discount-codes
 * List discount codes (admin)
 */
router.get('/discount-codes', requireAuth, attachUser, requireAdmin, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const isActive = req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined;

    const result = await feeService.listDiscountCodes({
      page,
      limit,
      isActive,
    });

    sendPaginated(res, result.codes, result.total, page, limit);
  } catch (error) {
    console.error('Error listing discount codes:', error);
    sendError(res, 'Failed to list discount codes');
  }
});

/**
 * POST /api/v2/fees/discount-codes
 * Create discount code
 */
router.post('/discount-codes', requireAuth, attachUser, requireAdmin, async (req: Request, res: Response) => {
  try {
    const {
      code,
      description,
      discountType,
      discountValue,
      maxDiscountAmount,
      validFrom,
      validUntil,
      maxUses,
      maxUsesPerStudent,
      applicableCourses,
      applicableBatches,
      applicableFeeTypes,
      minPurchaseAmount,
    } = req.body;

    if (!code || !discountType || discountValue === undefined) {
      return sendBadRequest(res, 'code, discountType, and discountValue are required');
    }

    const discountCode = await feeService.createDiscountCode({
      code,
      description,
      discount_type: discountType,
      discount_value: discountValue,
      max_discount_amount: maxDiscountAmount,
      valid_from: validFrom,
      valid_until: validUntil,
      max_uses: maxUses,
      max_uses_per_student: maxUsesPerStudent,
      applicable_courses: applicableCourses,
      applicable_batches: applicableBatches,
      applicable_fee_types: applicableFeeTypes,
      min_purchase_amount: minPurchaseAmount,
      created_by: req.user?.id,
    });

    sendCreated(res, discountCode, 'Discount code created');
  } catch (error) {
    console.error('Error creating discount code:', error);
    sendError(res, 'Failed to create discount code');
  }
});

/**
 * POST /api/v2/fees/validate-discount
 * Validate a discount code
 */
router.post('/validate-discount', requireAuth, attachUser, async (req: Request, res: Response) => {
  try {
    const { code, amount, courseId, batchId, feeType } = req.body;

    if (!code || amount === undefined) {
      return sendBadRequest(res, 'code and amount are required');
    }

    const student = await studentService.getByUserId(req.user!.id);
    if (!student) {
      return sendBadRequest(res, 'Student profile not found');
    }

    const result = await feeService.validateDiscount(code, student.id, amount, {
      courseId,
      batchId,
      feeType,
    });

    sendSuccess(res, result);
  } catch (error) {
    console.error('Error validating discount:', error);
    sendError(res, 'Failed to validate discount');
  }
});

/**
 * PUT /api/v2/fees/discount-codes/:id
 * Update discount code
 */
router.put('/discount-codes/:id', requireAuth, attachUser, requireAdmin, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const updates = req.body;

    // Map camelCase to snake_case
    const mappedUpdates: Record<string, unknown> = {};
    const fieldMap: Record<string, string> = {
      discountType: 'discount_type',
      discountValue: 'discount_value',
      maxDiscountAmount: 'max_discount_amount',
      validFrom: 'valid_from',
      validUntil: 'valid_until',
      maxUses: 'max_uses',
      maxUsesPerStudent: 'max_uses_per_student',
      applicableCourses: 'applicable_courses',
      applicableBatches: 'applicable_batches',
      applicableFeeTypes: 'applicable_fee_types',
      minPurchaseAmount: 'min_purchase_amount',
      isActive: 'is_active',
    };

    for (const [key, value] of Object.entries(updates)) {
      const mappedKey = fieldMap[key] || key;
      mappedUpdates[mappedKey] = value;
    }

    const discountCode = await feeService.updateDiscountCode(id, mappedUpdates);
    sendSuccess(res, discountCode, 'Discount code updated');
  } catch (error) {
    console.error('Error updating discount code:', error);
    sendError(res, 'Failed to update discount code');
  }
});

/**
 * DELETE /api/v2/fees/discount-codes/:id
 * Delete discount code
 */
router.delete('/discount-codes/:id', requireAuth, attachUser, requireAdmin, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    await feeService.deleteDiscountCode(id);
    sendSuccess(res, null, 'Discount code deleted');
  } catch (error) {
    console.error('Error deleting discount code:', error);
    sendError(res, 'Failed to delete discount code');
  }
});

export default router;
