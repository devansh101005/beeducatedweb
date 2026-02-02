// Parents Management Page
// List and manage parents with Add Parent and Link Student functionality

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  UserPlus,
  Plus,
  RefreshCw,
  Mail,
  Phone,
  Eye,
  X,
  CheckCircle,
  AlertCircle,
  Link2,
  Unlink,
  Search,
  GraduationCap,
  User,
  Briefcase,
  MapPin,
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

// ============================================
// TYPES
// ============================================

interface Parent {
  id: string;
  user_id: string;
  occupation: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  created_at: string;
  user?: {
    first_name: string | null;
    last_name: string | null;
    email: string;
    phone: string | null;
  };
  children?: LinkedStudent[];
}

interface LinkedStudent {
  id: string;
  student_id: string;
  relationship: string;
  is_primary_contact: boolean;
  user?: {
    first_name: string | null;
    last_name: string | null;
    email: string;
  };
  class_grade?: string;
}

interface StudentForLinking {
  id: string;
  studentId: string;
  name: string;
  email: string;
  classGrade: string | null;
}

const API_URL = import.meta.env.VITE_API_URL || '/api';

const relationshipTypes = [
  { value: 'father', label: 'Father' },
  { value: 'mother', label: 'Mother' },
  { value: 'guardian', label: 'Guardian' },
  { value: 'other', label: 'Other' },
];

// ============================================
// ADD PARENT MODAL
// ============================================

interface AddParentModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

function AddParentModal({ onClose, onSuccess }: AddParentModalProps) {
  const { getToken } = useAuth();

  // User fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');

  // Parent fields
  const [occupation, setOccupation] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');

  // Student linking
  const [studentId, setStudentId] = useState('');
  const [relationship, setRelationship] = useState('father');
  const [searchingStudents, setSearchingStudents] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [availableStudents, setAvailableStudents] = useState<StudentForLinking[]>([]);

  // UI state
  const [step, setStep] = useState(1); // 1 = user info, 2 = parent info, 3 = link student
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Search for students to link
  const searchStudents = async (query: string) => {
    if (query.length < 2) {
      setAvailableStudents([]);
      return;
    }
    setSearchingStudents(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/v2/admin/students-for-linking?search=${encodeURIComponent(query)}&limit=10`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAvailableStudents(data.data || []);
      }
    } catch (err) {
      console.error('Failed to search students:', err);
    } finally {
      setSearchingStudents(false);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (studentSearch) {
        searchStudents(studentSearch);
      }
    }, 300);
    return () => clearTimeout(debounce);
  }, [studentSearch]);

  const handleCreateParent = async () => {
    if (!email || !firstName) {
      setError('Please fill in email and first name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = await getToken();

      const res = await fetch(`${API_URL}/v2/admin/parents`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password: password || undefined,
          firstName,
          lastName,
          phone,
          occupation,
          address,
          city,
          state,
          pincode,
          studentId: studentId || undefined,
          relationship: studentId ? relationship : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to create parent');
      }

      onSuccess();
    } catch (err: any) {
      console.error('Error creating parent:', err);
      setError(err.message || 'Failed to create parent');
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
              <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <h2 className="text-lg font-heading font-semibold text-slate-900">Add New Parent</h2>
                <p className="text-sm text-slate-500">Step {step} of 3</p>
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
              <div className={`flex-1 h-1.5 rounded-full transition-colors ${step >= 1 ? 'bg-violet-500' : 'bg-slate-200'}`} />
              <div className={`flex-1 h-1.5 rounded-full transition-colors ${step >= 2 ? 'bg-violet-500' : 'bg-slate-200'}`} />
              <div className={`flex-1 h-1.5 rounded-full transition-colors ${step >= 3 ? 'bg-violet-500' : 'bg-slate-200'}`} />
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

            {step === 1 && (
              <div className="space-y-4">
                <p className="text-sm text-slate-600 mb-4">
                  Enter the parent's account details. An account will be created for them to login.
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
                    placeholder="parent@example.com"
                    leftIcon={<Mail className="w-4 h-4" />}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Password
                  </label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a password (optional)"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Leave empty to auto-generate. Parent can reset via forgot password.
                  </p>
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
            )}

            {step === 2 && (
              <div className="space-y-4">
                <p className="text-sm text-slate-600 mb-4">
                  Additional parent information (optional).
                </p>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Occupation</label>
                  <Input
                    value={occupation}
                    onChange={(e) => setOccupation(e.target.value)}
                    placeholder="e.g., Business, Government Service"
                    leftIcon={<Briefcase className="w-4 h-4" />}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                  <Input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Street address"
                    leftIcon={<MapPin className="w-4 h-4" />}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
                    <Input
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">State</label>
                    <Input
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      placeholder="State"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Pincode</label>
                  <Input
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    placeholder="Pincode"
                    maxLength={6}
                  />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <p className="text-sm text-slate-600 mb-4">
                  Link this parent to a student (optional). You can also do this later.
                </p>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Search Student</label>
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
                  </div>
                </div>

                {/* Student search results */}
                {availableStudents.length > 0 && (
                  <div className="border border-slate-200 rounded-lg max-h-40 overflow-y-auto">
                    {availableStudents.map((student) => (
                      <button
                        key={student.id}
                        type="button"
                        onClick={() => {
                          setStudentId(student.id);
                          setStudentSearch(student.name);
                          setAvailableStudents([]);
                        }}
                        className={`w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center justify-between ${
                          studentId === student.id ? 'bg-violet-50' : ''
                        }`}
                      >
                        <div>
                          <p className="font-medium text-slate-900">{student.name}</p>
                          <p className="text-xs text-slate-500">{student.studentId} • {student.email}</p>
                        </div>
                        {student.classGrade && (
                          <Badge variant="default" size="sm">{student.classGrade}</Badge>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {studentId && (
                  <div className="p-3 bg-violet-50 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-violet-600" />
                      <span className="text-sm font-medium text-violet-900">Student selected</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setStudentId('');
                        setStudentSearch('');
                      }}
                      className="text-violet-600 hover:text-violet-800"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {studentId && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Relationship</label>
                    <Select
                      value={relationship}
                      onChange={(e) => setRelationship(e.target.value)}
                      options={relationshipTypes}
                    />
                  </div>
                )}
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
                    if (!email || !firstName) {
                      setError('Please fill in email and first name');
                      return;
                    }
                    setError('');
                    setStep(2);
                  }}
                >
                  Next Step
                </Button>
              </>
            ) : step === 2 ? (
              <>
                <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
                <Button variant="primary" onClick={() => setStep(3)}>
                  Next Step
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={() => setStep(2)}>Back</Button>
                <Button
                  variant="primary"
                  onClick={handleCreateParent}
                  disabled={loading}
                  leftIcon={loading ? <Spinner size="sm" /> : <CheckCircle className="w-4 h-4" />}
                >
                  {loading ? 'Creating...' : 'Create Parent'}
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
// LINK STUDENT MODAL
// ============================================

interface LinkStudentModalProps {
  parent: Parent;
  onClose: () => void;
  onSuccess: () => void;
}

function LinkStudentModal({ parent, onClose, onSuccess }: LinkStudentModalProps) {
  const { getToken } = useAuth();

  const [studentId, setStudentId] = useState('');
  const [relationship, setRelationship] = useState('father');
  const [isPrimary, setIsPrimary] = useState(false);
  const [searchingStudents, setSearchingStudents] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [availableStudents, setAvailableStudents] = useState<StudentForLinking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const searchStudents = async (query: string) => {
    if (query.length < 2) {
      setAvailableStudents([]);
      return;
    }
    setSearchingStudents(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/v2/admin/students-for-linking?search=${encodeURIComponent(query)}&limit=10`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        // Filter out already linked students
        const linkedIds = (parent.children || []).map(c => c.id);
        setAvailableStudents((data.data || []).filter((s: StudentForLinking) => !linkedIds.includes(s.id)));
      }
    } catch (err) {
      console.error('Failed to search students:', err);
    } finally {
      setSearchingStudents(false);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (studentSearch) {
        searchStudents(studentSearch);
      }
    }, 300);
    return () => clearTimeout(debounce);
  }, [studentSearch]);

  const handleLinkStudent = async () => {
    if (!studentId) {
      setError('Please select a student');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = await getToken();

      const res = await fetch(`${API_URL}/v2/admin/parents/${parent.id}/link-child`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId,
          relationship,
          isPrimary,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to link student');
      }

      onSuccess();
    } catch (err: any) {
      console.error('Error linking student:', err);
      setError(err.message || 'Failed to link student');
    } finally {
      setLoading(false);
    }
  };

  const parentName = [parent.user?.first_name, parent.user?.last_name].filter(Boolean).join(' ') || 'Parent';

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
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <Link2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-lg font-heading font-semibold text-slate-900">Link Student</h2>
                <p className="text-sm text-slate-500">to {parentName}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Search Student</label>
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
              </div>
            </div>

            {availableStudents.length > 0 && (
              <div className="border border-slate-200 rounded-lg max-h-40 overflow-y-auto">
                {availableStudents.map((student) => (
                  <button
                    key={student.id}
                    type="button"
                    onClick={() => {
                      setStudentId(student.id);
                      setStudentSearch(student.name);
                      setAvailableStudents([]);
                    }}
                    className={`w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center justify-between ${
                      studentId === student.id ? 'bg-emerald-50' : ''
                    }`}
                  >
                    <div>
                      <p className="font-medium text-slate-900">{student.name}</p>
                      <p className="text-xs text-slate-500">{student.studentId} • {student.email}</p>
                    </div>
                    {student.classGrade && (
                      <Badge variant="default" size="sm">{student.classGrade}</Badge>
                    )}
                  </button>
                ))}
              </div>
            )}

            {studentId && (
              <>
                <div className="p-3 bg-emerald-50 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm font-medium text-emerald-900">Student selected</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setStudentId('');
                      setStudentSearch('');
                    }}
                    className="text-emerald-600 hover:text-emerald-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Relationship</label>
                  <Select
                    value={relationship}
                    onChange={(e) => setRelationship(e.target.value)}
                    options={relationshipTypes}
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPrimary}
                    onChange={(e) => setIsPrimary(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-sm text-slate-700">Set as primary contact for this student</span>
                </label>
              </>
            )}
          </div>

          <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button
              variant="primary"
              onClick={handleLinkStudent}
              disabled={loading || !studentId}
              leftIcon={loading ? <Spinner size="sm" /> : <Link2 className="w-4 h-4" />}
            >
              {loading ? 'Linking...' : 'Link Student'}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ============================================
// VIEW PARENT MODAL
// ============================================

interface ViewParentModalProps {
  parent: Parent;
  onClose: () => void;
  onLinkStudent: () => void;
  onUnlinkStudent: (studentId: string) => void;
}

function ViewParentModal({ parent, onClose, onLinkStudent, onUnlinkStudent }: ViewParentModalProps) {
  const fullName = [parent.user?.first_name, parent.user?.last_name].filter(Boolean).join(' ') || 'Unknown';

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
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center text-white font-semibold text-lg">
                {fullName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-lg font-heading font-semibold text-slate-900">{fullName}</h2>
                <p className="text-sm text-slate-500">{parent.user?.email}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6 overflow-y-auto max-h-[60vh]">
            {/* Contact Info */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Contact Information</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span>{parent.user?.email || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span>{parent.user?.phone || 'N/A'}</span>
                </div>
                {parent.occupation && (
                  <div className="flex items-center gap-2 text-sm">
                    <Briefcase className="w-4 h-4 text-slate-400" />
                    <span>{parent.occupation}</span>
                  </div>
                )}
                {(parent.address || parent.city) && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span>
                      {[parent.address, parent.city, parent.state, parent.pincode].filter(Boolean).join(', ')}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Linked Children */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-700">Linked Children</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onLinkStudent}
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  Link Student
                </Button>
              </div>

              {!parent.children || parent.children.length === 0 ? (
                <div className="text-center py-6 bg-slate-50 rounded-lg">
                  <GraduationCap className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">No students linked yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {parent.children.map((child) => {
                    const childName = [child.user?.first_name, child.user?.last_name].filter(Boolean).join(' ') || 'Unknown';
                    return (
                      <div
                        key={child.id}
                        className="p-3 bg-slate-50 rounded-lg flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                            <GraduationCap className="w-4 h-4 text-emerald-600" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 text-sm">{childName}</p>
                            <p className="text-xs text-slate-500">
                              {child.student_id} • {child.relationship}
                              {child.is_primary_contact && (
                                <Badge variant="info" size="sm" className="ml-1">Primary</Badge>
                              )}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => onUnlinkStudent(child.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                          title="Unlink student"
                        >
                          <Unlink className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="px-6 py-4 border-t border-slate-100 flex justify-end">
            <Button variant="ghost" onClick={onClose}>Close</Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function ParentsPage() {
  const { getToken } = useAuth();

  // Data state
  const [parents, setParents] = useState<Parent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 20;

  // Filters
  const [search, setSearch] = useState('');

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedParent, setSelectedParent] = useState<Parent | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);

  // Fetch parents
  const fetchParents = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    else setRefreshing(true);

    try {
      const token = await getToken();
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (search) params.append('search', search);

      const res = await fetch(`${API_URL}/v2/admin/parents?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (data.success) {
        // Fetch children for each parent
        const parentsWithChildren = await Promise.all(
          (Array.isArray(data.data) ? data.data : []).map(async (parent: Parent) => {
            try {
              const childrenRes = await fetch(`${API_URL}/v2/admin/parents/${parent.id}/children`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              const childrenData = await childrenRes.json();
              return { ...parent, children: childrenData.data || [] };
            } catch {
              return { ...parent, children: [] };
            }
          })
        );
        setParents(parentsWithChildren);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalItems(data.pagination?.total || 0);
      }
    } catch (error) {
      console.error('Error fetching parents:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchParents();
  }, [page]);

  // Debounced search
  useEffect(() => {
    const debounce = setTimeout(() => {
      if (page === 1) {
        fetchParents();
      } else {
        setPage(1);
      }
    }, 500);
    return () => clearTimeout(debounce);
  }, [search]);

  const handleRefresh = () => {
    fetchParents(false);
  };

  const handleViewParent = async (parent: Parent) => {
    // Fetch full parent details with children
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/v2/admin/parents/${parent.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setSelectedParent(data.data);
        setShowViewModal(true);
      }
    } catch (error) {
      console.error('Error fetching parent details:', error);
    }
  };

  const handleUnlinkStudent = async (studentId: string) => {
    if (!selectedParent) return;

    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/v2/admin/parents/${selectedParent.id}/children/${studentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        // Refresh the parent details
        handleViewParent(selectedParent);
        fetchParents(false);
      }
    } catch (error) {
      console.error('Error unlinking student:', error);
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
            <Users className="w-7 h-7 text-violet-600" />
            Parents
          </h1>
          <p className="text-slate-500 mt-1">
            Manage parent accounts and link them to students
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            onClick={() => setShowAddModal(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Parent
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
      <Stagger className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StaggerItem>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-900">
                  {loading ? '--' : totalItems}
                </p>
                <p className="text-xs text-slate-500">Total Parents</p>
              </div>
            </div>
          </Card>
        </StaggerItem>
        <StaggerItem>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Link2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-900">
                  {loading ? '--' : parents.filter(p => p.children && p.children.length > 0).length}
                </p>
                <p className="text-xs text-slate-500">With Linked Students</p>
              </div>
            </div>
          </Card>
        </StaggerItem>
        <StaggerItem>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-900">
                  {loading ? '--' : parents.filter(p => !p.children || p.children.length === 0).length}
                </p>
                <p className="text-xs text-slate-500">No Students Linked</p>
              </div>
            </div>
          </Card>
        </StaggerItem>
      </Stagger>

      {/* Search */}
      <Card className="p-4">
        <SearchInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, or occupation..."
        />
      </Card>

      {/* Parents List */}
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
        ) : !Array.isArray(parents) || parents.length === 0 ? (
          <EmptyState
            variant="search"
            title="No parents found"
            description={search ? 'Try adjusting your search.' : 'Add your first parent to get started.'}
            icon={<Users className="w-12 h-12" />}
            action={
              !search ? {
                label: 'Add Parent',
                onClick: () => setShowAddModal(true),
                variant: 'primary' as const,
              } : undefined
            }
          />
        ) : (
          <>
            <div className="divide-y divide-slate-100">
              {parents.map((parent, index) => {
                const fullName =
                  [parent.user?.first_name, parent.user?.last_name]
                    .filter(Boolean)
                    .join(' ') || 'Unknown';

                return (
                  <motion.div
                    key={parent.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-5 hover:bg-slate-50/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center text-white font-semibold text-lg shrink-0">
                        {fullName.charAt(0).toUpperCase()}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-slate-900">{fullName}</p>
                          {parent.children && parent.children.length > 0 ? (
                            <Badge variant="success" size="sm">
                              {parent.children.length} student{parent.children.length > 1 ? 's' : ''}
                            </Badge>
                          ) : (
                            <Badge variant="warning" size="sm">No students</Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3.5 h-3.5" />
                            {parent.user?.email || 'N/A'}
                          </span>
                          {parent.user?.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3.5 h-3.5" />
                              {parent.user.phone}
                            </span>
                          )}
                          {parent.occupation && (
                            <span className="flex items-center gap-1">
                              <Briefcase className="w-3.5 h-3.5" />
                              {parent.occupation}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewParent(parent)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedParent(parent);
                            setShowLinkModal(true);
                          }}
                          leftIcon={<Link2 className="w-4 h-4" />}
                        >
                          Link
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

      {/* Modals */}
      {showAddModal && (
        <AddParentModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            fetchParents(false);
          }}
        />
      )}

      {showViewModal && selectedParent && (
        <ViewParentModal
          parent={selectedParent}
          onClose={() => {
            setShowViewModal(false);
            setSelectedParent(null);
          }}
          onLinkStudent={() => {
            setShowViewModal(false);
            setShowLinkModal(true);
          }}
          onUnlinkStudent={handleUnlinkStudent}
        />
      )}

      {showLinkModal && selectedParent && (
        <LinkStudentModal
          parent={selectedParent}
          onClose={() => {
            setShowLinkModal(false);
            setSelectedParent(null);
          }}
          onSuccess={() => {
            setShowLinkModal(false);
            if (selectedParent) {
              handleViewParent(selectedParent);
            }
            fetchParents(false);
          }}
        />
      )}
    </div>
  );
}

export default ParentsPage;
