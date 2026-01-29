// Fee List Page
// Admin view for managing all student fees

import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Receipt,
  Plus,
  Search,
  Filter,
  Download,
  Calendar,
  User,
  IndianRupee,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ChevronDown,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Send,
  RefreshCw,
} from 'lucide-react';
import { format, parseISO, isAfter, isBefore, addDays } from 'date-fns';
import {
  Card,
  Button,
  IconButton,
  Badge,
  SearchInput,
  Select,
  Table,
  Pagination,
  Avatar,
  EmptyState,
  Spinner,
  SkeletonTable,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from '@shared/components/ui';
import { Stagger, StaggerItem, fadeInUp } from '@shared/components/ui/motion';
import clsx from 'clsx';

// ============================================
// TYPES
// ============================================

interface StudentFee {
  id: string;
  student_id: string;
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
  student?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    student_id: string;
  };
}

interface FeeSummary {
  totalFees: number;
  totalCollected: number;
  totalPending: number;
  totalOverdue: number;
  overdueCount: number;
}

const API_URL = import.meta.env.VITE_API_URL || '/api';

// ============================================
// STATUS CONFIG
// ============================================

const statusConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'default' }> = {
  pending: { label: 'Pending', variant: 'warning' },
  partial: { label: 'Partial', variant: 'info' },
  paid: { label: 'Paid', variant: 'success' },
  overdue: { label: 'Overdue', variant: 'danger' },
  cancelled: { label: 'Cancelled', variant: 'default' },
  refunded: { label: 'Refunded', variant: 'default' },
};

const feeTypeConfig: Record<string, string> = {
  tuition: 'Tuition Fee',
  admission: 'Admission Fee',
  exam: 'Exam Fee',
  material: 'Material Fee',
  library: 'Library Fee',
  lab: 'Lab Fee',
  transport: 'Transport Fee',
  hostel: 'Hostel Fee',
  other: 'Other',
};

// ============================================
// MAIN COMPONENT
// ============================================

export function FeeListPage() {
  const { getToken } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [fees, setFees] = useState<StudentFee[]>([]);
  const [summary, setSummary] = useState<FeeSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedFees, setSelectedFees] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [feeToDelete, setFeeToDelete] = useState<StudentFee | null>(null);

  // Filters
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [feeType, setFeeType] = useState(searchParams.get('feeType') || '');
  const [overdue, setOverdue] = useState(searchParams.get('overdue') === 'true');

  // Fetch fees
  const fetchFees = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(search && { search }),
        ...(status && { status }),
        ...(feeType && { feeType }),
        ...(overdue && { overdue: 'true' }),
      });

      const response = await fetch(`${API_URL}/v2/fees?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setFees(data.data.items || []);
        setTotalPages(data.data.totalPages || 1);
        setTotalItems(data.data.total || 0);
      }
    } catch (error) {
      console.error('Error fetching fees:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch summary
  const fetchSummary = async () => {
    try {
      const token = await getToken();
      // Note: We'd need a summary endpoint on the backend
      // For now, using placeholder data
      setSummary({
        totalFees: 1250000,
        totalCollected: 850000,
        totalPending: 300000,
        totalOverdue: 100000,
        overdueCount: 15,
      });
    } catch (error) {
      console.error('Error fetching summary:', error);
    }
  };

  useEffect(() => {
    fetchFees();
  }, [page, status, feeType, overdue]);

  useEffect(() => {
    fetchSummary();
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (page === 1) {
        fetchFees();
      } else {
        setPage(1);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Delete fee
  const handleDelete = async () => {
    if (!feeToDelete) return;

    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/v2/fees/${feeToDelete.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setFees(fees.filter(f => f.id !== feeToDelete.id));
        setDeleteModalOpen(false);
        setFeeToDelete(null);
      }
    } catch (error) {
      console.error('Error deleting fee:', error);
    }
  };

  // Format currency
  const formatCurrency = (amount: number, currency = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Table columns
  const columns = [
    {
      key: 'student',
      header: 'Student',
      accessor: (row: StudentFee) => (
        <div className="flex items-center gap-3">
          <Avatar
            name={`${row.student?.first_name || ''} ${row.student?.last_name || ''}`}
            size="sm"
          />
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">
              {row.student?.first_name} {row.student?.last_name}
            </p>
            <p className="text-xs text-slate-500">{row.student?.student_id}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Fee Type',
      accessor: (row: StudentFee) => (
        <div>
          <p className="text-sm font-medium text-slate-900">
            {feeTypeConfig[row.fee_type] || row.fee_type}
          </p>
          {row.description && (
            <p className="text-xs text-slate-500 truncate max-w-[200px]">{row.description}</p>
          )}
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      accessor: (row: StudentFee) => (
        <div>
          <p className="text-sm font-semibold text-slate-900">
            {formatCurrency(row.total_amount, row.currency)}
          </p>
          {row.amount_paid > 0 && row.amount_due > 0 && (
            <p className="text-xs text-slate-500">
              Paid: {formatCurrency(row.amount_paid)}
            </p>
          )}
        </div>
      ),
      align: 'right' as const,
    },
    {
      key: 'due',
      header: 'Due Date',
      accessor: (row: StudentFee) => {
        const dueDate = parseISO(row.due_date);
        const isOverdue = isBefore(dueDate, new Date()) && row.status !== 'paid';
        const isDueSoon = !isOverdue && isBefore(dueDate, addDays(new Date(), 7));

        return (
          <div className="flex items-center gap-2">
            <Calendar className={clsx(
              'w-4 h-4',
              isOverdue ? 'text-rose-500' : isDueSoon ? 'text-orange-500' : 'text-slate-400'
            )} />
            <span className={clsx(
              'text-sm',
              isOverdue ? 'text-rose-600 font-medium' : isDueSoon ? 'text-orange-600' : 'text-slate-600'
            )}>
              {format(dueDate, 'MMM dd, yyyy')}
            </span>
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (row: StudentFee) => {
        const config = statusConfig[row.status] || statusConfig.pending;
        return (
          <Badge variant={config.variant} dot>
            {config.label}
          </Badge>
        );
      },
    },
    {
      key: 'actions',
      header: '',
      accessor: (row: StudentFee) => (
        <div className="flex items-center gap-1 justify-end">
          <IconButton
            icon={<Eye className="w-4 h-4" />}
            aria-label="View details"
            variant="ghost"
            size="sm"
            onClick={() => {}}
          />
          <IconButton
            icon={<Edit className="w-4 h-4" />}
            aria-label="Edit fee"
            variant="ghost"
            size="sm"
            onClick={() => {}}
          />
          <IconButton
            icon={<Trash2 className="w-4 h-4" />}
            aria-label="Delete fee"
            variant="ghost"
            size="sm"
            onClick={() => {
              setFeeToDelete(row);
              setDeleteModalOpen(true);
            }}
          />
        </div>
      ),
      width: '120px',
    },
  ];

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
          <h1 className="text-2xl font-heading font-semibold text-slate-900">Fee Management</h1>
          <p className="text-slate-500">Manage student fees, invoices, and payments</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" leftIcon={<Download className="w-4 h-4" />}>
            Export
          </Button>
          <Link to="/dashboard/fees/create">
            <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
              Create Fee
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <Stagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StaggerItem>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                <IndianRupee className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-900">
                  {summary ? formatCurrency(summary.totalFees) : '--'}
                </p>
                <p className="text-xs text-slate-500">Total Fees</p>
              </div>
            </div>
          </Card>
        </StaggerItem>
        <StaggerItem>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-emerald-600">
                  {summary ? formatCurrency(summary.totalCollected) : '--'}
                </p>
                <p className="text-xs text-slate-500">Collected</p>
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
                <p className="text-2xl font-semibold text-amber-600">
                  {summary ? formatCurrency(summary.totalPending) : '--'}
                </p>
                <p className="text-xs text-slate-500">Pending</p>
              </div>
            </div>
          </Card>
        </StaggerItem>
        <StaggerItem>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-rose-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-rose-600">
                  {summary ? formatCurrency(summary.totalOverdue) : '--'}
                </p>
                <p className="text-xs text-slate-500">Overdue ({summary?.overdueCount || 0})</p>
              </div>
            </div>
          </Card>
        </StaggerItem>
      </Stagger>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {/* Search */}
          <div className="flex-1 max-w-sm">
            <SearchInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by student name or ID..."
            />
          </div>

          {/* Filter toggles */}
          <div className="flex items-center gap-3 flex-wrap">
            <Select
              options={[
                { value: '', label: 'All Status' },
                { value: 'pending', label: 'Pending' },
                { value: 'partial', label: 'Partially Paid' },
                { value: 'paid', label: 'Paid' },
                { value: 'overdue', label: 'Overdue' },
                { value: 'cancelled', label: 'Cancelled' },
              ]}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-40"
            />

            <Select
              options={[
                { value: '', label: 'All Types' },
                { value: 'tuition', label: 'Tuition' },
                { value: 'admission', label: 'Admission' },
                { value: 'exam', label: 'Exam' },
                { value: 'material', label: 'Material' },
                { value: 'other', label: 'Other' },
              ]}
              value={feeType}
              onChange={(e) => setFeeType(e.target.value)}
              className="w-40"
            />

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={overdue}
                onChange={(e) => setOverdue(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500"
              />
              <span className="text-sm text-slate-600">Overdue only</span>
            </label>

            <Button
              variant="ghost"
              size="sm"
              leftIcon={<RefreshCw className="w-4 h-4" />}
              onClick={fetchFees}
            >
              Refresh
            </Button>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card noPadding>
        {loading ? (
          <div className="p-4">
            <SkeletonTable rows={10} columns={6} />
          </div>
        ) : fees.length === 0 ? (
          <EmptyState
            variant="inbox"
            title="No fees found"
            description="No fees match your current filters. Try adjusting your search criteria."
            action={{
              label: 'Create Fee',
              onClick: () => {},
            }}
          />
        ) : (
          <>
            <Table
              data={fees}
              columns={columns}
              keyExtractor={(row) => row.id}
              onRowClick={(row) => {}}
              selectedRows={selectedFees}
              onSelectionChange={setSelectedFees}
            />
            <div className="px-4 py-3 border-t border-slate-100">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={totalItems}
                pageSize={20}
                onPageChange={setPage}
              />
            </div>
          </>
        )}
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} size="sm">
        <ModalHeader title="Delete Fee" onClose={() => setDeleteModalOpen(false)} />
        <ModalBody>
          <p className="text-slate-600">
            Are you sure you want to delete this fee? This action cannot be undone.
          </p>
          {feeToDelete && (
            <div className="mt-4 p-3 bg-slate-50 rounded-xl">
              <p className="text-sm font-medium text-slate-900">
                {feeTypeConfig[feeToDelete.fee_type] || feeToDelete.fee_type}
              </p>
              <p className="text-sm text-slate-500">
                {formatCurrency(feeToDelete.total_amount)} - {feeToDelete.student?.first_name} {feeToDelete.student?.last_name}
              </p>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setDeleteModalOpen(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Delete Fee
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}

export default FeeListPage;
