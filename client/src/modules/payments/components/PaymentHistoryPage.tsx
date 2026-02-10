// Payment History Page
// View all payment transactions

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { motion } from 'framer-motion';
import {
  Receipt,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  RefreshCw,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import {
  Card,
  Button,
  Badge,
  SearchInput,
  Select,
  Pagination,
  EmptyState,
  Skeleton,
} from '@shared/components/ui';
import { Stagger, StaggerItem, fadeInUp } from '@shared/components/ui/motion';
import clsx from 'clsx';

// ============================================
// TYPES
// ============================================

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'cancelled';
  payment_method: string;
  razorpay_payment_id: string;
  razorpay_order_id: string;
  created_at: string;
  completed_at: string | null;
  fee?: {
    id: string;
    fee_type: string;
    description: string;
  };
}

interface PaymentSummary {
  totalPaid: number;
  totalPending: number;
  totalRefunded: number;
  paymentCount: number;
}

const API_URL = import.meta.env.VITE_API_URL || '/api';

// ============================================
// STATUS CONFIG
// ============================================

const statusConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'default'; icon: typeof CheckCircle }> = {
  pending: { label: 'Pending', variant: 'warning', icon: Clock },
  processing: { label: 'Processing', variant: 'info', icon: Clock },
  completed: { label: 'Completed', variant: 'success', icon: CheckCircle },
  failed: { label: 'Failed', variant: 'danger', icon: XCircle },
  refunded: { label: 'Refunded', variant: 'default', icon: RefreshCw },
  cancelled: { label: 'Cancelled', variant: 'default', icon: XCircle },
};

// ============================================
// MAIN COMPONENT
// ============================================

export function PaymentHistoryPage() {
  const { getToken } = useAuth();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [dateRange, setDateRange] = useState('all');

  // Fetch payments
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = await getToken();

        // Fetch payments
        const params = new URLSearchParams({
          page: page.toString(),
          limit: '10',
          ...(status && { status }),
        });

        const paymentsRes = await fetch(`${API_URL}/v2/payments/my-payments?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (paymentsRes.ok) {
          const data = await paymentsRes.json();
          setPayments(data.data.items || []);
          setTotalPages(data.data.totalPages || 1);
          setTotalItems(data.data.total || 0);
        }

        // Fetch summary
        const summaryRes = await fetch(`${API_URL}/v2/payments/my-summary`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (summaryRes.ok) {
          const summaryData = await summaryRes.json();
          setSummary(summaryData.data);
        }
      } catch (error) {
        console.error('Error fetching payments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [page, status, getToken]);

  // Format currency
  const formatCurrency = (amount: number, currency = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <motion.div
        variants={fadeInUp}
        initial="initial"
        animate="animate"
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-heading font-semibold text-slate-900">
            Payment History
          </h1>
          <p className="text-slate-500">View all your payment transactions</p>
        </div>
        <Button variant="outline" leftIcon={<Download className="w-4 h-4" />}>
          Export
        </Button>
      </motion.div>

      {/* Summary Cards */}
      <Stagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StaggerItem>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xl font-semibold text-slate-900">
                  {loading ? '--' : formatCurrency(summary?.totalPaid || 0)}
                </p>
                <p className="text-xs text-slate-500">Total Paid</p>
              </div>
            </div>
          </Card>
        </StaggerItem>
        <StaggerItem>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xl font-semibold text-slate-900">
                  {loading ? '--' : formatCurrency(summary?.totalPending || 0)}
                </p>
                <p className="text-xs text-slate-500">Pending</p>
              </div>
            </div>
          </Card>
        </StaggerItem>
        <StaggerItem>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                <RefreshCw className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <p className="text-xl font-semibold text-slate-900">
                  {loading ? '--' : formatCurrency(summary?.totalRefunded || 0)}
                </p>
                <p className="text-xs text-slate-500">Refunded</p>
              </div>
            </div>
          </Card>
        </StaggerItem>
        <StaggerItem>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center">
                <Receipt className="w-5 h-5 text-sky-600" />
              </div>
              <div>
                <p className="text-xl font-semibold text-slate-900">
                  {loading ? '--' : summary?.paymentCount || 0}
                </p>
                <p className="text-xs text-slate-500">Transactions</p>
              </div>
            </div>
          </Card>
        </StaggerItem>
      </Stagger>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1 max-w-sm">
            <SearchInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by transaction ID..."
            />
          </div>
          <div className="flex items-center gap-3">
            <Select
              options={[
                { value: '', label: 'All Status' },
                { value: 'completed', label: 'Completed' },
                { value: 'pending', label: 'Pending' },
                { value: 'failed', label: 'Failed' },
                { value: 'refunded', label: 'Refunded' },
              ]}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-36"
            />
            <Select
              options={[
                { value: 'all', label: 'All Time' },
                { value: '7d', label: 'Last 7 Days' },
                { value: '30d', label: 'Last 30 Days' },
                { value: '90d', label: 'Last 90 Days' },
              ]}
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-36"
            />
          </div>
        </div>
      </Card>

      {/* Payments List */}
      <Card noPadding>
        {loading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="w-12 h-12 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-8 w-24" />
              </div>
            ))}
          </div>
        ) : payments.length === 0 ? (
          <EmptyState
            variant="inbox"
            title="No payments found"
            description="Your payment transactions will appear here."
          />
        ) : (
          <>
            <div className="divide-y divide-slate-100">
              {payments.map((payment, index) => {
                const config = statusConfig[payment.status] || statusConfig.pending;
                const StatusIcon = config.icon;

                return (
                  <motion.div
                    key={payment.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-5 hover:bg-slate-50/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      {/* Icon */}
                      <div className={clsx(
                        'w-12 h-12 rounded-xl flex items-center justify-center shrink-0',
                        payment.status === 'completed' ? 'bg-emerald-100' :
                        payment.status === 'failed' ? 'bg-rose-100' :
                        payment.status === 'pending' ? 'bg-amber-100' :
                        'bg-slate-100'
                      )}>
                        <StatusIcon className={clsx(
                          'w-6 h-6',
                          payment.status === 'completed' ? 'text-emerald-600' :
                          payment.status === 'failed' ? 'text-rose-600' :
                          payment.status === 'pending' ? 'text-amber-600' :
                          'text-slate-600'
                        )} />
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900">
                          {payment.fee?.description || payment.fee?.fee_type || 'Payment'}
                        </p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-slate-500 font-mono">
                            {payment.razorpay_payment_id || `#${payment.id.slice(0, 8)}`}
                          </span>
                          <span className="text-xs text-slate-400">
                            {format(parseISO(payment.created_at), 'MMM dd, yyyy HH:mm')}
                          </span>
                        </div>
                      </div>

                      {/* Amount */}
                      <div className="text-right">
                        <p className="font-semibold text-slate-900">
                          {formatCurrency(payment.amount, payment.currency)}
                        </p>
                        <p className="text-xs text-slate-500 capitalize">
                          {payment.payment_method || 'Online'}
                        </p>
                      </div>

                      {/* Status */}
                      <Badge variant={config.variant} dot>
                        {config.label}
                      </Badge>

                      {/* Actions */}
                      <Button variant="ghost" size="sm" leftIcon={<Download className="w-4 h-4" />}>
                        Receipt
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Pagination */}
            <div className="px-4 py-3 border-t border-slate-100">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={totalItems}
                pageSize={10}
                onPageChange={setPage}
              />
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

export default PaymentHistoryPage;
