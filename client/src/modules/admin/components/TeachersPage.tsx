// Teachers Management Page
// List and manage teacher profiles

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserCog,
  Plus,
  RefreshCw,
  Mail,
  Phone,
  Eye,
  X,
  CheckCircle,
  AlertCircle,
  BookOpen,
  Award,
  Briefcase,
  Search,
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

interface Teacher {
  id: string;
  user_id: string;
  teacher_id: string;
  specialization: string | null;
  subjects: string[] | null;
  qualification: string | null;
  experience_years: number | null;
  bio: string | null;
  is_active: boolean;
  joined_at: string;
  created_at: string;
  user?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
    phone: string | null;
    avatar_url: string | null;
  };
}

interface UserForTeacher {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
}

const API_URL = import.meta.env.VITE_API_URL || '/api';

// ============================================
// ADD TEACHER MODAL
// ============================================

interface AddTeacherModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

function AddTeacherModal({ onClose, onSuccess }: AddTeacherModalProps) {
  const { getToken } = useAuth();

  const [userSearch, setUserSearch] = useState('');
  const [searchResults, setSearchResults] = useState<UserForTeacher[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserForTeacher | null>(null);

  const [specialization, setSpecialization] = useState('');
  const [subjects, setSubjects] = useState('');
  const [qualification, setQualification] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [bio, setBio] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const searchUsers = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/v2/admin/users?search=${encodeURIComponent(query)}&limit=10`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        const users = (data.data?.items || []).filter(
          (u: UserForTeacher) => u.role === 'user' || u.role === 'teacher'
        );
        setSearchResults(users);
      }
    } catch (err) {
      console.error('Failed to search users:', err);
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (userSearch) searchUsers(userSearch);
    }, 300);
    return () => clearTimeout(debounce);
  }, [userSearch]);

  const handleCreate = async () => {
    if (!selectedUser) {
      setError('Please select a user');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/v2/admin/teachers`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedUser.id,
          specialization: specialization || undefined,
          subjects: subjects ? subjects.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
          qualification: qualification || undefined,
          experienceYears: experienceYears ? parseInt(experienceYears) : undefined,
          bio: bio || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to create teacher');
      }

      onSuccess();
    } catch (err: any) {
      console.error('Error creating teacher:', err);
      setError(err.message || 'Failed to create teacher');
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
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
                <Plus className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <h2 className="text-lg font-heading font-semibold text-slate-900">Add Teacher</h2>
                <p className="text-sm text-slate-500">Assign teacher role to an existing user</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto max-h-[60vh] space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            {/* User Search */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Select User <span className="text-rose-500">*</span>
              </label>
              {selectedUser ? (
                <div className="p-3 bg-teal-50 rounded-lg flex items-center justify-between">
                  <div>
                    <p className="font-medium text-teal-900">
                      {[selectedUser.first_name, selectedUser.last_name].filter(Boolean).join(' ') || selectedUser.email}
                    </p>
                    <p className="text-xs text-teal-700">{selectedUser.email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedUser(null);
                      setUserSearch('');
                    }}
                    className="text-teal-600 hover:text-teal-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Input
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      placeholder="Search by name or email..."
                      leftIcon={<Search className="w-4 h-4" />}
                    />
                    {searching && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Spinner size="sm" />
                      </div>
                    )}
                  </div>
                  {searchResults.length > 0 && (
                    <div className="mt-1 border border-slate-200 rounded-lg max-h-40 overflow-y-auto">
                      {searchResults.map((user) => (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => {
                            setSelectedUser(user);
                            setSearchResults([]);
                          }}
                          className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center justify-between"
                        >
                          <div>
                            <p className="font-medium text-slate-900">
                              {[user.first_name, user.last_name].filter(Boolean).join(' ') || 'Unnamed'}
                            </p>
                            <p className="text-xs text-slate-500">{user.email}</p>
                          </div>
                          <Badge variant="default" size="sm">{user.role}</Badge>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Specialization</label>
              <Input
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                placeholder="e.g., Mathematics, Physics"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Subjects (comma-separated)</label>
              <Input
                value={subjects}
                onChange={(e) => setSubjects(e.target.value)}
                placeholder="e.g., Mathematics, Calculus, Algebra"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Qualification</label>
                <Input
                  value={qualification}
                  onChange={(e) => setQualification(e.target.value)}
                  placeholder="e.g., M.Sc, B.Ed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Experience (years)</label>
                <Input
                  type="number"
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(e.target.value)}
                  placeholder="e.g., 5"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Short bio about the teacher..."
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none resize-none"
              />
            </div>
          </div>

          <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button
              variant="primary"
              onClick={handleCreate}
              disabled={loading || !selectedUser}
              leftIcon={loading ? <Spinner size="sm" /> : <CheckCircle className="w-4 h-4" />}
            >
              {loading ? 'Creating...' : 'Create Teacher'}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ============================================
// VIEW TEACHER MODAL
// ============================================

interface ViewTeacherModalProps {
  teacher: Teacher;
  onClose: () => void;
}

function ViewTeacherModal({ teacher, onClose }: ViewTeacherModalProps) {
  const fullName = [teacher.user?.first_name, teacher.user?.last_name].filter(Boolean).join(' ') || 'Unknown';

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
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center text-white font-semibold text-lg">
                {fullName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-lg font-heading font-semibold text-slate-900">{fullName}</h2>
                <p className="text-sm text-slate-500">{teacher.teacher_id}</p>
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
            {/* Status */}
            <div className="flex items-center gap-2">
              <Badge variant={teacher.is_active ? 'success' : 'danger'}>
                {teacher.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>

            {/* Contact Info */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Contact Information</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span>{teacher.user?.email || 'N/A'}</span>
                </div>
                {teacher.user?.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span>{teacher.user.phone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Professional Info */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Professional Details</h3>
              <div className="space-y-3">
                {teacher.specialization && (
                  <div>
                    <p className="text-xs text-slate-500">Specialization</p>
                    <p className="text-sm font-medium text-slate-900">{teacher.specialization}</p>
                  </div>
                )}
                {teacher.qualification && (
                  <div>
                    <p className="text-xs text-slate-500">Qualification</p>
                    <p className="text-sm font-medium text-slate-900">{teacher.qualification}</p>
                  </div>
                )}
                {teacher.experience_years != null && (
                  <div>
                    <p className="text-xs text-slate-500">Experience</p>
                    <p className="text-sm font-medium text-slate-900">{teacher.experience_years} years</p>
                  </div>
                )}
                {teacher.subjects && teacher.subjects.length > 0 && (
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Subjects</p>
                    <div className="flex flex-wrap gap-1">
                      {teacher.subjects.map((subject) => (
                        <Badge key={subject} variant="default" size="sm">{subject}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {teacher.bio && (
                  <div>
                    <p className="text-xs text-slate-500">Bio</p>
                    <p className="text-sm text-slate-700">{teacher.bio}</p>
                  </div>
                )}
              </div>
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

export function TeachersPage() {
  const { getToken } = useAuth();

  // Data state
  const [teachers, setTeachers] = useState<Teacher[]>([]);
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
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);

  // Fetch teachers
  const fetchTeachers = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    else setRefreshing(true);

    try {
      const token = await getToken();
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (search) params.append('search', search);

      const res = await fetch(`${API_URL}/v2/admin/teachers?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (data.success) {
        setTeachers(data.data?.items || []);
        setTotalPages(data.data?.totalPages || 1);
        setTotalItems(data.data?.total || 0);
      }
    } catch (error) {
      console.error('Error fetching teachers:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, [page]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (page === 1) {
        fetchTeachers();
      } else {
        setPage(1);
      }
    }, 500);
    return () => clearTimeout(debounce);
  }, [search]);

  const handleRefresh = () => {
    fetchTeachers(false);
  };

  const activeCount = teachers.filter((t) => t.is_active).length;

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
            <UserCog className="w-7 h-7 text-teal-600" />
            Teachers
          </h1>
          <p className="text-slate-500 mt-1">
            Manage teacher profiles and assignments
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            onClick={() => setShowAddModal(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Teacher
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
              <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center">
                <UserCog className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-900">
                  {loading ? '--' : totalItems}
                </p>
                <p className="text-xs text-slate-500">Total Teachers</p>
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
                <p className="text-2xl font-semibold text-slate-900">
                  {loading ? '--' : activeCount}
                </p>
                <p className="text-xs text-slate-500">Active</p>
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
                  {loading ? '--' : totalItems - activeCount}
                </p>
                <p className="text-xs text-slate-500">Inactive</p>
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
          placeholder="Search by ID, specialization..."
        />
      </Card>

      {/* Teachers List */}
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
        ) : teachers.length === 0 ? (
          <EmptyState
            variant="search"
            title="No teachers found"
            description={search ? 'Try adjusting your search.' : 'Add your first teacher to get started.'}
            icon={<UserCog className="w-12 h-12" />}
            action={
              !search
                ? {
                    label: 'Add Teacher',
                    onClick: () => setShowAddModal(true),
                    variant: 'primary' as const,
                  }
                : undefined
            }
          />
        ) : (
          <>
            <div className="divide-y divide-slate-100">
              {teachers.map((teacher, index) => {
                const fullName =
                  [teacher.user?.first_name, teacher.user?.last_name]
                    .filter(Boolean)
                    .join(' ') || 'Unknown';

                return (
                  <motion.div
                    key={teacher.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-5 hover:bg-slate-50/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center text-white font-semibold text-lg shrink-0">
                        {fullName.charAt(0).toUpperCase()}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-slate-900">{fullName}</p>
                          <Badge variant="default" size="sm">{teacher.teacher_id}</Badge>
                          <Badge variant={teacher.is_active ? 'success' : 'danger'} size="sm">
                            {teacher.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3.5 h-3.5" />
                            {teacher.user?.email || 'N/A'}
                          </span>
                          {teacher.user?.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3.5 h-3.5" />
                              {teacher.user.phone}
                            </span>
                          )}
                          {teacher.specialization && (
                            <span className="flex items-center gap-1">
                              <BookOpen className="w-3.5 h-3.5" />
                              {teacher.specialization}
                            </span>
                          )}
                          {teacher.qualification && (
                            <span className="flex items-center gap-1">
                              <Award className="w-3.5 h-3.5" />
                              {teacher.qualification}
                            </span>
                          )}
                          {teacher.experience_years != null && (
                            <span className="flex items-center gap-1">
                              <Briefcase className="w-3.5 h-3.5" />
                              {teacher.experience_years}y exp
                            </span>
                          )}
                        </div>
                        {teacher.subjects && teacher.subjects.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {teacher.subjects.map((subject) => (
                              <span
                                key={subject}
                                className="px-2 py-0.5 bg-teal-50 text-teal-700 text-xs rounded-full"
                              >
                                {subject}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedTeacher(teacher)}
                        >
                          <Eye className="w-4 h-4" />
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
        <AddTeacherModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            fetchTeachers(false);
          }}
        />
      )}

      {selectedTeacher && (
        <ViewTeacherModal
          teacher={selectedTeacher}
          onClose={() => setSelectedTeacher(null)}
        />
      )}
    </div>
  );
}

export default TeachersPage;
