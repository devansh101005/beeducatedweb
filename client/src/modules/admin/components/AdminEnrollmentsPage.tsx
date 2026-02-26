// Admin Enrollments Management Page
// View all enrollments — online (Razorpay) and manual (cash/bank/cheque/UPI)

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { motion } from 'framer-motion';
import {
  GraduationCap,
  Search,
  Plus,
  IndianRupee,
  Users,
  Clock,
  CheckCircle,
  CreditCard,
  Banknote,
  Building,
  FileText,
  Smartphone,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import {
  Card,
  Badge,
  Button,
  Skeleton,
  EmptyState,
} from '@shared/components/ui';
import { fadeInUp } from '@shared/components/ui/motion';
import { ManualEnrollmentModal } from './ManualEnrollmentModal';
import clsx from 'clsx';

// ============================================
// TYPES
// ============================================

interface Enrollment {
  id: string;
  enrollment_number: string;
  student_id: string;
  class_id: string;
  fee_plan_id: string;
  status: string;
  amount_paid: number;
  enrolled_at: string | null;
  expires_at: string | null;
  created_at: string;
  notes: string | null;
  metadata: any;
  student_name: string | null;
  student_code: string | null;
  student_email: string | null;
  class_name: string | null;
  course_type_name: string | null;
  fee_plan_name: string | null;
  total_amount: number | null;
  payment: {
    id: string;
    payment_type: string | null;
    status: string;
    amount: number;
    receipt_number: string | null;
    razorpay_payment_id: string | null;
    created_at: string;
  } | null;
}

interface EnrollmentStats {
  totalEnrollments: number;
  activeEnrollments: number;
  pendingEnrollments: number;
  totalRevenue: number;
  thisMonthEnrollments: number;
  thisMonthRevenue: number;
}

const API_URL = import.meta.env.VITE_API_URL || '/api';

// ============================================
// FILTER OPTIONS
// ============================================

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'expired', label: 'Expired' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'refunded', label: 'Refunded' },
];

const paymentMethodOptions = [
  { value: '', label: 'All Methods' },
  { value: 'razorpay', label: 'Online (Razorpay)' },
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'upi_direct', label: 'UPI Direct' },
];

// ============================================
// HELPERS
// ============================================

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'active':
      return <Badge variant="success">Active</Badge>;
    case 'pending':
      return <Badge variant="warning">Pending</Badge>;
    case 'expired':
      return <Badge variant="default">Expired</Badge>;
    case 'cancelled':
      return <Badge variant="danger">Cancelled</Badge>;
    case 'refunded':
      return <Badge variant="info">Refunded</Badge>;
    default:
      return <Badge variant="default">{status}</Badge>;
  }
}

function getPaymentMethodBadge(paymentType: string | null | undefined) {
  switch (paymentType) {
    case 'razorpay':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
          <CreditCard className="w-3 h-3" /> Online
        </span>
      );
    case 'cash':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
          <Banknote className="w-3 h-3" /> Cash
        </span>
      );
    case 'bank_transfer':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-violet-50 text-violet-700">
          <Building className="w-3 h-3" /> Bank Transfer
        </span>
      );
    case 'cheque':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
          <FileText className="w-3 h-3" /> Cheque
        </span>
      );
    case 'upi_direct':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-sky-50 text-sky-700">
          <Smartphone className="w-3 h-3" /> UPI
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500">
          <HelpCircle className="w-3 h-3" /> N/A
        </span>
      );
  }
}

// ============================================
// MAIN COMPONENT
// ============================================

export function AdminEnrollmentsPage() {
  const { getToken } = useAuth();

  // Data state
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [stats, setStats] = useState<EnrollmentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');

  // Modal
  const [showManualModal, setShowManualModal] = useState(false);

  // Fetch enrollments
  const fetchEnrollments = async () => {
    setLoading(true);
    setError('');
    try {
      const token = await getToken();
      const headers = { Authorization: `Bearer ${token}` };

      const params = new URLSearchParams();
      params.append('page', String(page));
      params.append('limit', String(limit));
      if (statusFilter) params.append('status', statusFilter);

      const response = await fetch(`${API_URL}/v2/admin/enrollments?${params}`, { headers });
      const data = await response.json();

      if (data.success) {
        setEnrollments(data.data?.items || []);
        setTotal(data.data?.total || 0);
        setTotalPages(data.data?.totalPages || 1);
      } else {
        setError(data.message || 'Failed to load enrollments');
      }
    } catch (err) {
      console.error('Failed to fetch enrollments:', err);
      setError('Failed to load enrollments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/v2/dashboard/admin/enrollment-stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch enrollment stats:', err);
    }
  };

  useEffect(() => {
    fetchEnrollments();
  }, [page, statusFilter]);

  useEffect(() => {
    fetchStats();
  }, []);

  // Client-side search + method filter
  const filteredEnrollments = useMemo(() => {
    let result = enrollments;

    if (methodFilter) {
      result = result.filter((e) => e.payment?.payment_type === methodFilter);
    }

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (e) =>
          e.student_name?.toLowerCase().includes(q) ||
          e.student_email?.toLowerCase().includes(q) ||
          e.enrollment_number?.toLowerCase().includes(q) ||
          e.class_name?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [enrollments, search, methodFilter]);

  const handleManualEnrollmentSuccess = () => {
    setShowManualModal(false);
    fetchEnrollments();
    fetchStats();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        variants={fadeInUp}
        initial="initial"
        animate="animate"
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-heading font-semibold text-slate-900 flex items-center gap-2">
            <GraduationCap className="w-7 h-7 text-amber-600" />
            Enrollments
          </h1>
          <p className="text-slate-500 mt-1">
            Manage all student enrollments — online and manual
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw className="w-4 h-4" />}
            onClick={() => { fetchEnrollments(); fetchStats(); }}
          >
            Refresh
          </Button>
          <Button
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setShowManualModal(true)}
          >
            Manual Enrollment
          </Button>
        </div>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Enrollments',
            value: stats?.totalEnrollments ?? '-',
            icon: <Users className="w-5 h-5 text-slate-500" />,
            bg: 'bg-slate-50',
          },
          {
            label: 'Active',
            value: stats?.activeEnrollments ?? '-',
            icon: <CheckCircle className="w-5 h-5 text-emerald-500" />,
            bg: 'bg-emerald-50',
          },
          {
            label: 'Pending',
            value: stats?.pendingEnrollments ?? '-',
            icon: <Clock className="w-5 h-5 text-amber-500" />,
            bg: 'bg-amber-50',
          },
          {
            label: 'Total Revenue',
            value: stats ? formatCurrency(stats.totalRevenue) : '-',
            icon: <IndianRupee className="w-5 h-5 text-blue-500" />,
            bg: 'bg-blue-50',
          },
        ].map((stat) => (
          <Card key={stat.label} className={clsx('p-4', stat.bg)}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-white shadow-sm">{stat.icon}</div>
              <div>
                <p className="text-xs text-slate-500 font-medium">{stat.label}</p>
                <p className="text-xl font-bold text-slate-900">{stat.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email, enrollment #, class..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
          >
            {paymentMethodOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </Card>

      {/* Table */}
      {loading ? (
        <Card className="p-4">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="w-10 h-10 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        </Card>
      ) : error ? (
        <Card className="p-8 text-center">
          <p className="text-rose-600 mb-4">{error}</p>
          <Button variant="outline" onClick={fetchEnrollments}>Try Again</Button>
        </Card>
      ) : filteredEnrollments.length === 0 ? (
        <EmptyState
          title="No Enrollments Found"
          description={search || statusFilter || methodFilter
            ? 'Try adjusting your filters.'
            : 'No enrollments have been made yet.'}
          icon={<GraduationCap className="w-12 h-12" />}
        />
      ) : (
        <Card className="overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-3 font-medium text-slate-500">Enrollment #</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500">Student</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500">Class</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500">Fee Plan</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-500">Amount</th>
                  <th className="text-center px-4 py-3 font-medium text-slate-500">Method</th>
                  <th className="text-center px-4 py-3 font-medium text-slate-500">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEnrollments.map((enrollment) => (
                  <tr
                    key={enrollment.id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-slate-600">
                        {enrollment.enrollment_number || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-slate-900">{enrollment.student_name || 'Unknown'}</p>
                        <p className="text-xs text-slate-500">{enrollment.student_email || ''}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-slate-900">{enrollment.class_name || '-'}</p>
                        <p className="text-xs text-slate-500">{enrollment.course_type_name || ''}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {enrollment.fee_plan_name || '-'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {formatCurrency(enrollment.amount_paid || 0)}
                        </p>
                        {enrollment.total_amount && enrollment.total_amount !== enrollment.amount_paid && (
                          <p className="text-xs text-slate-400">
                            of {formatCurrency(enrollment.total_amount)}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {getPaymentMethodBadge(enrollment.payment?.payment_type)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {getStatusBadge(enrollment.status)}
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-xs">
                      {enrollment.enrolled_at
                        ? formatDate(enrollment.enrolled_at)
                        : formatDate(enrollment.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-slate-100">
            {filteredEnrollments.map((enrollment) => (
              <div key={enrollment.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-slate-900">{enrollment.student_name || 'Unknown'}</p>
                    <p className="text-xs text-slate-500">{enrollment.student_email}</p>
                  </div>
                  {getStatusBadge(enrollment.status)}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <p className="text-slate-700">{enrollment.class_name}</p>
                    <p className="text-xs text-slate-400">{enrollment.course_type_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">{formatCurrency(enrollment.amount_paid || 0)}</p>
                    {getPaymentMethodBadge(enrollment.payment?.payment_type)}
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-mono">{enrollment.enrollment_number || '-'}</span>
                  <span>
                    {enrollment.enrolled_at
                      ? formatDate(enrollment.enrolled_at)
                      : formatDate(enrollment.created_at)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50">
              <p className="text-sm text-slate-500">
                Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
              </p>
              <div className="flex gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={clsx(
                        'w-8 h-8 rounded-lg text-sm font-medium',
                        page === pageNum
                          ? 'bg-amber-500 text-white'
                          : 'hover:bg-slate-200 text-slate-600'
                      )}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 rounded-lg hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Manual Enrollment Modal */}
      {showManualModal && (
        <ManualEnrollmentModal
          onClose={() => setShowManualModal(false)}
          onSuccess={handleManualEnrollmentSuccess}
        />
      )}
    </div>
  );
}

export default AdminEnrollmentsPage;
