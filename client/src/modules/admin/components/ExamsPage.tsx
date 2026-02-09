// Admin Exams Management Page
// Premium exam/assessment management with scheduling and analytics

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileQuestion,
  Plus,
  Calendar,
  MoreVertical,
  Edit2,
  Trash2,
  Copy,
  Play,
  CheckCircle,
  Target,
  Timer,
  Send,
  XCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import {
  Card,
  Button,
  IconButton,
  Badge,
  SearchInput,
  EmptyState,
  Skeleton,
  Pagination,
  Input,
  Select,
  Textarea,
} from '@shared/components/ui';
import { Stagger, StaggerItem, fadeInUp } from '@shared/components/ui/motion';
import { Modal, ModalHeader, ModalBody, ModalFooter, ConfirmModal } from '@shared/components/ui/Modal';
import clsx from 'clsx';

const API_URL = import.meta.env.VITE_API_URL || '/api';

// ============================================
// TYPES
// ============================================

interface Exam {
  id: string;
  title: string;
  description: string | null;
  exam_type: string | null;
  subject_id: string | null;
  course_id: string | null;
  batch_id: string | null;
  target_batch_type: string | null;
  target_class: string | null;
  duration_minutes: number;
  start_time: string | null;
  end_time: string | null;
  total_marks: number | null;
  passing_marks: number | null;
  max_attempts: number;
  status: 'draft' | 'scheduled' | 'live' | 'completed' | 'cancelled';
  created_at: string;
}

const typeLabels: Record<string, string> = {
  quiz: 'Quiz',
  test: 'Test',
  mock_test: 'Mock Test',
  final: 'Final Exam',
  practice: 'Practice',
};

const typeColors: Record<string, string> = {
  quiz: 'info',
  test: 'primary',
  mock_test: 'warning',
  final: 'danger',
  practice: 'default',
};

const statusColors: Record<string, 'success' | 'warning' | 'danger' | 'default' | 'primary'> = {
  draft: 'default',
  scheduled: 'warning',
  live: 'success',
  completed: 'primary',
  cancelled: 'danger',
};

/**
 * Compute the effective status of an exam based on its dates.
 * The DB status is static (set when admin publishes), so we derive
 * the real-time status from start_time / end_time.
 */
function computeEffectiveStatus(exam: Exam): Exam['status'] {
  // Draft and cancelled are admin-controlled — don't override
  if (exam.status === 'draft' || exam.status === 'cancelled') return exam.status;

  const now = new Date();

  // If end_time has passed → completed
  if (exam.end_time && new Date(exam.end_time) < now) return 'completed';

  // If start_time has passed (and end_time hasn't) → live
  if (exam.start_time && new Date(exam.start_time) <= now) return 'live';

  // start_time is in the future → scheduled
  if (exam.start_time && new Date(exam.start_time) > now) return 'scheduled';

  // No dates set — keep DB status
  return exam.status;
}

// ============================================
// MAIN COMPONENT
// ============================================

export function ExamsPage() {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [examToDelete, setExamToDelete] = useState<Exam | null>(null);
  const [stats, setStats] = useState({ total: 0, live: 0, scheduled: 0, draft: 0 });

  const authHeaders = async () => {
    const token = await getToken();
    return { Authorization: `Bearer ${token}` };
  };

  useEffect(() => {
    fetchExams();
  }, [currentPage, statusFilter, typeFilter, searchQuery]);

  const fetchExams = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(typeFilter !== 'all' && { examType: typeFilter }),
        ...(searchQuery && { search: searchQuery }),
      });

      const headers = await authHeaders();
      const response = await fetch(`${API_URL}/v2/exams?${params}`, { headers });
      const data = await response.json();

      if (data.success) {
        const items: Exam[] = (data.data?.items || []).map((e: Exam) => ({
          ...e,
          status: computeEffectiveStatus(e),
        }));
        setExams(items);
        setTotalPages(data.data?.totalPages || 1);
      }
    } catch (error) {
      console.error('Failed to fetch exams:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats separately to get accurate counts across all exams
  const fetchStats = async () => {
    try {
      const headers = await authHeaders();
      const response = await fetch(`${API_URL}/v2/exams?limit=1000`, { headers });
      const data = await response.json();

      if (data.success) {
        const items: Exam[] = (data.data?.items || []).map((e: Exam) => ({
          ...e,
          status: computeEffectiveStatus(e),
        }));
        const live = items.filter((e) => e.status === 'live').length;
        const scheduled = items.filter((e) => e.status === 'scheduled').length;
        const draft = items.filter((e) => e.status === 'draft').length;
        setStats({ total: data.data?.total || items.length, live, scheduled, draft });
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleDelete = async () => {
    if (!examToDelete) return;

    try {
      const headers = await authHeaders();
      const response = await fetch(`${API_URL}/v2/exams/${examToDelete.id}`, {
        method: 'DELETE',
        headers,
      });

      if (response.ok) {
        setShowDeleteConfirm(false);
        setExamToDelete(null);
        fetchExams();
        fetchStats();
      }
    } catch (error) {
      console.error('Failed to delete exam:', error);
    }
  };

  const handleStatusChange = async (exam: Exam, action: string) => {
    try {
      const headers = await authHeaders();
      const response = await fetch(`${API_URL}/v2/exams/${exam.id}/${action}`, {
        method: 'POST',
        headers,
      });

      if (response.ok) {
        fetchExams();
        fetchStats();
      }
    } catch (error) {
      console.error('Failed to update exam status:', error);
    }
  };

  const duplicateExam = async (exam: Exam) => {
    try {
      const headers = await authHeaders();
      const response = await fetch(`${API_URL}/v2/exams/${exam.id}/duplicate`, {
        method: 'POST',
        headers,
      });

      if (response.ok) {
        fetchExams();
        fetchStats();
      }
    } catch (error) {
      console.error('Failed to duplicate exam:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div {...fadeInUp}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-heading font-bold text-slate-900">Exams</h1>
            <p className="text-slate-500 mt-1">
              Create and manage assessments, quizzes, and tests
            </p>
          </div>
          <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowAddModal(true)}>
            Create Exam
          </Button>
        </div>
      </motion.div>

      {/* Stats */}
      <Stagger className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StaggerItem>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                <FileQuestion className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                <p className="text-xs text-slate-500">Total Exams</p>
              </div>
            </div>
          </Card>
        </StaggerItem>
        <StaggerItem>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <Play className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.live}</p>
                <p className="text-xs text-slate-500">Live Now</p>
              </div>
            </div>
          </Card>
        </StaggerItem>
        <StaggerItem>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.scheduled}</p>
                <p className="text-xs text-slate-500">Scheduled</p>
              </div>
            </div>
          </Card>
        </StaggerItem>
        <StaggerItem>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                <Edit2 className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.draft}</p>
                <p className="text-xs text-slate-500">Drafts</p>
              </div>
            </div>
          </Card>
        </StaggerItem>
      </Stagger>

      {/* Filters */}
      <Card>
        <div className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <SearchInput
                placeholder="Search exams by title..."
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            <div className="flex gap-3">
              <Select
                value={typeFilter}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                  setTypeFilter(e.target.value);
                  setCurrentPage(1);
                }}
                options={[
                  { value: 'all', label: 'All Types' },
                  { value: 'quiz', label: 'Quiz' },
                  { value: 'test', label: 'Test' },
                  { value: 'mock_test', label: 'Mock Test' },
                  { value: 'final', label: 'Final Exam' },
                  { value: 'practice', label: 'Practice' },
                ]}
              />
              <Select
                value={statusFilter}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                options={[
                  { value: 'all', label: 'All Status' },
                  { value: 'draft', label: 'Draft' },
                  { value: 'scheduled', label: 'Scheduled' },
                  { value: 'live', label: 'Live' },
                  { value: 'completed', label: 'Completed' },
                  { value: 'cancelled', label: 'Cancelled' },
                ]}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Exams List */}
      <Card noPadding>
        {loading ? (
          <div className="p-6 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="w-10 h-10 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        ) : exams.length === 0 ? (
          <EmptyState
            title="No exams found"
            description={searchQuery ? 'Try adjusting your search or filters' : 'Create your first exam to get started'}
            icon={<FileQuestion className="w-12 h-12" />}
            action={
              !searchQuery ? (
                <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowAddModal(true)}>
                  Create Exam
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            <div className="divide-y divide-slate-100">
              {exams.map((exam) => (
                <motion.div
                  key={exam.id}
                  {...fadeInUp}
                  className="px-6 py-4 hover:bg-slate-50/50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/dashboard/exams/${exam.id}/edit`)}
                >
                  <div className="flex items-center gap-4">
                    {/* Icon */}
                    <div className={clsx(
                      'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                      exam.status === 'live' ? 'bg-emerald-100' :
                      exam.status === 'scheduled' ? 'bg-amber-100' :
                      exam.status === 'completed' ? 'bg-indigo-100' :
                      'bg-slate-100'
                    )}>
                      <FileQuestion className={clsx(
                        'w-5 h-5',
                        exam.status === 'live' ? 'text-emerald-600' :
                        exam.status === 'scheduled' ? 'text-amber-600' :
                        exam.status === 'completed' ? 'text-indigo-600' :
                        'text-slate-500'
                      )} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-900 truncate">{exam.title}</p>
                        {exam.exam_type && (
                          <Badge variant={typeColors[exam.exam_type] as any || 'default'} size="sm">
                            {typeLabels[exam.exam_type] || exam.exam_type}
                          </Badge>
                        )}
                      </div>
                      {exam.description && (
                        <p className="text-xs text-slate-500 mt-0.5 truncate">{exam.description}</p>
                      )}
                    </div>

                    {/* Details */}
                    <div className="hidden md:flex items-center gap-4 text-xs text-slate-500 shrink-0">
                      <span className="flex items-center gap-1">
                        <Timer className="w-3.5 h-3.5" />
                        {exam.duration_minutes} min
                      </span>
                      {exam.total_marks && (
                        <span className="flex items-center gap-1">
                          <Target className="w-3.5 h-3.5" />
                          {exam.total_marks} marks
                        </span>
                      )}
                      {exam.start_time && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {format(new Date(exam.start_time), 'MMM d, h:mm a')}
                        </span>
                      )}
                    </div>

                    {/* Status */}
                    <Badge
                      variant={statusColors[exam.status] || 'default'}
                      size="sm"
                      className="shrink-0"
                    >
                      {exam.status.charAt(0).toUpperCase() + exam.status.slice(1)}
                    </Badge>

                    {/* Actions */}
                    <div onClick={(e) => e.stopPropagation()}>
                      <ExamActions
                        exam={exam}
                        onEdit={() => navigate(`/dashboard/exams/${exam.id}/edit`)}
                        onDelete={() => {
                          setExamToDelete(exam);
                          setShowDeleteConfirm(true);
                        }}
                        onStatusChange={(action) => handleStatusChange(exam, action)}
                        onDuplicate={() => duplicateExam(exam)}
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-slate-100">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </>
        )}
      </Card>

      {/* Add/Edit Exam Modal */}
      <Modal
        isOpen={showAddModal || !!editingExam}
        onClose={() => {
          setShowAddModal(false);
          setEditingExam(null);
        }}
        size="lg"
      >
        <ModalHeader
          onClose={() => {
            setShowAddModal(false);
            setEditingExam(null);
          }}
        >
          {editingExam ? 'Edit Exam' : 'Create New Exam'}
        </ModalHeader>
        <ExamForm
          exam={editingExam}
          getToken={getToken}
          onSave={(newExamId) => {
            setShowAddModal(false);
            setEditingExam(null);
            // Navigate to editor for new exams so user can add questions
            if (!editingExam && newExamId) {
              navigate(`/dashboard/exams/${newExamId}/edit`);
            } else {
              fetchExams();
              fetchStats();
            }
          }}
          onCancel={() => {
            setShowAddModal(false);
            setEditingExam(null);
          }}
        />
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setExamToDelete(null);
        }}
        onConfirm={handleDelete}
        title="Delete Exam"
        message={`Are you sure you want to delete "${examToDelete?.title}"? All attempt data will be lost. This action cannot be undone.`}
        confirmLabel="Delete Exam"
        variant="danger"
      />
    </div>
  );
}

// ============================================
// EXAM ACTIONS
// ============================================

function ExamActions({
  exam,
  onEdit,
  onDelete,
  onStatusChange,
  onDuplicate,
}: {
  exam: Exam;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (action: string) => void;
  onDuplicate: () => void;
}) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="relative">
      <IconButton variant="ghost" size="sm" onClick={() => setShowMenu(!showMenu)}>
        <MoreVertical className="w-4 h-4" />
      </IconButton>

      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-10"
            onMouseLeave={() => setShowMenu(false)}
          >
            <button
              onClick={() => { setShowMenu(false); onEdit(); }}
              className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
            >
              <Edit2 className="w-4 h-4" />
              Edit Details
            </button>

            {exam.status === 'draft' && (
              <button
                onClick={() => { setShowMenu(false); onStatusChange('publish'); }}
                className="w-full px-3 py-2 text-left text-sm text-emerald-600 hover:bg-emerald-50 flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                Publish
              </button>
            )}

            {(exam.status === 'scheduled' || exam.status === 'live') && (
              <button
                onClick={() => { setShowMenu(false); onStatusChange('complete'); }}
                className="w-full px-3 py-2 text-left text-sm text-amber-600 hover:bg-amber-50 flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Mark Completed
              </button>
            )}

            {exam.status !== 'cancelled' && exam.status !== 'completed' && (
              <button
                onClick={() => { setShowMenu(false); onStatusChange('cancel'); }}
                className="w-full px-3 py-2 text-left text-sm text-slate-500 hover:bg-slate-50 flex items-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                Cancel
              </button>
            )}

            <button
              onClick={() => { setShowMenu(false); onDuplicate(); }}
              className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
            >
              <Copy className="w-4 h-4" />
              Duplicate
            </button>

            <div className="border-t border-slate-100 my-1" />

            <button
              onClick={() => { setShowMenu(false); onDelete(); }}
              className="w-full px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================
// EXAM FORM
// ============================================

function ExamForm({
  exam,
  getToken,
  onSave,
  onCancel,
}: {
  exam: Exam | null;
  getToken: () => Promise<string | null>;
  onSave: (examId?: string) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    title: exam?.title || '',
    description: exam?.description || '',
    examType: exam?.exam_type || 'quiz',
    durationMinutes: exam?.duration_minutes || 30,
    totalMarks: exam?.total_marks || 100,
    passingMarks: exam?.passing_marks || 40,
    startTime: exam?.start_time
      ? format(new Date(exam.start_time), "yyyy-MM-dd'T'HH:mm")
      : '',
    endTime: exam?.end_time
      ? format(new Date(exam.end_time), "yyyy-MM-dd'T'HH:mm")
      : '',
    maxAttempts: exam?.max_attempts || 1,
    targetBatchType: exam?.target_batch_type || '',
    targetClass: exam?.target_class || '',
  });
  const [saving, setSaving] = useState(false);

  const classOptions = [
    { value: '6th', label: 'Class 6th' },
    { value: '7th', label: 'Class 7th' },
    { value: '8th', label: 'Class 8th' },
    { value: '9th', label: 'Class 9th' },
    { value: '10th', label: 'Class 10th' },
    { value: '11th', label: 'Class 11th' },
    { value: '12th', label: 'Class 12th' },
    { value: 'dropper', label: 'Dropper' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = await getToken();
      const url = exam ? `${API_URL}/v2/exams/${exam.id}` : `${API_URL}/v2/exams`;
      const method = exam ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description || null,
          examType: formData.examType || null,
          durationMinutes: formData.durationMinutes,
          totalMarks: formData.totalMarks,
          passingMarks: formData.passingMarks,
          startTime: formData.startTime ? new Date(formData.startTime).toISOString() : null,
          endTime: formData.endTime ? new Date(formData.endTime).toISOString() : null,
          maxAttempts: formData.maxAttempts,
          targetBatchType: formData.targetBatchType || null,
          targetClass: formData.targetClass || null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const newExamId = data.data?.id;
        onSave(newExamId);
      }
    } catch (error) {
      console.error('Failed to save exam:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <ModalBody>
        <div className="space-y-5">
          <Input
            label="Exam Title"
            value={formData.title}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g., Weekly Physics Quiz - Week 12"
            required
          />
          <Textarea
            label="Description"
            value={formData.description}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe the exam topics and instructions..."
            rows={2}
          />

          {/* Type & Duration */}
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Exam Type"
              value={formData.examType}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, examType: e.target.value })}
              options={[
                { value: 'quiz', label: 'Quiz' },
                { value: 'test', label: 'Test' },
                { value: 'mock_test', label: 'Mock Test' },
                { value: 'final', label: 'Final Exam' },
                { value: 'practice', label: 'Practice' },
              ]}
            />
            <Input
              label="Duration (minutes)"
              type="number"
              min={5}
              value={formData.durationMinutes}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, durationMinutes: parseInt(e.target.value) || 30 })}
              required
            />
          </div>

          {/* Targeting */}
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Coaching Type"
              value={formData.targetBatchType}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, targetBatchType: e.target.value })}
              options={[
                { value: '', label: 'All Students' },
                { value: 'coaching_offline', label: 'Offline Coaching' },
                { value: 'coaching_online', label: 'Online Coaching' },
                { value: 'test_series', label: 'Test Series' },
                { value: 'home_tuition', label: 'Home Tuition' },
              ]}
            />
            <Select
              label="Class"
              value={formData.targetClass}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, targetClass: e.target.value })}
              options={[{ value: '', label: 'All Classes' }, ...classOptions]}
            />
          </div>
          <p className="text-xs text-slate-500 -mt-3">
            Leave both as &quot;All&quot; to make this exam visible to every student. Select a coaching type and/or class to target specific students.
          </p>

          {/* Marks */}
          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Total Marks"
              type="number"
              min={1}
              value={formData.totalMarks}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, totalMarks: parseInt(e.target.value) || 100 })}
              required
            />
            <Input
              label="Passing Marks"
              type="number"
              min={0}
              max={formData.totalMarks}
              value={formData.passingMarks}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, passingMarks: parseInt(e.target.value) || 40 })}
              required
            />
            <Input
              label="Max Attempts"
              type="number"
              min={1}
              value={formData.maxAttempts}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, maxAttempts: parseInt(e.target.value) || 1 })}
              required
            />
          </div>

          {/* Schedule */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Time (Optional)"
              type="datetime-local"
              value={formData.startTime}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, startTime: e.target.value })}
            />
            <Input
              label="End Time (Optional)"
              type="datetime-local"
              value={formData.endTime}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, endTime: e.target.value })}
            />
          </div>

          {/* Info */}
          <div className="p-3 bg-indigo-50 rounded-xl">
            <p className="text-sm text-indigo-700">
              <strong>Note:</strong> After creating the exam, you can add questions from the exam editor. Use the "Publish" action to make it available to students.
            </p>
          </div>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={saving}>
          {exam ? 'Save Changes' : 'Create Exam'}
        </Button>
      </ModalFooter>
    </form>
  );
}
