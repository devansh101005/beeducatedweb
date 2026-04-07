// Enrollment Service
// Handles class enrollments with Cashfree payment integration

import { getSupabase } from '../config/supabase.js';
import { courseTypeService } from './courseTypeService.js';
import { feeService } from './feeService.js';
import { cashfreeService } from './cashfreeService.js';

export type EnrollmentStatus = 'pending' | 'active' | 'expired' | 'cancelled' | 'refunded';
export type PaymentStatus = 'pending' | 'processing' | 'paid' | 'failed' | 'refunded' | 'partially_refunded';
export type PaymentType = 'razorpay' | 'cashfree' | 'cash' | 'bank_transfer' | 'cheque' | 'upi_direct';

export interface ClassEnrollment {
  id: string;
  student_id: string;
  class_id: string;
  fee_plan_id: string;
  enrollment_number: string;
  status: EnrollmentStatus;
  registration_paid: boolean;
  registration_paid_at: string | null;
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
  payment_gateway: string;
  cashfree_order_id: string | null;
  cashfree_payment_id: string | null;
  payment_purpose: string;
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
  couponCode?: string;
  couponDiscount?: number;
  couponId?: string;
}

export interface InitiateEnrollmentResult {
  enrollmentId: string;
  orderId: string;
  paymentSessionId: string;
  amount: number;
  currency: string;
  environment: 'sandbox' | 'production';
  /** 'registration' = paying ₹499 reg fee; 'tuition' = paying tuition after reg */
  step: 'registration' | 'tuition';
  couponDiscount?: number;
  prefill: {
    name: string;
    email: string;
    contact?: string;
  };
  notes: Record<string, string>;
}

export interface VerifyPaymentInput {
  order_id: string;
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
   * Initiate enrollment - two-step flow:
   *   Step 1 (registration): Pay ₹499 registration fee
   *   Step 2 (tuition): Pay tuition amount (after registration is confirmed)
   * If fee plan has registration_fee = 0, skips directly to tuition.
   */
  async initiateEnrollment(input: InitiateEnrollmentInput): Promise<InitiateEnrollmentResult> {
    const { studentId, classId, feePlanId, studentName, studentEmail, studentPhone, couponCode, couponDiscount, couponId } = input;

    // 1. Check if student is already enrolled
    const existingEnrollment = await this.getEnrollmentByStudentAndClass(studentId, classId);
    if (existingEnrollment) {
      if (existingEnrollment.status === 'active') {
        throw new Error('You are already enrolled in this class');
      }

      if (existingEnrollment.status === 'pending') {
        // If registration is paid, they need tuition — redirect to initiateTuition
        if (existingEnrollment.registration_paid) {
          return this.initiateTuitionPayment({
            enrollmentId: existingEnrollment.id,
            studentName,
            studentEmail,
            studentPhone,
            couponCode,
            couponDiscount,
            couponId,
          });
        }

        // Registration not yet paid — check for existing pending payment
        const existingPayment = await this.getPendingPaymentByEnrollment(
          existingEnrollment.id,
          'registration'
        );
        if (existingPayment && existingPayment.cashfree_order_id) {
          // Re-create Cashfree order since payment sessions expire
          const cfOrder = await cashfreeService.createOrder({
            orderId: `reg_${Date.now()}`,
            amount: existingPayment.amount,
            customerName: studentName,
            customerEmail: studentEmail,
            customerPhone: studentPhone || '9999999999',
            notes: { enrollmentId: existingEnrollment.id, purpose: 'registration' },
          });

          await getSupabase()
            .from('enrollment_payments')
            .update({
              cashfree_order_id: cfOrder.order_id,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingPayment.id);

          return {
            enrollmentId: existingEnrollment.id,
            orderId: cfOrder.order_id,
            paymentSessionId: cfOrder.payment_session_id,
            amount: existingPayment.amount,
            currency: 'INR',
            environment: cashfreeService.getEnvironment(),
            step: 'registration',
            prefill: { name: studentName, email: studentEmail, contact: studentPhone },
            notes: { enrollmentId: existingEnrollment.id, classId, studentId },
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

    if (classInfo.max_students && classInfo.current_students >= classInfo.max_students) {
      throw new Error('This class is full');
    }

    // 3. Verify fee plan
    const feePlan = await courseTypeService.getFeePlanById(feePlanId);
    if (!feePlan || feePlan.class_id !== classId) {
      throw new Error('Invalid fee plan');
    }

    // 4. Determine if registration fee needs to be paid first
    const registrationFee = Number(feePlan.registration_fee) || 0;
    const hasRegistrationFee = registrationFee > 0;

    // 5. Create or update enrollment record
    let enrollment: ClassEnrollment;

    if (existingEnrollment && existingEnrollment.status === 'pending') {
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
      const { data, error } = await getSupabase()
        .from('class_enrollments')
        .insert({
          student_id: studentId,
          class_id: classId,
          fee_plan_id: feePlanId,
          status: 'pending',
          registration_paid: false,
          initiated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          const existing = await this.getEnrollmentByStudentAndClass(studentId, classId);
          if (existing) {
            enrollment = existing;
          } else {
            throw new Error('Failed to create enrollment');
          }
        } else {
          console.error('Error creating enrollment:', error);
          throw new Error('Failed to create enrollment');
        }
      } else {
        enrollment = data;
      }
    }

    // Store plan metadata for installment tracking
    const planMetadata = feePlan.metadata as Record<string, any> || {};
    if (planMetadata.installments) {
      let enrollMeta: Record<string, any>;

      if (planMetadata.plan_code === 'M') {
        // Monthly plan: 12 monthly payments
        enrollMeta = {
          plan_code: 'M',
          installments: 12,
          monthly_fee: planMetadata.monthly_fee,
          annual_fee: planMetadata.annual_fee,
          months_paid: 0,
        };
      } else if (planMetadata.plan_code === 'E' && planMetadata.installments === 4) {
        // 4-installment quarterly plan
        enrollMeta = {
          plan_code: 'E',
          installments: 4,
          installment_1: planMetadata.installment_1,
          quarterly_fee: planMetadata.quarterly_fee,
          installments_paid: 0,
        };
      } else {
        // Standard installment plan (2-installment, etc.)
        enrollMeta = {
          plan_code: planMetadata.plan_code,
          installments: planMetadata.installments,
          installment_1: planMetadata.installment_1,
          installment_2: planMetadata.installment_2,
          installment_1_paid: false,
          installment_2_paid: false,
        };
      }

      // Attach coupon info if provided
      if (couponCode && couponDiscount) {
        enrollMeta.coupon_code = couponCode;
        enrollMeta.coupon_discount = couponDiscount;
        enrollMeta.coupon_id = couponId;
      }

      await getSupabase()
        .from('class_enrollments')
        .update({ metadata: enrollMeta })
        .eq('id', enrollment.id);
    } else if (couponCode && couponDiscount) {
      // No installment plan but has coupon — store coupon info
      await getSupabase()
        .from('class_enrollments')
        .update({
          metadata: {
            coupon_code: couponCode,
            coupon_discount: couponDiscount,
            coupon_id: couponId,
          },
        })
        .eq('id', enrollment.id);
    }

    // 6. If no registration fee, skip straight to tuition payment
    if (!hasRegistrationFee) {
      return this.initiateTuitionPayment({
        enrollmentId: enrollment.id,
        studentName,
        studentEmail,
        studentPhone,
        couponCode,
        couponDiscount,
        couponId,
      });
    }

    // 7. Create Cashfree order for registration fee
    const cfOrder = await cashfreeService.createOrder({
      orderId: `reg_${Date.now()}`,
      amount: registrationFee,
      customerName: studentName,
      customerEmail: studentEmail,
      customerPhone: studentPhone || '9999999999',
      notes: {
        enrollmentId: enrollment.id,
        classId,
        studentId,
        purpose: 'registration',
      },
    });

    // 8. Create payment record for registration
    const { error: paymentError } = await getSupabase()
      .from('enrollment_payments')
      .insert({
        enrollment_id: enrollment.id,
        payment_gateway: 'cashfree',
        cashfree_order_id: cfOrder.order_id,
        payment_purpose: 'registration',
        amount: registrationFee,
        amount_paise: Math.round(registrationFee * 100),
        currency: 'INR',
        status: 'pending',
        payment_notes: 'Registration fee',
      });

    if (paymentError) {
      console.error('Error creating payment record:', paymentError);
      await getSupabase()
        .from('class_enrollments')
        .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
        .eq('id', enrollment.id);
      throw new Error('Failed to create payment record');
    }

    return {
      enrollmentId: enrollment.id,
      orderId: cfOrder.order_id,
      paymentSessionId: cfOrder.payment_session_id,
      amount: registrationFee,
      currency: 'INR',
      environment: cashfreeService.getEnvironment(),
      step: 'registration',
      prefill: { name: studentName, email: studentEmail, contact: studentPhone },
      notes: { enrollmentId: enrollment.id, classId, studentId },
    };
  }

  /**
   * Initiate tuition payment — called after registration fee is paid.
   * Determines tuition amount from fee plan (total_amount - registration_fee).
   * For installment plans, charges installment_1 amount.
   */
  async initiateTuitionPayment(input: {
    enrollmentId: string;
    studentName: string;
    studentEmail: string;
    studentPhone?: string;
    couponCode?: string;
    couponDiscount?: number;
    couponId?: string;
  }): Promise<InitiateEnrollmentResult> {
    const { enrollmentId, studentName, studentEmail, studentPhone, couponDiscount } = input;

    const { data: enrollment, error } = await getSupabase()
      .from('class_enrollments')
      .select('*')
      .eq('id', enrollmentId)
      .single();

    if (error || !enrollment) {
      throw new Error('Enrollment not found');
    }

    if (enrollment.status === 'active') {
      throw new Error('Already enrolled — tuition has been paid');
    }

    // Get fee plan
    const feePlan = await courseTypeService.getFeePlanById(enrollment.fee_plan_id);
    if (!feePlan) throw new Error('Fee plan not found');

    const registrationFee = Number(feePlan.registration_fee) || 0;
    const tuitionTotal = Number(feePlan.total_amount) - registrationFee;

    // Determine the amount for this payment
    const planMetadata = (feePlan.metadata as Record<string, any>) || {};
    const hasInstallments = planMetadata.installments && planMetadata.installments >= 2;

    let paymentAmount: number;
    let paymentPurpose: string;
    let paymentNote: string;

    if (planMetadata.plan_code === 'M') {
      // Monthly plan: charge first month's fee only
      paymentAmount = planMetadata.monthly_fee as number;
      paymentPurpose = 'monthly_1';
      paymentNote = 'Monthly fee — Month 1 of 12';
    } else if (hasInstallments) {
      // For installment plans, installment amounts are already tuition-only
      // (registration_fee was excluded when they were computed in migration 018)
      paymentAmount = planMetadata.installment_1 as number;
      paymentPurpose = 'installment_1';
      paymentNote = `Tuition installment 1 of ${planMetadata.installments}`;
    } else {
      paymentAmount = tuitionTotal;
      paymentPurpose = 'tuition';
      paymentNote = 'Tuition fee';
    }

    // Apply coupon discount
    if (couponDiscount && couponDiscount > 0) {
      paymentAmount = Math.max(1, paymentAmount - couponDiscount);
      paymentNote += ` (₹${couponDiscount} coupon discount applied)`;
    }

    if (paymentAmount <= 0) {
      throw new Error('Tuition amount is zero — nothing to pay');
    }

    // Check for existing pending tuition payment and refresh it
    const existingPayment = await this.getPendingPaymentByEnrollment(enrollmentId, paymentPurpose);
    if (existingPayment && existingPayment.cashfree_order_id) {
      const cfOrder = await cashfreeService.createOrder({
        orderId: `tui_${Date.now()}`,
        amount: paymentAmount,
        customerName: studentName,
        customerEmail: studentEmail,
        customerPhone: studentPhone || '9999999999',
        notes: { enrollmentId, purpose: paymentPurpose },
      });

      await getSupabase()
        .from('enrollment_payments')
        .update({
          cashfree_order_id: cfOrder.order_id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingPayment.id);

      return {
        enrollmentId,
        orderId: cfOrder.order_id,
        paymentSessionId: cfOrder.payment_session_id,
        amount: paymentAmount,
        currency: 'INR',
        environment: cashfreeService.getEnvironment(),
        step: 'tuition',
        prefill: { name: studentName, email: studentEmail, contact: studentPhone },
        notes: { enrollmentId, classId: enrollment.class_id, studentId: enrollment.student_id },
      };
    }

    // Create new Cashfree order for tuition
    const cfOrder = await cashfreeService.createOrder({
      orderId: `tui_${Date.now()}`,
      amount: paymentAmount,
      customerName: studentName,
      customerEmail: studentEmail,
      customerPhone: studentPhone || '9999999999',
      notes: {
        enrollmentId,
        classId: enrollment.class_id,
        studentId: enrollment.student_id,
        purpose: paymentPurpose,
      },
    });

    const { error: paymentError } = await getSupabase()
      .from('enrollment_payments')
      .insert({
        enrollment_id: enrollmentId,
        payment_gateway: 'cashfree',
        cashfree_order_id: cfOrder.order_id,
        payment_purpose: paymentPurpose,
        amount: paymentAmount,
        amount_paise: Math.round(paymentAmount * 100),
        currency: 'INR',
        status: 'pending',
        payment_notes: paymentNote,
      });

    if (paymentError) {
      console.error('Error creating tuition payment record:', paymentError);
      throw new Error('Failed to create tuition payment record');
    }

    return {
      enrollmentId,
      orderId: cfOrder.order_id,
      paymentSessionId: cfOrder.payment_session_id,
      amount: paymentAmount,
      currency: 'INR',
      environment: cashfreeService.getEnvironment(),
      step: 'tuition',
      prefill: { name: studentName, email: studentEmail, contact: studentPhone },
      notes: { enrollmentId, classId: enrollment.class_id, studentId: enrollment.student_id },
    };
  }

  /**
   * Verify payment — handles both registration and tuition payments.
   *
   * Registration payment: sets registration_paid = true, keeps enrollment pending.
   * Tuition payment: activates the enrollment.
   */
  async verifyPayment(input: VerifyPaymentInput): Promise<ClassEnrollment & { verifiedStep: string }> {
    const { order_id } = input;

    // 1. Verify payment status with Cashfree server-side
    const cfOrder = await cashfreeService.getOrder(order_id);
    if (cfOrder.order_status !== 'PAID') {
      await getSupabase()
        .from('enrollment_payments')
        .update({
          status: 'failed',
          error_description: `Order status: ${cfOrder.order_status}`,
          updated_at: new Date().toISOString(),
        })
        .eq('cashfree_order_id', order_id);

      throw new Error('Payment verification failed');
    }

    // 2. Get payment record
    const { data: payment, error: paymentError } = await getSupabase()
      .from('enrollment_payments')
      .select('*, class_enrollments(*)')
      .eq('cashfree_order_id', order_id)
      .single();

    if (paymentError || !payment) {
      throw new Error('Payment record not found');
    }

    // Idempotency check
    if (payment.status === 'paid') {
      return { ...payment.class_enrollments, verifiedStep: payment.payment_purpose || 'full_payment' };
    }

    // 3. Get payment details from Cashfree
    const cfPayments = await cashfreeService.getOrderPayments(order_id);
    const cfPayment = cfPayments.find(p => p.payment_status === 'SUCCESS') || cfPayments[0];

    // 4. Update payment record to paid
    await getSupabase()
      .from('enrollment_payments')
      .update({
        cashfree_payment_id: cfPayment?.cf_payment_id?.toString() || null,
        status: 'paid',
        payment_method: cfPayment?.payment_method?.type || null,
        bank: cfPayment?.payment_method?.netbanking?.netbanking_bank_name || null,
        vpa: cfPayment?.payment_method?.upi?.upi_id || null,
        card_last4: cfPayment?.payment_method?.card?.card_number?.slice(-4) || null,
        card_network: cfPayment?.payment_method?.card?.card_network || null,
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('cashfree_order_id', order_id);

    const paymentPurpose = payment.payment_purpose || 'full_payment';

    // 5. Get current enrollment state
    const { data: currentEnrollment } = await getSupabase()
      .from('class_enrollments')
      .select('metadata, amount_paid, registration_paid')
      .eq('id', payment.enrollment_id)
      .single();

    const previousAmountPaid = currentEnrollment?.amount_paid || 0;
    const enrollmentMeta = (currentEnrollment?.metadata as Record<string, any>) || {};

    // ── REGISTRATION PAYMENT ──
    if (paymentPurpose === 'registration') {
      const { data: enrollment, error: enrollmentError } = await getSupabase()
        .from('class_enrollments')
        .update({
          registration_paid: true,
          registration_paid_at: new Date().toISOString(),
          amount_paid: previousAmountPaid + payment.amount,
          updated_at: new Date().toISOString(),
        })
        .eq('id', payment.enrollment_id)
        .select()
        .single();

      if (enrollmentError) {
        console.error('Error updating enrollment for registration:', enrollmentError);
        throw new Error('Failed to record registration payment');
      }

      // Create student_fees record for registration
      const classInfo = await courseTypeService.getClassById(enrollment.class_id);
      await this.createStudentFeeForEnrollment({
        studentId: enrollment.student_id,
        amount: payment.amount,
        className: classInfo?.name || 'Unknown Class',
        feePlanName: 'Registration Fee',
        enrollmentId: enrollment.id,
        paymentType: 'cashfree',
      });

      return { ...enrollment, verifiedStep: 'registration' };
    }

    // ── TUITION / INSTALLMENT / FULL PAYMENT ──
    const { data: feePlan } = await getSupabase()
      .from('class_fee_plans')
      .select('validity_months')
      .eq('id', payment.class_enrollments.fee_plan_id)
      .single();

    const validityMonths = feePlan?.validity_months || 12;
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + validityMonths);

    const enrollmentUpdate: Record<string, any> = {
      status: 'active',
      enrolled_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
      amount_paid: previousAmountPaid + payment.amount,
      updated_at: new Date().toISOString(),
    };

    // Update installment tracking metadata
    if (paymentPurpose === 'monthly_1') {
      enrollmentUpdate.metadata = {
        ...enrollmentMeta,
        months_paid: 1,
        month_1_paid_at: new Date().toISOString(),
      };
    } else if (paymentPurpose === 'installment_1' && enrollmentMeta.plan_code === 'E') {
      // 4-installment plan: track with counter
      enrollmentUpdate.metadata = {
        ...enrollmentMeta,
        installments_paid: 1,
        installment_1_paid_at: new Date().toISOString(),
      };
    } else if (paymentPurpose === 'installment_1') {
      enrollmentUpdate.metadata = {
        ...enrollmentMeta,
        installment_1_paid: true,
        installment_1_paid_at: new Date().toISOString(),
      };
    } else if (paymentPurpose === 'installment_2') {
      enrollmentUpdate.metadata = {
        ...enrollmentMeta,
        installment_2_paid: true,
        installment_2_paid_at: new Date().toISOString(),
      };
    }

    const { data: enrollment, error: enrollmentError } = await getSupabase()
      .from('class_enrollments')
      .update(enrollmentUpdate)
      .eq('id', payment.enrollment_id)
      .select()
      .single();

    if (enrollmentError) {
      console.error('Error updating enrollment:', enrollmentError);
      throw new Error('Failed to complete enrollment');
    }

    // Create student_fees record for the payment just made
    const classInfo = await courseTypeService.getClassById(enrollment.class_id);
    const feePlanInfo = await courseTypeService.getFeePlanById(enrollment.fee_plan_id);
    await this.createStudentFeeForEnrollment({
      studentId: enrollment.student_id,
      amount: payment.amount,
      className: classInfo?.name || 'Unknown Class',
      feePlanName: feePlanInfo?.name || 'Fee Plan',
      enrollmentId: enrollment.id,
      paymentType: 'cashfree',
    });

    // For monthly plans, auto-generate remaining 11 monthly student_fees (unpaid)
    if (paymentPurpose === 'monthly_1') {
      const monthlyFee = enrollmentMeta.monthly_fee || payment.amount;
      const className = classInfo?.name || 'Unknown Class';
      await this.generateRemainingMonthlyFees({
        studentId: enrollment.student_id,
        enrollmentId: enrollment.id,
        className,
        monthlyFee,
        startMonth: 2, // months 2–12
        totalMonths: 12,
      });
    }

    // For 4-installment plans, auto-generate remaining 3 quarterly student_fees (unpaid)
    if (paymentPurpose === 'installment_1' && enrollmentMeta.plan_code === 'E') {
      const quarterlyFee = enrollmentMeta.quarterly_fee as number;
      const className = classInfo?.name || 'Unknown Class';
      await this.generateRemainingQuarterlyFees({
        studentId: enrollment.student_id,
        enrollmentId: enrollment.id,
        className,
        quarterlyFee,
      });
    }

    return { ...enrollment, verifiedStep: paymentPurpose };
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
      .eq('cashfree_order_id', orderId);
  }

  /**
   * Initiate second installment payment for Plan C enrollments
   */
  async initiateSecondInstallment(input: {
    enrollmentId: string;
    studentName: string;
    studentEmail: string;
    studentPhone?: string;
  }): Promise<InitiateEnrollmentResult> {
    const { enrollmentId, studentName, studentEmail, studentPhone } = input;

    // 1. Get enrollment
    const { data: enrollment, error: enrollmentError } = await getSupabase()
      .from('class_enrollments')
      .select('*')
      .eq('id', enrollmentId)
      .single();

    if (enrollmentError || !enrollment) {
      throw new Error('Enrollment not found');
    }

    if (enrollment.status !== 'active') {
      throw new Error('Enrollment is not active');
    }

    // 2. Check installment metadata
    const meta = (enrollment.metadata as Record<string, any>) || {};
    if (meta.plan_code !== 'C' || meta.installments !== 2) {
      throw new Error('This enrollment is not on a 2-installment plan');
    }

    if (!meta.installment_1_paid) {
      throw new Error('First installment has not been paid yet');
    }

    if (meta.installment_2_paid) {
      throw new Error('Second installment has already been paid');
    }

    const installment2Amount = meta.installment_2 as number;
    if (!installment2Amount || installment2Amount <= 0) {
      throw new Error('Invalid installment amount');
    }

    // 3. Create Cashfree order for installment 2
    const cfOrderId = `inst2_${Date.now()}`;
    const cfOrder = await cashfreeService.createOrder({
      orderId: cfOrderId,
      amount: installment2Amount,
      customerName: studentName,
      customerEmail: studentEmail,
      customerPhone: studentPhone || '9999999999',
      notes: {
        enrollmentId,
        classId: enrollment.class_id,
        studentId: enrollment.student_id,
        installment: '2',
        plan_code: 'C',
      },
    });

    // 4. Create payment record
    const amountPaise = Math.round(installment2Amount * 100);
    const { error: paymentError } = await getSupabase()
      .from('enrollment_payments')
      .insert({
        enrollment_id: enrollmentId,
        payment_gateway: 'cashfree',
        cashfree_order_id: cfOrder.order_id,
        amount: installment2Amount,
        amount_paise: amountPaise,
        currency: 'INR',
        status: 'pending',
        payment_notes: 'Installment 2 of 2',
      });

    if (paymentError) {
      console.error('Error creating payment record for installment 2:', paymentError);
    }

    return {
      enrollmentId,
      orderId: cfOrder.order_id,
      paymentSessionId: cfOrder.payment_session_id,
      amount: installment2Amount,
      currency: 'INR',
      environment: cashfreeService.getEnvironment(),
      step: 'tuition' as const,
      prefill: {
        name: studentName,
        email: studentEmail,
        contact: studentPhone,
      },
      notes: {
        enrollmentId,
        classId: enrollment.class_id,
        studentId: enrollment.student_id,
      },
    };
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
   * Get pending payment for a specific enrollment and purpose
   */
  private async getPendingPaymentByEnrollment(
    enrollmentId: string,
    purpose: string
  ): Promise<EnrollmentPayment | null> {
    const { data, error } = await getSupabase()
      .from('enrollment_payments')
      .select('*')
      .eq('enrollment_id', enrollmentId)
      .eq('payment_purpose', purpose)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching pending payment:', error);
      return null;
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
   * Create a student_fees record for an enrollment so it appears in Fee & Payments
   */
  private async createStudentFeeForEnrollment(params: {
    studentId: string;
    amount: number;
    className: string;
    feePlanName: string;
    enrollmentId: string;
    paymentType: string;
    adminId?: string;
  }): Promise<void> {
    try {
      const { studentId, amount, className, feePlanName, enrollmentId, paymentType, adminId } = params;
      const now = new Date().toISOString();
      const today = now.split('T')[0];

      // Create the fee record
      const fee = await feeService.createStudentFee({
        student_id: studentId,
        fee_type: 'tuition',
        description: `${className} - ${feePlanName}`,
        base_amount: amount,
        due_date: today,
        notes: `Enrollment #${enrollmentId} via ${paymentType}`,
        created_by: adminId,
      });

      // Mark it as completed (paid) immediately
      await feeService.updateStudentFee(fee.id, {
        status: 'completed',
        amount_paid: fee.total_amount,
        amount_due: 0,
        paid_at: now,
      });
    } catch (err) {
      // Log but don't fail the enrollment — fee record is supplementary
      console.error('Failed to create student_fees record for enrollment:', err);
    }
  }

  /**
   * Generate remaining monthly student_fees for a monthly plan.
   * Called after month 1 is paid at enrollment — creates months 2–12 as pending fees.
   */
  private async generateRemainingMonthlyFees(params: {
    studentId: string;
    enrollmentId: string;
    className: string;
    monthlyFee: number;
    startMonth: number;
    totalMonths: number;
  }): Promise<void> {
    const { studentId, enrollmentId, className, monthlyFee, startMonth, totalMonths } = params;

    try {
      const now = new Date();

      for (let month = startMonth; month <= totalMonths; month++) {
        // Due date: N months from now (month 2 = 1 month out, month 3 = 2 months out, etc.)
        const dueDate = new Date(now);
        dueDate.setMonth(dueDate.getMonth() + (month - 1));
        const dueDateStr = dueDate.toISOString().split('T')[0];

        await feeService.createStudentFee({
          student_id: studentId,
          fee_type: 'tuition',
          description: `${className} — Monthly Fee (Month ${month} of ${totalMonths})`,
          base_amount: monthlyFee,
          due_date: dueDateStr,
          is_installment: true,
          installment_number: month,
          total_installments: totalMonths,
          notes: `Enrollment #${enrollmentId} — Monthly plan auto-generated`,
        });
      }
    } catch (err) {
      // Log but don't fail — the enrollment is already active
      console.error('Failed to generate remaining monthly fees:', err);
    }
  }

  /**
   * Generate remaining 3 quarterly student_fees for a 4-installment plan.
   * Called after installment 1 is paid — creates installments 2, 3, 4 as pending fees.
   */
  private async generateRemainingQuarterlyFees(params: {
    studentId: string;
    enrollmentId: string;
    className: string;
    quarterlyFee: number;
  }): Promise<void> {
    const { studentId, enrollmentId, className, quarterlyFee } = params;

    try {
      const now = new Date();

      for (let inst = 2; inst <= 4; inst++) {
        // Due date: 3 months apart (inst 2 = 3 months, inst 3 = 6 months, inst 4 = 9 months)
        const dueDate = new Date(now);
        dueDate.setMonth(dueDate.getMonth() + (inst - 1) * 3);
        const dueDateStr = dueDate.toISOString().split('T')[0];

        await feeService.createStudentFee({
          student_id: studentId,
          fee_type: 'tuition',
          description: `${className} — Quarterly Fee (Installment ${inst} of 4)`,
          base_amount: quarterlyFee,
          due_date: dueDateStr,
          is_installment: true,
          installment_number: inst,
          total_installments: 4,
          notes: `Enrollment #${enrollmentId} — 4-installment plan auto-generated`,
        });
      }
    } catch (err) {
      console.error('Failed to generate remaining quarterly fees:', err);
    }
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
        // Handle unique constraint violation (race condition: duplicate enrollment)
        if (error.code === '23505') {
          const existing = await this.getEnrollmentByStudentAndClass(studentId, classId);
          if (existing && existing.status === 'active') {
            throw new Error('Student is already enrolled in this class');
          }
          if (existing) {
            enrollment = existing;
          } else {
            throw new Error('Failed to create enrollment');
          }
        } else {
          console.error('Error creating enrollment:', error);
          throw new Error('Failed to create enrollment');
        }
      } else {
        enrollment = data;
      }
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

    // 8. Create student_fees record so it appears in Fee & Payments page
    await this.createStudentFeeForEnrollment({
      studentId,
      amount: amountReceived,
      className: classInfo.name,
      feePlanName: feePlan.name,
      enrollmentId: enrollment.id,
      paymentType,
      adminId: receivedBy,
    });

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
      cashfree: 'CF',
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

  /**
   * Cancel all active enrollments for a student
   * Used when deleting/unenrolling a student
   */
  async cancelAllEnrollmentsForStudent(studentId: string, reason: string): Promise<number> {
    const { data, error } = await getSupabase()
      .from('class_enrollments')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancellation_reason: reason,
        updated_at: new Date().toISOString(),
      })
      .eq('student_id', studentId)
      .in('status', ['active', 'pending'])
      .select('id');

    if (error) {
      console.error('Error cancelling enrollments:', error);
      throw new Error('Failed to cancel enrollments');
    }

    return data?.length || 0;
  }

  /**
   * Get manual enrollments for multiple students (for admin list view)
   * Returns enrollments with payment_type from manual fee plans
   */
  async getManualEnrollmentsForStudents(studentIds: string[]): Promise<any[]> {
    if (studentIds.length === 0) return [];

    const { data, error } = await getSupabase()
      .from('class_enrollments')
      .select(`
        id,
        student_id,
        status,
        academic_classes!inner (name),
        class_fee_plans!inner (plan_type),
        enrollment_payments (payment_type)
      `)
      .in('student_id', studentIds)
      .in('status', ['active', 'pending']);

    if (error) {
      console.error('Error fetching manual enrollments:', error);
      return [];
    }

    // Transform and filter for manual enrollments
    return (data || [])
      .filter((e: any) => e.class_fee_plans?.plan_type === 'manual')
      .map((e: any) => ({
        id: e.id,
        student_id: e.student_id,
        status: e.status,
        class_name: e.academic_classes?.name || 'Unknown Class',
        payment_type: e.enrollment_payments?.[0]?.payment_type || 'manual',
      }));
  }
}

// Export singleton instance
export const enrollmentService = new EnrollmentService();
