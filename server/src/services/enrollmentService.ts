// Enrollment Service
// Handles class enrollments with Razorpay payment integration

import crypto from 'crypto';
import Razorpay from 'razorpay';
import { getSupabase } from '../config/supabase.js';
import { env } from '../config/env.js';
import { courseTypeService } from './courseTypeService.js';

// Lazy initialize Razorpay to avoid crash if env vars not set
let razorpayInstance: Razorpay | null = null;

function getRazorpay(): Razorpay {
  if (!razorpayInstance) {
    if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
      throw new Error('Razorpay credentials not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env');
    }
    razorpayInstance = new Razorpay({
      key_id: env.RAZORPAY_KEY_ID,
      key_secret: env.RAZORPAY_KEY_SECRET,
    });
  }
  return razorpayInstance;
}

export type EnrollmentStatus = 'pending' | 'active' | 'expired' | 'cancelled' | 'refunded';
export type PaymentStatus = 'pending' | 'processing' | 'paid' | 'failed' | 'refunded' | 'partially_refunded';
export type PaymentType = 'razorpay' | 'cash' | 'bank_transfer' | 'cheque' | 'upi_direct';

export interface ClassEnrollment {
  id: string;
  student_id: string;
  class_id: string;
  fee_plan_id: string;
  enrollment_number: string;
  status: EnrollmentStatus;
  initiated_at: string;
  enrolled_at: string | null;
  expires_at: string | null;
  cancelled_at: string | null;
  amount_paid: number | null;
  notes: string | null;
  cancellation_reason: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface EnrollmentPayment {
  id: string;
  enrollment_id: string;
  payment_type: PaymentType;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  razorpay_signature: string | null;
  amount: number;
  amount_paise: number;
  currency: string;
  status: PaymentStatus;
  payment_method: string | null;
  bank: string | null;
  wallet: string | null;
  vpa: string | null;
  card_last4: string | null;
  card_network: string | null;
  error_code: string | null;
  error_description: string | null;
  error_source: string | null;
  error_step: string | null;
  error_reason: string | null;
  refund_id: string | null;
  refund_amount: number | null;
  refund_status: string | null;
  refunded_at: string | null;
  paid_at: string | null;
  // Manual payment fields
  receipt_number: string | null;
  received_by: string | null;
  received_at: string | null;
  payment_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface InitiateEnrollmentInput {
  studentId: string;
  classId: string;
  feePlanId: string;
  studentName: string;
  studentEmail: string;
  studentPhone?: string;
}

export interface InitiateEnrollmentResult {
  enrollmentId: string;
  orderId: string;
  amount: number;
  amountPaise: number;
  currency: string;
  keyId: string;
  prefill: {
    name: string;
    email: string;
    contact?: string;
  };
  notes: Record<string, string>;
}

export interface VerifyPaymentInput {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface EnrollmentWithDetails extends ClassEnrollment {
  class_name?: string;
  course_type_name?: string;
  fee_plan_name?: string;
  total_amount?: number;
  payment?: EnrollmentPayment;
}

export interface ManualEnrollmentInput {
  studentId: string;
  classId: string;
  feePlanId: string;
  paymentType: Exclude<PaymentType, 'razorpay'>;
  amountReceived: number;
  receivedBy: string; // Admin user ID
  receiptNumber?: string; // Optional - will be auto-generated if not provided
  notes?: string;
}

export interface ManualEnrollmentResult {
  enrollment: ClassEnrollment;
  payment: {
    id: string;
    receipt_number: string;
    amount: number;
    payment_type: PaymentType;
    status: PaymentStatus;
  };
}

class EnrollmentService {
  /**
   * Initiate enrollment - creates enrollment record and Razorpay order
   */
  async initiateEnrollment(input: InitiateEnrollmentInput): Promise<InitiateEnrollmentResult> {
    const { studentId, classId, feePlanId, studentName, studentEmail, studentPhone } = input;

    // 1. Check if student is already enrolled
    const existingEnrollment = await this.getEnrollmentByStudentAndClass(studentId, classId);
    if (existingEnrollment) {
      if (existingEnrollment.status === 'active') {
        throw new Error('You are already enrolled in this class');
      }
      if (existingEnrollment.status === 'pending') {
        // Return existing pending enrollment's order
        const existingPayment = await this.getPaymentByEnrollmentId(existingEnrollment.id);
        if (existingPayment && existingPayment.status === 'pending' && existingPayment.razorpay_order_id) {
          return {
            enrollmentId: existingEnrollment.id,
            orderId: existingPayment.razorpay_order_id,
            amount: existingPayment.amount,
            amountPaise: existingPayment.amount_paise,
            currency: existingPayment.currency,
            keyId: env.RAZORPAY_KEY_ID,
            prefill: {
              name: studentName,
              email: studentEmail,
              contact: studentPhone,
            },
            notes: {
              enrollmentId: existingEnrollment.id,
              classId,
              studentId,
            },
          };
        }
      }
    }

    // 2. Verify class exists and is active
    const classInfo = await courseTypeService.getClassById(classId);
    if (!classInfo) {
      throw new Error('Class not found');
    }
    if (!classInfo.is_active || !classInfo.enrollment_open) {
      throw new Error('This class is not available for enrollment');
    }

    // Check capacity
    if (classInfo.max_students && classInfo.current_students >= classInfo.max_students) {
      throw new Error('This class is full');
    }

    // 3. Verify fee plan
    const feePlan = await courseTypeService.getFeePlanById(feePlanId);
    if (!feePlan || feePlan.class_id !== classId) {
      throw new Error('Invalid fee plan');
    }

    // 4. Create Razorpay order
    const amountPaise = Math.round(feePlan.total_amount * 100);
    const order = await getRazorpay().orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt: `enr_${Date.now()}`,
      notes: {
        classId,
        studentId,
        feePlanId,
      },
    });

    // 5. Create enrollment record (or update existing pending one)
    let enrollment: ClassEnrollment;

    if (existingEnrollment && existingEnrollment.status === 'pending') {
      // Update existing enrollment
      const { data, error } = await getSupabase()
        .from('class_enrollments')
        .update({
          fee_plan_id: feePlanId,
          initiated_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingEnrollment.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating enrollment:', error);
        throw new Error('Failed to update enrollment');
      }
      enrollment = data;
    } else {
      // Create new enrollment
      const { data, error } = await getSupabase()
        .from('class_enrollments')
        .insert({
          student_id: studentId,
          class_id: classId,
          fee_plan_id: feePlanId,
          status: 'pending',
          initiated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating enrollment:', error);
        throw new Error('Failed to create enrollment');
      }
      enrollment = data;
    }

    // 6. Create payment record
    const { error: paymentError } = await getSupabase()
      .from('enrollment_payments')
      .insert({
        enrollment_id: enrollment.id,
        razorpay_order_id: order.id,
        amount: feePlan.total_amount,
        amount_paise: amountPaise,
        currency: 'INR',
        status: 'pending',
      });

    if (paymentError) {
      console.error('Error creating payment record:', paymentError);
      // Don't throw - enrollment is created, payment record failure shouldn't stop the flow
    }

    return {
      enrollmentId: enrollment.id,
      orderId: order.id,
      amount: feePlan.total_amount,
      amountPaise,
      currency: 'INR',
      keyId: env.RAZORPAY_KEY_ID,
      prefill: {
        name: studentName,
        email: studentEmail,
        contact: studentPhone,
      },
      notes: {
        enrollmentId: enrollment.id,
        classId,
        studentId,
      },
    };
  }

  /**
   * Verify payment and complete enrollment
   */
  async verifyPayment(input: VerifyPaymentInput): Promise<ClassEnrollment> {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = input;

    // 1. Verify signature
    const isValid = this.verifyRazorpaySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValid) {
      // Update payment status to failed
      await getSupabase()
        .from('enrollment_payments')
        .update({
          status: 'failed',
          error_description: 'Signature verification failed',
          updated_at: new Date().toISOString(),
        })
        .eq('razorpay_order_id', razorpay_order_id);

      throw new Error('Payment verification failed');
    }

    // 2. Get payment record
    const { data: payment, error: paymentError } = await getSupabase()
      .from('enrollment_payments')
      .select('*, class_enrollments(*)')
      .eq('razorpay_order_id', razorpay_order_id)
      .single();

    if (paymentError || !payment) {
      throw new Error('Payment record not found');
    }

    // Check if already processed (idempotency)
    if (payment.status === 'paid') {
      return payment.class_enrollments;
    }

    // 3. Get payment details from Razorpay
    const razorpayPayment = await getRazorpay().payments.fetch(razorpay_payment_id) as any;

    // 4. Update payment record
    const { error: updatePaymentError } = await getSupabase()
      .from('enrollment_payments')
      .update({
        razorpay_payment_id,
        razorpay_signature,
        status: 'paid',
        payment_method: razorpayPayment.method || null,
        bank: razorpayPayment.bank || null,
        wallet: razorpayPayment.wallet || null,
        vpa: razorpayPayment.vpa || null,
        card_last4: razorpayPayment.card?.last4 || null,
        card_network: razorpayPayment.card?.network || null,
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('razorpay_order_id', razorpay_order_id);

    if (updatePaymentError) {
      console.error('Error updating payment:', updatePaymentError);
    }

    // 5. Get fee plan for validity calculation
    const { data: feePlan } = await getSupabase()
      .from('class_fee_plans')
      .select('validity_months')
      .eq('id', payment.class_enrollments.fee_plan_id)
      .single();

    const validityMonths = feePlan?.validity_months || 12;
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + validityMonths);

    // 6. Update enrollment to active
    const { data: enrollment, error: enrollmentError } = await getSupabase()
      .from('class_enrollments')
      .update({
        status: 'active',
        enrolled_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        amount_paid: payment.amount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', payment.enrollment_id)
      .select()
      .single();

    if (enrollmentError) {
      console.error('Error updating enrollment:', enrollmentError);
      throw new Error('Failed to complete enrollment');
    }

    return enrollment;
  }

  /**
   * Verify Razorpay signature (CRITICAL SECURITY)
   */
  private verifyRazorpaySignature(
    orderId: string,
    paymentId: string,
    signature: string
  ): boolean {
    const body = orderId + '|' + paymentId;
    const expectedSignature = crypto
      .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    return expectedSignature === signature;
  }

  /**
   * Handle payment failure
   */
  async handlePaymentFailure(
    orderId: string,
    errorCode: string,
    errorDescription: string
  ): Promise<void> {
    await getSupabase()
      .from('enrollment_payments')
      .update({
        status: 'failed',
        error_code: errorCode,
        error_description: errorDescription,
        updated_at: new Date().toISOString(),
      })
      .eq('razorpay_order_id', orderId);
  }

  /**
   * Get enrollment by student and class
   */
  async getEnrollmentByStudentAndClass(
    studentId: string,
    classId: string
  ): Promise<ClassEnrollment | null> {
    const { data, error } = await getSupabase()
      .from('class_enrollments')
      .select('*')
      .eq('student_id', studentId)
      .eq('class_id', classId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching enrollment:', error);
      throw new Error('Failed to fetch enrollment');
    }

    return data;
  }

  /**
   * Get payment by enrollment ID
   */
  async getPaymentByEnrollmentId(enrollmentId: string): Promise<EnrollmentPayment | null> {
    const { data, error } = await getSupabase()
      .from('enrollment_payments')
      .select('*')
      .eq('enrollment_id', enrollmentId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching payment:', error);
      throw new Error('Failed to fetch payment');
    }

    return data;
  }

  /**
   * Get student's enrollments
   */
  async getStudentEnrollments(studentId: string): Promise<EnrollmentWithDetails[]> {
    const { data, error } = await getSupabase()
      .from('class_enrollments')
      .select(`
        *,
        academic_classes (
          name,
          course_types (name)
        ),
        class_fee_plans (
          name,
          total_amount
        ),
        enrollment_payments (*)
      `)
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching student enrollments:', error);
      throw new Error('Failed to fetch enrollments');
    }

    return (data || []).map((enrollment: any) => ({
      ...enrollment,
      class_name: enrollment.academic_classes?.name,
      course_type_name: enrollment.academic_classes?.course_types?.name,
      fee_plan_name: enrollment.class_fee_plans?.name,
      total_amount: enrollment.class_fee_plans?.total_amount,
      payment: enrollment.enrollment_payments?.find((p: any) => p.status === 'paid') ||
               enrollment.enrollment_payments?.[0],
      academic_classes: undefined,
      class_fee_plans: undefined,
      enrollment_payments: undefined,
    }));
  }

  /**
   * Get enrollment by ID
   */
  async getEnrollmentById(enrollmentId: string): Promise<EnrollmentWithDetails | null> {
    const { data, error } = await getSupabase()
      .from('class_enrollments')
      .select(`
        *,
        academic_classes (
          name,
          course_types (name)
        ),
        class_fee_plans (
          name,
          total_amount
        ),
        enrollment_payments (*)
      `)
      .eq('id', enrollmentId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      console.error('Error fetching enrollment:', error);
      throw new Error('Failed to fetch enrollment');
    }

    if (!data) return null;

    return {
      ...data,
      class_name: data.academic_classes?.name,
      course_type_name: data.academic_classes?.course_types?.name,
      fee_plan_name: data.class_fee_plans?.name,
      total_amount: data.class_fee_plans?.total_amount,
      payment: data.enrollment_payments?.find((p: any) => p.status === 'paid') ||
               data.enrollment_payments?.[0],
      academic_classes: undefined,
      class_fee_plans: undefined,
      enrollment_payments: undefined,
    };
  }

  /**
   * Manual enrollment by admin (for cash/offline payments)
   * Creates enrollment directly as 'active' without Razorpay
   */
  async createManualEnrollment(input: ManualEnrollmentInput): Promise<ManualEnrollmentResult> {
    const { studentId, classId, feePlanId, paymentType, amountReceived, receivedBy, receiptNumber, notes } = input;

    // 1. Check if student is already enrolled
    const existingEnrollment = await this.getEnrollmentByStudentAndClass(studentId, classId);
    if (existingEnrollment) {
      if (existingEnrollment.status === 'active') {
        throw new Error('Student is already enrolled in this class');
      }
      // If pending, we'll update it to active
    }

    // 2. Verify class exists and is active
    const classInfo = await courseTypeService.getClassById(classId);
    if (!classInfo) {
      throw new Error('Class not found');
    }
    if (!classInfo.is_active) {
      throw new Error('This class is not active');
    }

    // Check capacity
    if (classInfo.max_students && classInfo.current_students >= classInfo.max_students) {
      throw new Error('This class is full');
    }

    // 3. Verify fee plan
    const feePlan = await courseTypeService.getFeePlanById(feePlanId);
    if (!feePlan || feePlan.class_id !== classId) {
      throw new Error('Invalid fee plan');
    }

    // 4. Validate amount (allow partial payments but warn)
    if (amountReceived <= 0) {
      throw new Error('Amount received must be greater than 0');
    }

    // Calculate expiry date
    const validityMonths = feePlan.validity_months || 12;
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + validityMonths);

    const now = new Date().toISOString();
    let enrollment: ClassEnrollment;

    // 5. Create or update enrollment
    if (existingEnrollment && existingEnrollment.status === 'pending') {
      // Update existing pending enrollment to active
      const { data, error } = await getSupabase()
        .from('class_enrollments')
        .update({
          fee_plan_id: feePlanId,
          status: 'active',
          enrolled_at: now,
          expires_at: expiresAt.toISOString(),
          amount_paid: amountReceived,
          notes: notes || null,
          updated_at: now,
        })
        .eq('id', existingEnrollment.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating enrollment:', error);
        throw new Error('Failed to update enrollment');
      }
      enrollment = data;
    } else {
      // Create new enrollment directly as active
      const { data, error } = await getSupabase()
        .from('class_enrollments')
        .insert({
          student_id: studentId,
          class_id: classId,
          fee_plan_id: feePlanId,
          status: 'active',
          initiated_at: now,
          enrolled_at: now,
          expires_at: expiresAt.toISOString(),
          amount_paid: amountReceived,
          notes: notes || null,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating enrollment:', error);
        throw new Error('Failed to create enrollment');
      }
      enrollment = data;
    }

    // 6. Generate receipt number if not provided
    const finalReceiptNumber = receiptNumber || await this.generateReceiptNumber(paymentType);

    // 7. Create payment record (without Razorpay fields)
    const amountPaise = Math.round(amountReceived * 100);
    const { data: payment, error: paymentError } = await getSupabase()
      .from('enrollment_payments')
      .insert({
        enrollment_id: enrollment.id,
        payment_type: paymentType,
        razorpay_order_id: null,
        razorpay_payment_id: null,
        razorpay_signature: null,
        amount: amountReceived,
        amount_paise: amountPaise,
        currency: 'INR',
        status: 'paid',
        payment_method: paymentType,
        receipt_number: finalReceiptNumber,
        received_by: receivedBy,
        received_at: now,
        paid_at: now,
        payment_notes: notes || null,
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Error creating payment record:', paymentError);
      // Rollback enrollment status
      await getSupabase()
        .from('class_enrollments')
        .update({ status: 'pending', enrolled_at: null })
        .eq('id', enrollment.id);
      throw new Error('Failed to create payment record');
    }

    return {
      enrollment,
      payment: {
        id: payment.id,
        receipt_number: finalReceiptNumber,
        amount: amountReceived,
        payment_type: paymentType,
        status: 'paid',
      },
    };
  }

  /**
   * Generate receipt number for manual payments
   * Format: CASH-2026-000001, BANK-2026-000001, etc.
   */
  private async generateReceiptNumber(paymentType: PaymentType): Promise<string> {
    const year = new Date().getFullYear();
    const prefixMap: Record<PaymentType, string> = {
      razorpay: 'RZP',
      cash: 'CASH',
      bank_transfer: 'BANK',
      cheque: 'CHQ',
      upi_direct: 'UPI',
    };
    const prefix = prefixMap[paymentType] || 'RCP';
    const pattern = `${prefix}-${year}-%`;

    // Find the highest existing receipt number for this type and year
    const { data } = await getSupabase()
      .from('enrollment_payments')
      .select('receipt_number')
      .like('receipt_number', pattern)
      .order('receipt_number', { ascending: false })
      .limit(1);

    let nextNum = 1;
    if (data && data.length > 0 && data[0].receipt_number) {
      const match = data[0].receipt_number.match(/-(\d+)$/);
      if (match) {
        nextNum = parseInt(match[1], 10) + 1;
      }
    }

    return `${prefix}-${year}-${nextNum.toString().padStart(6, '0')}`;
  }

  /**
   * List all enrollments (admin)
   */
  async listAllEnrollments(options: {
    page?: number;
    limit?: number;
    status?: EnrollmentStatus;
    classId?: string;
  }): Promise<{ enrollments: EnrollmentWithDetails[]; total: number }> {
    const { page = 1, limit = 20, status, classId } = options;
    const offset = (page - 1) * limit;

    let query = getSupabase()
      .from('class_enrollments')
      .select(`
        *,
        students (
          id,
          student_id,
          users (
            first_name,
            last_name,
            email
          )
        ),
        academic_classes (
          name,
          course_types (name)
        ),
        class_fee_plans (
          name,
          total_amount
        ),
        enrollment_payments (*)
      `, { count: 'exact' });

    if (status) {
      query = query.eq('status', status);
    }

    if (classId) {
      query = query.eq('class_id', classId);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error listing enrollments:', error);
      throw new Error('Failed to list enrollments');
    }

    const enrollments = (data || []).map((enrollment: any) => ({
      ...enrollment,
      student_name: enrollment.students?.users
        ? `${enrollment.students.users.first_name || ''} ${enrollment.students.users.last_name || ''}`.trim()
        : null,
      student_code: enrollment.students?.student_id,
      student_email: enrollment.students?.users?.email,
      class_name: enrollment.academic_classes?.name,
      course_type_name: enrollment.academic_classes?.course_types?.name,
      fee_plan_name: enrollment.class_fee_plans?.name,
      total_amount: enrollment.class_fee_plans?.total_amount,
      payment: enrollment.enrollment_payments?.find((p: any) => p.status === 'paid') ||
               enrollment.enrollment_payments?.[0],
      students: undefined,
      academic_classes: undefined,
      class_fee_plans: undefined,
      enrollment_payments: undefined,
    }));

    return { enrollments, total: count || 0 };
  }

  /**
   * Check if a student has active access to a specific class
   */
  async checkClassAccess(studentId: string, classId: string): Promise<{
    hasAccess: boolean;
    enrollment: ClassEnrollment | null;
    reason: string;
  }> {
    const enrollment = await this.getEnrollmentByStudentAndClass(studentId, classId);

    if (!enrollment) {
      return {
        hasAccess: false,
        enrollment: null,
        reason: 'Not enrolled in this class',
      };
    }

    // Check status
    if (enrollment.status !== 'active') {
      return {
        hasAccess: false,
        enrollment,
        reason: `Enrollment is ${enrollment.status}`,
      };
    }

    // Check expiry
    if (enrollment.expires_at) {
      const expiryDate = new Date(enrollment.expires_at);
      if (expiryDate < new Date()) {
        // Auto-update status to expired
        await this.markEnrollmentExpired(enrollment.id);
        return {
          hasAccess: false,
          enrollment: { ...enrollment, status: 'expired' },
          reason: 'Enrollment has expired',
        };
      }
    }

    return {
      hasAccess: true,
      enrollment,
      reason: 'Active enrollment',
    };
  }

  /**
   * Get all active class IDs for a student
   */
  async getStudentActiveClassIds(studentId: string): Promise<string[]> {
    const { data, error } = await getSupabase()
      .from('class_enrollments')
      .select('class_id, expires_at')
      .eq('student_id', studentId)
      .eq('status', 'active');

    if (error) {
      console.error('Error fetching student active classes:', error);
      return [];
    }

    const now = new Date();
    const activeClassIds: string[] = [];

    for (const enrollment of data || []) {
      // Check if expired
      if (enrollment.expires_at && new Date(enrollment.expires_at) < now) {
        // Mark as expired (async, don't await)
        this.markEnrollmentExpired(enrollment.class_id).catch(() => {});
      } else {
        activeClassIds.push(enrollment.class_id);
      }
    }

    return activeClassIds;
  }

  /**
   * Get student's full access summary
   */
  async getStudentAccessSummary(studentId: string): Promise<{
    activeEnrollments: Array<{
      classId: string;
      className: string;
      courseTypeName: string;
      enrolledAt: string;
      expiresAt: string | null;
      daysRemaining: number | null;
    }>;
    totalActiveClasses: number;
  }> {
    const { data, error } = await getSupabase()
      .from('class_enrollments')
      .select(`
        id,
        class_id,
        enrolled_at,
        expires_at,
        academic_classes (
          name,
          course_types (name)
        )
      `)
      .eq('student_id', studentId)
      .eq('status', 'active');

    if (error) {
      console.error('Error fetching student access summary:', error);
      throw new Error('Failed to fetch access summary');
    }

    const now = new Date();
    const activeEnrollments = (data || [])
      .filter((e: any) => {
        if (!e.expires_at) return true;
        return new Date(e.expires_at) >= now;
      })
      .map((e: any) => {
        let daysRemaining: number | null = null;
        if (e.expires_at) {
          const diffTime = new Date(e.expires_at).getTime() - now.getTime();
          daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }

        return {
          classId: e.class_id,
          className: e.academic_classes?.name || 'Unknown',
          courseTypeName: e.academic_classes?.course_types?.name || 'Unknown',
          enrolledAt: e.enrolled_at,
          expiresAt: e.expires_at,
          daysRemaining,
        };
      });

    return {
      activeEnrollments,
      totalActiveClasses: activeEnrollments.length,
    };
  }

  /**
   * Mark an enrollment as expired
   */
  private async markEnrollmentExpired(enrollmentId: string): Promise<void> {
    await getSupabase()
      .from('class_enrollments')
      .update({
        status: 'expired',
        updated_at: new Date().toISOString(),
      })
      .eq('id', enrollmentId)
      .eq('status', 'active');
  }

  /**
   * Batch check and update expired enrollments
   * Call this periodically (e.g., daily cron job)
   */
  async processExpiredEnrollments(): Promise<{ expiredCount: number }> {
    const now = new Date().toISOString();

    const { data, error } = await getSupabase()
      .from('class_enrollments')
      .update({
        status: 'expired',
        updated_at: now,
      })
      .eq('status', 'active')
      .lt('expires_at', now)
      .select('id');

    if (error) {
      console.error('Error processing expired enrollments:', error);
      throw new Error('Failed to process expired enrollments');
    }

    return { expiredCount: data?.length || 0 };
  }

  /**
   * Get recent enrollments for dashboard display
   */
  async getRecentEnrollments(limit: number = 10): Promise<{
    id: string;
    enrollmentNumber: string;
    studentName: string;
    studentEmail: string;
    className: string;
    courseTypeName: string;
    status: EnrollmentStatus;
    amount: number;
    paymentType: PaymentType | null;
    enrolledAt: string | null;
    createdAt: string;
  }[]> {
    const { data, error } = await getSupabase()
      .from('class_enrollments')
      .select(`
        id,
        enrollment_number,
        status,
        amount_paid,
        enrolled_at,
        created_at,
        students (
          users (
            first_name,
            last_name,
            email
          )
        ),
        academic_classes (
          name,
          course_types (name)
        ),
        enrollment_payments (
          payment_type,
          amount
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching recent enrollments:', error);
      return [];
    }

    return (data || []).map((enrollment: any) => {
      const user = enrollment.students?.users;
      const firstName = user?.first_name || '';
      const lastName = user?.last_name || '';
      const payment = enrollment.enrollment_payments?.[0];

      return {
        id: enrollment.id,
        enrollmentNumber: enrollment.enrollment_number,
        studentName: [firstName, lastName].filter(Boolean).join(' ') || 'Unknown',
        studentEmail: user?.email || '',
        className: enrollment.academic_classes?.name || 'Unknown Class',
        courseTypeName: enrollment.academic_classes?.course_types?.name || 'Unknown',
        status: enrollment.status,
        amount: enrollment.amount_paid || payment?.amount || 0,
        paymentType: payment?.payment_type || null,
        enrolledAt: enrollment.enrolled_at,
        createdAt: enrollment.created_at,
      };
    });
  }

  /**
   * Get enrollment statistics for dashboard
   */
  async getEnrollmentStats(): Promise<{
    totalEnrollments: number;
    activeEnrollments: number;
    pendingEnrollments: number;
    totalRevenue: number;
    thisMonthEnrollments: number;
    thisMonthRevenue: number;
  }> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const [
      totalResult,
      activeResult,
      pendingResult,
      revenueResult,
      thisMonthResult,
    ] = await Promise.all([
      getSupabase().from('class_enrollments').select('id', { count: 'exact', head: true }),
      getSupabase().from('class_enrollments').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      getSupabase().from('class_enrollments').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      getSupabase().from('class_enrollments').select('amount_paid').eq('status', 'active'),
      getSupabase().from('class_enrollments').select('amount_paid').gte('enrolled_at', startOfMonth).eq('status', 'active'),
    ]);

    const totalRevenue = (revenueResult.data || []).reduce((sum: number, e: any) => sum + (e.amount_paid || 0), 0);
    const thisMonthRevenue = (thisMonthResult.data || []).reduce((sum: number, e: any) => sum + (e.amount_paid || 0), 0);

    return {
      totalEnrollments: totalResult.count || 0,
      activeEnrollments: activeResult.count || 0,
      pendingEnrollments: pendingResult.count || 0,
      totalRevenue,
      thisMonthEnrollments: thisMonthResult.data?.length || 0,
      thisMonthRevenue,
    };
  }
}

// Export singleton instance
export const enrollmentService = new EnrollmentService();
