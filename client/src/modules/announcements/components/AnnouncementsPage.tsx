// Announcements Page
// Role-aware: Admin/Teacher see management view, Students see feed
// Complete CRUD with targeting, scheduling, and attachments

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Megaphone,
  Plus,
  RefreshCw,
  Search,
  Edit2,
  Trash2,
  X,
  CheckCircle,
  AlertCircle,
  Pin,
  PinOff,
  Globe,
  Lock,
  Calendar,
  Clock,
  Users,
  Target,
  Paperclip,
  Download,
  Eye,
  EyeOff,
  Send,
  ChevronDown,
  ChevronUp,
  Bell,
  AlertTriangle,
  Info,
  Filter,
  MoreVertical,
  FileText,
  User,
  ExternalLink,
} from 'lucide-react';
import { format, parseISO, formatDistanceToNow, isAfter, isBefore } from 'date-fns';
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
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@shared/components/ui/Modal';
import { Stagger, StaggerItem, fadeInUp, staggerItem } from '@shared/components/ui/motion';
import clsx from 'clsx';

// ============================================
// TYPES
// ============================================

type Priority = 'low' | 'normal' | 'high' | 'urgent';
type TargetType = 'all' | 'class' | 'batch' | 'course' | 'role';
type UserRole = 'admin' | 'teacher' | 'student' | 'parent' | 'batch_manager';

interface Attachment {
  name: string;
  path: string;
  size: number;
  type: string;
}

interface Announcement {
  id: string;
  title: string;
  body: string;
  target_type: TargetType;
  target_batch_id: string | null;
  target_course_id: string | null;
  target_class_id: string | null;
  target_roles: UserRole[] | null;
  priority: Priority;
  is_pinned: boolean;
  attachments: Attachment[];
  publish_at: string | null;
  expires_at: string | null;
  is_published: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  is_read?: boolean;
}

interface AcademicClass {
  id: string;
  name: string;
}

interface DashboardContext {
  userData: {
    user: {
      id: string;
      role: UserRole;
    };
  } | null;
  userRole: UserRole;
}

const API_URL = import.meta.env.VITE_API_URL || '/api';

// ============================================
// PRIORITY & TYPE CONFIG
// ============================================

const priorityConfig: Record<Priority, { label: string; color: string; bgColor: string; borderColor: string }> = {
  low: { label: 'Low', color: 'text-slate-600', bgColor: 'bg-slate-100', borderColor: 'border-l-slate-300' },
  normal: { label: 'Normal', color: 'text-sky-600', bgColor: 'bg-sky-100', borderColor: 'border-l-sky-400' },
  high: { label: 'High', color: 'text-amber-600', bgColor: 'bg-amber-100', borderColor: 'border-l-amber-400' },
  urgent: { label: 'Urgent', color: 'text-rose-600', bgColor: 'bg-rose-100', borderColor: 'border-l-rose-500' },
};

const targetTypeLabels: Record<TargetType, string> = {
  all: 'Everyone',
  class: 'Specific Class',
  batch: 'Specific Batch',
  course: 'Specific Course',
  role: 'Specific Roles',
};

const roleOptions = [
  { value: 'student', label: 'Students' },
  { value: 'teacher', label: 'Teachers' },
  { value: 'parent', label: 'Parents' },
  { value: 'batch_manager', label: 'Batch Managers' },
  { value: 'admin', label: 'Admins' },
];

// ============================================
// CREATE/EDIT MODAL
// ============================================

interface AnnouncementModalProps {
  announcement?: Announcement | null;
  classes: AcademicClass[];
  onClose: () => void;
  onSuccess: () => void;
}

function AnnouncementModal({ announcement, classes, onClose, onSuccess }: AnnouncementModalProps) {
  const { getToken } = useAuth();
  const isEditing = !!announcement;

  // Form state
  const [title, setTitle] = useState(announcement?.title || '');
  const [body, setBody] = useState(announcement?.body || '');
  const [targetType, setTargetType] = useState<TargetType>(announcement?.target_type || 'all');
  const [targetClassId, setTargetClassId] = useState(announcement?.target_class_id || '');
  const [targetRoles, setTargetRoles] = useState<UserRole[]>(announcement?.target_roles || []);
  const [priority, setPriority] = useState<Priority>(announcement?.priority || 'normal');
  const [isPinned, setIsPinned] = useState(announcement?.is_pinned || false);
  const [isPublished, setIsPublished] = useState(announcement?.is_published ?? true);
  const [publishAt, setPublishAt] = useState(announcement?.publish_at?.slice(0, 16) || '');
  const [expiresAt, setExpiresAt] = useState(announcement?.expires_at?.slice(0, 16) || '');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleRoleToggle = (role: UserRole) => {
    setTargetRoles(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    if (!body.trim()) {
      setError('Body is required');
      return;
    }
    if (targetType === 'class' && !targetClassId) {
      setError('Please select a class');
      return;
    }
    if (targetType === 'role' && targetRoles.length === 0) {
      setError('Please select at least one role');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const token = await getToken();
      const payload = {
        title,
        body,
        targetType,
        targetClassId: targetType === 'class' ? targetClassId : null,
        targetBatchId: null,
        targetCourseId: null,
        targetRoles: targetType === 'role' ? targetRoles : null,
        priority,
        isPinned,
        isPublished,
        publishAt: publishAt ? new Date(publishAt).toISOString() : null,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      };

      const url = isEditing
        ? `${API_URL}/v2/announcements/${announcement.id}`
        : `${API_URL}/v2/announcements`;

      const res = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save announcement');
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} size="lg">
      <form onSubmit={handleSubmit}>
        <ModalHeader
          title={isEditing ? 'Edit Announcement' : 'Create Announcement'}
          onClose={onClose}
        />
        <ModalBody className="space-y-4 max-h-[60vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Title <span className="text-rose-500">*</span>
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Announcement title"
            />
          </div>

          {/* Body */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Message <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your announcement message..."
              rows={5}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-100 focus:border-amber-300 transition-all resize-none"
            />
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
            <div className="flex gap-2">
              {(['low', 'normal', 'high', 'urgent'] as Priority[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={clsx(
                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-all capitalize',
                    priority === p
                      ? `${priorityConfig[p].bgColor} ${priorityConfig[p].color}`
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Targeting */}
          <div className="p-4 bg-slate-50 rounded-xl space-y-3">
            <p className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Target Audience
            </p>

            <div>
              <Select
                value={targetType}
                onChange={(e) => setTargetType(e.target.value as TargetType)}
                options={[
                  { value: 'all', label: 'Everyone' },
                  { value: 'class', label: 'Specific Class' },
                  { value: 'role', label: 'Specific Roles' },
                ]}
              />
            </div>

            {targetType === 'class' && (
              classes.length > 0 ? (
                <Select
                  value={targetClassId}
                  onChange={(e) => setTargetClassId(e.target.value)}
                  options={[
                    { value: '', label: 'Select a class' },
                    ...classes.map((c) => ({ value: c.id, label: c.name })),
                  ]}
                />
              ) : (
                <p className="text-sm text-slate-500 italic">No classes found. Create classes first in the Classes page.</p>
              )
            )}

            {targetType === 'role' && (
              <div className="flex flex-wrap gap-2">
                {roleOptions.map((role) => (
                  <button
                    key={role.value}
                    type="button"
                    onClick={() => handleRoleToggle(role.value as UserRole)}
                    className={clsx(
                      'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                      targetRoles.includes(role.value as UserRole)
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    )}
                  >
                    {role.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Scheduling */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                <Clock className="w-4 h-4 inline mr-1" />
                Publish At
              </label>
              <Input
                type="datetime-local"
                value={publishAt}
                onChange={(e) => setPublishAt(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                <Calendar className="w-4 h-4 inline mr-1" />
                Expires At
              </label>
              <Input
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </div>
          </div>

          {/* Options */}
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
              />
              <Pin className="w-4 h-4 text-slate-500" />
              <span className="text-sm text-slate-700">Pin to top</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
              />
              <Globe className="w-4 h-4 text-slate-500" />
              <span className="text-sm text-slate-700">Publish immediately</span>
            </label>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" isLoading={saving} leftIcon={<Send className="w-4 h-4" />}>
            {isEditing ? 'Update' : 'Publish'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

// ============================================
// ANNOUNCEMENT CARD (Admin View)
// ============================================

interface AdminAnnouncementCardProps {
  announcement: Announcement;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePin: () => void;
  onTogglePublish: () => void;
}

function AdminAnnouncementCard({
  announcement,
  onEdit,
  onDelete,
  onTogglePin,
  onTogglePublish,
}: AdminAnnouncementCardProps) {
  const [expanded, setExpanded] = useState(false);
  const config = priorityConfig[announcement.priority];
  const isLong = announcement.body.length > 200;
  const displayBody = expanded || !isLong ? announcement.body : announcement.body.slice(0, 200) + '...';

  const isScheduled = announcement.publish_at && isAfter(parseISO(announcement.publish_at), new Date());
  const isExpired = announcement.expires_at && isBefore(parseISO(announcement.expires_at), new Date());

  return (
    <Card className={clsx('p-0 overflow-hidden border-l-4', config.borderColor)}>
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center gap-2 flex-wrap mb-2">
              {announcement.is_pinned && (
                <Pin className="w-4 h-4 text-amber-500" />
              )}
              <h3 className="font-semibold text-slate-900">{announcement.title}</h3>
              <Badge variant={
                announcement.priority === 'urgent' ? 'danger' :
                announcement.priority === 'high' ? 'warning' :
                'default'
              } size="sm">
                {config.label}
              </Badge>
              {!announcement.is_published && (
                <Badge variant="warning" size="sm">Draft</Badge>
              )}
              {isScheduled && (
                <Badge variant="info" size="sm">Scheduled</Badge>
              )}
              {isExpired && (
                <Badge variant="danger" size="sm">Expired</Badge>
              )}
            </div>

            {/* Meta */}
            <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
              <span className="flex items-center gap-1">
                <Target className="w-3 h-3" />
                {targetTypeLabels[announcement.target_type]}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDistanceToNow(parseISO(announcement.created_at), { addSuffix: true })}
              </span>
              {announcement.attachments?.length > 0 && (
                <span className="flex items-center gap-1">
                  <Paperclip className="w-3 h-3" />
                  {announcement.attachments.length} file(s)
                </span>
              )}
            </div>

            {/* Body */}
            <p className="text-sm text-slate-600 whitespace-pre-wrap">{displayBody}</p>
            {isLong && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1 mt-2 text-sm font-medium text-amber-600 hover:text-amber-700"
              >
                {expanded ? (
                  <>Show less <ChevronUp className="w-4 h-4" /></>
                ) : (
                  <>Read more <ChevronDown className="w-4 h-4" /></>
                )}
              </button>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={onTogglePin}
              title={announcement.is_pinned ? 'Unpin' : 'Pin'}
            >
              {announcement.is_pinned ? (
                <PinOff className="w-4 h-4" />
              ) : (
                <Pin className="w-4 h-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onTogglePublish}
              title={announcement.is_published ? 'Unpublish' : 'Publish'}
            >
              {announcement.is_published ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </Button>
            <Button variant="ghost" size="sm" onClick={onEdit}>
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="text-rose-600 hover:bg-rose-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

// ============================================
// ANNOUNCEMENT CARD (User View)
// ============================================

interface UserAnnouncementCardProps {
  announcement: Announcement;
  onMarkAsRead: () => void;
}

function UserAnnouncementCard({ announcement, onMarkAsRead }: UserAnnouncementCardProps) {
  const { getToken } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const config = priorityConfig[announcement.priority];
  const isLong = announcement.body.length > 200;
  const displayBody = expanded || !isLong ? announcement.body : announcement.body.slice(0, 200) + '...';

  const handleExpand = () => {
    setExpanded(!expanded);
    // Mark as read when expanding
    if (!expanded && !announcement.is_read) {
      onMarkAsRead();
    }
  };

  const handleGetAttachment = async (index: number) => {
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/v2/announcements/${announcement.id}/attachments/${index}/url`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.data.url) {
        window.open(data.data.url, '_blank');
      }
    } catch (err) {
      console.error('Error getting attachment URL:', err);
    }
  };

  return (
    <motion.div variants={staggerItem}>
      <Card
        className={clsx(
          'p-0 overflow-hidden border-l-4',
          config.borderColor,
          announcement.is_pinned && 'ring-1 ring-amber-200',
          !announcement.is_read && 'bg-amber-50/30'
        )}
      >
        <div className="p-5">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className={clsx(
              'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
              config.bgColor
            )}>
              {announcement.priority === 'urgent' ? (
                <AlertTriangle className={clsx('w-5 h-5', config.color)} />
              ) : announcement.priority === 'high' ? (
                <Bell className={clsx('w-5 h-5', config.color)} />
              ) : (
                <Megaphone className={clsx('w-5 h-5', config.color)} />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                {announcement.is_pinned && (
                  <Pin className="w-3.5 h-3.5 text-amber-500" />
                )}
                <h3 className="font-medium text-slate-900">{announcement.title}</h3>
                {!announcement.is_read && (
                  <span className="w-2 h-2 bg-amber-500 rounded-full" />
                )}
                <Badge variant={
                  announcement.priority === 'urgent' ? 'danger' :
                  announcement.priority === 'high' ? 'warning' :
                  'default'
                } size="sm">
                  {config.label}
                </Badge>
              </div>

              <p className="text-xs text-slate-500 mb-3">
                {formatDistanceToNow(parseISO(announcement.created_at), { addSuffix: true })}
              </p>

              <p className="text-sm text-slate-600 whitespace-pre-wrap">{displayBody}</p>

              {isLong && (
                <button
                  onClick={handleExpand}
                  className="flex items-center gap-1 mt-2 text-sm font-medium text-amber-600 hover:text-amber-700"
                >
                  {expanded ? (
                    <>Show less <ChevronUp className="w-4 h-4" /></>
                  ) : (
                    <>Read more <ChevronDown className="w-4 h-4" /></>
                  )}
                </button>
              )}

              {/* Attachments */}
              {announcement.attachments?.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <p className="text-xs font-medium text-slate-500 mb-2">Attachments</p>
                  <div className="flex flex-wrap gap-2">
                    {announcement.attachments.map((att, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleGetAttachment(idx)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                      >
                        <FileText className="w-4 h-4" />
                        {att.name}
                        <Download className="w-3 h-3" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function AnnouncementsPage() {
  const { getToken } = useAuth();
  const context = useOutletContext<DashboardContext>();
  const userRole = context?.userRole || 'student';
  const isAdminOrTeacher = userRole === 'admin' || userRole === 'teacher';

  // Data state
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [classes, setClasses] = useState<AcademicClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 20;

  // Filters
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [publishedFilter, setPublishedFilter] = useState('');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);

  // Stats for admin
  const [stats, setStats] = useState({ total: 0, published: 0, pinned: 0 });

  // Fetch announcements
  const fetchAnnouncements = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    else setRefreshing(true);

    try {
      const token = await getToken();
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (priorityFilter) params.append('priority', priorityFilter);
      if (publishedFilter) params.append('isPublished', publishedFilter);
      if (search) params.append('search', search);

      const endpoint = isAdminOrTeacher
        ? `${API_URL}/v2/announcements/admin/list?${params}`
        : `${API_URL}/v2/announcements?${params}`;

      const res = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (data.success) {
        const items = data.data?.items || [];
        setAnnouncements(items);
        setTotalPages(data.data?.totalPages || 1);
        setTotalItems(data.data?.total || 0);

        // Calculate stats for admin
        if (isAdminOrTeacher) {
          setStats({
            total: data.data?.total || 0,
            published: items.filter((a: Announcement) => a.is_published).length,
            pinned: items.filter((a: Announcement) => a.is_pinned).length,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch academic classes for targeting via dedicated endpoint
  const fetchTargetingOptions = async () => {
    if (!isAdminOrTeacher) return;

    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/v2/announcements/admin/targeting-options`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (data.success) {
        setClasses(data.data?.classes || []);
      } else {
        console.error('Failed to fetch targeting options:', data);
      }
    } catch (error) {
      console.error('Error fetching targeting options:', error);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, [page, priorityFilter, publishedFilter, isAdminOrTeacher]);

  // Fetch targeting options when admin role is confirmed
  useEffect(() => {
    if (isAdminOrTeacher) {
      fetchTargetingOptions();
    }
  }, [isAdminOrTeacher]);

  // Debounced search
  useEffect(() => {
    const debounce = setTimeout(() => {
      if (page === 1) {
        fetchAnnouncements();
      } else {
        setPage(1);
      }
    }, 500);
    return () => clearTimeout(debounce);
  }, [search]);

  // Action handlers
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;

    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/v2/announcements/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        fetchAnnouncements(false);
      }
    } catch (error) {
      console.error('Error deleting announcement:', error);
    }
  };

  const handleTogglePin = async (announcement: Announcement) => {
    try {
      const token = await getToken();
      await fetch(`${API_URL}/v2/announcements/${announcement.id}/pin`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isPinned: !announcement.is_pinned }),
      });
      fetchAnnouncements(false);
    } catch (error) {
      console.error('Error toggling pin:', error);
    }
  };

  const handleTogglePublish = async (announcement: Announcement) => {
    try {
      const token = await getToken();
      const endpoint = announcement.is_published ? 'unpublish' : 'publish';
      await fetch(`${API_URL}/v2/announcements/${announcement.id}/${endpoint}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchAnnouncements(false);
    } catch (error) {
      console.error('Error toggling publish:', error);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      const token = await getToken();
      await fetch(`${API_URL}/v2/announcements/${id}/read`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      // Update local state
      setAnnouncements(prev =>
        prev.map(a => a.id === id ? { ...a, is_read: true } : a)
      );
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleModalSuccess = () => {
    setShowModal(false);
    setEditingAnnouncement(null);
    fetchAnnouncements(false);
  };

  // Separate pinned and regular
  const pinnedAnnouncements = announcements.filter(a => a.is_pinned);
  const regularAnnouncements = announcements.filter(a => !a.is_pinned);

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
            <Megaphone className="w-7 h-7 text-amber-600" />
            Announcements
          </h1>
          <p className="text-slate-500 mt-1">
            {isAdminOrTeacher
              ? 'Create and manage announcements for your community'
              : 'Stay updated with the latest news and updates'}
          </p>
        </div>
        {isAdminOrTeacher && (
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              onClick={() => {
                setEditingAnnouncement(null);
                setShowModal(true);
              }}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              New Announcement
            </Button>
            <Button
              variant="outline"
              onClick={() => fetchAnnouncements(false)}
              disabled={refreshing}
              leftIcon={refreshing ? <Spinner size="sm" /> : <RefreshCw className="w-4 h-4" />}
            >
              Refresh
            </Button>
          </div>
        )}
      </motion.div>

      {/* Stats Cards (Admin Only) */}
      {isAdminOrTeacher && (
        <Stagger className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StaggerItem>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Megaphone className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-slate-900">{stats.total}</p>
                  <p className="text-xs text-slate-500">Total Announcements</p>
                </div>
              </div>
            </Card>
          </StaggerItem>
          <StaggerItem>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <Globe className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-slate-900">{stats.published}</p>
                  <p className="text-xs text-slate-500">Published</p>
                </div>
              </div>
            </Card>
          </StaggerItem>
          <StaggerItem>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center">
                  <Pin className="w-5 h-5 text-sky-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-slate-900">{stats.pinned}</p>
                  <p className="text-xs text-slate-500">Pinned</p>
                </div>
              </div>
            </Card>
          </StaggerItem>
        </Stagger>
      )}

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <SearchInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search announcements..."
            />
          </div>
          <div className="flex gap-3">
            <Select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              options={[
                { value: '', label: 'All Priority' },
                { value: 'urgent', label: 'Urgent' },
                { value: 'high', label: 'High' },
                { value: 'normal', label: 'Normal' },
                { value: 'low', label: 'Low' },
              ]}
              className="w-36"
            />
            {isAdminOrTeacher && (
              <Select
                value={publishedFilter}
                onChange={(e) => setPublishedFilter(e.target.value)}
                options={[
                  { value: '', label: 'All Status' },
                  { value: 'true', label: 'Published' },
                  { value: 'false', label: 'Draft' },
                ]}
                className="w-36"
              />
            )}
          </div>
        </div>
      </Card>

      {/* Announcements List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-5">
              <div className="flex items-start gap-4">
                <Skeleton className="w-10 h-10 rounded-xl" />
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-16 w-full" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : announcements.length === 0 ? (
        <EmptyState
          variant="inbox"
          title="No announcements"
          description={isAdminOrTeacher ? 'Create your first announcement.' : 'There are no announcements at the moment.'}
          icon={<Megaphone className="w-12 h-12" />}
          action={isAdminOrTeacher ? {
            label: 'Create Announcement',
            onClick: () => setShowModal(true),
          } : undefined}
        />
      ) : (
        <div className="space-y-4">
          {/* Pinned */}
          {pinnedAnnouncements.length > 0 && (
            <>
              <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <Pin className="w-4 h-4" />
                Pinned
              </h2>
              <div className="space-y-4">
                {pinnedAnnouncements.map((announcement) =>
                  isAdminOrTeacher ? (
                    <AdminAnnouncementCard
                      key={announcement.id}
                      announcement={announcement}
                      onEdit={() => {
                        setEditingAnnouncement(announcement);
                        setShowModal(true);
                      }}
                      onDelete={() => handleDelete(announcement.id)}
                      onTogglePin={() => handleTogglePin(announcement)}
                      onTogglePublish={() => handleTogglePublish(announcement)}
                    />
                  ) : (
                    <UserAnnouncementCard
                      key={announcement.id}
                      announcement={announcement}
                      onMarkAsRead={() => handleMarkAsRead(announcement.id)}
                    />
                  )
                )}
              </div>
            </>
          )}

          {/* Regular */}
          {regularAnnouncements.length > 0 && (
            <>
              {pinnedAnnouncements.length > 0 && (
                <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wider mt-6">
                  Recent
                </h2>
              )}
              <div className="space-y-4">
                {regularAnnouncements.map((announcement) =>
                  isAdminOrTeacher ? (
                    <AdminAnnouncementCard
                      key={announcement.id}
                      announcement={announcement}
                      onEdit={() => {
                        setEditingAnnouncement(announcement);
                        setShowModal(true);
                      }}
                      onDelete={() => handleDelete(announcement.id)}
                      onTogglePin={() => handleTogglePin(announcement)}
                      onTogglePublish={() => handleTogglePublish(announcement)}
                    />
                  ) : (
                    <UserAnnouncementCard
                      key={announcement.id}
                      announcement={announcement}
                      onMarkAsRead={() => handleMarkAsRead(announcement.id)}
                    />
                  )
                )}
              </div>
            </>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pt-4">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={totalItems}
                pageSize={limit}
                onPageChange={setPage}
              />
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <AnnouncementModal
          announcement={editingAnnouncement}
          classes={classes}
          onClose={() => {
            setShowModal(false);
            setEditingAnnouncement(null);
          }}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  );
}

export default AnnouncementsPage;
