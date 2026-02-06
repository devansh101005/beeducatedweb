// Students Management Page
// List and manage students with Add Student functionality

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  GraduationCap,
  Plus,
  RefreshCw,
  Mail,
  Phone,
  Eye,
  X,
  CheckCircle,
  AlertCircle,
  Hash,
  School,
  Target,
  User,
  Trash2,
  UserX,
  MoreVertical,
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

interface Student {
  id: string;
  user_id: string;
  student_id: string;
  student_type: string;
  class_grade: string | null;
  board: string | null;
  target_exam: string | null;
  target_year: number | null;
  parent_name: string | null;
  parent_phone: string | null;
  subscription_status: string;
  created_at: string;
  users?: {
    first_name: string | null;
    last_name: string | null;
    email: string;
    phone: string | null;
  };
  // Enrollment info for manual enrollment badge
  enrollment?: {
    id: string;
    status: string;
    class_name?: string;
  } | null;
}

interface CourseType {
  id: string;
  slug: string;
  name: string;
  isActive: boolean;
}

interface AcademicClass {
  id: string;
  name: string;
  enrollmentOpen: boolean;
}

const API_URL = import.meta.env.VITE_API_URL || '/api';

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

// ============================================
// ADD STUDENT MODAL
// ============================================

interface AddStudentModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

function AddStudentModal({ onClose, onSuccess }: AddStudentModalProps) {
  const { getToken } = useAuth();

  // User fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');

  // Student fields
  const [studentId, setStudentId] = useState('');
  const [studentType, setStudentType] = useState('coaching_offline');
  const [classGrade, setClassGrade] = useState('12th');
  const [board, setBoard] = useState('CBSE');
  const [targetExam, setTargetExam] = useState('');
  const [targetYear, setTargetYear] = useState(new Date().getFullYear());
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');

  // Enrollment fields (for manual enrollment)
  const [courseTypes, setCourseTypes] = useState<CourseType[]>([]);
  const [academicClasses, setAcademicClasses] = useState<AcademicClass[]>([]);
  const [selectedCourseType, setSelectedCourseType] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [loadingCourseTypes, setLoadingCourseTypes] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(false);

  // UI state
  const [step, setStep] = useState(1); // 1 = user info, 2 = student info
  const [loading, setLoading] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [error, setError] = useState('');
  const [idAvailable, setIdAvailable] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);

  // Generate suggested student ID
  const handleSuggestId = async () => {
    setSuggesting(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/v2/students/suggest-id`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStudentId(data.data?.suggestedId || '');
        setIdAvailable(true);
      }
    } catch (err) {
      console.error('Failed to suggest ID:', err);
    } finally {
      setSuggesting(false);
    }
  };

  // Check ID availability
  const checkIdAvailability = async (id: string) => {
    if (id.length < 5) {
      setIdAvailable(null);
      return;
    }
    setChecking(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/v2/students/check-id/${encodeURIComponent(id)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setIdAvailable(data.data?.available || false);
      }
    } catch (err) {
      console.error('Failed to check ID:', err);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    if (studentId && studentId.length >= 5) {
      const debounce = setTimeout(() => checkIdAvailability(studentId), 500);
      return () => clearTimeout(debounce);
    }
  }, [studentId]);

  // Get suggested ID when moving to step 2
  useEffect(() => {
    if (step === 2 && !studentId) {
      handleSuggestId();
    }
  }, [step]);

  // Fetch course types on mount
  useEffect(() => {
    const fetchCourseTypes = async () => {
      setLoadingCourseTypes(true);
      try {
        const token = await getToken();
        const res = await fetch(`${API_URL}/v2/course-types`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const activeCourseTypes = (data.data || []).filter((ct: CourseType) => ct.isActive);
          setCourseTypes(activeCourseTypes);
        }
      } catch (err) {
        console.error('Failed to fetch course types:', err);
      } finally {
        setLoadingCourseTypes(false);
      }
    };
    fetchCourseTypes();
  }, []);

  // Fetch classes when course type changes & auto-set studentType
  useEffect(() => {
    if (!selectedCourseType) {
      setAcademicClasses([]);
      setSelectedClassId('');
      return;
    }

    // Auto-set studentType based on course type slug (they map directly)
    // Course type slugs: coaching_offline, coaching_online, test_series, home_tuition
    setStudentType(selectedCourseType.replace(/-/g, '_'));

    const fetchClasses = async () => {
      setLoadingClasses(true);
      try {
        const token = await getToken();
        const res = await fetch(`${API_URL}/v2/course-types/${selectedCourseType}/classes`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const classes = (data.data?.classes || []).filter((c: AcademicClass) => c.enrollmentOpen);
          setAcademicClasses(classes);
          // Auto-select first class if available
          if (classes.length > 0 && !selectedClassId) {
            setSelectedClassId(classes[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to fetch classes:', err);
      } finally {
        setLoadingClasses(false);
      }
    };
    fetchClasses();
  }, [selectedCourseType]);

  const handleCreateStudent = async () => {
    if (!email || !password || !firstName || !studentId || !studentType) {
      setError('Please fill in all required fields');
      return;
    }

    if (idAvailable === false) {
      setError('Student ID is not available');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = await getToken();

      // Create user and student profile in one request
      const res = await fetch(`${API_URL}/v2/admin/students/create-with-user`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // User fields
          email,
          password,
          firstName,
          lastName,
          phone,
          // Student fields
          studentId,
          studentType,
          classGrade,
          board,
          targetExam,
          targetYear,
          parentName,
          parentPhone,
          // Enrollment field (for manual enrollment)
          classId: selectedClassId || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Show the actual error message from the server
        const errorMessage = data.message || data.error || 'Failed to create student';
        console.error('Server error response:', data);
        throw new Error(errorMessage);
      }

      // Check if student was created (could be partial success)
      if (data.data?.student === null) {
        throw new Error(data.message || 'User created but student profile failed. Please try again.');
      }

      onSuccess();
    } catch (err: any) {
      console.error('Error creating student:', err);
      setError(err.message || 'Failed to create student');
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
                <GraduationCap className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-lg font-heading font-semibold text-slate-900">Add New Student</h2>
                <p className="text-sm text-slate-500">Step {step} of 2</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress */}
          <div className="px-6 pt-4">
            <div className="flex items-center gap-2">
              <div className={clsx(
                'flex-1 h-1.5 rounded-full transition-colors',
                step >= 1 ? 'bg-emerald-500' : 'bg-slate-200'
              )} />
              <div className={clsx(
                'flex-1 h-1.5 rounded-full transition-colors',
                step >= 2 ? 'bg-emerald-500' : 'bg-slate-200'
              )} />
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-rose-50 text-rose-700 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            {step === 1 ? (
              <div className="space-y-4">
                <p className="text-sm text-slate-600 mb-4">
                  Enter the student's account details. An account will be created for them to login.
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      First Name <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="First name"
                      leftIcon={<User className="w-4 h-4" />}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Last Name
                    </label>
                    <Input
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Last name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Email <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@example.com"
                    leftIcon={<Mail className="w-4 h-4" />}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Password <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a password"
                  />
                  <p className="text-xs text-slate-500 mt-1">Min 8 characters. Share this with the student.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Phone Number
                  </label>
                  <Input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    leftIcon={<Phone className="w-4 h-4" />}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-slate-600 mb-4">
                  Enter the student's academic information and assign a Student ID.
                </p>

                {/* Course Type & Class for Manual Enrollment */}
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <p className="text-xs font-medium text-emerald-700 mb-2 flex items-center gap-1">
                    <GraduationCap className="w-3.5 h-3.5" />
                    Enroll Student (Optional)
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Program</label>
                      <Select
                        value={selectedCourseType}
                        onChange={(e) => {
                          setSelectedCourseType(e.target.value);
                          setSelectedClassId('');
                        }}
                        options={[
                          { value: '', label: loadingCourseTypes ? 'Loading...' : 'Select course type' },
                          ...courseTypes.map(ct => ({ value: ct.slug, label: ct.name })),
                        ]}
                        disabled={loadingCourseTypes}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Enroll In</label>
                      <Select
                        value={selectedClassId}
                        onChange={(e) => {
                          setSelectedClassId(e.target.value);
                          // Auto-detect grade from class name (e.g., "Class 12 JEE" → "12th")
                          const selectedClass = academicClasses.find(c => c.id === e.target.value);
                          if (selectedClass) {
                            const match = selectedClass.name.match(/(?:class\s*)?(\d{1,2})(?:th|st|nd|rd)?/i);
                            if (match) {
                              const grade = match[1] + 'th';
                              if (['9th', '10th', '11th', '12th'].includes(grade)) {
                                setClassGrade(grade);
                              }
                            } else if (selectedClass.name.toLowerCase().includes('dropper')) {
                              setClassGrade('dropper');
                            }
                          }
                        }}
                        options={[
                          { value: '', label: loadingClasses ? 'Loading...' : (selectedCourseType ? 'Select class' : 'Select program first') },
                          ...academicClasses.map(c => ({ value: c.id, label: c.name })),
                        ]}
                        disabled={!selectedCourseType || loadingClasses}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Select a program and class to auto-enroll the student with a free enrollment.
                  </p>
                </div>

                {/* Student ID */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Student ID <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <Input
                        value={studentId}
                        onChange={(e) => {
                          setStudentId(e.target.value.toUpperCase());
                          setIdAvailable(null);
                        }}
                        placeholder="e.g., BE2025001"
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
                    <p className="text-xs text-rose-500 mt-1">This ID is already taken</p>
                  )}
                </div>

                {/* Student Type - only show if no course type selected for enrollment */}
                {!selectedCourseType ? (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Student Type <span className="text-rose-500">*</span>
                    </label>
                    <Select
                      value={studentType}
                      onChange={(e) => setStudentType(e.target.value)}
                      options={studentTypes}
                    />
                  </div>
                ) : (
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-xs text-slate-500">
                      Student Type: <span className="font-medium text-slate-700">{studentTypes.find(t => t.value === studentType)?.label || studentType}</span>
                      <span className="text-emerald-600 ml-1">(auto-set from Course Type)</span>
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  {/* Grade - only show if no enrollment class selected */}
                  {!selectedClassId ? (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Grade</label>
                      <Select
                        value={classGrade}
                        onChange={(e) => setClassGrade(e.target.value)}
                        options={classes}
                      />
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 w-full">
                        <p className="text-xs text-slate-500">
                          Grade: <span className="font-medium text-slate-700">{classes.find(c => c.value === classGrade)?.label || classGrade}</span>
                          <span className="text-emerald-600 ml-1">(from class)</span>
                        </p>
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Board</label>
                    <Select
                      value={board}
                      onChange={(e) => setBoard(e.target.value)}
                      options={boards}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Target Exam</label>
                    <Input
                      value={targetExam}
                      onChange={(e) => setTargetExam(e.target.value)}
                      placeholder="e.g., JEE, NEET"
                      leftIcon={<Target className="w-4 h-4" />}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Target Year</label>
                    <Input
                      type="number"
                      value={targetYear}
                      onChange={(e) => setTargetYear(parseInt(e.target.value))}
                      min={new Date().getFullYear()}
                      max={new Date().getFullYear() + 5}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Parent Name</label>
                    <Input
                      value={parentName}
                      onChange={(e) => setParentName(e.target.value)}
                      placeholder="Parent's name"
                      leftIcon={<Users className="w-4 h-4" />}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Parent Phone</label>
                    <Input
                      type="tel"
                      value={parentPhone}
                      onChange={(e) => setParentPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      leftIcon={<Phone className="w-4 h-4" />}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-100 flex justify-between">
            {step === 1 ? (
              <>
                <Button variant="ghost" onClick={onClose}>Cancel</Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    if (!email || !password || !firstName) {
                      setError('Please fill in all required fields');
                      return;
                    }
                    setError('');
                    setStep(2);
                  }}
                >
                  Next Step
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
                <Button
                  variant="primary"
                  onClick={handleCreateStudent}
                  disabled={loading || idAvailable === false}
                  leftIcon={loading ? <Spinner size="sm" /> : <CheckCircle className="w-4 h-4" />}
                >
                  {loading ? 'Creating...' : 'Create Student'}
                </Button>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function StudentsPage() {
  const { getToken } = useAuth();

  // Data state
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 20;

  // URL params
  const [searchParams, setSearchParams] = useSearchParams();

  // Filters
  const [search, setSearch] = useState('');
  const [studentTypeFilter, setStudentTypeFilter] = useState('');

  // Modal state - check if action=add in URL
  const [showAddModal, setShowAddModal] = useState(searchParams.get('action') === 'add');

  // Delete/Unenroll state
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [deleteAction, setDeleteAction] = useState<'delete' | 'unenroll' | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Clear action param when modal closes
  const handleCloseAddModal = () => {
    setShowAddModal(false);
    if (searchParams.get('action')) {
      searchParams.delete('action');
      setSearchParams(searchParams);
    }
  };

  // Fetch students
  const fetchStudents = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    else setRefreshing(true);

    try {
      const token = await getToken();
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (search) params.append('search', search);
      if (studentTypeFilter) params.append('studentType', studentTypeFilter);

      const res = await fetch(`${API_URL}/v2/admin/students?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      console.log('Students API response:', data);

      if (data.success) {
        // sendPaginated returns { items, total, page, pageSize, totalPages } in data
        const items = data.data?.items || data.data || [];
        setStudents(Array.isArray(items) ? items : []);
        setTotalPages(data.data?.totalPages || data.pagination?.totalPages || 1);
        setTotalItems(data.data?.total || data.pagination?.total || 0);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [page, studentTypeFilter]);

  // Debounced search
  useEffect(() => {
    const debounce = setTimeout(() => {
      if (page === 1) {
        fetchStudents();
      } else {
        setPage(1);
      }
    }, 500);
    return () => clearTimeout(debounce);
  }, [search]);

  const handleRefresh = () => {
    fetchStudents(false);
  };

  const handleAddSuccess = () => {
    setShowAddModal(false);
    fetchStudents(false);
  };

  // Delete student handler
  const handleDeleteStudent = async () => {
    if (!studentToDelete) return;

    setDeleting(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/v2/admin/students/${studentToDelete.id}?deleteUser=true`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to delete student');
      }

      // Refresh list
      fetchStudents(false);
    } catch (err: any) {
      console.error('Error deleting student:', err);
      alert(err.message || 'Failed to delete student');
    } finally {
      setDeleting(false);
      setStudentToDelete(null);
      setDeleteAction(null);
    }
  };

  // Unenroll student handler
  const handleUnenrollStudent = async () => {
    if (!studentToDelete) return;

    setDeleting(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/v2/admin/students/${studentToDelete.id}/enrollment`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to unenroll student');
      }

      // Refresh list
      fetchStudents(false);
    } catch (err: any) {
      console.error('Error unenrolling student:', err);
      alert(err.message || 'Failed to unenroll student');
    } finally {
      setDeleting(false);
      setStudentToDelete(null);
      setDeleteAction(null);
    }
  };

  const getStudentTypeBadge = (type: string) => {
    switch (type) {
      case 'coaching_online':
        return <Badge variant="info">Online</Badge>;
      case 'coaching_offline':
        return <Badge variant="success">Offline</Badge>;
      case 'test_series':
        return <Badge variant="warning">Test Series</Badge>;
      case 'home_tuition':
        return <Badge variant="default">Home Tuition</Badge>;
      default:
        return <Badge variant="default">{type}</Badge>;
    }
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
            <GraduationCap className="w-7 h-7 text-emerald-600" />
            Students
          </h1>
          <p className="text-slate-500 mt-1">
            Manage registered students
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            onClick={() => setShowAddModal(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Student
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

      {/* Stats Cards */}
      <Stagger className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StaggerItem>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-900">
                  {loading ? '--' : totalItems}
                </p>
                <p className="text-xs text-slate-500">Total Students</p>
              </div>
            </div>
          </Card>
        </StaggerItem>
        <StaggerItem>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center">
                <School className="w-5 h-5 text-sky-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-900">
                  {loading ? '--' : (Array.isArray(students) ? students.filter(s => s.student_type === 'coaching_offline').length : 0)}
                </p>
                <p className="text-xs text-slate-500">Offline Coaching</p>
              </div>
            </div>
          </Card>
        </StaggerItem>
        <StaggerItem>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                <Target className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-900">
                  {loading ? '--' : (Array.isArray(students) ? students.filter(s => s.student_type === 'coaching_online').length : 0)}
                </p>
                <p className="text-xs text-slate-500">Online Coaching</p>
              </div>
            </div>
          </Card>
        </StaggerItem>
        <StaggerItem>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-900">
                  {loading ? '--' : (Array.isArray(students) ? students.filter(s => s.student_type === 'home_tuition').length : 0)}
                </p>
                <p className="text-xs text-slate-500">Home Tuition</p>
              </div>
            </div>
          </Card>
        </StaggerItem>
      </Stagger>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <SearchInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, or student ID..."
            />
          </div>
          <div className="w-full sm:w-48">
            <Select
              value={studentTypeFilter}
              onChange={(e) => setStudentTypeFilter(e.target.value)}
              options={[
                { value: '', label: 'All Types' },
                ...studentTypes,
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Students List */}
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
        ) : !Array.isArray(students) || students.length === 0 ? (
          <EmptyState
            variant="search"
            title="No students found"
            description={search ? 'Try adjusting your search or filters.' : 'Add your first student to get started.'}
            icon={<GraduationCap className="w-12 h-12" />}
            action={
              !search ? {
                label: 'Add Student',
                onClick: () => setShowAddModal(true),
                variant: 'primary' as const,
              } : undefined
            }
          />
        ) : (
          <>
            <div className="divide-y divide-slate-100">
              {students.map((student, index) => {
                const fullName =
                  [student.users?.first_name, student.users?.last_name]
                    .filter(Boolean)
                    .join(' ') || 'Unknown';

                return (
                  <motion.div
                    key={student.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-5 hover:bg-slate-50/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-semibold text-lg shrink-0">
                        {fullName.charAt(0).toUpperCase()}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <p className="font-semibold text-slate-900">{fullName}</p>
                          <Badge variant="default" size="sm">{student.student_id}</Badge>
                          {getStudentTypeBadge(student.student_type)}
                          {student.enrollment && (
                            <Badge variant="success" size="sm" className="bg-emerald-100 text-emerald-700 border-emerald-200">
                              Manual Enrollment
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3.5 h-3.5" />
                            {student.users?.email || 'N/A'}
                          </span>
                          {student.users?.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3.5 h-3.5" />
                              {student.users.phone}
                            </span>
                          )}
                          {student.class_grade && (
                            <span className="flex items-center gap-1">
                              <School className="w-3.5 h-3.5" />
                              {student.class_grade} | {student.board}
                            </span>
                          )}
                          {student.target_exam && (
                            <span className="flex items-center gap-1">
                              <Target className="w-3.5 h-3.5" />
                              {student.target_exam} {student.target_year}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        <Button variant="ghost" size="sm" title="View">
                          <Eye className="w-4 h-4" />
                        </Button>
                        {student.enrollment && (
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Unenroll"
                            onClick={() => {
                              setStudentToDelete(student);
                              setDeleteAction('unenroll');
                            }}
                            className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                          >
                            <UserX className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Delete Student"
                          onClick={() => {
                            setStudentToDelete(student);
                            setDeleteAction('delete');
                          }}
                          className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
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

      {/* Add Student Modal */}
      {showAddModal && (
        <AddStudentModal
          onClose={handleCloseAddModal}
          onSuccess={handleAddSuccess}
        />
      )}

      {/* Delete/Unenroll Confirmation Modal */}
      {studentToDelete && deleteAction && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => {
              setStudentToDelete(null);
              setDeleteAction(null);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className={clsx(
                'px-6 py-4 flex items-center gap-3',
                deleteAction === 'delete' ? 'bg-rose-50' : 'bg-amber-50'
              )}>
                <div className={clsx(
                  'w-10 h-10 rounded-xl flex items-center justify-center',
                  deleteAction === 'delete' ? 'bg-rose-100' : 'bg-amber-100'
                )}>
                  {deleteAction === 'delete' ? (
                    <Trash2 className="w-5 h-5 text-rose-600" />
                  ) : (
                    <UserX className="w-5 h-5 text-amber-600" />
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-heading font-semibold text-slate-900">
                    {deleteAction === 'delete' ? 'Delete Student' : 'Unenroll Student'}
                  </h2>
                  <p className="text-sm text-slate-500">
                    {deleteAction === 'delete' ? 'This action cannot be undone' : 'Remove enrollment but keep profile'}
                  </p>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <p className="text-slate-600">
                  {deleteAction === 'delete' ? (
                    <>
                      Are you sure you want to delete <span className="font-semibold">{studentToDelete.users?.first_name} {studentToDelete.users?.last_name}</span>?
                      This will permanently remove their account and all associated data.
                    </>
                  ) : (
                    <>
                      Are you sure you want to unenroll <span className="font-semibold">{studentToDelete.users?.first_name} {studentToDelete.users?.last_name}</span>?
                      This will cancel their enrollment but keep their student profile.
                    </>
                  )}
                </p>

                {studentToDelete.enrollment && deleteAction === 'delete' && (
                  <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-amber-700">
                      This student has an active enrollment in <span className="font-medium">{studentToDelete.enrollment.class_name}</span>.
                      It will be cancelled automatically.
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setStudentToDelete(null);
                    setDeleteAction(null);
                  }}
                  disabled={deleting}
                >
                  Cancel
                </Button>
                <Button
                  variant={deleteAction === 'delete' ? 'danger' : 'primary'}
                  onClick={deleteAction === 'delete' ? handleDeleteStudent : handleUnenrollStudent}
                  disabled={deleting}
                  leftIcon={deleting ? <Spinner size="sm" /> : deleteAction === 'delete' ? <Trash2 className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                  className={deleteAction === 'unenroll' ? 'bg-amber-500 hover:bg-amber-600' : ''}
                >
                  {deleting ? 'Processing...' : deleteAction === 'delete' ? 'Delete Student' : 'Unenroll'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}

export default StudentsPage;
