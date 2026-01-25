// Admin Courses Management Page
// Premium course catalog with curriculum management

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Search,
  Plus,
  Clock,
  DollarSign,
  Users,
  Star,
  MoreVertical,
  Edit2,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  ChevronRight,
  Layers,
  Video,
  FileText,
  Award,
  TrendingUp,
  Filter,
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
import { SearchInput, Input, Select, Textarea } from '@shared/components/ui/Input';
import { Badge, StatusBadge } from '@shared/components/ui/Badge';
import { Modal, ModalHeader, ModalBody, ModalFooter, ConfirmModal } from '@shared/components/ui/Modal';
import { SkeletonCard, InlineLoader } from '@shared/components/ui/Loading';
import { EmptyState } from '@shared/components/ui/EmptyState';

interface Course {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  duration: string;
  price: number;
  discountPrice?: number;
  thumbnail?: string;
  status: 'draft' | 'published' | 'archived';
  enrolledCount: number;
  rating: number;
  reviewCount: number;
  modules: number;
  lessons: number;
  createdAt: string;
  updatedAt: string;
}

const levelColors: Record<string, string> = {
  beginner: 'success',
  intermediate: 'warning',
  advanced: 'danger',
};

const statusColors: Record<string, 'success' | 'warning' | 'default'> = {
  published: 'success',
  draft: 'warning',
  archived: 'default',
};

export function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    totalEnrollments: 0,
    avgRating: 0,
  });

  useEffect(() => {
    fetchCourses();
    fetchCategories();
    fetchStats();
  }, [statusFilter, categoryFilter, searchQuery]);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(categoryFilter !== 'all' && { category: categoryFilter }),
        ...(searchQuery && { search: searchQuery }),
      });

      const response = await fetch(`/api/v2/courses?${params}`);
      const data = await response.json();

      if (data.success) {
        setCourses(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/v2/courses/categories');
      const data = await response.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/v2/courses/stats');
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleDelete = async () => {
    if (!courseToDelete) return;

    try {
      const response = await fetch(`/api/v2/courses/${courseToDelete.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setShowDeleteConfirm(false);
        setCourseToDelete(null);
        fetchCourses();
        fetchStats();
      }
    } catch (error) {
      console.error('Failed to delete course:', error);
    }
  };

  const togglePublish = async (course: Course) => {
    const newStatus = course.status === 'published' ? 'draft' : 'published';
    try {
      const response = await fetch(`/api/v2/courses/${course.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchCourses();
        fetchStats();
      }
    } catch (error) {
      console.error('Failed to update course status:', error);
    }
  };

  const duplicateCourse = async (course: Course) => {
    try {
      const response = await fetch(`/api/v2/courses/${course.id}/duplicate`, {
        method: 'POST',
      });

      if (response.ok) {
        fetchCourses();
        fetchStats();
      }
    } catch (error) {
      console.error('Failed to duplicate course:', error);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <FadeIn>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">Courses</h1>
              <p className="text-neutral-600 mt-1">
                Manage course catalog, content, and pricing
              </p>
            </div>
            <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowAddModal(true)}>
              Create Course
            </Button>
          </div>
        </FadeIn>

        {/* Stats */}
        <Stagger className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StaggerItem>
            <StatCard
              title="Total Courses"
              value={stats.total}
              icon={<BookOpen className="w-5 h-5" />}
              color="primary"
            />
          </StaggerItem>
          <StaggerItem>
            <StatCard
              title="Published"
              value={stats.published}
              icon={<Eye className="w-5 h-5" />}
              color="success"
            />
          </StaggerItem>
          <StaggerItem>
            <StatCard
              title="Total Enrollments"
              value={stats.totalEnrollments.toLocaleString()}
              icon={<Users className="w-5 h-5" />}
              color="info"
            />
          </StaggerItem>
          <StaggerItem>
            <StatCard
              title="Avg. Rating"
              value={stats.avgRating.toFixed(1)}
              icon={<Star className="w-5 h-5" />}
              color="warning"
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
                    placeholder="Search courses by name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex gap-3">
                  <Select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-44"
                  >
                    <option value="all">All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </Select>
                  <Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-36"
                  >
                    <option value="all">All Status</option>
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                    <option value="archived">Archived</option>
                  </Select>
                  <div className="flex border border-neutral-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`px-3 py-2 ${
                        viewMode === 'grid'
                          ? 'bg-primary-50 text-primary-600'
                          : 'bg-white text-neutral-600 hover:bg-neutral-50'
                      }`}
                    >
                      <Layers className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`px-3 py-2 ${
                        viewMode === 'list'
                          ? 'bg-primary-50 text-primary-600'
                          : 'bg-white text-neutral-600 hover:bg-neutral-50'
                      }`}
                    >
                      <Filter className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </FadeIn>

        {/* Courses Grid/List */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : courses.length === 0 ? (
          <EmptyState
            title="No courses found"
            description={searchQuery ? 'Try adjusting your search or filters' : 'Create your first course to get started'}
            icon={<BookOpen className="w-12 h-12" />}
            action={
              <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowAddModal(true)}>
                Create Course
              </Button>
            }
          />
        ) : (
          <Stagger className={viewMode === 'grid' ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
            {courses.map((course) => (
              <StaggerItem key={course.id}>
                {viewMode === 'grid' ? (
                  <CourseCard
                    course={course}
                    onEdit={() => setEditingCourse(course)}
                    onDelete={() => {
                      setCourseToDelete(course);
                      setShowDeleteConfirm(true);
                    }}
                    onTogglePublish={() => togglePublish(course)}
                    onDuplicate={() => duplicateCourse(course)}
                  />
                ) : (
                  <CourseListItem
                    course={course}
                    onEdit={() => setEditingCourse(course)}
                    onDelete={() => {
                      setCourseToDelete(course);
                      setShowDeleteConfirm(true);
                    }}
                    onTogglePublish={() => togglePublish(course)}
                  />
                )}
              </StaggerItem>
            ))}
          </Stagger>
        )}

        {/* Add/Edit Course Modal */}
        <Modal
          isOpen={showAddModal || !!editingCourse}
          onClose={() => {
            setShowAddModal(false);
            setEditingCourse(null);
          }}
          size="lg"
        >
          <ModalHeader
            onClose={() => {
              setShowAddModal(false);
              setEditingCourse(null);
            }}
          >
            {editingCourse ? 'Edit Course' : 'Create New Course'}
          </ModalHeader>
          <CourseForm
            course={editingCourse}
            categories={categories}
            onSave={() => {
              setShowAddModal(false);
              setEditingCourse(null);
              fetchCourses();
              fetchStats();
            }}
            onCancel={() => {
              setShowAddModal(false);
              setEditingCourse(null);
            }}
          />
        </Modal>

        {/* Delete Confirmation */}
        <ConfirmModal
          isOpen={showDeleteConfirm}
          onClose={() => {
            setShowDeleteConfirm(false);
            setCourseToDelete(null);
          }}
          onConfirm={handleDelete}
          title="Delete Course"
          message={`Are you sure you want to delete "${courseToDelete?.name}"? This will remove all course content and enrollments. This action cannot be undone.`}
          confirmLabel="Delete Course"
          variant="danger"
        />
      </div>
    </PageTransition>
  );
}

// Course Card Component
function CourseCard({
  course,
  onEdit,
  onDelete,
  onTogglePublish,
  onDuplicate,
}: {
  course: Course;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePublish: () => void;
  onDuplicate: () => void;
}) {
  const [showMenu, setShowMenu] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <HoverScale>
      <Card className="h-full overflow-hidden">
        {/* Thumbnail */}
        <div className="relative h-40 bg-gradient-to-br from-primary-100 to-primary-200">
          {course.thumbnail ? (
            <img
              src={course.thumbnail}
              alt={course.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <BookOpen className="w-16 h-16 text-primary-300" />
            </div>
          )}
          <div className="absolute top-3 left-3">
            <StatusBadge
              status={statusColors[course.status]}
              label={course.status.charAt(0).toUpperCase() + course.status.slice(1)}
            />
          </div>
          <div className="absolute top-3 right-3">
            <Badge variant={levelColors[course.level] as any}>
              {course.level.charAt(0).toUpperCase() + course.level.slice(1)}
            </Badge>
          </div>
        </div>

        <CardBody className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-primary-600 mb-1">{course.category}</p>
              <h3 className="font-semibold text-neutral-900 truncate">{course.name}</h3>
            </div>
            <div className="relative ml-2">
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
                        onTogglePublish();
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 flex items-center gap-2"
                    >
                      {course.status === 'published' ? (
                        <>
                          <EyeOff className="w-4 h-4" />
                          Unpublish
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4" />
                          Publish
                        </>
                      )}
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

          {/* Description */}
          <p className="text-sm text-neutral-600 line-clamp-2 mb-4">{course.description}</p>

          {/* Meta */}
          <div className="flex items-center gap-4 text-sm text-neutral-500 mb-4">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {course.duration}
            </span>
            <span className="flex items-center gap-1">
              <Layers className="w-4 h-4" />
              {course.modules} modules
            </span>
            <span className="flex items-center gap-1">
              <Video className="w-4 h-4" />
              {course.lessons} lessons
            </span>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-warning-500 fill-warning-500" />
              <span className="font-medium text-neutral-900">{course.rating.toFixed(1)}</span>
              <span className="text-neutral-500">({course.reviewCount})</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4 text-neutral-400" />
              <span className="text-neutral-600">{course.enrolledCount.toLocaleString()}</span>
            </div>
          </div>

          {/* Price */}
          <div className="flex items-center gap-2 mt-4">
            {course.discountPrice ? (
              <>
                <span className="text-lg font-bold text-neutral-900">
                  {formatPrice(course.discountPrice)}
                </span>
                <span className="text-sm text-neutral-400 line-through">
                  {formatPrice(course.price)}
                </span>
              </>
            ) : (
              <span className="text-lg font-bold text-neutral-900">
                {formatPrice(course.price)}
              </span>
            )}
          </div>
        </CardBody>
      </Card>
    </HoverScale>
  );
}

// Course List Item Component
function CourseListItem({
  course,
  onEdit,
  onDelete,
  onTogglePublish,
}: {
  course: Course;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePublish: () => void;
}) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <Card>
      <CardBody className="p-4">
        <div className="flex items-center gap-4">
          {/* Thumbnail */}
          <div className="w-24 h-16 rounded-lg bg-gradient-to-br from-primary-100 to-primary-200 flex-shrink-0 overflow-hidden">
            {course.thumbnail ? (
              <img
                src={course.thumbnail}
                alt={course.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-primary-300" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-neutral-900 truncate">{course.name}</h3>
              <StatusBadge
                status={statusColors[course.status]}
                label={course.status.charAt(0).toUpperCase() + course.status.slice(1)}
              />
            </div>
            <p className="text-sm text-neutral-600 truncate">{course.description}</p>
          </div>

          {/* Meta */}
          <div className="hidden md:flex items-center gap-6">
            <div className="text-center">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-warning-500 fill-warning-500" />
                <span className="font-medium">{course.rating.toFixed(1)}</span>
              </div>
              <p className="text-xs text-neutral-500">{course.reviewCount} reviews</p>
            </div>
            <div className="text-center">
              <div className="font-medium text-neutral-900">
                {course.enrolledCount.toLocaleString()}
              </div>
              <p className="text-xs text-neutral-500">Students</p>
            </div>
            <div className="text-center">
              <div className="font-medium text-neutral-900">
                {formatPrice(course.discountPrice || course.price)}
              </div>
              <p className="text-xs text-neutral-500">Price</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <IconButton variant="ghost" size="sm" onClick={onEdit}>
              <Edit2 className="w-4 h-4" />
            </IconButton>
            <IconButton variant="ghost" size="sm" onClick={onTogglePublish}>
              {course.status === 'published' ? (
                <EyeOff className="w-4 h-4 text-warning-600" />
              ) : (
                <Eye className="w-4 h-4 text-success-600" />
              )}
            </IconButton>
            <IconButton variant="ghost" size="sm" onClick={onDelete}>
              <Trash2 className="w-4 h-4 text-danger-600" />
            </IconButton>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

// Course Form Component
function CourseForm({
  course,
  categories,
  onSave,
  onCancel,
}: {
  course: Course | null;
  categories: string[];
  onSave: () => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    name: course?.name || '',
    slug: course?.slug || '',
    description: course?.description || '',
    category: course?.category || '',
    level: course?.level || 'beginner',
    duration: course?.duration || '',
    price: course?.price || 0,
    discountPrice: course?.discountPrice || '',
    status: course?.status || 'draft',
  });
  const [saving, setSaving] = useState(false);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
      slug: course ? formData.slug : generateSlug(name),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = course ? `/api/v2/courses/${course.id}` : '/api/v2/courses';
      const method = course ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          discountPrice: formData.discountPrice || null,
        }),
      });

      if (response.ok) {
        onSave();
      }
    } catch (error) {
      console.error('Failed to save course:', error);
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
            label="Course Name"
            value={formData.name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="e.g., JEE Advanced Complete Course"
            required
          />
          <Input
            label="URL Slug"
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            placeholder="e.g., jee-advanced-complete-course"
            required
          />
          <Textarea
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe what students will learn..."
            rows={3}
            required
          />

          {/* Category & Level */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Category
              </label>
              <input
                list="categories"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="Select or type..."
                className="input"
                required
              />
              <datalist id="categories">
                {categories.map((cat) => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>
            </div>
            <Select
              label="Level"
              value={formData.level}
              onChange={(e) => setFormData({ ...formData, level: e.target.value as any })}
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </Select>
          </div>

          {/* Duration */}
          <Input
            label="Duration"
            value={formData.duration}
            onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
            placeholder="e.g., 6 months, 120 hours"
            required
          />

          {/* Pricing */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Price (INR)"
              type="number"
              min={0}
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) })}
              required
            />
            <Input
              label="Discount Price (Optional)"
              type="number"
              min={0}
              value={formData.discountPrice}
              onChange={(e) => setFormData({ ...formData, discountPrice: e.target.value ? parseInt(e.target.value) : '' })}
              placeholder="Leave empty for no discount"
            />
          </div>

          {/* Status */}
          <Select
            label="Status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </Select>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={saving}>
          {course ? 'Save Changes' : 'Create Course'}
        </Button>
      </ModalFooter>
    </form>
  );
}
