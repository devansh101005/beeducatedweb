// Reminder Service — runs daily to send automated fee reminders
// Scheduled at 21:00 IST via node-cron (see server.ts)

import { getSupabase } from '../config/supabase.js';
import { emailService } from './emailService.js';
import { env } from '../config/env.js';

type ReminderType =
  | 'due_in_7'
  | 'due_in_3'
  | 'due_tomorrow'
  | 'due_today'
  | 'overdue_week_1'
  | 'overdue_week_2'
  | 'overdue_week_3'
  | 'overdue_week_4_plus';

interface ClassifiedFee {
  feeId: string;
  enrollmentId: string | null;
  studentId: string;
  className: string;
  description: string;
  amountDue: number;
  dueDate: string;
  daysUntilDue: number;
  reminderType: ReminderType;
}

/**
 * Classify a fee's daysUntilDue into a reminder type.
 * Returns null if today is not a reminder day for this fee.
 *
 * Weekly escalation:
 *   -7 → overdue_week_1
 *   -14 → overdue_week_2
 *   -21 → overdue_week_3
 *   -28, -35, -42, ... → overdue_week_4_plus (fires weekly forever)
 */
function classifyReminder(daysUntilDue: number): ReminderType | null {
  if (daysUntilDue === 7) return 'due_in_7';
  if (daysUntilDue === 3) return 'due_in_3';
  if (daysUntilDue === 1) return 'due_tomorrow';
  if (daysUntilDue === 0) return 'due_today';
  if (daysUntilDue === -7) return 'overdue_week_1';
  if (daysUntilDue === -14) return 'overdue_week_2';
  if (daysUntilDue === -21) return 'overdue_week_3';
  // Week 4+ fires on day -28 and every 7 days after
  if (daysUntilDue <= -28 && (Math.abs(daysUntilDue) % 7 === 0)) {
    return 'overdue_week_4_plus';
  }
  return null;
}

export async function runDailyReminders(): Promise<{
  scanned: number;
  classified: number;
  deduped: number;
  sent: number;
  failed: number;
}> {
  const supabase = getSupabase();
  const startedAt = Date.now();
  console.log('[REMINDERS] Daily reminder job started at', new Date().toISOString());

  // 1. Pull all unpaid fees (pending/partial/overdue)
  const { data: fees, error } = await supabase
    .from('student_fees')
    .select(`
      id,
      student_id,
      description,
      fee_type,
      amount_due,
      due_date,
      status,
      metadata,
      students!inner (
        id,
        users!inner ( id, first_name, email )
      )
    `)
    .in('status', ['pending', 'partial', 'overdue']);

  if (error) {
    console.error('[REMINDERS] Failed to fetch fees:', error);
    throw error;
  }

  const scanned = fees?.length || 0;

  // 2. Build list of enrollments for class name lookup (single batch)
  const enrollmentIds = Array.from(
    new Set(
      (fees || [])
        .map(f => (f.metadata as any)?.enrollment_id)
        .filter((v): v is string => !!v)
    )
  );

  const enrollmentClassMap = new Map<string, string>();
  if (enrollmentIds.length > 0) {
    const { data: enrollments } = await supabase
      .from('class_enrollments')
      .select(`
        id,
        status,
        suspended_at,
        academic_classes:class_id ( name )
      `)
      .in('id', enrollmentIds);

    for (const e of enrollments || []) {
      // Skip suspended/cancelled enrollments — don't pester students we've suspended
      if (e.suspended_at || e.status === 'cancelled' || e.status === 'refunded') continue;
      const klass = (e as any).academic_classes;
      enrollmentClassMap.set(e.id, klass?.name || 'Fee');
    }
  }

  // 3. Classify each fee
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const classified: ClassifiedFee[] = [];
  for (const f of fees || []) {
    if (!f.due_date) continue;
    const amountDue = Number(f.amount_due || 0);
    if (amountDue <= 0) continue;

    const daysUntilDue = Math.round(
      (new Date(f.due_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    const reminderType = classifyReminder(daysUntilDue);
    if (!reminderType) continue;

    const enrollmentId = (f.metadata as any)?.enrollment_id || null;

    // If linked to an enrollment, ensure that enrollment is still active
    if (enrollmentId && !enrollmentClassMap.has(enrollmentId)) continue;

    const className = enrollmentId
      ? enrollmentClassMap.get(enrollmentId) || 'Fee'
      : 'General Fee';

    classified.push({
      feeId: f.id,
      enrollmentId,
      studentId: f.student_id,
      className,
      description: f.description || f.fee_type.replace(/_/g, ' '),
      amountDue,
      dueDate: f.due_date,
      daysUntilDue,
      reminderType,
    });
  }

  // 4. De-dupe: drop any (feeId, reminderType) we've already sent
  // For `overdue_week_4_plus`, we dedupe within a 6-day window so it fires weekly but not twice.
  const feeIds = Array.from(new Set(classified.map(c => c.feeId)));
  const dedupeDropped: string[] = [];
  if (feeIds.length > 0) {
    const { data: existingLogs } = await supabase
      .from('reminder_log')
      .select('fee_id, reminder_type, sent_at, status')
      .in('fee_id', feeIds)
      .in('status', ['sent']);

    const logMap = new Map<string, Date[]>(); // key: feeId|type
    for (const log of existingLogs || []) {
      const key = `${log.fee_id}|${log.reminder_type}`;
      if (!logMap.has(key)) logMap.set(key, []);
      logMap.get(key)!.push(new Date(log.sent_at));
    }

    const kept: ClassifiedFee[] = [];
    for (const c of classified) {
      const key = `${c.feeId}|${c.reminderType}`;
      const prior = logMap.get(key) || [];

      if (c.reminderType === 'overdue_week_4_plus') {
        // Allow weekly re-send: drop only if one was sent within the last 6 days
        const sixDaysAgo = Date.now() - 6 * 24 * 60 * 60 * 1000;
        const recent = prior.some(d => d.getTime() > sixDaysAgo);
        if (recent) {
          dedupeDropped.push(key);
          continue;
        }
      } else {
        // All other types: fire exactly once per fee
        if (prior.length > 0) {
          dedupeDropped.push(key);
          continue;
        }
      }
      kept.push(c);
    }

    classified.length = 0;
    classified.push(...kept);
  }

  // 5. Group by student and send one email per student
  const byStudent = new Map<string, ClassifiedFee[]>();
  for (const c of classified) {
    if (!byStudent.has(c.studentId)) byStudent.set(c.studentId, []);
    byStudent.get(c.studentId)!.push(c);
  }

  // Build a student map (id → {firstName, email}) from the fees query
  const studentInfoMap = new Map<string, { firstName: string; email: string }>();
  for (const f of fees || []) {
    const s = (f as any).students;
    const u = s?.users;
    if (s?.id && u?.email && !studentInfoMap.has(s.id)) {
      studentInfoMap.set(s.id, {
        firstName: u.first_name || 'there',
        email: u.email,
      });
    }
  }

  let sent = 0;
  let failed = 0;
  const dashboardUrl = `${env.FRONTEND_URL}/dashboard/my-fees`;

  for (const [studentId, studentFees] of byStudent.entries()) {
    const info = studentInfoMap.get(studentId);
    if (!info) {
      console.warn(`[REMINDERS] No user info for student ${studentId}, skipping`);
      continue;
    }

    const totalDue = studentFees.reduce((sum, f) => sum + f.amountDue, 0);
    const pendingDues = studentFees.map(f => ({
      className: f.className,
      description: f.description,
      amountDue: f.amountDue,
      dueDate: f.dueDate,
      daysUntilDue: f.daysUntilDue,
    }));

    let emailStatus: 'sent' | 'failed' = 'sent';
    let emailError: string | null = null;
    try {
      await emailService.sendFeeReminder({
        email: info.email,
        firstName: info.firstName,
        pendingDues,
        totalDue,
        dashboardUrl,
      });
      sent++;
    } catch (err: any) {
      emailStatus = 'failed';
      emailError = err?.message || 'Unknown error';
      failed++;
    }

    // Log one entry per fee so per-fee/type de-dupe works tomorrow
    const logRows = studentFees.map(f => ({
      student_id: studentId,
      fee_id: f.feeId,
      enrollment_id: f.enrollmentId,
      reminder_type: f.reminderType,
      channel: 'email',
      sent_by: null,
      status: emailStatus,
      error_message: emailError,
      metadata: {
        amount_due: f.amountDue,
        days_until_due: f.daysUntilDue,
        class_name: f.className,
      },
    }));
    await supabase.from('reminder_log').insert(logRows);
  }

  const summary = {
    scanned,
    classified: classified.length + dedupeDropped.length,
    deduped: dedupeDropped.length,
    sent,
    failed,
  };
  const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
  console.log(`[REMINDERS] Done in ${elapsed}s —`, summary);
  return summary;
}
