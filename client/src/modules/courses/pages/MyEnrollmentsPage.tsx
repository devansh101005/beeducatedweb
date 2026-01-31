import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  GraduationCap,
  Calendar,
  CreditCard,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  ChevronRight,
  BookOpen,
  RefreshCw,
} from 'lucide-react';
import type { Enrollment } from '../types';

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  active: { label: 'Active', color: 'green', icon: CheckCircle },
  pending: { label: 'Pending Payment', color: 'amber', icon: Clock },
  expired: { label: 'Expired', color: 'slate', icon: AlertCircle },
  cancelled: { label: 'Cancelled', color: 'red', icon: XCircle },
  refunded: { label: 'Refunded', color: 'slate', icon: RefreshCw },
};

export function MyEnrollmentsPage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEnrollments();
  }, []);

  const fetchEnrollments = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/v2/course-types/enrollments/my');
      const result = await res.json();

      if (result.success) {
        setEnrollments(result.data);
      } else {
        setError('Failed to load enrollments');
      }
    } catch (err) {
      setError('Failed to load enrollments');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getDaysRemaining = (expiresAt: string | null) => {
    if (!expiresAt) return null;
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading enrollments...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchEnrollments}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">My Enrollments</h1>
        <p className="text-slate-600">
          View and manage your course enrollments
        </p>
      </div>

      {/* Stats Summary */}
      {enrollments.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-green-50 rounded-xl p-4 border border-green-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-700">
                  {enrollments.filter((e) => e.status === 'active').length}
                </p>
                <p className="text-sm text-green-600">Active Enrollments</p>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-700">
                  {enrollments.filter((e) => e.status === 'pending').length}
                </p>
                <p className="text-sm text-amber-600">Pending Payment</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-700">
                  ₹{enrollments
                    .filter((e) => e.status === 'active')
                    .reduce((sum, e) => sum + (e.amountPaid || 0), 0)
                    .toLocaleString()}
                </p>
                <p className="text-sm text-blue-600">Total Paid</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enrollments List */}
      {enrollments.length > 0 ? (
        <div className="space-y-4">
          {enrollments.map((enrollment, index) => {
            const status = statusConfig[enrollment.status] || statusConfig.pending;
            const StatusIcon = status.icon;
            const daysRemaining = getDaysRemaining(enrollment.expiresAt);

            return (
              <motion.div
                key={enrollment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left side - Class info */}
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <GraduationCap className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">
                          {enrollment.className}
                        </h3>
                        <p className="text-slate-500 text-sm">
                          {enrollment.courseTypeName}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-slate-600">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            Enrolled: {formatDate(enrollment.enrolledAt)}
                          </span>
                          {enrollment.status === 'active' && daysRemaining !== null && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {daysRemaining} days remaining
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right side - Status and amount */}
                    <div className="flex items-center gap-6">
                      {/* Amount */}
                      <div className="text-right">
                        <p className="text-sm text-slate-500">Amount Paid</p>
                        <p className="text-xl font-bold text-slate-900">
                          ₹{(enrollment.amountPaid || 0).toLocaleString()}
                        </p>
                      </div>

                      {/* Status Badge */}
                      <div
                        className={`
                          flex items-center gap-2 px-4 py-2 rounded-lg
                          ${status.color === 'green' ? 'bg-green-100 text-green-700' : ''}
                          ${status.color === 'amber' ? 'bg-amber-100 text-amber-700' : ''}
                          ${status.color === 'red' ? 'bg-red-100 text-red-700' : ''}
                          ${status.color === 'slate' ? 'bg-slate-100 text-slate-700' : ''}
                        `}
                      >
                        <StatusIcon className="w-4 h-4" />
                        <span className="font-medium text-sm">{status.label}</span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Details */}
                  {enrollment.payment && enrollment.payment.status === 'paid' && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                        <span className="flex items-center gap-1">
                          <CreditCard className="w-4 h-4" />
                          {enrollment.payment.paymentType === 'cash' ? 'Cash Payment' :
                           enrollment.payment.paymentType === 'bank_transfer' ? 'Bank Transfer' :
                           enrollment.payment.paymentType === 'cheque' ? 'Cheque' :
                           enrollment.payment.paymentType === 'upi_direct' ? 'UPI' :
                           enrollment.payment.paymentMethod || 'Online Payment'}
                        </span>
                        {enrollment.payment.receiptNumber && (
                          <span className="font-mono bg-slate-100 px-2 py-0.5 rounded">
                            Receipt: {enrollment.payment.receiptNumber}
                          </span>
                        )}
                        {enrollment.payment.razorpayPaymentId && !enrollment.payment.receiptNumber && (
                          <span>
                            Payment ID: {enrollment.payment.razorpayPaymentId}
                          </span>
                        )}
                        <span>
                          Paid on: {formatDate(enrollment.payment.paidAt)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
          <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">
            No enrollments yet
          </h3>
          <p className="text-slate-600 mb-6 max-w-md mx-auto">
            You haven't enrolled in any courses yet. Browse our available courses and start your learning journey.
          </p>
          <Link
            to="/courses"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            Browse Courses
            <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      )}
    </div>
  );
}

export default MyEnrollmentsPage;
