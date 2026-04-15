// Student Fee Profile — complete fee story for a single student
// Reachable via /dashboard/fees/students/:studentId

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Mail,
  Phone,
  CheckCircle,
  Clock,
  Ban,
  AlertCircle,
  CreditCard,
  Banknote,
  Calendar,
  IndianRupee,
  Receipt,
  BellRing,
  MapPin,
  GraduationCap,
  ChevronDown,
  ChevronUp,
  Send,
  ShieldOff,
  User,
} from 'lucide-react';
import { Card, Badge, Skeleton, Button, Modal, ModalHeader, ModalBody, ModalFooter, Textarea } from '@shared/components/ui';
import clsx from 'clsx';

const API_URL = import.meta.env.VITE_API_URL || '/api';

// ── Types ──────────────────────────────────────────────────────────────
interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  paymentType: string | null;
  paymentMethod: string | null;
  paymentPurpose: string | null;
  source: 'cashfree' | 'manual';
  receiptNumber: string | null;
  paidAt: string | null;
  receivedAt: string | null;
  notes: string | null;
  errorDescription: string | null;
  createdAt: string;
}

interface Fee {
  id: string;
  feeType: string;
  description: string | null;
  totalAmount: number;
  amountPaid: number;
  amountDue: number;
  dueDate: string;
  status: string;
  paidAt: string | null;
  isInstallment: boolean;
  installmentNumber: number | null;
  totalInstallments: number | null;
  lateFeeAmount: number;
  academicYear: string | null;
  academicTerm: string | null;
}

interface Enrollment {
  id: string;
  status: string;
  source: 'cashfree' | 'manual';
  class: { id: string; name: string; slug: string; location: string | null } | null;
  feePlan: {
    id: string;
    name: string;
    registrationFee: number;
    tuitionFee: number;
    materialFee: number;
    examFee: number;
    discountAmount: number;
    totalAmount: number;
    validityMonths: number;
  } | null;
  registrationPaid: boolean;
  registrationPaidAt: string | null;
  initiatedAt: string | null;
  enrolledAt: string | null;
  firstFeePaidAt: string | null;
  expiresAt: string | null;
  daysUntilExpiry: number | null;
  amountPaid: number;
  totalAmount: number;
  remaining: number;
  nextDueDate: string | null;
  daysUntilDue: number | null;
  notes: string | null;
  metadata: Record<string, any> | null;
  suspended: { at: string; by: string | null; reason: string | null; emailSent: boolean } | null;
  payments: Payment[];
  fees: Fee[];
}

interface ReminderEntry {
  id: string;
  reminderType: string;
  channel: string;
  sentAt: string;
  sentBy: string;
  isAutomated: boolean;
  status: string;
  errorMessage: string | null;
  feeId: string | null;
  enrollmentId: string | null;
  metadata: Record<string, any> | null;
}

interface StudentInfo {
  id: string;
  studentId: string;
  name: string;
  email: string;
  phone: string | null;
  userId: string;
  classGrade: string | null;
  board: string | null;
  targetExam: string | null;
  targetYear: number | null;
  parentName: string | null;
  parentPhone: string | null;
  parentEmail: string | null;
  subscriptionStatus: string | null;
  studentType: string | null;
  createdAt: string;
}

interface ProfileData {
  student: StudentInfo;
  enrollments: Enrollment[];
  reminderHistory: ReminderEntry[];
}

// ── Formatters ─────────────────────────────────────────────────────────
const formatINR = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const formatDate = (iso: string | null) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return '—';
  }
};

const formatDateTime = (iso: string | null) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
};

const reminderTypeLabel = (t: string) => {
  const map: Record<string, string> = {
    due_in_7: 'Due in 7 days',
    due_in_3: 'Due in 3 days',
    due_tomorrow: 'Due tomorrow',
    due_today: 'Due today',
    overdue_week_1: 'Overdue — Week 1',
    overdue_week_2: 'Overdue — Week 2',
    overdue_week_3: 'Overdue — Week 3',
    overdue_week_4_plus: 'Overdue — Week 4+',
    manual: 'Manual reminder',
    suspension: 'Suspension notice',
  };
  return map[t] || t;
};

// ── Page ───────────────────────────────────────────────────────────────
export default function StudentFeeProfilePage() {
  const { studentId } = useParams<{ studentId: string }>();
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAllReminders, setShowAllReminders] = useState(false);
  const [reminderModalOpen, setReminderModalOpen] = useState(false);
  const [reminderMessage, setReminderMessage] = useState('');
  const [reminderSending, setReminderSending] = useState(false);
  const [reminderToast, setReminderToast] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);

  const refetch = async () => {
    if (!studentId) return;
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/v2/admin/fees/students/${studentId}/full-profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (res.ok) setData(json.data);
    } catch {
      /* ignore */
    }
  };

  const handleSendReminder = async () => {
    if (!studentId) return;
    setReminderSending(true);
    setReminderToast(null);
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/v2/admin/fees/students/${studentId}/send-reminder`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ customMessage: reminderMessage.trim() || undefined }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || `Failed (${res.status})`);
      setReminderToast({
        tone: 'success',
        text: `Reminder sent to ${json.data?.email || 'student'} for ${json.data?.dueCount || 0} pending due(s).`,
      });
      setReminderMessage('');
      setReminderModalOpen(false);
      await refetch();
    } catch (err: any) {
      setReminderToast({ tone: 'error', text: err.message || 'Failed to send reminder' });
    } finally {
      setReminderSending(false);
    }
  };

  useEffect(() => {
    if (!reminderToast) return;
    const t = setTimeout(() => setReminderToast(null), 4500);
    return () => clearTimeout(t);
  }, [reminderToast]);

  useEffect(() => {
    if (!studentId) return;
    let cancelled = false;

    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = await getToken();
        const res = await fetch(`${API_URL}/v2/admin/fees/students/${studentId}/full-profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.message || `Request failed (${res.status})`);
        }
        const json = await res.json();
        if (cancelled) return;
        setData(json.data);
      } catch (err: any) {
        if (cancelled) return;
        setError(err.message || 'Failed to load profile');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchProfile();
    return () => {
      cancelled = true;
    };
  }, [studentId, getToken]);

  // Aggregate totals across all enrollments
  const totals = useMemo(() => {
    if (!data) return { paid: 0, remaining: 0, nextDue: null as Enrollment | null };
    let paid = 0;
    let remaining = 0;
    let nextDue: Enrollment | null = null;
    for (const e of data.enrollments) {
      paid += e.amountPaid;
      remaining += e.remaining;
      if (e.nextDueDate && e.daysUntilDue !== null) {
        if (!nextDue || (nextDue.daysUntilDue !== null && e.daysUntilDue < nextDue.daysUntilDue)) {
          nextDue = e;
        }
      }
    }
    return { paid, remaining, nextDue };
  }, [data]);

  const visibleReminders = showAllReminders
    ? data?.reminderHistory ?? []
    : (data?.reminderHistory ?? []).slice(0, 5);

  if (loading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-32 rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-5">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <Card className="p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
            <div>
              <p className="font-semibold text-red-700">Could not load student profile</p>
              <p className="text-sm text-red-600 mt-1">{error || 'Unknown error'}</p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const { student, enrollments, reminderHistory } = data;
  const isSuspended = enrollments.some(e => e.suspended);
  const primarySource = enrollments[0]?.source;

  return (
    <div className="space-y-5">
      {/* Toast */}
      {reminderToast && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className={clsx(
            'p-3 rounded-lg border text-sm flex items-start gap-2',
            reminderToast.tone === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          )}
        >
          {reminderToast.tone === 'success' ? (
            <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          )}
          <span>{reminderToast.text}</span>
        </motion.div>
      )}

      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      {/* Header */}
      <Card className="p-5">
        <div className="flex flex-wrap items-start gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-lg shrink-0">
            {student.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">{student.name}</h1>
              <span className="text-xs font-mono text-slate-400">{student.studentId}</span>
              {primarySource && <SourceBadge source={primarySource} />}
              {isSuspended && (
                <Badge variant="danger" size="sm">
                  <Ban className="w-3 h-3 mr-1" /> Suspended
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-slate-500">
              <span className="inline-flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" />
                {student.email}
              </span>
              {student.phone && (
                <span className="inline-flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" />
                  {student.phone}
                </span>
              )}
              {student.classGrade && (
                <span className="inline-flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5" />
                  Class {student.classGrade}
                </span>
              )}
            </div>
            {(student.parentName || student.parentPhone) && (
              <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <User className="w-3 h-3" />
                  Parent: {student.parentName || '—'}
                </span>
                {student.parentPhone && <span>• {student.parentPhone}</span>}
              </div>
            )}
          </div>

          {/* Action placeholders — wired in Phase 3 + 5 */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setReminderModalOpen(true)}
              disabled={totals.remaining <= 0}
              title={totals.remaining <= 0 ? 'No pending dues' : 'Send fee reminder email'}
            >
              <Send className="w-4 h-4 mr-1" /> Send Reminder
            </Button>
            {!isSuspended ? (
              <Button variant="danger" size="sm" disabled title="Coming in Phase 5">
                <ShieldOff className="w-4 h-4 mr-1" /> Suspend
              </Button>
            ) : (
              <Button variant="primary" size="sm" disabled title="Coming in Phase 5">
                <CheckCircle className="w-4 h-4 mr-1" /> Reactivate
              </Button>
            )}
          </div>
        </div>

        {/* Suspension banner */}
        {isSuspended && (
          <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200">
            {enrollments
              .filter(e => e.suspended)
              .map(e => (
                <div key={e.id} className="text-sm">
                  <p className="font-semibold text-red-800">
                    {e.class?.name} — suspended {formatDate(e.suspended!.at)}
                  </p>
                  {e.suspended!.reason && (
                    <p className="text-red-700 mt-1">Reason: {e.suspended!.reason}</p>
                  )}
                </div>
              ))}
          </div>
        )}
      </Card>

      {/* Top-line stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<IndianRupee className="w-4 h-4" />}
          label="Total Paid"
          value={formatINR(totals.paid)}
          accent="emerald"
        />
        <StatCard
          icon={<IndianRupee className="w-4 h-4" />}
          label="Remaining"
          value={formatINR(totals.remaining)}
          accent={totals.remaining > 0 ? 'amber' : 'slate'}
        />
        <StatCard
          icon={<Calendar className="w-4 h-4" />}
          label="Next Due"
          value={totals.nextDue?.nextDueDate ? formatDate(totals.nextDue.nextDueDate) : '—'}
          sub={
            totals.nextDue?.daysUntilDue !== undefined && totals.nextDue?.daysUntilDue !== null
              ? totals.nextDue.daysUntilDue < 0
                ? `${Math.abs(totals.nextDue.daysUntilDue)} days overdue`
                : totals.nextDue.daysUntilDue === 0
                ? 'Due today'
                : `in ${totals.nextDue.daysUntilDue} days`
              : undefined
          }
          subTone={
            totals.nextDue?.daysUntilDue !== undefined && totals.nextDue?.daysUntilDue !== null
              ? totals.nextDue.daysUntilDue < 0
                ? 'red'
                : totals.nextDue.daysUntilDue <= 3
                ? 'amber'
                : 'slate'
              : 'slate'
          }
          accent="blue"
        />
        <StatCard
          icon={<Clock className="w-4 h-4" />}
          label="Enrollments"
          value={enrollments.length.toString()}
          sub={`${enrollments.filter(e => e.status === 'active').length} active`}
          accent="indigo"
        />
      </div>

      {/* Enrollments */}
      {enrollments.length === 0 ? (
        <Card className="p-6 text-center text-sm text-slate-500">
          This student has no enrollments yet.
        </Card>
      ) : (
        <div className="space-y-5">
          {enrollments.map((e, idx) => (
            <EnrollmentSection key={e.id} enrollment={e} index={idx} />
          ))}
        </div>
      )}

      {/* Reminder history */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
            <BellRing className="w-4 h-4 text-slate-500" />
            Reminder History
            <span className="text-xs font-normal text-slate-400">({reminderHistory.length})</span>
          </h3>
          {reminderHistory.length > 5 && (
            <button
              onClick={() => setShowAllReminders(v => !v)}
              className="text-xs font-semibold text-blue-700 hover:text-blue-800 inline-flex items-center gap-1"
            >
              {showAllReminders ? (
                <>
                  Show less <ChevronUp className="w-3 h-3" />
                </>
              ) : (
                <>
                  Show all <ChevronDown className="w-3 h-3" />
                </>
              )}
            </button>
          )}
        </div>

        {reminderHistory.length === 0 ? (
          <p className="text-sm text-slate-500">No reminders sent yet.</p>
        ) : (
          <div className="space-y-2">
            {visibleReminders.map(r => (
              <div
                key={r.id}
                className="flex items-start justify-between gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-slate-900">
                      {reminderTypeLabel(r.reminderType)}
                    </span>
                    <Badge variant={r.status === 'sent' ? 'success' : 'danger'} size="sm">
                      {r.status}
                    </Badge>
                    {r.isAutomated && (
                      <Badge variant="default" size="sm">
                        Auto
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {formatDateTime(r.sentAt)} • by {r.sentBy} • via {r.channel}
                  </p>
                  {r.errorMessage && (
                    <p className="text-xs text-red-600 mt-1">Error: {r.errorMessage}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Reminder modal */}
      <Modal isOpen={reminderModalOpen} onClose={() => !reminderSending && setReminderModalOpen(false)} size="md">
        <ModalHeader title="Send Fee Reminder" subtitle={`To ${student.name} · ${student.email}`} onClose={() => !reminderSending && setReminderModalOpen(false)} />
        <ModalBody>
          <p className="text-sm text-slate-600 mb-4">
            This will email {student.name.split(' ')[0]} a summary of{' '}
            <span className="font-semibold text-slate-900">{formatINR(totals.remaining)}</span> in pending dues
            across {enrollments.filter(e => e.remaining > 0).length} enrollment
            {enrollments.filter(e => e.remaining > 0).length === 1 ? '' : 's'}.
          </p>
          <Textarea
            label="Custom message (optional)"
            placeholder="Add a personal note — e.g. 'Please pay before the next class on Monday.'"
            rows={4}
            maxLength={1000}
            value={reminderMessage}
            onChange={e => setReminderMessage(e.target.value)}
            helperText={`${reminderMessage.length}/1000 characters`}
          />
        </ModalBody>
        <ModalFooter>
          <Button
            variant="ghost"
            onClick={() => setReminderModalOpen(false)}
            disabled={reminderSending}
          >
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSendReminder} isLoading={reminderSending}>
            <Send className="w-4 h-4 mr-1" />
            Send Reminder
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}

// ── Per-enrollment section ─────────────────────────────────────────────
function EnrollmentSection({ enrollment, index }: { enrollment: Enrollment; index: number }) {
  const [paymentsOpen, setPaymentsOpen] = useState(index === 0);
  const e = enrollment;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.2 }}
    >
      <Card className="p-5">
        {/* Enrollment header */}
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-slate-900 truncate">{e.class?.name || 'Unknown class'}</h3>
              <StatusBadge status={e.status} registrationPaid={e.registrationPaid} />
              <SourceBadge source={e.source} />
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 flex-wrap">
              {e.class?.location && (
                <span className="inline-flex items-center gap-1 capitalize">
                  <MapPin className="w-3 h-3" />
                  {e.class.location}
                </span>
              )}
              {e.feePlan && (
                <span className="inline-flex items-center gap-1">
                  <Receipt className="w-3 h-3" />
                  {e.feePlan.name} • {e.feePlan.validityMonths}mo
                </span>
              )}
            </div>
          </div>

          <div className="text-right">
            <p className="text-xs text-slate-500">Plan Total</p>
            <p className="text-lg font-bold text-slate-900">{formatINR(e.totalAmount)}</p>
          </div>
        </div>

        {/* Fee math strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <MiniStat label="Paid" value={formatINR(e.amountPaid)} tone="emerald" />
          <MiniStat label="Remaining" value={formatINR(e.remaining)} tone={e.remaining > 0 ? 'amber' : 'slate'} />
          <MiniStat
            label="Next Due"
            value={e.nextDueDate ? formatDate(e.nextDueDate) : '—'}
            sub={
              e.daysUntilDue !== null
                ? e.daysUntilDue < 0
                  ? `${Math.abs(e.daysUntilDue)}d overdue`
                  : e.daysUntilDue === 0
                  ? 'Today'
                  : `in ${e.daysUntilDue}d`
                : undefined
            }
            tone={e.daysUntilDue !== null && e.daysUntilDue < 0 ? 'red' : 'blue'}
          />
          <MiniStat
            label="Plan Expires"
            value={e.expiresAt ? formatDate(e.expiresAt) : '—'}
            sub={
              e.daysUntilExpiry !== null
                ? e.daysUntilExpiry < 0
                  ? 'expired'
                  : `in ${e.daysUntilExpiry}d`
                : undefined
            }
            tone={e.daysUntilExpiry !== null && e.daysUntilExpiry < 0 ? 'red' : 'slate'}
          />
        </div>

        {/* Timeline */}
        <div className="mb-4 p-3 rounded-lg bg-slate-50">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Timeline</p>
          <div className="space-y-1.5 text-sm">
            <TimelineRow
              dot={e.initiatedAt ? 'filled' : 'empty'}
              label="Initiated"
              value={formatDate(e.initiatedAt)}
            />
            <TimelineRow
              dot={e.registrationPaid ? 'filled' : 'empty'}
              label="Registration paid"
              value={formatDate(e.registrationPaidAt)}
            />
            <TimelineRow
              dot={e.firstFeePaidAt ? 'filled' : 'empty'}
              label="First tuition paid"
              value={formatDate(e.firstFeePaidAt)}
            />
            <TimelineRow
              dot={e.enrolledAt ? 'filled' : 'empty'}
              label="Enrolled (activated)"
              value={formatDate(e.enrolledAt)}
            />
            <TimelineRow dot="empty" label="Plan expires" value={formatDate(e.expiresAt)} />
          </div>
        </div>

        {/* Payment history */}
        <div>
          <button
            onClick={() => setPaymentsOpen(v => !v)}
            className="w-full flex items-center justify-between text-left text-sm font-semibold text-slate-700 hover:text-slate-900"
          >
            <span className="inline-flex items-center gap-2">
              <Receipt className="w-4 h-4 text-slate-500" />
              Payment History
              <span className="text-xs font-normal text-slate-400">({e.payments.length})</span>
            </span>
            {paymentsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {paymentsOpen && (
            <div className="mt-3 overflow-x-auto">
              {e.payments.length === 0 ? (
                <p className="text-sm text-slate-500 py-3">No payments yet.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide border-b border-slate-200">
                      <th className="py-2 pr-3">Date</th>
                      <th className="py-2 pr-3">Purpose</th>
                      <th className="py-2 pr-3">Method</th>
                      <th className="py-2 pr-3">Receipt</th>
                      <th className="py-2 pr-3">Status</th>
                      <th className="py-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {e.payments.map(p => (
                      <tr key={p.id} className="border-b border-slate-100 last:border-0">
                        <td className="py-2 pr-3 text-slate-700 whitespace-nowrap">
                          {formatDate(p.paidAt || p.receivedAt || p.createdAt)}
                        </td>
                        <td className="py-2 pr-3 capitalize text-slate-700">
                          {p.paymentPurpose?.replace(/_/g, ' ') || p.paymentType || '—'}
                        </td>
                        <td className="py-2 pr-3 text-slate-600">
                          <span className="inline-flex items-center gap-1">
                            {p.source === 'cashfree' ? (
                              <CreditCard className="w-3 h-3" />
                            ) : (
                              <Banknote className="w-3 h-3" />
                            )}
                            <span className="capitalize">{p.paymentMethod || p.source}</span>
                          </span>
                        </td>
                        <td className="py-2 pr-3 font-mono text-xs text-slate-500">
                          {p.receiptNumber || '—'}
                        </td>
                        <td className="py-2 pr-3">
                          <PaymentStatusPill status={p.status} />
                        </td>
                        <td className="py-2 text-right font-semibold text-slate-900 whitespace-nowrap">
                          {formatINR(p.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>

        {/* Upcoming dues */}
        {e.fees.filter(f => f.status !== 'completed').length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Upcoming / Overdue Dues
            </p>
            <div className="space-y-1.5">
              {e.fees
                .filter(f => f.status !== 'completed')
                .map(f => (
                  <div key={f.id} className="flex items-center justify-between text-sm">
                    <span className="text-slate-700 capitalize truncate">
                      {f.description || f.feeType.replace(/_/g, ' ')}
                      {f.isInstallment && f.installmentNumber && (
                        <span className="text-xs text-slate-400 ml-1">
                          ({f.installmentNumber}/{f.totalInstallments})
                        </span>
                      )}
                    </span>
                    <span className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-slate-500">due {formatDate(f.dueDate)}</span>
                      <span className="font-semibold text-slate-900">{formatINR(f.amountDue)}</span>
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  );
}

// ── Small components ───────────────────────────────────────────────────
function SourceBadge({ source }: { source: 'cashfree' | 'manual' }) {
  if (source === 'cashfree') {
    return (
      <Badge variant="info" size="sm">
        <CreditCard className="w-3 h-3 mr-1" /> Cashfree
      </Badge>
    );
  }
  return (
    <Badge variant="default" size="sm">
      <Banknote className="w-3 h-3 mr-1" /> Manual
    </Badge>
  );
}

function StatusBadge({ status, registrationPaid }: { status: string; registrationPaid: boolean }) {
  if (status === 'suspended') {
    return (
      <Badge variant="danger" size="sm">
        <Ban className="w-3 h-3 mr-1" /> Suspended
      </Badge>
    );
  }
  if (status === 'active') {
    return (
      <Badge variant="success" size="sm">
        <CheckCircle className="w-3 h-3 mr-1" /> Active
      </Badge>
    );
  }
  if (status === 'expired') {
    return (
      <Badge variant="warning" size="sm">
        <Clock className="w-3 h-3 mr-1" /> Expired
      </Badge>
    );
  }
  return (
    <Badge variant="warning" size="sm">
      <Clock className="w-3 h-3 mr-1" />
      {registrationPaid ? 'Awaiting Tuition' : 'Pending'}
    </Badge>
  );
}

function PaymentStatusPill({ status }: { status: string }) {
  const lower = status.toLowerCase();
  const variant =
    lower === 'paid' || lower === 'completed' || lower === 'success'
      ? 'success'
      : lower === 'failed' || lower === 'cancelled'
      ? 'danger'
      : lower === 'refunded'
      ? 'info'
      : 'warning';
  return (
    <Badge variant={variant} size="sm">
      {status}
    </Badge>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  subTone = 'slate',
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  subTone?: 'slate' | 'red' | 'amber';
  accent: 'blue' | 'indigo' | 'emerald' | 'amber' | 'slate';
}) {
  const accents: Record<string, string> = {
    blue: 'from-blue-500 to-blue-700',
    indigo: 'from-indigo-500 to-indigo-700',
    emerald: 'from-emerald-500 to-emerald-700',
    amber: 'from-amber-500 to-amber-700',
    slate: 'from-slate-400 to-slate-600',
  };
  const subColors: Record<string, string> = {
    slate: 'text-slate-500',
    red: 'text-red-600',
    amber: 'text-amber-600',
  };

  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div
          className={clsx(
            'w-9 h-9 rounded-lg bg-gradient-to-br flex items-center justify-center text-white shrink-0',
            accents[accent]
          )}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
          <p className="text-base font-bold text-slate-900 truncate">{value}</p>
          {sub && <p className={clsx('text-xs mt-0.5', subColors[subTone])}>{sub}</p>}
        </div>
      </div>
    </Card>
  );
}

function MiniStat({
  label,
  value,
  sub,
  tone = 'slate',
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: 'emerald' | 'amber' | 'red' | 'blue' | 'slate';
}) {
  const valueColors: Record<string, string> = {
    emerald: 'text-emerald-700',
    amber: 'text-amber-700',
    red: 'text-red-700',
    blue: 'text-blue-700',
    slate: 'text-slate-900',
  };
  return (
    <div className="p-3 rounded-lg border border-slate-100 bg-white">
      <p className="text-xs text-slate-500 uppercase tracking-wide">{label}</p>
      <p className={clsx('text-sm font-bold mt-1', valueColors[tone])}>{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
    </div>
  );
}

function TimelineRow({
  dot,
  label,
  value,
}: {
  dot: 'filled' | 'empty';
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={clsx(
          'w-2 h-2 rounded-full shrink-0',
          dot === 'filled' ? 'bg-emerald-500' : 'bg-slate-300'
        )}
      />
      <span className="text-slate-600 w-40 shrink-0">{label}</span>
      <span className="text-slate-900 font-medium">{value}</span>
    </div>
  );
}
