// Manual Enrollment Modal
// Allows admin to enroll students with cash/offline payments

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  CheckCircle,
  AlertCircle,
  Search,
  User,
  GraduationCap,
  IndianRupee,
  Receipt,
  FileText,
  Building,
  Smartphone,
} from 'lucide-react';
import { Button, Card, Input, Spinner } from '@shared/components/ui';
import clsx from 'clsx';

// ============================================
// TYPES
// ============================================

interface Student {
  id: string;
  student_id: string;
  student_type: string;
  user?: {
    first_name: string | null;
    last_name: string | null;
    email: string;
  };
}

interface FeePlan {
  id: string;
  name: string;
  total_amount: number;
  registration_fee: number;
  tuition_fee: number;
}

interface AcademicClass {
  id: string;
  name: string;
  slug: string;
  course_type?: {
    name: string;
    slug: string;
  };
  fee_plan?: FeePlan;
  fee_plans?: FeePlan[];
}

interface ManualEnrollmentModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const paymentTypes = [
  { value: 'cash', label: 'Cash', icon: IndianRupee },
  { value: 'bank_transfer', label: 'Bank Transfer (NEFT/IMPS)', icon: Building },
  { value: 'cheque', label: 'Cheque', icon: FileText },
  { value: 'upi_direct', label: 'Direct UPI', icon: Smartphone },
];

const API_URL = import.meta.env.VITE_API_URL || '/api';

// ============================================
// MAIN COMPONENT
// ============================================

export function ManualEnrollmentModal({ onClose, onSuccess }: ManualEnrollmentModalProps) {
  const { getToken } = useAuth();

  // Selection state
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedClass, setSelectedClass] = useState<AcademicClass | null>(null);
  const [selectedFeePlan, setSelectedFeePlan] = useState<FeePlan | null>(null);

  // Form state
  const [paymentType, setPaymentType] = useState('cash');
  const [amountReceived, setAmountReceived] = useState('');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [notes, setNotes] = useState('');

  // Search state
  const [studentSearch, setStudentSearch] = useState('');
  const [studentResults, setStudentResults] = useState<Student[]>([]);
  const [searchingStudents, setSearchingStudents] = useState(false);

  // Classes state
  const [classes, setClasses] = useState<AcademicClass[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(false);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{ enrollment: any; payment: any } | null>(null);

  // Load classes on mount
  useEffect(() => {
    loadClasses();
  }, []);

  // Search students with debounce
  useEffect(() => {
    if (studentSearch.length >= 2) {
      const debounce = setTimeout(() => {
        searchStudents();
      }, 300);
      return () => clearTimeout(debounce);
    } else {
      setStudentResults([]);
    }
  }, [studentSearch]);

  // Set default amount when class/fee plan selected
  useEffect(() => {
    if (selectedFeePlan && !amountReceived) {
      setAmountReceived(selectedFeePlan.total_amount.toString());
    }
  }, [selectedFeePlan]);

  const loadClasses = async () => {
    setLoadingClasses(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/v2/admin/enrollments/classes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setClasses(data.data || []);
      }
    } catch (err) {
      console.error('Error loading classes:', err);
    } finally {
      setLoadingClasses(false);
    }
  };

  const searchStudents = useCallback(async () => {
    setSearchingStudents(true);
    try {
      const token = await getToken();
      const url = new URL(`${API_URL}/v2/admin/enrollments/students/search`);
      url.searchParams.set('search', studentSearch);
      if (selectedClass) {
        url.searchParams.set('classId', selectedClass.id);
      }

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setStudentResults(data.data || []);
      }
    } catch (err) {
      console.error('Error searching students:', err);
    } finally {
      setSearchingStudents(false);
    }
  }, [studentSearch, selectedClass, getToken]);

  const handleSelectStudent = (student: Student) => {
    setSelectedStudent(student);
    setStudentSearch('');
    setStudentResults([]);
  };

  const handleSelectClass = (classItem: AcademicClass) => {
    setSelectedClass(classItem);
    // Auto-select default fee plan
    if (classItem.fee_plan) {
      setSelectedFeePlan(classItem.fee_plan);
      setAmountReceived(classItem.fee_plan.total_amount.toString());
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!selectedStudent) {
      setError('Please select a student');
      return;
    }
    if (!selectedClass) {
      setError('Please select a class');
      return;
    }
    if (!selectedFeePlan) {
      setError('Please select a fee plan');
      return;
    }
    if (!amountReceived || parseFloat(amountReceived) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = await getToken();

      const res = await fetch(`${API_URL}/v2/admin/enrollments/manual`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: selectedStudent.id,
          classId: selectedClass.id,
          feePlanId: selectedFeePlan.id,
          paymentType,
          amountReceived: parseFloat(amountReceived),
          receiptNumber: receiptNumber || undefined,
          notes: notes || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to create enrollment');
      }

      setSuccess({
        enrollment: data.data.enrollment,
        payment: data.data.payment,
      });

      // Call onSuccess after a short delay to show success message
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (err: any) {
      console.error('Error creating enrollment:', err);
      setError(err.message || 'Failed to create enrollment');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStudentName = (student: Student) => {
    if (student.user) {
      return [student.user.first_name, student.user.last_name].filter(Boolean).join(' ') || student.user.email;
    }
    return student.student_id;
  };

  // Success state
  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 text-center"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-heading font-semibold text-slate-900 mb-2">
            Enrollment Successful!
          </h2>
          <p className="text-slate-600 mb-4">
            Student has been enrolled successfully.
          </p>
          <div className="bg-slate-50 rounded-lg p-4 text-left space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Receipt Number:</span>
              <span className="font-mono font-medium">{success.payment.receipt_number}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Amount:</span>
              <span className="font-medium">{formatCurrency(success.payment.amount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Payment Type:</span>
              <span className="font-medium capitalize">{success.payment.payment_type.replace('_', ' ')}</span>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-4 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-heading font-semibold text-slate-900">
                  Manual Enrollment
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Enroll a student with cash or offline payment
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Step 1: Select Student */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                1. Select Student *
              </label>
              {selectedStudent ? (
                <Card className="p-4 bg-emerald-50 border-emerald-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                        <User className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{getStudentName(selectedStudent)}</p>
                        <p className="text-sm text-slate-500">ID: {selectedStudent.student_id}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedStudent(null)}
                    >
                      Change
                    </Button>
                  </div>
                </Card>
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
                  {/* Search Results Dropdown */}
                  {studentResults.length > 0 && (
                    <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {studentResults.map((student) => (
                        <button
                          key={student.id}
                          onClick={() => handleSelectStudent(student)}
                          className="w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center gap-3 border-b border-slate-100 last:border-0"
                        >
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                            <User className="w-4 h-4 text-slate-600" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{getStudentName(student)}</p>
                            <p className="text-sm text-slate-500">
                              {student.student_id} • {student.student_type.replace('_', ' ')}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {studentSearch.length >= 2 && !searchingStudents && studentResults.length === 0 && (
                    <p className="text-sm text-slate-500 mt-2">
                      No students found. Make sure the student has been created first.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Step 2: Select Class */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                2. Select Class *
              </label>
              {loadingClasses ? (
                <div className="flex items-center justify-center py-8">
                  <Spinner />
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                  {classes.map((classItem) => (
                    <button
                      key={classItem.id}
                      onClick={() => handleSelectClass(classItem)}
                      className={clsx(
                        'p-4 rounded-lg border text-left transition-all',
                        selectedClass?.id === classItem.id
                          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <GraduationCap className={clsx(
                            'w-5 h-5',
                            selectedClass?.id === classItem.id ? 'text-blue-600' : 'text-slate-400'
                          )} />
                          <div>
                            <p className="font-medium text-slate-900">{classItem.name}</p>
                            <p className="text-sm text-slate-500">
                              {classItem.course_type?.name}
                            </p>
                          </div>
                        </div>
                        {classItem.fee_plan && (
                          <span className="font-semibold text-slate-900">
                            {formatCurrency(classItem.fee_plan.total_amount)}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                  {classes.length === 0 && (
                    <p className="text-sm text-slate-500 py-4 text-center">
                      No classes available. Please add classes first.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Step 3: Payment Details */}
            {selectedStudent && selectedClass && (
              <>
                <hr className="border-slate-200" />

                {/* Payment Type */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    3. Payment Type *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {paymentTypes.map((type) => {
                      const Icon = type.icon;
                      return (
                        <button
                          key={type.value}
                          onClick={() => setPaymentType(type.value)}
                          className={clsx(
                            'p-3 rounded-lg border text-left transition-all flex items-center gap-2',
                            paymentType === type.value
                              ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                              : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                          )}
                        >
                          <Icon className={clsx(
                            'w-5 h-5',
                            paymentType === type.value ? 'text-blue-600' : 'text-slate-400'
                          )} />
                          <span className={clsx(
                            'text-sm font-medium',
                            paymentType === type.value ? 'text-blue-900' : 'text-slate-700'
                          )}>
                            {type.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Amount */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Amount Received *
                    </label>
                    <Input
                      type="number"
                      value={amountReceived}
                      onChange={(e) => setAmountReceived(e.target.value)}
                      placeholder="Enter amount"
                      leftIcon={<IndianRupee className="w-4 h-4" />}
                      min={0}
                    />
                    {selectedFeePlan && parseFloat(amountReceived) < selectedFeePlan.total_amount && (
                      <p className="text-sm text-amber-600 mt-1">
                        Note: Amount is less than total fee ({formatCurrency(selectedFeePlan.total_amount)})
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Receipt Number (Optional)
                    </label>
                    <Input
                      value={receiptNumber}
                      onChange={(e) => setReceiptNumber(e.target.value)}
                      placeholder="Auto-generated if empty"
                      leftIcon={<Receipt className="w-4 h-4" />}
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any additional notes about this payment..."
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    rows={2}
                  />
                </div>

                {/* Summary */}
                <Card className="p-4 bg-slate-50">
                  <h4 className="font-semibold text-slate-900 mb-3">Enrollment Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Student:</span>
                      <span className="font-medium">{getStudentName(selectedStudent)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Class:</span>
                      <span className="font-medium">{selectedClass.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Fee Plan:</span>
                      <span className="font-medium">{selectedFeePlan?.name || 'Standard'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Total Fee:</span>
                      <span className="font-medium">{formatCurrency(selectedFeePlan?.total_amount || 0)}</span>
                    </div>
                    <hr className="border-slate-200" />
                    <div className="flex justify-between">
                      <span className="text-slate-500">Payment Type:</span>
                      <span className="font-medium capitalize">{paymentType.replace('_', ' ')}</span>
                    </div>
                    <div className="flex justify-between text-base">
                      <span className="text-slate-700 font-medium">Amount Received:</span>
                      <span className="font-bold text-emerald-600">{formatCurrency(parseFloat(amountReceived) || 0)}</span>
                    </div>
                  </div>
                </Card>
              </>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <p className="text-sm text-rose-800">{error}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white border-t border-slate-200 px-6 py-4 rounded-b-2xl flex items-center justify-end gap-3">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={loading || !selectedStudent || !selectedClass || !selectedFeePlan || !amountReceived}
              leftIcon={loading ? <Spinner size="sm" /> : <CheckCircle className="w-4 h-4" />}
            >
              {loading ? 'Enrolling...' : 'Enroll Student'}
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default ManualEnrollmentModal;
