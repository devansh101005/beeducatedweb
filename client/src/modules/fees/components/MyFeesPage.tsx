// My Fees Page
// Student view for their own fees and payment history

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { motion } from 'framer-motion';
import {
  Receipt,
  IndianRupee,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  FileText,
  ChevronRight,
  ArrowUpRight,
} from 'lucide-react';
import { format, parseISO, isBefore, addDays } from 'date-fns';
import {
  Card,
  Button,
  Badge,
  StatCard,
  EmptyState,
  Skeleton,
} from '@shared/components/ui';
import { Stagger, StaggerItem, fadeInUp } from '@shared/components/ui/motion';
import clsx from 'clsx';

// ============================================
// TYPES
// ============================================

interface StudentFee {
  id: string;
  fee_type: string;
  description: string;
  base_amount: number;
  discount_amount: number;
  tax_amount: number;
  late_fee_amount: number;
  total_amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  status: 'pending' | 'partial' | 'paid' | 'overdue' | 'cancelled' | 'refunded';
  due_date: string;
  academic_year: string;
  academic_term: string;
  created_at: string;
}

interface FeeSummary {
  totalDue: number;
  totalPaid: number;
  upcomingDue: number;
  overdueAmount: number;
  nextDueDate: string | null;
}

const API_URL = import.meta.env.VITE_API_URL || '/api';

// ============================================
// STATUS CONFIG
// ============================================

const statusConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'default'; icon: typeof CheckCircle }> = {
  pending: { label: 'Pending', variant: 'warning', icon: Clock },
  partial: { label: 'Partially Paid', variant: 'info', icon: Clock },
  paid: { label: 'Paid', variant: 'success', icon: CheckCircle },
  overdue: { label: 'Overdue', variant: 'danger', icon: AlertTriangle },
  cancelled: { label: 'Cancelled', variant: 'default', icon: Clock },
  refunded: { label: 'Refunded', variant: 'default', icon: Clock },
};

const feeTypeLabels: Record<string, string> = {
  tuition: 'Tuition Fee',
  admission: 'Admission Fee',
  exam: 'Exam Fee',
  material: 'Study Material',
  library: 'Library Fee',
  lab: 'Lab Fee',
  transport: 'Transport Fee',
  hostel: 'Hostel Fee',
  other: 'Other Charges',
};

// ============================================
// MAIN COMPONENT
// ============================================

export function MyFeesPage() {
  const { getToken } = useAuth();
  const [fees, setFees] = useState<StudentFee[]>([]);
  const [summary, setSummary] = useState<FeeSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'paid' | 'all'>('pending');

  // Fetch fees
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = await getToken();

        // Fetch fees
        const feesRes = await fetch(`${API_URL}/v2/fees/my-fees`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (feesRes.ok) {
          const feesData = await feesRes.json();
          setFees(feesData.data.items || []);
        }

        // Fetch summary
        const summaryRes = await fetch(`${API_URL}/v2/fees/my-summary`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (summaryRes.ok) {
          const summaryData = await summaryRes.json();
          setSummary(summaryData.data);
        }
      } catch (error) {
        console.error('Error fetching fees:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [getToken]);

  // Format currency
  const formatCurrency = (amount: number, currency = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Filter fees based on active tab
  const filteredFees = fees.filter(fee => {
    if (activeTab === 'pending') return ['pending', 'partial', 'overdue'].includes(fee.status);
    if (activeTab === 'paid') return fee.status === 'paid';
    return true;
  });

  // Get overdue fees
  const overdueFees = fees.filter(fee => fee.status === 'overdue');
  const pendingFees = fees.filter(fee => ['pending', 'partial'].includes(fee.status));

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="p-5">
              <Skeleton className="w-12 h-12 rounded-xl mb-4" />
              <Skeleton className="h-8 w-24 mb-2" />
              <Skeleton className="h-4 w-16" />
            </Card>
          ))}
        </div>
        <Card className="p-5">
          <Skeleton className="h-6 w-40 mb-4" />
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <motion.div
        variants={fadeInUp}
        initial="initial"
        animate="animate"
      >
        <h1 className="text-2xl font-heading font-semibold text-slate-900 mb-1">
          Fees & Payments
        </h1>
        <p className="text-slate-500">View your fee details and make payments</p>
      </motion.div>

      {/* Summary Cards */}
      <Stagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StaggerItem>
          <StatCard
            title="Total Due"
            value={formatCurrency(summary?.totalDue || 0)}
            icon={<IndianRupee className="w-6 h-6" />}
            iconColor="amber"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            title="Total Paid"
            value={formatCurrency(summary?.totalPaid || 0)}
            icon={<CheckCircle className="w-6 h-6" />}
            iconColor="emerald"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            title="Upcoming Due"
            value={formatCurrency(summary?.upcomingDue || 0)}
            icon={<Calendar className="w-6 h-6" />}
            iconColor="sky"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            title="Overdue"
            value={formatCurrency(summary?.overdueAmount || 0)}
            icon={<AlertTriangle className="w-6 h-6" />}
            iconColor="rose"
          />
        </StaggerItem>
      </Stagger>

      {/* Overdue Alert */}
      {overdueFees.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-rose-50 border border-rose-200 rounded-2xl p-4"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-rose-800">
                You have {overdueFees.length} overdue payment{overdueFees.length > 1 ? 's' : ''}
              </h3>
              <p className="text-sm text-rose-600 mt-0.5">
                Total overdue amount: {formatCurrency(overdueFees.reduce((sum, f) => sum + f.amount_due, 0))}
              </p>
            </div>
            <Button variant="danger" size="sm">
              Pay Now
            </Button>
          </div>
        </motion.div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl w-fit">
        {(['pending', 'paid', 'all'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={clsx(
              'px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200',
              activeTab === tab
                ? 'bg-white text-slate-900 shadow-soft-sm'
                : 'text-slate-600 hover:text-slate-900'
            )}
          >
            {tab === 'pending' ? 'Pending' : tab === 'paid' ? 'Paid' : 'All Fees'}
            {tab === 'pending' && pendingFees.length > 0 && (
              <span className="ml-2 px-1.5 py-0.5 text-xs bg-amber-100 text-amber-700 rounded-full">
                {pendingFees.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Fee List */}
      <Card noPadding>
        {filteredFees.length === 0 ? (
          <EmptyState
            variant="inbox"
            title={activeTab === 'pending' ? 'No pending fees' : activeTab === 'paid' ? 'No paid fees' : 'No fees found'}
            description={
              activeTab === 'pending'
                ? 'Great! You have no pending payments at the moment.'
                : 'Your fee records will appear here.'
            }
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredFees.map((fee, index) => {
              const config = statusConfig[fee.status] || statusConfig.pending;
              const dueDate = parseISO(fee.due_date);
              const isOverdue = isBefore(dueDate, new Date()) && fee.status !== 'paid';
              const isDueSoon = !isOverdue && isBefore(dueDate, addDays(new Date(), 7));

              return (
                <motion.div
                  key={fee.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-5 hover:bg-slate-50/50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={clsx(
                      'w-12 h-12 rounded-xl flex items-center justify-center shrink-0',
                      fee.status === 'paid' ? 'bg-emerald-100' :
                      fee.status === 'overdue' ? 'bg-rose-100' :
                      'bg-amber-100'
                    )}>
                      <Receipt className={clsx(
                        'w-6 h-6',
                        fee.status === 'paid' ? 'text-emerald-600' :
                        fee.status === 'overdue' ? 'text-rose-600' :
                        'text-amber-600'
                      )} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-medium text-slate-900">
                            {feeTypeLabels[fee.fee_type] || fee.fee_type}
                          </h3>
                          {fee.description && (
                            <p className="text-sm text-slate-500 mt-0.5">{fee.description}</p>
                          )}
                          <div className="flex items-center gap-3 mt-2">
                            <Badge variant={config.variant} dot size="sm">
                              {config.label}
                            </Badge>
                            <span className="text-xs text-slate-400">
                              {fee.academic_year} - {fee.academic_term}
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <p className="text-lg font-semibold text-slate-900">
                            {formatCurrency(fee.amount_due > 0 ? fee.amount_due : fee.total_amount)}
                          </p>
                          {fee.amount_paid > 0 && fee.amount_due > 0 && (
                            <p className="text-xs text-slate-500">
                              of {formatCurrency(fee.total_amount)}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1.5 text-sm">
                            <Calendar className={clsx(
                              'w-4 h-4',
                              isOverdue ? 'text-rose-500' : isDueSoon ? 'text-orange-500' : 'text-slate-400'
                            )} />
                            <span className={clsx(
                              isOverdue ? 'text-rose-600 font-medium' :
                              isDueSoon ? 'text-orange-600' : 'text-slate-600'
                            )}>
                              Due: {format(dueDate, 'MMM dd, yyyy')}
                            </span>
                          </div>
                          {fee.discount_amount > 0 && (
                            <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                              Discount: {formatCurrency(fee.discount_amount)}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {fee.status !== 'paid' && fee.status !== 'cancelled' && (
                            <Link to={`/dashboard/fees/${fee.id}/pay`}>
                              <Button variant="primary" size="sm" rightIcon={<ArrowUpRight className="w-4 h-4" />}>
                                Pay Now
                              </Button>
                            </Link>
                          )}
                          <Button variant="ghost" size="sm" leftIcon={<FileText className="w-4 h-4" />}>
                            Receipt
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Payment History Link */}
      <Card className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-slate-900">Payment History</h3>
            <p className="text-sm text-slate-500">View all your past transactions</p>
          </div>
          <Link to="/dashboard/payments/history">
            <Button variant="outline" rightIcon={<ChevronRight className="w-4 h-4" />}>
              View History
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}

export default MyFeesPage;
