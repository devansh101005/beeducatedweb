// Enrollment Service
// Handles class enrollments with Razorpay payment integration

import crypto from 'crypto';
import Razorpay from 'razorpay';
import { getSupabase } from '../config/supabase.js';
import { env } from '../config/env.js';
import { courseTypeService, ClassFeePlan } from './courseTypeService.js';

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
  razorpay_order_id: string;
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
        if (existingPayment && existingPayment.status === 'pending') {
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
}

// Export singleton instance
export const enrollmentService = new EnrollmentService();
