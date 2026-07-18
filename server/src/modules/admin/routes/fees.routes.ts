// Admin fee management routes (drilldown UX, reminders, suspension) — mounted under /api/v2/admin
// Admin auth (requireAuth + attachUser + requireAdmin) is enforced by the parent router.

import { Router, Request, Response } from 'express';
import { emailService } from '../../../services/emailService.js';
import { runDailyReminders } from '../../../services/reminderService.js';
import { env } from '../../../config/env.js';
import { getSupabase } from '../../../config/supabase.js';
import { getParam } from '../../../shared/utils/params.js';
import {
  sendSuccess,
  sendNotFound,
  sendError,
  sendBadRequest,
} from '../../../shared/utils/response.js';

const router = Router();

// ============================================
// FEE MANAGEMENT
// ============================================

/**
 * GET /api/v2/admin/fees/classes
 * Query: ?courseType=coaching_offline|home_tuition  &branch=lalganj|pratapgarh|prayagraj
 *
 * Returns classes for the given course type (optionally filtered by branch),
 * each with aggregate fee stats (student count, total collected).
 */
router.get('/fees/classes', async (req: Request, res: Response) => {
  try {
    const courseTypeSlug = getParam(req.query.courseType as string | string[] | undefined);
    const branch = getParam(req.query.branch as string | string[] | undefined).toLowerCase();

    if (!courseTypeSlug) {
      return sendBadRequest(res, 'courseType query param is required');
    }

    const supabase = getSupabase();

    // 1. Resolve course_type_id
    const { data: courseType, error: ctError } = await supabase
      .from('course_types')
      .select('id, slug, name')
      .eq('slug', courseTypeSlug)
      .single();

    if (ctError || !courseType) {
      return sendBadRequest(res, `Unknown course type: ${courseTypeSlug}`);
    }

    // 2. Fetch classes (optionally filter by branch via metadata->>'location')
    let classQuery = supabase
      .from('academic_classes')
      .select('id, name, slug, metadata, display_order, is_active')
      .eq('course_type_id', courseType.id)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (branch) {
      classQuery = classQuery.eq('metadata->>location', branch);
    }

    const { data: classes, error: classError } = await classQuery;
    if (classError) {
      console.error('Error fetching classes:', classError);
      return sendError(res, 'Failed to load classes');
    }

    if (!classes || classes.length === 0) {
      return sendSuccess(res, { courseType, classes: [] });
    }

    const classIds = classes.map(c => c.id);

    // 3. Aggregate enrollment counts + amount paid per class
    const { data: enrollments } = await supabase
      .from('class_enrollments')
      .select('class_id, status, amount_paid')
      .in('class_id', classIds)
      .neq('status', 'cancelled')
      .neq('status', 'refunded');

    const stats = new Map<string, { students: number; collected: number; active: number; pending: number; suspended: number }>();
    for (const id of classIds) {
      stats.set(id, { students: 0, collected: 0, active: 0, pending: 0, suspended: 0 });
    }
    for (const e of enrollments || []) {
      const s = stats.get(e.class_id);
      if (!s) continue;
      s.students += 1;
      s.collected += Number(e.amount_paid || 0);
      if (e.status === 'active') s.active += 1;
      else if (e.status === 'pending') s.pending += 1;
      else if (e.status === 'suspended') s.suspended += 1;
    }

    const result = classes.map(c => {
      const s = stats.get(c.id) || { students: 0, collected: 0, active: 0, pending: 0, suspended: 0 };
      const meta = (c.metadata as Record<string, any>) || {};
      return {
        id: c.id,
        name: c.name,
        slug: c.slug,
        location: meta.location || null,
        totalStudents: s.students,
        activeStudents: s.active,
        pendingStudents: s.pending,
        suspendedStudents: s.suspended,
        totalCollected: s.collected,
      };
    });

    sendSuccess(res, { courseType, classes: result });
  } catch (error: any) {
    console.error('Error in GET /admin/fees/classes:', error);
    sendError(res, error.message || 'Failed to load classes');
  }
});

/**
 * GET /api/v2/admin/fees/classes/:classId/students
 * Query: ?search=
 *
 * Returns enrolled students for the given class with inline fee summary
 * and a "source" badge (cashfree vs manual).
 */
router.get('/fees/classes/:classId/students', async (req: Request, res: Response) => {
  try {
    const classId = getParam(req.params.classId);
    const search = getParam(req.query.search as string | string[] | undefined).trim().toLowerCase();

    if (!classId) {
      return sendBadRequest(res, 'classId is required');
    }

    const supabase = getSupabase();

    // 1. Fetch class info (for header context on the page)
    const { data: classInfo } = await supabase
      .from('academic_classes')
      .select('id, name, metadata')
      .eq('id', classId)
      .single();

    if (!classInfo) {
      return sendNotFound(res, 'Class not found');
    }

    // 2. Fetch enrollments + nested student + user
    const { data: enrollments, error: enrollError } = await supabase
      .from('class_enrollments')
      .select(`
        id,
        status,
        registration_paid,
        registration_paid_at,
        enrolled_at,
        expires_at,
        amount_paid,
        suspended_at,
        suspension_reason,
        students!inner (
          id,
          student_id,
          class_grade,
          users!inner (
            id,
            first_name,
            last_name,
            email,
            phone
          )
        )
      `)
      .eq('class_id', classId)
      .neq('status', 'cancelled')
      .neq('status', 'refunded')
      .order('enrolled_at', { ascending: false, nullsFirst: false });

    if (enrollError) {
      console.error('Error fetching enrollments:', enrollError);
      return sendError(res, 'Failed to load students');
    }

    if (!enrollments || enrollments.length === 0) {
      return sendSuccess(res, { class: classInfo, students: [] });
    }

    // 3. Get the first payment for each enrollment (to determine source)
    const enrollmentIds = enrollments.map(e => e.id);
    const { data: payments } = await supabase
      .from('enrollment_payments')
      .select('enrollment_id, payment_method, payment_type, cashfree_payment_id, razorpay_payment_id, paid_at')
      .in('enrollment_id', enrollmentIds)
      .order('paid_at', { ascending: true, nullsFirst: false });

    const sourceByEnrollment = new Map<string, 'cashfree' | 'manual'>();
    for (const p of payments || []) {
      if (sourceByEnrollment.has(p.enrollment_id)) continue; // first payment wins
      const isCashfree = !!p.cashfree_payment_id || !!p.razorpay_payment_id ||
        ['card', 'upi', 'netbanking', 'wallet'].includes((p.payment_method || '').toLowerCase());
      sourceByEnrollment.set(p.enrollment_id, isCashfree ? 'cashfree' : 'manual');
    }

    // 4. Shape response + apply search filter
    const rows = enrollments
      .map((e: any) => {
        const student = e.students;
        const user = student?.users;
        const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(' ').trim() || '—';

        return {
          enrollmentId: e.id,
          studentDbId: student?.id,
          studentId: student?.student_id,
          name: fullName,
          email: user?.email || '',
          phone: user?.phone || null,
          classGrade: student?.class_grade || null,
          source: sourceByEnrollment.get(e.id) || 'manual',
          status: e.suspended_at ? 'suspended' : e.status,
          registrationPaid: !!e.registration_paid,
          registrationPaidAt: e.registration_paid_at,
          enrolledAt: e.enrolled_at,
          expiresAt: e.expires_at,
          amountPaid: Number(e.amount_paid || 0),
          suspendedAt: e.suspended_at,
          suspensionReason: e.suspension_reason,
        };
      })
      .filter(row => {
        if (!search) return true;
        return (
          row.name.toLowerCase().includes(search) ||
          row.email.toLowerCase().includes(search) ||
          (row.studentId || '').toLowerCase().includes(search) ||
          (row.phone || '').toLowerCase().includes(search)
        );
      });

    sendSuccess(res, { class: classInfo, students: rows });
  } catch (error: any) {
    console.error('Error in GET /admin/fees/classes/:classId/students:', error);
    sendError(res, error.message || 'Failed to load students');
  }
});

/**
 * GET /api/v2/admin/fees/students/:studentId/full-profile
 *
 * Returns everything needed to render a student's fee profile page:
 * student details + all enrollments (with class, plan, payments, dues,
 * source badge, suspension state) + reminder history.
 */
router.get('/fees/students/:studentId/full-profile', async (req: Request, res: Response) => {
  try {
    const studentId = getParam(req.params.studentId);
    if (!studentId) return sendBadRequest(res, 'studentId is required');

    const supabase = getSupabase();

    // 1. Student + user
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select(`
        id,
        student_id,
        class_grade,
        board,
        target_exam,
        target_year,
        parent_name,
        parent_phone,
        parent_email,
        subscription_status,
        student_type,
        created_at,
        users!inner (
          id,
          first_name,
          last_name,
          email,
          phone,
          created_at
        )
      `)
      .eq('id', studentId)
      .single();

    if (studentError || !student) {
      return sendNotFound(res, 'Student not found');
    }

    const user = (student as any).users;
    const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(' ').trim() || '—';

    // 2. All enrollments for this student (active, pending, suspended, expired)
    const { data: enrollments, error: enrollError } = await supabase
      .from('class_enrollments')
      .select(`
        id,
        status,
        registration_paid,
        registration_paid_at,
        initiated_at,
        enrolled_at,
        expires_at,
        amount_paid,
        notes,
        metadata,
        suspended_at,
        suspended_by,
        suspension_reason,
        suspension_email_sent,
        academic_classes:class_id (
          id,
          name,
          slug,
          metadata
        ),
        class_fee_plans:fee_plan_id (
          id,
          name,
          registration_fee,
          tuition_fee,
          material_fee,
          exam_fee,
          discount_amount,
          total_amount,
          validity_months
        )
      `)
      .eq('student_id', studentId)
      .order('initiated_at', { ascending: false });

    if (enrollError) {
      console.error('Error fetching enrollments:', enrollError);
      return sendError(res, 'Failed to load enrollments');
    }

    const enrollmentList = enrollments || [];
    const enrollmentIds = enrollmentList.map(e => e.id);

    // 3. All enrollment payments for these enrollments
    const { data: allPayments } = enrollmentIds.length
      ? await supabase
          .from('enrollment_payments')
          .select(`
            id,
            enrollment_id,
            amount,
            currency,
            status,
            payment_type,
            payment_method,
            payment_purpose,
            cashfree_order_id,
            cashfree_payment_id,
            razorpay_order_id,
            razorpay_payment_id,
            receipt_number,
            received_by,
            received_at,
            paid_at,
            payment_notes,
            error_description,
            created_at
          `)
          .in('enrollment_id', enrollmentIds)
          .order('paid_at', { ascending: false, nullsFirst: false })
      : { data: [] as any[] };

    // 4. Student fees (the dues ledger)
    const { data: studentFees } = await supabase
      .from('student_fees')
      .select(`
        id,
        fee_type,
        description,
        total_amount,
        amount_paid,
        amount_due,
        due_date,
        status,
        paid_at,
        is_installment,
        installment_number,
        total_installments,
        academic_year,
        academic_term,
        late_fee_amount,
        notes,
        created_at,
        metadata
      `)
      .eq('student_id', studentId)
      .order('due_date', { ascending: true });

    // 5. Reminder history (most recent 50)
    const { data: reminders } = await supabase
      .from('reminder_log')
      .select(`
        id,
        reminder_type,
        channel,
        sent_at,
        sent_by,
        status,
        error_message,
        fee_id,
        enrollment_id,
        metadata
      `)
      .eq('student_id', studentId)
      .order('sent_at', { ascending: false })
      .limit(50);

    // ── Derive per-enrollment computed fields ──
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const enrollmentResponses = enrollmentList.map((e: any) => {
      const klass = e.academic_classes;
      const plan = e.class_fee_plans;
      const klassMeta = (klass?.metadata as Record<string, any>) || {};

      const ePayments = (allPayments || []).filter(p => p.enrollment_id === e.id);

      // Source = first chronological payment's channel
      const firstPaid = [...ePayments]
        .filter(p => p.paid_at)
        .sort((a, b) => new Date(a.paid_at!).getTime() - new Date(b.paid_at!).getTime())[0];
      const isCashfree = firstPaid
        ? !!firstPaid.cashfree_payment_id ||
          !!firstPaid.razorpay_payment_id ||
          ['card', 'upi', 'netbanking', 'wallet'].includes((firstPaid.payment_method || '').toLowerCase())
        : false;
      const source: 'cashfree' | 'manual' = isCashfree ? 'cashfree' : 'manual';

      // Fee math
      const totalPlan = Number(plan?.total_amount || 0);
      const amountPaid = Number(e.amount_paid || 0);
      const remaining = Math.max(totalPlan - amountPaid, 0);

      // Find next due fee for this student related to this enrollment.
      // student_fees aren't directly FK'd to enrollments — we match by metadata.enrollment_id (set by createStudentFeeForEnrollment).
      const enrollmentFees = (studentFees || []).filter(
        f => (f.metadata as any)?.enrollment_id === e.id
      );
      const unpaidFees = enrollmentFees
        .filter(f => f.status !== 'completed' && f.status !== 'cancelled' && f.status !== 'refunded')
        .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
      const nextFee = unpaidFees[0];
      const nextDueDate = nextFee?.due_date || null;
      const daysUntilDue = nextDueDate
        ? Math.round((new Date(nextDueDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        : null;

      const expiresAt = e.expires_at ? new Date(e.expires_at) : null;
      const daysUntilExpiry = expiresAt
        ? Math.round((expiresAt.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        : null;

      const firstTuitionPayment = ePayments
        .filter(p => p.status === 'paid' && p.payment_purpose !== 'registration')
        .sort((a, b) => new Date(a.paid_at || a.created_at).getTime() - new Date(b.paid_at || b.created_at).getTime())[0];

      return {
        id: e.id,
        status: e.suspended_at ? 'suspended' : e.status,
        source,
        class: klass
          ? {
              id: klass.id,
              name: klass.name,
              slug: klass.slug,
              location: klassMeta.location || null,
            }
          : null,
        feePlan: plan
          ? {
              id: plan.id,
              name: plan.name,
              registrationFee: Number(plan.registration_fee || 0),
              tuitionFee: Number(plan.tuition_fee || 0),
              materialFee: Number(plan.material_fee || 0),
              examFee: Number(plan.exam_fee || 0),
              discountAmount: Number(plan.discount_amount || 0),
              totalAmount: totalPlan,
              validityMonths: plan.validity_months || 12,
            }
          : null,
        registrationPaid: !!e.registration_paid,
        registrationPaidAt: e.registration_paid_at,
        initiatedAt: e.initiated_at,
        enrolledAt: e.enrolled_at,
        firstFeePaidAt: firstTuitionPayment?.paid_at || null,
        expiresAt: e.expires_at,
        daysUntilExpiry,
        amountPaid,
        totalAmount: totalPlan,
        remaining,
        nextDueDate,
        daysUntilDue,
        notes: e.notes,
        metadata: e.metadata,
        suspended: e.suspended_at
          ? {
              at: e.suspended_at,
              by: e.suspended_by,
              reason: e.suspension_reason,
              emailSent: !!e.suspension_email_sent,
            }
          : null,
        payments: ePayments.map(p => ({
          id: p.id,
          amount: Number(p.amount),
          currency: p.currency || 'INR',
          status: p.status,
          paymentType: p.payment_type,
          paymentMethod: p.payment_method,
          paymentPurpose: p.payment_purpose,
          source:
            !!p.cashfree_payment_id ||
            !!p.razorpay_payment_id ||
            ['card', 'upi', 'netbanking', 'wallet'].includes((p.payment_method || '').toLowerCase())
              ? 'cashfree'
              : 'manual',
          receiptNumber: p.receipt_number,
          paidAt: p.paid_at,
          receivedAt: p.received_at,
          notes: p.payment_notes,
          errorDescription: p.error_description,
          createdAt: p.created_at,
        })),
        fees: enrollmentFees.map(f => ({
          id: f.id,
          feeType: f.fee_type,
          description: f.description,
          totalAmount: Number(f.total_amount),
          amountPaid: Number(f.amount_paid || 0),
          amountDue: Number(f.amount_due),
          dueDate: f.due_date,
          status: f.status,
          paidAt: f.paid_at,
          isInstallment: !!f.is_installment,
          installmentNumber: f.installment_number,
          totalInstallments: f.total_installments,
          lateFeeAmount: Number(f.late_fee_amount || 0),
          academicYear: f.academic_year,
          academicTerm: f.academic_term,
        })),
      };
    });

    // Resolve sent_by names for reminders (single batched query)
    const senderIds = Array.from(
      new Set((reminders || []).map(r => r.sent_by).filter((v): v is string => !!v))
    );
    let senderMap = new Map<string, string>();
    if (senderIds.length > 0) {
      const { data: senders } = await supabase
        .from('users')
        .select('id, first_name, last_name, email')
        .in('id', senderIds);
      senderMap = new Map(
        (senders || []).map(s => [
          s.id,
          [s.first_name, s.last_name].filter(Boolean).join(' ').trim() || s.email,
        ])
      );
    }

    const reminderResponses = (reminders || []).map(r => ({
      id: r.id,
      reminderType: r.reminder_type,
      channel: r.channel,
      sentAt: r.sent_at,
      sentBy: r.sent_by ? senderMap.get(r.sent_by) || 'Admin' : 'Automated',
      isAutomated: !r.sent_by,
      status: r.status,
      errorMessage: r.error_message,
      feeId: r.fee_id,
      enrollmentId: r.enrollment_id,
      metadata: r.metadata,
    }));

    sendSuccess(res, {
      student: {
        id: student.id,
        studentId: student.student_id,
        name: fullName,
        email: user?.email,
        phone: user?.phone,
        userId: user?.id,
        classGrade: student.class_grade,
        board: student.board,
        targetExam: student.target_exam,
        targetYear: student.target_year,
        parentName: student.parent_name,
        parentPhone: student.parent_phone,
        parentEmail: student.parent_email,
        subscriptionStatus: student.subscription_status,
        studentType: student.student_type,
        createdAt: student.created_at,
      },
      enrollments: enrollmentResponses,
      reminderHistory: reminderResponses,
    });
  } catch (error: any) {
    console.error('Error in GET /admin/fees/students/:id/full-profile:', error);
    sendError(res, error.message || 'Failed to load student profile');
  }
});

/**
 * POST /api/v2/admin/fees/students/:studentId/send-reminder
 *
 * Manually send a fee reminder email to a student. Admin can optionally
 * include a custom message. Logs entry in reminder_log with type='manual'.
 *
 * Body: { customMessage?: string }
 */
router.post('/fees/students/:studentId/send-reminder', async (req: Request, res: Response) => {
  try {
    const studentId = getParam(req.params.studentId);
    if (!studentId) return sendBadRequest(res, 'studentId is required');

    const customMessage = typeof req.body?.customMessage === 'string'
      ? req.body.customMessage.trim().slice(0, 1000)
      : undefined;

    const supabase = getSupabase();

    // Fetch student + user
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select(`
        id,
        student_id,
        users!inner ( id, first_name, email )
      `)
      .eq('id', studentId)
      .single();

    if (studentError || !student) {
      return sendNotFound(res, 'Student not found');
    }
    const user = (student as any).users;
    if (!user?.email) {
      return sendBadRequest(res, 'Student has no email on file');
    }

    // Fetch enrollments (active / pending — not cancelled/refunded/suspended)
    const { data: enrollments } = await supabase
      .from('class_enrollments')
      .select(`
        id,
        status,
        amount_paid,
        suspended_at,
        academic_classes:class_id ( id, name ),
        class_fee_plans:fee_plan_id ( total_amount )
      `)
      .eq('student_id', studentId);

    // Fetch unpaid student fees linked to enrollments
    const { data: fees } = await supabase
      .from('student_fees')
      .select('id, description, fee_type, amount_due, due_date, status, metadata')
      .eq('student_id', studentId)
      .in('status', ['pending', 'partial', 'overdue']);

    // Build pending dues list
    const enrollmentMap = new Map<string, any>();
    for (const e of enrollments || []) {
      enrollmentMap.set(e.id, e);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const pendingDues = (fees || [])
      .map(f => {
        const enrollmentId = (f.metadata as any)?.enrollment_id;
        const enrollment = enrollmentId ? enrollmentMap.get(enrollmentId) : null;
        const klass = enrollment?.academic_classes;
        const daysUntilDue = f.due_date
          ? Math.round((new Date(f.due_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
          : null;
        return {
          feeId: f.id,
          enrollmentId: enrollmentId || null,
          className: klass?.name || 'General Fee',
          description: f.description || f.fee_type.replace(/_/g, ' '),
          amountDue: Number(f.amount_due || 0),
          dueDate: f.due_date,
          daysUntilDue,
        };
      })
      .filter(d => d.amountDue > 0);

    if (pendingDues.length === 0) {
      return sendBadRequest(res, 'This student has no pending dues to remind about');
    }

    const totalDue = pendingDues.reduce((sum, d) => sum + d.amountDue, 0);
    const firstName = user.first_name || 'there';
    const dashboardUrl = `${env.FRONTEND_URL}/dashboard/my-fees`;

    // Send email
    let emailStatus: 'sent' | 'failed' = 'sent';
    let emailError: string | null = null;
    try {
      await emailService.sendFeeReminder({
        email: user.email,
        firstName,
        pendingDues,
        totalDue,
        customMessage,
        dashboardUrl,
      });
    } catch (err: any) {
      emailStatus = 'failed';
      emailError = err?.message || 'Unknown error';
    }

    // Log to reminder_log
    await supabase.from('reminder_log').insert({
      student_id: studentId,
      reminder_type: 'manual',
      channel: 'email',
      sent_by: req.user?.id || null,
      status: emailStatus,
      error_message: emailError,
      metadata: {
        total_due: totalDue,
        due_count: pendingDues.length,
        custom_message: customMessage || null,
      },
    });

    if (emailStatus === 'failed') {
      return sendError(res, emailError || 'Failed to send reminder');
    }

    sendSuccess(res, {
      sent: true,
      email: user.email,
      totalDue,
      dueCount: pendingDues.length,
    });
  } catch (error: any) {
    console.error('Error in POST /admin/fees/students/:id/send-reminder:', error);
    sendError(res, error.message || 'Failed to send reminder');
  }
});

/**
 * POST /api/v2/admin/fees/enrollments/:enrollmentId/suspend
 *
 * Suspend a student's enrollment. Optionally email the student with reason.
 *
 * Body: { reason: string, sendEmail?: boolean, customMessage?: string }
 */
router.post('/fees/enrollments/:enrollmentId/suspend', async (req: Request, res: Response) => {
  try {
    const enrollmentId = getParam(req.params.enrollmentId);
    if (!enrollmentId) return sendBadRequest(res, 'enrollmentId is required');

    const reason = typeof req.body?.reason === 'string' ? req.body.reason.trim().slice(0, 500) : '';
    if (!reason) return sendBadRequest(res, 'reason is required');

    const sendEmail = req.body?.sendEmail !== false; // default true
    const customMessage = typeof req.body?.customMessage === 'string'
      ? req.body.customMessage.trim().slice(0, 1000)
      : undefined;

    const supabase = getSupabase();

    // Fetch enrollment with student + class
    const { data: enrollment, error: fetchError } = await supabase
      .from('class_enrollments')
      .select(`
        id,
        status,
        suspended_at,
        student_id,
        academic_classes:class_id ( name ),
        students!inner (
          id,
          users!inner ( first_name, email )
        )
      `)
      .eq('id', enrollmentId)
      .single();

    if (fetchError || !enrollment) {
      return sendNotFound(res, 'Enrollment not found');
    }

    if ((enrollment as any).suspended_at) {
      return sendBadRequest(res, 'Enrollment is already suspended');
    }

    // Update enrollment
    const { error: updateError } = await supabase
      .from('class_enrollments')
      .update({
        status: 'suspended',
        suspended_at: new Date().toISOString(),
        suspended_by: req.user?.id || null,
        suspension_reason: reason,
        suspension_email_sent: false,
      })
      .eq('id', enrollmentId);

    if (updateError) {
      console.error('Error suspending enrollment:', updateError);
      return sendError(res, 'Failed to suspend enrollment');
    }

    // Send email if requested
    let emailSent = false;
    let emailError: string | null = null;
    const klass = (enrollment as any).academic_classes;
    const user = (enrollment as any).students?.users;

    if (sendEmail && user?.email) {
      try {
        await emailService.sendAccountSuspended({
          email: user.email,
          firstName: user.first_name || 'there',
          className: klass?.name || 'your class',
          reason,
          customMessage,
          contactEmail: env.ENQUIRY_EMAIL,
        });
        emailSent = true;
        // Mark email sent
        await supabase
          .from('class_enrollments')
          .update({ suspension_email_sent: true })
          .eq('id', enrollmentId);
      } catch (err: any) {
        emailError = err?.message || 'Email failed';
      }
    }

    // Log to reminder_log
    await supabase.from('reminder_log').insert({
      student_id: (enrollment as any).student_id,
      enrollment_id: enrollmentId,
      reminder_type: 'suspension',
      channel: 'email',
      sent_by: req.user?.id || null,
      status: emailSent ? 'sent' : sendEmail ? 'failed' : 'sent',
      error_message: emailError,
      metadata: {
        reason,
        custom_message: customMessage || null,
        email_attempted: sendEmail,
      },
    });

    sendSuccess(res, {
      suspended: true,
      enrollmentId,
      emailSent,
      emailError,
    });
  } catch (error: any) {
    console.error('Error in POST /admin/fees/enrollments/:id/suspend:', error);
    sendError(res, error.message || 'Failed to suspend enrollment');
  }
});

/**
 * POST /api/v2/admin/fees/enrollments/:enrollmentId/reactivate
 *
 * Reverse a suspension. Restores enrollment to its prior status (active if
 * fully paid + within validity, otherwise pending).
 */
router.post('/fees/enrollments/:enrollmentId/reactivate', async (req: Request, res: Response) => {
  try {
    const enrollmentId = getParam(req.params.enrollmentId);
    if (!enrollmentId) return sendBadRequest(res, 'enrollmentId is required');

    const supabase = getSupabase();

    const { data: enrollment, error: fetchError } = await supabase
      .from('class_enrollments')
      .select(`
        id,
        suspended_at,
        registration_paid,
        amount_paid,
        expires_at,
        student_id,
        class_fee_plans:fee_plan_id ( total_amount )
      `)
      .eq('id', enrollmentId)
      .single();

    if (fetchError || !enrollment) {
      return sendNotFound(res, 'Enrollment not found');
    }

    if (!(enrollment as any).suspended_at) {
      return sendBadRequest(res, 'Enrollment is not suspended');
    }

    // Decide what status to restore to
    const totalAmount = Number((enrollment as any).class_fee_plans?.total_amount || 0);
    const amountPaid = Number((enrollment as any).amount_paid || 0);
    const expiresAt = (enrollment as any).expires_at ? new Date((enrollment as any).expires_at) : null;
    const now = new Date();

    let newStatus: 'active' | 'pending' | 'expired';
    if (expiresAt && expiresAt < now) {
      newStatus = 'expired';
    } else if ((enrollment as any).registration_paid && amountPaid >= totalAmount) {
      newStatus = 'active';
    } else {
      newStatus = 'pending';
    }

    const { error: updateError } = await supabase
      .from('class_enrollments')
      .update({
        status: newStatus,
        suspended_at: null,
        suspended_by: null,
        suspension_reason: null,
        suspension_email_sent: false,
      })
      .eq('id', enrollmentId);

    if (updateError) {
      console.error('Error reactivating enrollment:', updateError);
      return sendError(res, 'Failed to reactivate enrollment');
    }

    sendSuccess(res, {
      reactivated: true,
      enrollmentId,
      newStatus,
    });
  } catch (error: any) {
    console.error('Error in POST /admin/fees/enrollments/:id/reactivate:', error);
    sendError(res, error.message || 'Failed to reactivate enrollment');
  }
});

/**
 * POST /api/v2/admin/fees/run-reminders
 *
 * Admin-triggered manual run of the daily reminder job.
 * Useful for testing or catching up after downtime.
 */
router.post('/fees/run-reminders', async (_req: Request, res: Response) => {
  try {
    const summary = await runDailyReminders();
    sendSuccess(res, summary);
  } catch (error: any) {
    console.error('Error in POST /admin/fees/run-reminders:', error);
    sendError(res, error.message || 'Failed to run reminders');
  }
});


export default router;
