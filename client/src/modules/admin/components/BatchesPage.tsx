// Admin Batches Management Page
// Premium batch/class management with scheduling and student assignment

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Calendar,
  Clock,
  Edit2,
  Trash2,
  Copy,
  MoreVertical,
  ChevronRight,
  BookOpen,
  GraduationCap,
  Layers,
} from 'lucide-react';
import { format } from 'date-fns';
import {
  PageTransition,
  FadeIn,
  Stagger,
  StaggerItem,
  HoverScale,
} from '@shared/components/ui/motion';
import { Button, IconButton } from '@shared/components/ui/Button';
import { Card, CardBody, StatCard } from '@shared/components/ui/Card';
import { SearchInput, Input, Select } from '@shared/components/ui/Input';
import { Badge, StatusBadge } from '@shared/components/ui/Badge';
import { Avatar } from '@shared/components/ui/Avatar';
import { Modal, ModalHeader, ModalBody, ModalFooter, ConfirmModal } from '@shared/components/ui/Modal';
import { SkeletonCard } from '@shared/components/ui/Loading';
import { EmptyState } from '@shared/components/ui/EmptyState';

interface Batch {
  id: string;
  name: string;
  code: string;
  course: {
    id: string;
    name: string;
  };
  teacher: {
    id: string;
    name: string;
    avatar?: string;
  };
  schedule: {
    days: string[];
    startTime: string;
    endTime: string;
  };
  startDate: string;
  endDate?: string;
  maxStudents: number;
  enrolledCount: number;
  status: 'active' | 'upcoming' | 'completed' | 'paused';
  createdAt: string;
}

const statusColors: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
  active: 'success',
  upcoming: 'warning',
  completed: 'default',
  paused: 'danger',
};

const daysShort: Record<string, string> = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun',
};

export function BatchesPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [courses, setCourses] = useState<{ id: string; name: string }[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [batchToDelete, setBatchToDelete] = useState<Batch | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    upcoming: 0,
    totalStudents: 0,
  });

  useEffect(() => {
    fetchBatches();
    fetchCourses();
    fetchStats();
  }, [statusFilter, courseFilter, searchQuery]);

  const fetchBatches = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(courseFilter !== 'all' && { courseId: courseFilter }),
        ...(searchQuery && { search: searchQuery }),
      });

      const response = await fetch(`/api/v2/batches?${params}`);
      const data = await response.json();

      if (data.success) {
        setBatches(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch batches:', error);
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

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/v2/batches/stats');
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleDelete = async () => {
    if (!batchToDelete) return;

    try {
      const response = await fetch(`/api/v2/batches/${batchToDelete.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setShowDeleteConfirm(false);
        setBatchToDelete(null);
        fetchBatches();
        fetchStats();
      }
    } catch (error) {
      console.error('Failed to delete batch:', error);
    }
  };

  const duplicateBatch = async (batch: Batch) => {
    try {
      const response = await fetch(`/api/v2/batches/${batch.id}/duplicate`, {
        method: 'POST',
      });

      if (response.ok) {
        fetchBatches();
        fetchStats();
      }
    } catch (error) {
      console.error('Failed to duplicate batch:', error);
    }
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <FadeIn>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">Batches</h1>
              <p className="text-neutral-600 mt-1">
                Manage classes, schedules, and student enrollments
              </p>
            </div>
            <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowAddModal(true)}>
              Create Batch
            </Button>
          </div>
        </FadeIn>

        {/* Stats */}
        <Stagger className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StaggerItem>
            <StatCard
              title="Total Batches"
              value={stats.total}
              icon={<Layers className="w-5 h-5" />}
              color="primary"
            />
          </StaggerItem>
          <StaggerItem>
            <StatCard
              title="Active"
              value={stats.active}
              icon={<BookOpen className="w-5 h-5" />}
              color="success"
            />
          </StaggerItem>
          <StaggerItem>
            <StatCard
              title="Upcoming"
              value={stats.upcoming}
              icon={<Calendar className="w-5 h-5" />}
              color="warning"
            />
          </StaggerItem>
          <StaggerItem>
            <StatCard
              title="Total Students"
              value={stats.totalStudents}
              icon={<GraduationCap className="w-5 h-5" />}
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
                    placeholder="Search batches by name or code..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex gap-3">
                  <Select
                    value={courseFilter}
                    onChange={(e) => setCourseFilter(e.target.value)}
                    className="w-48"
                  >
                    <option value="all">All Courses</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.name}
                      </option>
                    ))}
                  </Select>
                  <Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-40"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="completed">Completed</option>
                    <option value="paused">Paused</option>
                  </Select>
                </div>
              </div>
            </CardBody>
          </Card>
        </FadeIn>

        {/* Batches Grid */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : batches.length === 0 ? (
          <EmptyState
            title="No batches found"
            description={searchQuery ? 'Try adjusting your search or filters' : 'Create your first batch to get started'}
            icon={<Layers className="w-12 h-12" />}
            action={
              <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowAddModal(true)}>
                Create Batch
              </Button>
            }
          />
        ) : (
          <Stagger className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {batches.map((batch) => (
              <StaggerItem key={batch.id}>
                <BatchCard
                  batch={batch}
                  onEdit={() => setEditingBatch(batch)}
                  onDelete={() => {
                    setBatchToDelete(batch);
                    setShowDeleteConfirm(true);
                  }}
                  onDuplicate={() => duplicateBatch(batch)}
                />
              </StaggerItem>
            ))}
          </Stagger>
        )}

        {/* Add/Edit Batch Modal */}
        <Modal
          isOpen={showAddModal || !!editingBatch}
          onClose={() => {
            setShowAddModal(false);
            setEditingBatch(null);
          }}
          size="lg"
        >
          <ModalHeader
            onClose={() => {
              setShowAddModal(false);
              setEditingBatch(null);
            }}
          >
            {editingBatch ? 'Edit Batch' : 'Create New Batch'}
          </ModalHeader>
          <BatchForm
            batch={editingBatch}
            courses={courses}
            onSave={() => {
              setShowAddModal(false);
              setEditingBatch(null);
              fetchBatches();
              fetchStats();
            }}
            onCancel={() => {
              setShowAddModal(false);
              setEditingBatch(null);
            }}
          />
        </Modal>

        {/* Delete Confirmation */}
        <ConfirmModal
          isOpen={showDeleteConfirm}
          onClose={() => {
            setShowDeleteConfirm(false);
            setBatchToDelete(null);
          }}
          onConfirm={handleDelete}
          title="Delete Batch"
          message={`Are you sure you want to delete "${batchToDelete?.name}"? This will remove all enrolled students from this batch. This action cannot be undone.`}
          confirmLabel="Delete Batch"
          variant="danger"
        />
      </div>
    </PageTransition>
  );
}

// Batch Card Component
function BatchCard({
  batch,
  onEdit,
  onDelete,
  onDuplicate,
}: {
  batch: Batch;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const enrollmentPercent = (batch.enrolledCount / batch.maxStudents) * 100;

  return (
    <HoverScale>
      <Card className="h-full">
        <CardBody className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-neutral-900">{batch.name}</h3>
                <Badge variant="default" className="text-xs">
                  {batch.code}
                </Badge>
              </div>
              <p className="text-sm text-neutral-600">{batch.course.name}</p>
            </div>
            <div className="relative">
              <IconButton
                variant="ghost"
                size="sm"
                onClick={() => setShowMenu(!showMenu)}
              >
                <MoreVertical className="w-4 h-4" />
              </IconButton>

              <AnimatePresence>
                {showMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-neutral-200 py-1 z-10"
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
                      Edit
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
          </div>

          {/* Status */}
          <div className="mb-4">
            <StatusBadge
              status={statusColors[batch.status]}
              label={batch.status.charAt(0).toUpperCase() + batch.status.slice(1)}
            />
          </div>

          {/* Schedule */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-sm text-neutral-600">
              <Calendar className="w-4 h-4" />
              <span>
                {batch.schedule.days.map((d) => daysShort[d.toLowerCase()]).join(', ')}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-neutral-600">
              <Clock className="w-4 h-4" />
              <span>
                {batch.schedule.startTime} - {batch.schedule.endTime}
              </span>
            </div>
          </div>

          {/* Teacher */}
          <div className="flex items-center gap-3 mb-4 p-3 bg-neutral-50 rounded-lg">
            <Avatar
              name={batch.teacher.name}
              src={batch.teacher.avatar}
              size="sm"
            />
            <div>
              <p className="text-sm font-medium text-neutral-900">{batch.teacher.name}</p>
              <p className="text-xs text-neutral-500">Instructor</p>
            </div>
          </div>

          {/* Enrollment */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-600">Enrollment</span>
              <span className="font-medium text-neutral-900">
                {batch.enrolledCount} / {batch.maxStudents}
              </span>
            </div>
            <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${enrollmentPercent}%` }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className={`h-full rounded-full ${
                  enrollmentPercent >= 90
                    ? 'bg-danger-500'
                    : enrollmentPercent >= 70
                    ? 'bg-warning-500'
                    : 'bg-success-500'
                }`}
              />
            </div>
          </div>

          {/* View Details Link */}
          <button className="mt-4 w-full py-2 text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center justify-center gap-1 transition-colors">
            View Details
            <ChevronRight className="w-4 h-4" />
          </button>
        </CardBody>
      </Card>
    </HoverScale>
  );
}

// Batch Form Component
function BatchForm({
  batch,
  courses,
  onSave,
  onCancel,
}: {
  batch: Batch | null;
  courses: { id: string; name: string }[];
  onSave: () => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    name: batch?.name || '',
    code: batch?.code || '',
    courseId: batch?.course.id || '',
    teacherId: batch?.teacher.id || '',
    scheduleDays: batch?.schedule.days || [],
    startTime: batch?.schedule.startTime || '09:00',
    endTime: batch?.schedule.endTime || '11:00',
    startDate: batch?.startDate ? format(new Date(batch.startDate), 'yyyy-MM-dd') : '',
    endDate: batch?.endDate ? format(new Date(batch.endDate), 'yyyy-MM-dd') : '',
    maxStudents: batch?.maxStudents || 30,
    status: batch?.status || 'upcoming',
  });
  const [teachers, setTeachers] = useState<{ id: string; name: string }[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      const response = await fetch('/api/v2/admin/users?role=teacher&limit=100');
      const data = await response.json();
      if (data.success) {
        setTeachers(
          data.data.users.map((t: any) => ({
            id: t.id,
            name: `${t.firstName} ${t.lastName}`,
          }))
        );
      }
    } catch (error) {
      console.error('Failed to fetch teachers:', error);
    }
  };

  const handleDayToggle = (day: string) => {
    setFormData((prev) => ({
      ...prev,
      scheduleDays: prev.scheduleDays.includes(day)
        ? prev.scheduleDays.filter((d) => d !== day)
        : [...prev.scheduleDays, day],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = batch
        ? `/api/v2/batches/${batch.id}`
        : '/api/v2/batches';
      const method = batch ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          code: formData.code,
          courseId: formData.courseId,
          teacherId: formData.teacherId,
          schedule: {
            days: formData.scheduleDays,
            startTime: formData.startTime,
            endTime: formData.endTime,
          },
          startDate: formData.startDate,
          endDate: formData.endDate || null,
          maxStudents: formData.maxStudents,
          status: formData.status,
        }),
      });

      if (response.ok) {
        onSave();
      }
    } catch (error) {
      console.error('Failed to save batch:', error);
    } finally {
      setSaving(false);
    }
  };

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <form onSubmit={handleSubmit}>
      <ModalBody>
        <div className="space-y-5">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Batch Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., JEE Advanced 2025 - Batch A"
              required
            />
            <Input
              label="Batch Code"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="e.g., JEE25A"
              required
            />
          </div>

          {/* Course & Teacher */}
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
              label="Teacher"
              value={formData.teacherId}
              onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
              required
            >
              <option value="">Select teacher</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.name}
                </option>
              ))}
            </Select>
          </div>

          {/* Schedule Days */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Schedule Days
            </label>
            <div className="flex flex-wrap gap-2">
              {days.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleDayToggle(day)}
                  className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                    formData.scheduleDays.includes(day)
                      ? 'bg-primary-50 border-primary-300 text-primary-700'
                      : 'bg-white border-neutral-300 text-neutral-600 hover:border-neutral-400'
                  }`}
                >
                  {day.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>

          {/* Time */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Time"
              type="time"
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              required
            />
            <Input
              label="End Time"
              type="time"
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              required
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Date"
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              required
            />
            <Input
              label="End Date (Optional)"
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            />
          </div>

          {/* Capacity & Status */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Max Students"
              type="number"
              min={1}
              value={formData.maxStudents}
              onChange={(e) => setFormData({ ...formData, maxStudents: parseInt(e.target.value) })}
              required
            />
            <Select
              label="Status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
            >
              <option value="upcoming">Upcoming</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
            </Select>
          </div>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={saving}>
          {batch ? 'Save Changes' : 'Create Batch'}
        </Button>
      </ModalFooter>
    </form>
  );
}
