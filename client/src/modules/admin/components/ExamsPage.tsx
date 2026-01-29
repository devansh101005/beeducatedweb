// Admin Exams Management Page
// Premium exam/assessment management with scheduling and analytics

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileQuestion,
  Search,
  Plus,
  Calendar,
  Clock,
  Users,
  BarChart3,
  MoreVertical,
  Edit2,
  Trash2,
  Copy,
  Eye,
  Play,
  Pause,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  Target,
  Award,
  Timer,
  BookOpen,
} from 'lucide-react';
import { format, formatDistanceToNow, isPast, isFuture } from 'date-fns';
import {
  PageTransition,
  FadeIn,
  Stagger,
  StaggerItem,
  HoverScale,
} from '@shared/components/ui/motion';
import { Button, IconButton } from '@shared/components/ui/Button';
import { Card, CardBody, StatCard } from '@shared/components/ui/Card';
import { SearchInput, Input, Select, Textarea } from '@shared/components/ui/Input';
import { Badge, StatusBadge } from '@shared/components/ui/Badge';
import { Modal, ModalHeader, ModalBody, ModalFooter, ConfirmModal } from '@shared/components/ui/Modal';
import { Table, Pagination } from '@shared/components/ui/Table';
import { SkeletonTable, SkeletonCard, InlineLoader } from '@shared/components/ui/Loading';
import { EmptyState } from '@shared/components/ui/EmptyState';

interface Exam {
  id: string;
  title: string;
  description: string;
  course: {
    id: string;
    name: string;
  };
  batch?: {
    id: string;
    name: string;
  };
  type: 'quiz' | 'test' | 'mock' | 'final';
  duration: number; // in minutes
  totalMarks: number;
  passingMarks: number;
  totalQuestions: number;
  scheduledAt?: string;
  endsAt?: string;
  status: 'draft' | 'scheduled' | 'live' | 'completed' | 'cancelled';
  attemptCount: number;
  avgScore?: number;
  createdAt: string;
}

const typeLabels: Record<string, string> = {
  quiz: 'Quiz',
  test: 'Test',
  mock: 'Mock Test',
  final: 'Final Exam',
};

const typeColors: Record<string, string> = {
  quiz: 'info',
  test: 'primary',
  mock: 'warning',
  final: 'danger',
};

const statusColors: Record<string, 'success' | 'warning' | 'danger' | 'default' | 'primary'> = {
  draft: 'default',
  scheduled: 'warning',
  live: 'success',
  completed: 'primary',
  cancelled: 'danger',
};

export function ExamsPage() {
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
  const [courses, setCourses] = useState<{ id: string; name: string }[]>([]);
  const [batches, setBatches] = useState<{ id: string; name: string }[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    live: 0,
    scheduled: 0,
    avgScore: 0,
  });

  useEffect(() => {
    fetchExams();
    fetchCourses();
    fetchBatches();
    fetchStats();
  }, [currentPage, statusFilter, typeFilter, searchQuery]);

  const fetchExams = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(typeFilter !== 'all' && { type: typeFilter }),
        ...(searchQuery && { search: searchQuery }),
      });

      const response = await fetch(`/api/v2/exams?${params}`);
      const data = await response.json();

      if (data.success) {
        setExams(data.data.exams);
        setTotalPages(data.data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Failed to fetch exams:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/v2/courses?limit=100');
      const data = await response.json();
      if (data.success) {
        setCourses(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    }
  };

  const fetchBatches = async () => {
    try {
      const response = await fetch('/api/v2/batches?status=active&limit=100');
      const data = await response.json();
      if (data.success) {
        setBatches(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch batches:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/v2/exams/stats');
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleDelete = async () => {
    if (!examToDelete) return;

    try {
      const response = await fetch(`/api/v2/exams/${examToDelete.id}`, {
        method: 'DELETE',
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

  const handleStatusChange = async (exam: Exam, newStatus: string) => {
    try {
      const response = await fetch(`/api/v2/exams/${exam.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
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
      const response = await fetch(`/api/v2/exams/${exam.id}/duplicate`, {
        method: 'POST',
      });

      if (response.ok) {
        fetchExams();
        fetchStats();
      }
    } catch (error) {
      console.error('Failed to duplicate exam:', error);
    }
  };

  const columns = [
    {
      key: 'title',
      header: 'Exam',
      render: (exam: Exam) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-neutral-900">{exam.title}</span>
            <Badge variant={typeColors[exam.type] as any} className="text-xs">
              {typeLabels[exam.type]}
            </Badge>
          </div>
          <p className="text-sm text-neutral-500 mt-0.5">{exam.course.name}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (exam: Exam) => (
        <StatusBadge
          status={statusColors[exam.status]}
          label={exam.status.charAt(0).toUpperCase() + exam.status.slice(1)}
        />
      ),
    },
    {
      key: 'schedule',
      header: 'Schedule',
      render: (exam: Exam) => (
        <div className="text-sm">
          {exam.scheduledAt ? (
            <>
              <div className="text-neutral-900">
                {format(new Date(exam.scheduledAt), 'MMM d, yyyy')}
              </div>
              <div className="text-neutral-500">
                {format(new Date(exam.scheduledAt), 'h:mm a')}
              </div>
            </>
          ) : (
            <span className="text-neutral-400">Not scheduled</span>
          )}
        </div>
      ),
    },
    {
      key: 'details',
      header: 'Details',
      render: (exam: Exam) => (
        <div className="flex items-center gap-4 text-sm text-neutral-600">
          <span className="flex items-center gap-1">
            <Timer className="w-4 h-4" />
            {exam.duration} min
          </span>
          <span className="flex items-center gap-1">
            <Target className="w-4 h-4" />
            {exam.totalMarks} marks
          </span>
          <span className="flex items-center gap-1">
            <FileQuestion className="w-4 h-4" />
            {exam.totalQuestions} Qs
          </span>
        </div>
      ),
    },
    {
      key: 'attempts',
      header: 'Attempts',
      render: (exam: Exam) => (
        <div className="text-sm">
          <div className="font-medium text-neutral-900">{exam.attemptCount}</div>
          {exam.avgScore !== undefined && (
            <div className="text-neutral-500">Avg: {exam.avgScore.toFixed(1)}%</div>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (exam: Exam) => (
        <ExamActions
          exam={exam}
          onEdit={() => setEditingExam(exam)}
          onDelete={() => {
            setExamToDelete(exam);
            setShowDeleteConfirm(true);
          }}
          onStatusChange={(status) => handleStatusChange(exam, status)}
          onDuplicate={() => duplicateExam(exam)}
        />
      ),
    },
  ];

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <FadeIn>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">Exams</h1>
              <p className="text-neutral-600 mt-1">
                Create and manage assessments, quizzes, and tests
              </p>
            </div>
            <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowAddModal(true)}>
              Create Exam
            </Button>
          </div>
        </FadeIn>

        {/* Stats */}
        <Stagger className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StaggerItem>
            <StatCard
              title="Total Exams"
              value={stats.total}
              icon={<FileQuestion className="w-5 h-5" />}
              color="primary"
            />
          </StaggerItem>
          <StaggerItem>
            <StatCard
              title="Live Now"
              value={stats.live}
              icon={<Play className="w-5 h-5" />}
              color="success"
            />
          </StaggerItem>
          <StaggerItem>
            <StatCard
              title="Scheduled"
              value={stats.scheduled}
              icon={<Calendar className="w-5 h-5" />}
              color="warning"
            />
          </StaggerItem>
          <StaggerItem>
            <StatCard
              title="Avg. Score"
              value={`${stats.avgScore.toFixed(1)}%`}
              icon={<BarChart3 className="w-5 h-5" />}
              color="info"
            />
          </StaggerItem>
        </Stagger>

        {/* Filters */}
        <FadeIn delay={0.1}>
          <Card>
            <CardBody className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <SearchInput
                    placeholder="Search exams by title..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex gap-3">
                  <Select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="w-36"
                  >
                    <option value="all">All Types</option>
                    <option value="quiz">Quiz</option>
                    <option value="test">Test</option>
                    <option value="mock">Mock Test</option>
                    <option value="final">Final Exam</option>
                  </Select>
                  <Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-36"
                  >
                    <option value="all">All Status</option>
                    <option value="draft">Draft</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="live">Live</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </Select>
                </div>
              </div>
            </CardBody>
          </Card>
        </FadeIn>

        {/* Exams Table */}
        <FadeIn delay={0.2}>
          <Card>
            {loading ? (
              <SkeletonTable rows={5} columns={6} />
            ) : exams.length === 0 ? (
              <EmptyState
                title="No exams found"
                description={searchQuery ? 'Try adjusting your search or filters' : 'Create your first exam to get started'}
                icon={<FileQuestion className="w-12 h-12" />}
                action={
                  <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowAddModal(true)}>
                    Create Exam
                  </Button>
                }
              />
            ) : (
              <>
                <Table data={exams} columns={columns} />
                <div className="px-6 py-4 border-t border-neutral-200">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
              </>
            )}
          </Card>
        </FadeIn>

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
            courses={courses}
            batches={batches}
            onSave={() => {
              setShowAddModal(false);
              setEditingExam(null);
              fetchExams();
              fetchStats();
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
    </PageTransition>
  );
}

// Exam Actions Component
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
  onStatusChange: (status: string) => void;
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
            className="absolute right-0 mt-1 w-44 bg-white rounded-lg shadow-lg border border-neutral-200 py-1 z-10"
            onMouseLeave={() => setShowMenu(false)}
          >
            <button
              onClick={() => {
                setShowMenu(false);
                onEdit();
              }}
              className="w-full px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 flex items-center gap-2"
            >
              <Edit2 className="w-4 h-4" />
              Edit Details
            </button>

            {exam.status === 'draft' && (
              <button
                onClick={() => {
                  setShowMenu(false);
                  onStatusChange('scheduled');
                }}
                className="w-full px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 flex items-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                Schedule
              </button>
            )}

            {exam.status === 'scheduled' && (
              <button
                onClick={() => {
                  setShowMenu(false);
                  onStatusChange('live');
                }}
                className="w-full px-3 py-2 text-left text-sm text-success-600 hover:bg-success-50 flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                Start Now
              </button>
            )}

            {exam.status === 'live' && (
              <button
                onClick={() => {
                  setShowMenu(false);
                  onStatusChange('completed');
                }}
                className="w-full px-3 py-2 text-left text-sm text-warning-600 hover:bg-warning-50 flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                End Exam
              </button>
            )}

            <button
              onClick={() => {
                setShowMenu(false);
                // Navigate to view results
              }}
              className="w-full px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 flex items-center gap-2"
            >
              <BarChart3 className="w-4 h-4" />
              View Results
            </button>

            <button
              onClick={() => {
                setShowMenu(false);
                onDuplicate();
              }}
              className="w-full px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 flex items-center gap-2"
            >
              <Copy className="w-4 h-4" />
              Duplicate
            </button>

            <div className="border-t border-neutral-100 my-1" />

            <button
              onClick={() => {
                setShowMenu(false);
                onDelete();
              }}
              className="w-full px-3 py-2 text-left text-sm text-danger-600 hover:bg-danger-50 flex items-center gap-2"
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

// Exam Form Component
function ExamForm({
  exam,
  courses,
  batches,
  onSave,
  onCancel,
}: {
  exam: Exam | null;
  courses: { id: string; name: string }[];
  batches: { id: string; name: string }[];
  onSave: () => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    title: exam?.title || '',
    description: exam?.description || '',
    courseId: exam?.course.id || '',
    batchId: exam?.batch?.id || '',
    type: exam?.type || 'quiz',
    duration: exam?.duration || 30,
    totalMarks: exam?.totalMarks || 100,
    passingMarks: exam?.passingMarks || 40,
    scheduledAt: exam?.scheduledAt
      ? format(new Date(exam.scheduledAt), "yyyy-MM-dd'T'HH:mm")
      : '',
    status: exam?.status || 'draft',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = exam ? `/api/v2/exams/${exam.id}` : '/api/v2/exams';
      const method = exam ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          batchId: formData.batchId || null,
          scheduledAt: formData.scheduledAt || null,
        }),
      });

      if (response.ok) {
        onSave();
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
          {/* Basic Info */}
          <Input
            label="Exam Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g., Weekly Physics Quiz - Week 12"
            required
          />
          <Textarea
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe the exam topics and instructions..."
            rows={2}
          />

          {/* Course & Batch */}
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Course"
              value={formData.courseId}
              onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
              required
            >
              <option value="">Select course</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
            </Select>
            <Select
              label="Batch (Optional)"
              value={formData.batchId}
              onChange={(e) => setFormData({ ...formData, batchId: e.target.value })}
            >
              <option value="">All batches</option>
              {batches.map((batch) => (
                <option key={batch.id} value={batch.id}>
                  {batch.name}
                </option>
              ))}
            </Select>
          </div>

          {/* Type & Duration */}
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Exam Type"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
            >
              <option value="quiz">Quiz</option>
              <option value="test">Test</option>
              <option value="mock">Mock Test</option>
              <option value="final">Final Exam</option>
            </Select>
            <Input
              label="Duration (minutes)"
              type="number"
              min={5}
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
              required
            />
          </div>

          {/* Marks */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Total Marks"
              type="number"
              min={1}
              value={formData.totalMarks}
              onChange={(e) => setFormData({ ...formData, totalMarks: parseInt(e.target.value) })}
              required
            />
            <Input
              label="Passing Marks"
              type="number"
              min={0}
              max={formData.totalMarks}
              value={formData.passingMarks}
              onChange={(e) => setFormData({ ...formData, passingMarks: parseInt(e.target.value) })}
              required
            />
          </div>

          {/* Schedule */}
          <Input
            label="Schedule Date & Time (Optional)"
            type="datetime-local"
            value={formData.scheduledAt}
            onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
          />

          {/* Status */}
          <Select
            label="Status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
          >
            <option value="draft">Draft</option>
            <option value="scheduled">Scheduled</option>
            <option value="live">Live</option>
          </Select>

          {/* Info */}
          <div className="p-3 bg-primary-50 rounded-lg">
            <p className="text-sm text-primary-700">
              <strong>Note:</strong> After creating the exam, you can add questions from the exam editor.
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
