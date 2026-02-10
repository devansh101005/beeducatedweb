// Approve Student Application Modal
// Allows admin to review and approve student applications with manual student ID assignment

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  User,
  Mail,
  Phone,
  Hash,
  GraduationCap,
  School,
  Target,
  Users,
} from 'lucide-react';
import { Button, Card, Select, Input, Spinner } from '@shared/components/ui';
import clsx from 'clsx';

// ============================================
// TYPES
// ============================================

interface User {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  created_at: string;
}

interface ApproveStudentModalProps {
  application: User;
  onClose: () => void;
  onSuccess: () => void;
}

const studentTypes = [
  { value: 'coaching_online', label: 'Online Coaching' },
  { value: 'coaching_offline', label: 'Offline Coaching' },
  { value: 'test_series', label: 'Test Series' },
  { value: 'home_tuition', label: 'Home Tuition' },
];

const classes = [
  { value: '9th', label: 'Class 9' },
  { value: '10th', label: 'Class 10' },
  { value: '11th', label: 'Class 11' },
  { value: '12th', label: 'Class 12' },
  { value: 'dropper', label: 'Dropper' },
];

const boards = [
  { value: 'CBSE', label: 'CBSE' },
  { value: 'State', label: 'State Board' },
  { value: 'ICSE', label: 'ICSE' },
];

const API_URL = import.meta.env.VITE_API_URL || '/api';

// ============================================
// MAIN COMPONENT
// ============================================

export function ApproveStudentModal({ application, onClose, onSuccess }: ApproveStudentModalProps) {
  const { getToken } = useAuth();

  // Form state
  const [studentId, setStudentId] = useState('');
  const [studentType, setStudentType] = useState('coaching_online');
  const [classGrade, setClassGrade] = useState('12th');
  const [board, setBoard] = useState('CBSE');
  const [targetExam, setTargetExam] = useState('');
  const [targetYear, setTargetYear] = useState(new Date().getFullYear());
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [parentEmail, setParentEmail] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [idAvailable, setIdAvailable] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');

  // Suggest student ID on mount
  useEffect(() => {
    handleSuggestId();
  }, []);

  // Check ID availability when ID changes
  useEffect(() => {
    if (studentId && studentId.length >= 5) {
      const debounce = setTimeout(() => {
        checkIdAvailability();
      }, 500);
      return () => clearTimeout(debounce);
    } else {
      setIdAvailable(null);
    }
  }, [studentId]);

  const handleSuggestId = async () => {
    setSuggesting(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/v2/students/suggest-id`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.data.studentId) {
        setStudentId(data.data.studentId);
      }
    } catch (err) {
      console.error('Error suggesting ID:', err);
    } finally {
      setSuggesting(false);
    }
  };

  const checkIdAvailability = async () => {
    setChecking(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/v2/students/check-id/${studentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setIdAvailable(data.data.available);
    } catch (err) {
      console.error('Error checking ID:', err);
      setIdAvailable(null);
    } finally {
      setChecking(false);
    }
  };

  const handleApprove = async () => {
    if (!studentId) {
      setError('Student ID is required');
      return;
    }

    if (idAvailable === false) {
      setError('Student ID is already taken');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = await getToken();

      // Approve application and create student
      const res = await fetch(`${API_URL}/v2/admin/applications/${application.id}/approve-student`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId,
          studentType,
          classGrade,
          board,
          targetExam,
          targetYear,
          parentName,
          parentPhone,
          parentEmail,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to approve application');
      }

      onSuccess();
    } catch (err: any) {
      console.error('Error approving application:', err);
      setError(err.message || 'Failed to approve application');
    } finally {
      setLoading(false);
    }
  };

  const fullName = [application.first_name, application.last_name].filter(Boolean).join(' ') || 'Unknown';

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
                  Approve Student Application
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Assign a student ID and enroll {fullName}
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
            {/* Applicant Info */}
            <Card className="p-4 bg-slate-50">
              <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <User className="w-4 h-4" />
                Applicant Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-600">{application.email}</span>
                </div>
                {application.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-600">{application.phone}</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Student ID Assignment */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Student ID *
              </label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Input
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value.toUpperCase())}
                    placeholder="BEE-2026-0001"
                    className={clsx(
                      'font-mono',
                      idAvailable === false && 'border-rose-500 focus:ring-rose-500',
                      idAvailable === true && 'border-emerald-500 focus:ring-emerald-500'
                    )}
                    leftIcon={<Hash className="w-4 h-4" />}
                  />
                  {checking && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Spinner size="sm" />
                    </div>
                  )}
                  {!checking && idAvailable !== null && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {idAvailable ? (
                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-rose-500" />
                      )}
                    </div>
                  )}
                </div>
                <Button
                  variant="outline"
                  onClick={handleSuggestId}
                  disabled={suggesting}
                  leftIcon={suggesting ? <Spinner size="sm" /> : <RefreshCw className="w-4 h-4" />}
                >
                  Suggest
                </Button>
              </div>
              {idAvailable === false && (
                <p className="text-sm text-rose-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  This student ID is already taken
                </p>
              )}
              {idAvailable === true && (
                <p className="text-sm text-emerald-600 mt-1 flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  This student ID is available
                </p>
              )}
            </div>

            {/* Student Type */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Student Type *
              </label>
              <Select
                value={studentType}
                onChange={(e) => setStudentType(e.target.value)}
                options={studentTypes}
                leftIcon={<GraduationCap className="w-4 h-4" />}
              />
            </div>

            {/* Academic Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Class/Grade
                </label>
                <Select
                  value={classGrade}
                  onChange={(e) => setClassGrade(e.target.value)}
                  options={classes}
                  leftIcon={<School className="w-4 h-4" />}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Board
                </label>
                <Select
                  value={board}
                  onChange={(e) => setBoard(e.target.value)}
                  options={boards}
                />
              </div>
            </div>

            {/* Target Exam */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Target Exam
                </label>
                <Input
                  value={targetExam}
                  onChange={(e) => setTargetExam(e.target.value)}
                  placeholder="JEE Main, NEET, etc."
                  leftIcon={<Target className="w-4 h-4" />}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Target Year
                </label>
                <Input
                  type="number"
                  value={targetYear}
                  onChange={(e) => setTargetYear(parseInt(e.target.value))}
                  min={new Date().getFullYear()}
                  max={new Date().getFullYear() + 5}
                />
              </div>
            </div>

            {/* Parent/Guardian Details */}
            <div>
              <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Parent/Guardian Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Parent Name
                  </label>
                  <Input
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    placeholder="Full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Parent Phone
                  </label>
                  <Input
                    value={parentPhone}
                    onChange={(e) => setParentPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    leftIcon={<Phone className="w-4 h-4" />}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Parent Email
                  </label>
                  <Input
                    type="email"
                    value={parentEmail}
                    onChange={(e) => setParentEmail(e.target.value)}
                    placeholder="parent@example.com"
                    leftIcon={<Mail className="w-4 h-4" />}
                  />
                </div>
              </div>
            </div>

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
              onClick={handleApprove}
              disabled={loading || !studentId || idAvailable === false}
              leftIcon={loading ? <Spinner size="sm" /> : <CheckCircle className="w-4 h-4" />}
            >
              {loading ? 'Approving...' : 'Approve & Create Student'}
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default ApproveStudentModal;
