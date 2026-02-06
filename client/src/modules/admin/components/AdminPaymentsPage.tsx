// Admin Payments Management Page
// View all payments, analytics, record manual payments, and process refunds

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard,
  RefreshCw,
  Plus,
  X,
  AlertCircle,
  CheckCircle,
  DollarSign,
  TrendingUp,
  ArrowDownRight,
  RotateCcw,
  Eye,
  Calendar,
  Search,
  Download,
  IndianRupee,
  Receipt,
  Hash,
  User,
  Mail,
  Phone,
} from 'lucide-react';
import {
  Card,
  Button,
  Badge,
  SearchInput,
  EmptyState,
  Spinner,
  Skeleton,
  Pagination,
  Input,
  Select,
} from '@shared/components/ui';
import { Stagger, StaggerItem, fadeInUp } from '@shared/components/ui/motion';
import clsx from 'clsx';

// ============================================
// TYPES
// ============================================

interface Payment {
  id: string;
  payment_number: string;
  student_id: string;
  student_fee_id: string | null;
  amount: number;
  currency: string;
  payment_method: string;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  transaction_id: string | null;
  bank_name: string | null;
  bank_reference: string | null;
  cheque_number: string | null;
  cheque_date: string | null;
  cheque_bank: string | null;
  status: string;
  status_reason: string | null;
  refund_amount: number | null;
  refund_status: string | null;
  refund_reason: string | null;
  refunded_at: string | null;
  payer_name: string | null;
  payer_email: string | null;
  payer_phone: string | null;
  notes: string | null;
  initiated_at: string;
  completed_at: string | null;
  created_at: string;
}

interface Analytics {
  totalCollected: number;
  totalRefunded: number;
  paymentCount: number;
  avgPaymentAmount: number;
  paymentsByMethod: Record<string, number>;
  paymentsByStatus: Record<string, number>;
}

interface StudentSearchResult {
  id: string;
  student_id: string;
  user_id: string;
  users?: {
    first_name: string | null;
    last_name: string | null;
    email: string;
    phone: string | null;
  };
}

const API_URL = import.meta.env.VITE_API_URL || '/api';

const paymentStatuses = [
  { value: '', label: 'All Statuses' },
  { value: 'completed', label: 'Completed' },
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'failed', label: 'Failed' },
  { value: 'refunded', label: 'Refunded' },
  { value: 'cancelled', label: 'Cancelled' },
];

const paymentMethods = [
  { value: '', label: 'All Methods' },
  { value: 'razorpay', label: 'Razorpay' },
  { value: 'cash', label: 'Cash' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'upi', label: 'UPI' },
  { value: 'other', label: 'Other' },
];

const manualMethodOptions = [
  { value: 'cash', label: 'Cash' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'upi', label: 'UPI' },
  { value: 'other', label: 'Other' },
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

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'completed':
      return <Badge variant="success">Completed</Badge>;
    case 'pending':
      return <Badge variant="warning">Pending</Badge>;
    case 'processing':
      return <Badge variant="info">Processing</Badge>;
    case 'failed':
      return <Badge variant="danger">Failed</Badge>;
    case 'refunded':
      return <Badge variant="default">Refunded</Badge>;
    case 'cancelled':
      return <Badge variant="default">Cancelled</Badge>;
    default:
      return <Badge variant="default">{status}</Badge>;
  }
}

function getMethodLabel(method: string): string {
  const map: Record<string, string> = {
    razorpay: 'Razorpay',
    cash: 'Cash',
    cheque: 'Cheque',
    bank_transfer: 'Bank Transfer',
    upi: 'UPI',
    card: 'Card',
    wallet: 'Wallet',
    emi: 'EMI',
    other: 'Other',
  };
  return map[method] || method;
}

function getMethodBadge(method: string) {
  switch (method) {
    case 'razorpay':
      return <Badge variant="info">Razorpay</Badge>;
    case 'cash':
      return <Badge variant="success">Cash</Badge>;
    case 'cheque':
      return <Badge variant="warning">Cheque</Badge>;
    case 'bank_transfer':
      return <Badge variant="default">Bank Transfer</Badge>;
    case 'upi':
      return <Badge variant="info">UPI</Badge>;
    default:
      return <Badge variant="default">{getMethodLabel(method)}</Badge>;
  }
}

// ============================================
// MANUAL PAYMENT MODAL
// ============================================

interface ManualPaymentModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

function ManualPaymentModal({ onClose, onSuccess }: ManualPaymentModalProps) {
  const { getToken } = useAuth();

  // Student search
  const [studentSearch, setStudentSearch] = useState('');
  const [studentResults, setStudentResults] = useState<StudentSearchResult[]>([]);
  const [searchingStudents, setSearchingStudents] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentSearchResult | null>(null);

  // Payment fields
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [transactionId, setTransactionId] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankReference, setBankReference] = useState('');
  const [chequeNumber, setChequeNumber] = useState('');
  const [chequeDate, setChequeDate] = useState('');
  const [chequeBank, setChequeBank] = useState('');
  const [payerName, setPayerName] = useState('');
  const [payerEmail, setPayerEmail] = useState('');
  const [payerPhone, setPayerPhone] = useState('');
  const [notes, setNotes] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Search students
  useEffect(() => {
    if (studentSearch.length < 2) {
      setStudentResults([]);
      return;
    }

    const debounce = setTimeout(async () => {
      setSearchingStudents(true);
      try {
        const token = await getToken();
        const res = await fetch(
          `${API_URL}/v2/admin/students?search=${encodeURIComponent(studentSearch)}&limit=10`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await res.json();
        if (data.success) {
          setStudentResults(data.data?.items || []);
        }
      } catch (err) {
        console.error('Student search failed:', err);
      } finally {
        setSearchingStudents(false);
      }
    }, 400);

    return () => clearTimeout(debounce);
  }, [studentSearch]);

  // Auto-fill payer info when student selected
  useEffect(() => {
    if (selectedStudent?.users) {
      const u = selectedStudent.users;
      setPayerName([u.first_name, u.last_name].filter(Boolean).join(' '));
      setPayerEmail(u.email || '');
      setPayerPhone(u.phone || '');
    }
  }, [selectedStudent]);

  const handleSubmit = async () => {
    if (!selectedStudent) {
      setError('Please select a student');
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = await getToken();
      const body: Record<string, unknown> = {
        studentId: selectedStudent.id,
        amount: parseFloat(amount),
        paymentMethod,
        payerName: payerName || undefined,
        payerEmail: payerEmail || undefined,
        payerPhone: payerPhone || undefined,
        notes: notes || undefined,
      };

      if (transactionId) body.transactionId = transactionId;
      if (bankName) body.bankName = bankName;
      if (bankReference) body.bankReference = bankReference;
      if (chequeNumber) body.chequeNumber = chequeNumber;
      if (chequeDate) body.chequeDate = chequeDate;
      if (chequeBank) body.chequeBank = chequeBank;

      const res = await fetch(`${API_URL}/v2/payments/manual`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to record payment');
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <Plus className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-lg font-heading font-semibold text-slate-900">Record Manual Payment</h2>
                <p className="text-sm text-slate-500">Cash, cheque, bank transfer, or UPI</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[65vh] space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            {/* Student Search */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Student <span className="text-rose-500">*</span>
              </label>
              {selectedStudent ? (
                <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white text-sm font-semibold">
                    {(selectedStudent.users?.first_name || 'S').charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 text-sm">
                      {[selectedStudent.users?.first_name, selectedStudent.users?.last_name].filter(Boolean).join(' ') || 'Unknown'}
                    </p>
                    <p className="text-xs text-slate-500">{selectedStudent.student_id} | {selectedStudent.users?.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedStudent(null);
                      setStudentSearch('');
                    }}
                    className="p-1 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <Input
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    placeholder="Search by name, email, or student ID..."
                    leftIcon={<Search className="w-4 h-4" />}
                  />
                  {searchingStudents && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Spinner size="sm" />
                    </div>
                  )}
                  {studentResults.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {studentResults.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => {
                            setSelectedStudent(s);
                            setStudentResults([]);
                          }}
                          className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2 text-sm"
                        >
                          <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-xs font-semibold">
                            {(s.users?.first_name || 'S').charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">
                              {[s.users?.first_name, s.users?.last_name].filter(Boolean).join(' ') || 'Unknown'}
                            </p>
                            <p className="text-xs text-slate-500">{s.student_id} | {s.users?.email}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Amount & Method */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Amount (INR) <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  min="1"
                  leftIcon={<IndianRupee className="w-4 h-4" />}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Payment Method <span className="text-rose-500">*</span>
                </label>
                <Select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  options={manualMethodOptions}
                />
              </div>
            </div>

            {/* Method-specific fields */}
            {(paymentMethod === 'bank_transfer' || paymentMethod === 'upi') && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Transaction ID</label>
                  <Input
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder="Transaction reference"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Bank Name</label>
                  <Input
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="Bank name"
                  />
                </div>
              </div>
            )}

            {paymentMethod === 'cheque' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Cheque Number</label>
                    <Input
                      value={chequeNumber}
                      onChange={(e) => setChequeNumber(e.target.value)}
                      placeholder="Cheque number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Cheque Date</label>
                    <Input
                      type="date"
                      value={chequeDate}
                      onChange={(e) => setChequeDate(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Cheque Bank</label>
                  <Input
                    value={chequeBank}
                    onChange={(e) => setChequeBank(e.target.value)}
                    placeholder="Issuing bank name"
                  />
                </div>
              </div>
            )}

            {/* Payer Info */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Payer Name</label>
                <Input
                  value={payerName}
                  onChange={(e) => setPayerName(e.target.value)}
                  placeholder="Name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Payer Email</label>
                <Input
                  value={payerEmail}
                  onChange={(e) => setPayerEmail(e.target.value)}
                  placeholder="Email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Payer Phone</label>
                <Input
                  value={payerPhone}
                  onChange={(e) => setPayerPhone(e.target.value)}
                  placeholder="Phone"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional payment notes..."
                rows={2}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-100 flex justify-between">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={loading || !selectedStudent || !amount}
              leftIcon={loading ? <Spinner size="sm" /> : <CheckCircle className="w-4 h-4" />}
            >
              {loading ? 'Recording...' : 'Record Payment'}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ============================================
// REFUND MODAL
// ============================================

interface RefundModalProps {
  payment: Payment;
  onClose: () => void;
  onSuccess: () => void;
}

function RefundModal({ payment, onClose, onSuccess }: RefundModalProps) {
  const { getToken } = useAuth();
  const [amount, setAmount] = useState(payment.amount.toString());
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRefund = async () => {
    const refundAmount = parseFloat(amount);
    if (!refundAmount || refundAmount <= 0) {
      setError('Please enter a valid refund amount');
      return;
    }
    if (refundAmount > payment.amount) {
      setError('Refund amount cannot exceed payment amount');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/v2/payments/${payment.id}/refund`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: refundAmount,
          reason: reason || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to initiate refund');
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to initiate refund');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 bg-amber-50 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <RotateCcw className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-lg font-heading font-semibold text-slate-900">Process Refund</h2>
              <p className="text-sm text-slate-500">{payment.payment_number}</p>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="p-3 bg-slate-50 rounded-lg space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Original Amount</span>
                <span className="font-semibold text-slate-900">{formatCurrency(payment.amount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Method</span>
                <span className="text-slate-700">{getMethodLabel(payment.payment_method)}</span>
              </div>
              {payment.payer_name && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Payer</span>
                  <span className="text-slate-700">{payment.payer_name}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Refund Amount (INR) <span className="text-rose-500">*</span>
              </label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="1"
                max={payment.amount}
                leftIcon={<IndianRupee className="w-4 h-4" />}
              />
              <p className="text-xs text-slate-500 mt-1">
                Max: {formatCurrency(payment.amount)}
                {parseFloat(amount) < payment.amount && parseFloat(amount) > 0 && (
                  <span className="text-amber-600 ml-1">(Partial refund)</span>
                )}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Reason</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason for refund..."
                rows={2}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 resize-none"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
            <Button variant="ghost" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button
              onClick={handleRefund}
              disabled={loading || !amount}
              leftIcon={loading ? <Spinner size="sm" /> : <RotateCcw className="w-4 h-4" />}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              {loading ? 'Processing...' : 'Process Refund'}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ============================================
// PAYMENT DETAIL MODAL
// ============================================

interface PaymentDetailModalProps {
  payment: Payment;
  onClose: () => void;
}

function PaymentDetailModal({ payment, onClose }: PaymentDetailModalProps) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center">
                <Receipt className="w-5 h-5 text-sky-600" />
              </div>
              <div>
                <h2 className="text-lg font-heading font-semibold text-slate-900">Payment Details</h2>
                <p className="text-sm text-slate-500">{payment.payment_number}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Amount & Status */}
            <div className="text-center p-4 bg-slate-50 rounded-xl">
              <p className="text-3xl font-bold text-slate-900">{formatCurrency(payment.amount)}</p>
              <div className="flex items-center justify-center gap-2 mt-2">
                {getStatusBadge(payment.status)}
                {getMethodBadge(payment.payment_method)}
              </div>
            </div>

            {/* Details Grid */}
            <div className="space-y-3">
              <DetailRow label="Payment Number" value={payment.payment_number} />
              {payment.transaction_id && <DetailRow label="Transaction ID" value={payment.transaction_id} />}
              {payment.razorpay_payment_id && <DetailRow label="Razorpay ID" value={payment.razorpay_payment_id} />}
              {payment.payer_name && <DetailRow label="Payer Name" value={payment.payer_name} />}
              {payment.payer_email && <DetailRow label="Payer Email" value={payment.payer_email} />}
              {payment.payer_phone && <DetailRow label="Payer Phone" value={payment.payer_phone} />}
              {payment.bank_name && <DetailRow label="Bank" value={payment.bank_name} />}
              {payment.bank_reference && <DetailRow label="Bank Reference" value={payment.bank_reference} />}
              {payment.cheque_number && <DetailRow label="Cheque No." value={payment.cheque_number} />}
              {payment.cheque_date && <DetailRow label="Cheque Date" value={formatDate(payment.cheque_date)} />}
              {payment.cheque_bank && <DetailRow label="Cheque Bank" value={payment.cheque_bank} />}
              <DetailRow label="Created" value={formatDateTime(payment.created_at)} />
              {payment.completed_at && <DetailRow label="Completed" value={formatDateTime(payment.completed_at)} />}
              {payment.notes && <DetailRow label="Notes" value={payment.notes} />}

              {/* Refund Info */}
              {payment.refund_amount && (
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Refund Information</p>
                  <DetailRow label="Refund Amount" value={formatCurrency(payment.refund_amount)} />
                  {payment.refund_status && <DetailRow label="Refund Status" value={payment.refund_status} />}
                  {payment.refund_reason && <DetailRow label="Reason" value={payment.refund_reason} />}
                  {payment.refunded_at && <DetailRow label="Refunded At" value={formatDateTime(payment.refunded_at)} />}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-100 flex justify-end">
            <Button variant="ghost" onClick={onClose}>Close</Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start text-sm">
      <span className="text-slate-500 shrink-0">{label}</span>
      <span className="text-slate-900 text-right ml-3 break-all">{value}</span>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function AdminPaymentsPage() {
  const { getToken } = useAuth();

  // Data state
  const [payments, setPayments] = useState<Payment[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 20;

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');

  // Modal state
  const [showManualModal, setShowManualModal] = useState(false);
  const [refundPayment, setRefundPayment] = useState<Payment | null>(null);
  const [viewPayment, setViewPayment] = useState<Payment | null>(null);

  // Fetch payments
  const fetchPayments = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    else setRefreshing(true);

    try {
      const token = await getToken();
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (statusFilter) params.append('status', statusFilter);
      if (methodFilter) params.append('paymentMethod', methodFilter);

      const res = await fetch(`${API_URL}/v2/payments?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (data.success) {
        const items = data.data?.items || [];
        setPayments(Array.isArray(items) ? items : []);
        setTotalPages(data.data?.totalPages || 1);
        setTotalItems(data.data?.total || 0);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch analytics
  const fetchAnalytics = async () => {
    setLoadingAnalytics(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/v2/payments/analytics`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (data.success) {
        setAnalytics(data.data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [page, statusFilter, methodFilter]);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleRefresh = () => {
    fetchPayments(false);
    fetchAnalytics();
  };

  const handleManualSuccess = () => {
    setShowManualModal(false);
    fetchPayments(false);
    fetchAnalytics();
  };

  const handleRefundSuccess = () => {
    setRefundPayment(null);
    fetchPayments(false);
    fetchAnalytics();
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
          <h1 className="text-2xl font-heading font-semibold text-slate-900 flex items-center gap-2">
            <CreditCard className="w-7 h-7 text-emerald-600" />
            Payments
          </h1>
          <p className="text-slate-500 mt-1">
            Track and manage all payment transactions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            onClick={() => setShowManualModal(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Record Payment
          </Button>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
            leftIcon={
              refreshing ? (
                <Spinner size="sm" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )
            }
          >
            Refresh
          </Button>
        </div>
      </motion.div>

      {/* Analytics Cards */}
      <Stagger className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StaggerItem>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <IndianRupee className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-900">
                  {loadingAnalytics ? '--' : formatCurrency(analytics?.totalCollected || 0)}
                </p>
                <p className="text-xs text-slate-500">Total Collected</p>
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
                <p className="text-2xl font-semibold text-slate-900">
                  {loadingAnalytics ? '--' : (analytics?.paymentCount || 0)}
                </p>
                <p className="text-xs text-slate-500">Total Payments</p>
              </div>
            </div>
          </Card>
        </StaggerItem>
        <StaggerItem>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-900">
                  {loadingAnalytics ? '--' : formatCurrency(analytics?.avgPaymentAmount || 0)}
                </p>
                <p className="text-xs text-slate-500">Avg Payment</p>
              </div>
            </div>
          </Card>
        </StaggerItem>
        <StaggerItem>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <RotateCcw className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-900">
                  {loadingAnalytics ? '--' : formatCurrency(analytics?.totalRefunded || 0)}
                </p>
                <p className="text-xs text-slate-500">Total Refunded</p>
              </div>
            </div>
          </Card>
        </StaggerItem>
      </Stagger>

      {/* Payment Method Breakdown */}
      {analytics && Object.keys(analytics.paymentsByMethod).length > 0 && (
        <Card className="p-4">
          <h3 className="text-sm font-medium text-slate-700 mb-3">Payments by Method</h3>
          <div className="flex flex-wrap gap-3">
            {Object.entries(analytics.paymentsByMethod).map(([method, count]) => (
              <div key={method} className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg">
                {getMethodBadge(method)}
                <span className="text-sm font-medium text-slate-700">{count}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="w-full sm:w-48">
            <Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              options={paymentStatuses}
            />
          </div>
          <div className="w-full sm:w-48">
            <Select
              value={methodFilter}
              onChange={(e) => {
                setMethodFilter(e.target.value);
                setPage(1);
              }}
              options={paymentMethods}
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
                <Skeleton className="w-12 h-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-56" />
                </div>
                <Skeleton className="h-6 w-20" />
              </div>
            ))}
          </div>
        ) : !Array.isArray(payments) || payments.length === 0 ? (
          <EmptyState
            variant="search"
            title="No payments found"
            description={statusFilter || methodFilter ? 'Try adjusting your filters.' : 'No payment transactions yet.'}
            icon={<CreditCard className="w-12 h-12" />}
          />
        ) : (
          <>
            <div className="divide-y divide-slate-100">
              {payments.map((payment, index) => (
                <motion.div
                  key={payment.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="p-5 hover:bg-slate-50/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {/* Icon */}
                    <div className={clsx(
                      'w-11 h-11 rounded-full flex items-center justify-center shrink-0',
                      payment.status === 'completed' ? 'bg-emerald-100' :
                      payment.status === 'refunded' ? 'bg-amber-100' :
                      payment.status === 'failed' ? 'bg-rose-100' :
                      'bg-slate-100'
                    )}>
                      {payment.status === 'refunded' ? (
                        <RotateCcw className={clsx('w-5 h-5', 'text-amber-600')} />
                      ) : (
                        <IndianRupee className={clsx(
                          'w-5 h-5',
                          payment.status === 'completed' ? 'text-emerald-600' :
                          payment.status === 'failed' ? 'text-rose-600' :
                          'text-slate-500'
                        )} />
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="font-semibold text-slate-900">{formatCurrency(payment.amount)}</p>
                        {getStatusBadge(payment.status)}
                        {getMethodBadge(payment.payment_method)}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <Hash className="w-3.5 h-3.5" />
                          {payment.payment_number}
                        </span>
                        {payment.payer_name && (
                          <span className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5" />
                            {payment.payer_name}
                          </span>
                        )}
                        {payment.payer_email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3.5 h-3.5" />
                            {payment.payer_email}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDateTime(payment.created_at)}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        title="View Details"
                        onClick={() => setViewPayment(payment)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {payment.status === 'completed' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Refund"
                          onClick={() => setRefundPayment(payment)}
                          className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-4 py-3 border-t border-slate-100">
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  pageSize={limit}
                  onPageChange={setPage}
                />
              </div>
            )}
          </>
        )}
      </Card>

      {/* Modals */}
      {showManualModal && (
        <ManualPaymentModal
          onClose={() => setShowManualModal(false)}
          onSuccess={handleManualSuccess}
        />
      )}

      {refundPayment && (
        <RefundModal
          payment={refundPayment}
          onClose={() => setRefundPayment(null)}
          onSuccess={handleRefundSuccess}
        />
      )}

      {viewPayment && (
        <PaymentDetailModal
          payment={viewPayment}
          onClose={() => setViewPayment(null)}
        />
      )}
    </div>
  );
}

export default AdminPaymentsPage;
