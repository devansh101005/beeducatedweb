// Premium Dashboard Layout
// Role-based navigation with smooth animations

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth, useUser, UserButton } from '@clerk/clerk-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  UserCog,
  BookOpen,
  FileText,
  ClipboardList,
  FolderOpen,
  Settings,
  Calendar,
  Trophy,
  CreditCard,
  Users2,
  TrendingUp,
  CheckSquare,
  Bell,
  Search,
  Menu,
  X,
  Home,
  ChevronRight,
  Megaphone,
  Receipt,
  BarChart3,
  AlertTriangle,
  Info,
  Pin,
  CheckCheck,
} from 'lucide-react';
import { formatDistanceToNow, parseISO, differenceInMinutes, differenceInHours } from 'date-fns';
import clsx from 'clsx';
import { IconButton, Badge, Spinner, PageLoader } from '@shared/components/ui';

// ============================================
// TYPES
// ============================================

type UserRole = 'admin' | 'teacher' | 'student' | 'parent' | 'batch_manager' | 'user';

interface NavItem {
  name: string;
  href: string;
  icon: typeof LayoutDashboard;
  badge?: number;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

interface UserData {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: UserRole;
    avatar?: string;
  };
}

// ============================================
// NAVIGATION CONFIG
// ============================================

const navigationByRole: Record<UserRole, NavSection[]> = {
  admin: [
    {
      title: 'Overview',
      items: [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Reports', href: '/dashboard/reports', icon: BarChart3 },
      ],
    },
    {
      title: 'Users',
      items: [
        { name: 'All Users', href: '/dashboard/users', icon: Users },
        { name: 'Students', href: '/dashboard/students', icon: GraduationCap },
        { name: 'Teachers', href: '/dashboard/teachers', icon: UserCog },
        { name: 'Parents', href: '/dashboard/parents', icon: Users2 },
        { name: 'Applications', href: '/dashboard/applications', icon: FileText },
      ],
    },
    {
      title: 'Academics',
      items: [
        { name: 'Batches', href: '/dashboard/batches', icon: BookOpen },
        { name: 'Courses', href: '/dashboard/courses', icon: FolderOpen },
        { name: 'Exams', href: '/dashboard/exams', icon: ClipboardList },
        { name: 'Materials', href: '/dashboard/materials', icon: FolderOpen },
      ],
    },
    {
      title: 'Finance',
      items: [
        { name: 'Fee Management', href: '/dashboard/fees', icon: Receipt },
        { name: 'Payments', href: '/dashboard/payments', icon: CreditCard },
      ],
    },
    {
      title: 'Communication',
      items: [
        { name: 'Announcements', href: '/dashboard/announcements', icon: Megaphone },
      ],
    },
    {
      title: 'System',
      items: [
        { name: 'Settings', href: '/dashboard/settings', icon: Settings },
      ],
    },
  ],
  teacher: [
    {
      items: [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'My Batches', href: '/dashboard/my-batches', icon: BookOpen },
        { name: 'Students', href: '/dashboard/students', icon: GraduationCap },
        { name: 'Exams', href: '/dashboard/exams', icon: ClipboardList },
        { name: 'Materials', href: '/dashboard/materials', icon: FolderOpen },
        { name: 'Schedule', href: '/dashboard/schedule', icon: Calendar },
        { name: 'Announcements', href: '/dashboard/announcements', icon: Megaphone },
      ],
    },
  ],
  student: [
    {
      title: 'Learning',
      items: [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'My Enrollments', href: '/dashboard/my-enrollments', icon: GraduationCap },
        { name: 'Study Materials', href: '/dashboard/study-materials', icon: FolderOpen },
      ],
    },
    {
      title: 'Exams & Progress',
      items: [
        { name: 'My Exams', href: '/dashboard/my-exams', icon: ClipboardList },
        { name: 'My Results', href: '/dashboard/my-results', icon: Trophy },
      ],
    },
    {
      title: 'Account',
      items: [
        { name: 'Fee & Payments', href: '/dashboard/my-fees', icon: CreditCard },
        { name: 'Announcements', href: '/dashboard/announcements', icon: Megaphone },
      ],
    },
  ],
  parent: [
    {
      items: [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'My Children', href: '/dashboard/children', icon: Users2 },
        { name: 'Progress', href: '/dashboard/progress', icon: TrendingUp },
        { name: 'Payments', href: '/dashboard/parent-payments', icon: CreditCard },
        { name: 'Announcements', href: '/dashboard/announcements', icon: Megaphone },
      ],
    },
  ],
  batch_manager: [
    {
      items: [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Batches', href: '/dashboard/batches', icon: BookOpen },
        { name: 'Students', href: '/dashboard/students', icon: GraduationCap },
        { name: 'Schedule', href: '/dashboard/schedule', icon: Calendar },
        { name: 'Attendance', href: '/dashboard/attendance', icon: CheckSquare },
        { name: 'Announcements', href: '/dashboard/announcements', icon: Megaphone },
      ],
    },
  ],
  user: [
    {
      items: [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      ],
    },
  ],
};

const API_URL = import.meta.env.VITE_API_URL || '/api';

// ============================================
// SIDEBAR COMPONENT
// ============================================

interface SidebarProps {
  navigation: NavSection[];
  currentPath: string;
  isOpen: boolean;
  onClose: () => void;
  userData: UserData | null;
}

function Sidebar({ navigation, currentPath, isOpen, onClose, userData }: SidebarProps) {
  return (
    <>
      {/* Mobile backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-50 w-[260px]',
          'bg-white border-r border-slate-200',
          'flex flex-col',
          'transform transition-transform duration-300 ease-smooth',
          'lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="h-[72px] px-5 flex items-center justify-between border-b border-slate-100">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/logo.png" alt="Be Educated" className="w-9 h-9 rounded-xl object-contain" />
            <span className="text-lg font-heading font-semibold text-slate-900">
              Be Educated
            </span>
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
            <UserButton
              appearance={{
                elements: {
                  avatarBox: 'w-10 h-10 rounded-xl',
                },
              }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">
                {userData?.user?.firstName} {userData?.user?.lastName}
              </p>
              <p className="text-xs text-slate-500 truncate capitalize">
                {userData?.user?.role?.replace('_', ' ') || 'User'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 scrollbar-hide">
          {navigation.map((section, sectionIndex) => (
            <div key={sectionIndex} className="mb-6">
              {section.title && (
                <h3 className="px-3 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  {section.title}
                </h3>
              )}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const isActive = currentPath === item.href;
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={onClose}
                      className={clsx(
                        'flex items-center gap-3 px-3 py-2.5 rounded-xl',
                        'text-sm transition-all duration-200',
                        isActive
                          ? 'bg-amber-50 text-amber-700 font-medium'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      )}
                    >
                      <Icon className="w-5 h-5 shrink-0" />
                      <span className="flex-1">{item.name}</span>
                      {item.badge && (
                        <span className="min-w-[20px] h-5 px-1.5 flex items-center justify-center text-xs font-medium bg-amber-500 text-white rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100">
          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-600 hover:text-amber-600 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <Home className="w-5 h-5" />
            <span>Back to Home</span>
          </Link>
        </div>
      </aside>
    </>
  );
}

// ============================================
// ANNOUNCEMENT PANEL COMPONENT
// ============================================

type Priority = 'low' | 'normal' | 'high' | 'urgent';

interface PanelAnnouncement {
  id: string;
  title: string;
  body: string;
  priority: Priority;
  is_pinned: boolean;
  created_at: string;
  is_read?: boolean;
}

const priorityConfig: Record<Priority, { icon: typeof Info; color: string; bg: string }> = {
  low: { icon: Info, color: 'text-slate-400', bg: 'bg-slate-100' },
  normal: { icon: Bell, color: 'text-sky-500', bg: 'bg-sky-50' },
  high: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50' },
  urgent: { icon: AlertTriangle, color: 'text-rose-500', bg: 'bg-rose-50' },
};

interface AnnouncementPanelProps {
  isOpen: boolean;
  onClose: () => void;
  getToken: () => Promise<string | null>;
  onUnreadChange: (count: number) => void;
}

interface UpcomingExam {
  id: string;
  title: string;
  exam_type: string | null;
  start_time: string | null;
  duration_minutes: number;
}

function AnnouncementPanel({ isOpen, onClose, getToken, onUnreadChange }: AnnouncementPanelProps) {
  const [announcements, setAnnouncements] = useState<PanelAnnouncement[]>([]);
  const [upcomingExams, setUpcomingExams] = useState<UpcomingExam[]>([]);
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const headers = { Authorization: `Bearer ${token}` };

      const [announcementRes, examRes] = await Promise.all([
        fetch(`${API_URL}/v2/announcements?limit=30`, { headers }),
        fetch(`${API_URL}/v2/exams/available`, { headers }).catch(() => null),
      ]);

      if (announcementRes.ok) {
        const data = await announcementRes.json();
        const items = data.data?.items || [];
        setAnnouncements(items);
      }

      if (examRes?.ok) {
        const data = await examRes.json();
        const exams: UpcomingExam[] = data.data || [];
        // Show exams starting within 24 hours
        const now = new Date();
        const soonExams = exams.filter((e) => {
          if (!e.start_time) return false;
          const hoursUntil = differenceInHours(new Date(e.start_time), now);
          return hoursUntil >= -1 && hoursUntil <= 24; // started within last hour OR within next 24h
        });
        setUpcomingExams(soonExams);
      }
    } catch (err) {
      console.error('Error fetching announcements:', err);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  // Fetch when panel opens
  useEffect(() => {
    if (isOpen) {
      fetchAnnouncements();
    }
  }, [isOpen, fetchAnnouncements]);

  const markAsRead = async (id: string) => {
    try {
      const token = await getToken();
      await fetch(`${API_URL}/v2/announcements/${id}/read`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      setAnnouncements((prev) =>
        prev.map((a) => (a.id === id ? { ...a, is_read: true } : a))
      );

      // Update unread count
      const newUnread = announcements.filter((a) => !a.is_read && a.id !== id).length;
      onUnreadChange(newUnread);
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const markAllAsRead = async () => {
    const unreadIds = announcements.filter((a) => !a.is_read).map((a) => a.id);
    if (unreadIds.length === 0) return;

    setMarkingAll(true);
    try {
      const token = await getToken();
      await fetch(`${API_URL}/v2/announcements/mark-all-read`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ announcementIds: unreadIds }),
      });

      setAnnouncements((prev) => prev.map((a) => ({ ...a, is_read: true })));
      onUnreadChange(0);
    } catch (err) {
      console.error('Error marking all as read:', err);
    } finally {
      setMarkingAll(false);
    }
  };

  const handleAnnouncementClick = (announcement: PanelAnnouncement) => {
    if (expandedId === announcement.id) {
      setExpandedId(null);
    } else {
      setExpandedId(announcement.id);
      if (!announcement.is_read) {
        markAsRead(announcement.id);
      }
    }
  };

  const unreadCount = announcements.filter((a) => !a.is_read).length;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-lg font-heading font-semibold text-slate-900">Notifications</h2>
                  {unreadCount > 0 && (
                    <p className="text-xs text-slate-500">{unreadCount} unread</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    disabled={markingAll}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-600 hover:bg-amber-50 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {markingAll ? <Spinner size="sm" /> : <CheckCheck className="w-3.5 h-3.5" />}
                    Mark all read
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <Spinner />
                </div>
              ) : announcements.length === 0 && upcomingExams.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                    <Megaphone className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="text-slate-500 font-medium">No notifications</p>
                  <p className="text-sm text-slate-400 mt-1">You're all caught up!</p>
                </div>
              ) : (
                <>
                {/* Upcoming Exam Reminders */}
                {upcomingExams.length > 0 && (
                  <div className="border-b border-slate-200">
                    <div className="px-5 py-2 bg-indigo-50/60">
                      <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Upcoming Exams</p>
                    </div>
                    {upcomingExams.map((exam) => {
                      const now = new Date();
                      const startTime = exam.start_time ? new Date(exam.start_time) : null;
                      const minsUntil = startTime ? differenceInMinutes(startTime, now) : null;
                      const isEntrySoon = minsUntil !== null && minsUntil <= 10 && minsUntil > -60;
                      const isLive = minsUntil !== null && minsUntil <= 0 && minsUntil > -60;

                      return (
                        <div
                          key={`exam-${exam.id}`}
                          className={clsx(
                            'px-5 py-3 cursor-pointer transition-colors border-b border-slate-100',
                            isEntrySoon ? 'bg-amber-50/60' : 'hover:bg-slate-50'
                          )}
                          onClick={() => { onClose(); navigate('/dashboard/exams'); }}
                        >
                          <div className="flex items-start gap-3">
                            <div className={clsx(
                              'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5',
                              isLive ? 'bg-emerald-100' : isEntrySoon ? 'bg-amber-100' : 'bg-indigo-100'
                            )}>
                              <ClipboardList className={clsx(
                                'w-4 h-4',
                                isLive ? 'text-emerald-600' : isEntrySoon ? 'text-amber-600' : 'text-indigo-500'
                              )} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-slate-900 truncate">{exam.title}</p>
                              <p className="text-xs text-slate-500 mt-0.5">
                                {exam.duration_minutes} min • {exam.exam_type || 'Exam'}
                              </p>
                              {startTime && (
                                <div className="flex items-center gap-1.5 mt-1">
                                  {isLive ? (
                                    <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
                                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                      Live now
                                    </span>
                                  ) : isEntrySoon ? (
                                    <span className="flex items-center gap-1 text-xs font-semibold text-amber-600">
                                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                                      Entry open — starts in {minsUntil} min
                                    </span>
                                  ) : (
                                    <span className="text-xs text-slate-400">
                                      {formatDistanceToNow(startTime, { addSuffix: true })}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {announcements.length > 0 && upcomingExams.length > 0 && (
                  <div className="px-5 py-2 bg-slate-50/60">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Announcements</p>
                  </div>
                )}
                <div className="divide-y divide-slate-100">
                  {announcements.map((announcement) => {
                    const config = priorityConfig[announcement.priority] || priorityConfig.normal;
                    const PriorityIcon = config.icon;
                    const isExpanded = expandedId === announcement.id;

                    return (
                      <motion.div
                        key={announcement.id}
                        layout
                        className={clsx(
                          'cursor-pointer transition-colors',
                          !announcement.is_read ? 'bg-amber-50/40' : 'hover:bg-slate-50'
                        )}
                        onClick={() => handleAnnouncementClick(announcement)}
                      >
                        <div className="px-5 py-4">
                          <div className="flex items-start gap-3">
                            {/* Priority icon */}
                            <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5', config.bg)}>
                              <PriorityIcon className={clsx('w-4 h-4', config.color)} />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className={clsx(
                                  'text-sm truncate',
                                  !announcement.is_read ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'
                                )}>
                                  {announcement.title}
                                </p>
                                {announcement.is_pinned && (
                                  <Pin className="w-3 h-3 text-amber-500 shrink-0" />
                                )}
                              </div>

                              {/* Preview or full body */}
                              <p className={clsx(
                                'text-sm text-slate-500 mt-0.5',
                                !isExpanded && 'line-clamp-2'
                              )}>
                                {announcement.body}
                              </p>

                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-xs text-slate-400">
                                  {formatDistanceToNow(parseISO(announcement.created_at), { addSuffix: true })}
                                </span>
                                {announcement.priority !== 'normal' && (
                                  <Badge
                                    variant={
                                      announcement.priority === 'urgent' ? 'danger' :
                                      announcement.priority === 'high' ? 'warning' : 'default'
                                    }
                                    size="sm"
                                  >
                                    {announcement.priority}
                                  </Badge>
                                )}
                                {!announcement.is_read && (
                                  <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-slate-100 shrink-0">
              <Link
                to="/dashboard/announcements"
                onClick={onClose}
                className="block w-full text-center py-2.5 text-sm font-medium text-amber-600 hover:bg-amber-50 rounded-xl transition-colors"
              >
                View all announcements
              </Link>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ============================================
// TOP BAR COMPONENT
// ============================================

interface TopBarProps {
  title: string;
  onMenuClick: () => void;
  onBellClick: () => void;
  notificationCount?: number;
}

function TopBar({ title, onMenuClick, onBellClick, notificationCount = 0 }: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 h-[72px] px-4 lg:px-6 bg-white border-b border-slate-200 flex items-center justify-between">
      {/* Left side */}
      <div className="flex items-center gap-4">
        <IconButton
          icon={<Menu className="w-5 h-5" />}
          aria-label="Open menu"
          variant="ghost"
          onClick={onMenuClick}
          className="lg:hidden"
        />

        {/* Breadcrumb / Page title */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-400 hidden sm:inline">Dashboard</span>
          <ChevronRight className="w-4 h-4 text-slate-300 hidden sm:inline" />
          <h1 className="font-heading font-semibold text-slate-900">{title}</h1>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Search button (mobile) */}
        <IconButton
          icon={<Search className="w-5 h-5" />}
          aria-label="Search"
          variant="ghost"
          className="sm:hidden"
        />

        {/* Search input (desktop) */}
        <div className="hidden sm:flex items-center gap-2 px-4 h-10 bg-slate-100 rounded-xl w-64 text-sm text-slate-500 transition-all focus-within:bg-white focus-within:ring-2 focus-within:ring-amber-100 focus-within:border-amber-300">
          <Search className="w-4 h-4 shrink-0" />
          <input
            type="text"
            placeholder="Search..."
            className="flex-1 bg-transparent outline-none placeholder:text-slate-400"
          />
        </div>

        {/* Notifications */}
        <div className="relative">
          <IconButton
            icon={<Bell className="w-5 h-5" />}
            aria-label="Notifications"
            variant="ghost"
            onClick={onBellClick}
          />
          {notificationCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-semibold bg-rose-500 text-white rounded-full pointer-events-none">
              {notificationCount > 9 ? '9+' : notificationCount}
            </span>
          )}
        </div>

        {/* User menu (desktop) */}
        <div className="hidden lg:block ml-2">
          <UserButton
            afterSignOutUrl="/"
            appearance={{
              elements: {
                avatarBox: 'w-9 h-9 rounded-xl',
              },
            }}
          />
        </div>
      </div>
    </header>
  );
}

// ============================================
// DASHBOARD LAYOUT COMPONENT
// ============================================

export function DashboardLayout() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { user: _clerkUser } = useUser();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [announcementPanelOpen, setAnnouncementPanelOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();

  // Fetch user data from backend
  useEffect(() => {
    const fetchUserData = async () => {
      if (!isSignedIn) {
        setLoading(false);
        return;
      }

      try {
        const token = await getToken();
        const response = await fetch(`${API_URL}/v2/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setUserData(data.data);
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (isLoaded) {
      fetchUserData();
    }
  }, [isLoaded, isSignedIn, getToken]);

  // Fetch unread announcement count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (!isSignedIn) return;

      try {
        const token = await getToken();
        const headers = { Authorization: `Bearer ${token}` };

        const [announcementRes, examRes] = await Promise.all([
          fetch(`${API_URL}/v2/announcements/unread-count`, { headers }),
          fetch(`${API_URL}/v2/exams/available`, { headers }).catch(() => null),
        ]);

        let count = 0;
        if (announcementRes.ok) {
          const data = await announcementRes.json();
          count += data.data?.count || 0;
        }

        // Count exams starting within 24 hours as notifications
        if (examRes?.ok) {
          const data = await examRes.json();
          const exams = data.data || [];
          const now = new Date();
          const soonExams = exams.filter((e: any) => {
            if (!e.start_time) return false;
            const hours = differenceInHours(new Date(e.start_time), now);
            return hours >= -1 && hours <= 24;
          });
          count += soonExams.length;
        }

        setUnreadCount(count);
      } catch (err) {
        console.error('Error fetching unread count:', err);
      }
    };

    if (isLoaded && isSignedIn) {
      fetchUnreadCount();
      // Refresh every 60 seconds
      const interval = setInterval(fetchUnreadCount, 60000);
      return () => clearInterval(interval);
    }
  }, [isLoaded, isSignedIn, getToken]);

  // Get navigation for current role
  const userRole = (userData?.user?.role as UserRole) || 'student';
  const baseNavigation = navigationByRole[userRole] || navigationByRole.student;

  // Add unread badge to Announcements nav item
  const navigation = useMemo(() => {
    return baseNavigation.map(section => ({
      ...section,
      items: section.items.map(item => {
        if (item.name === 'Announcements' && unreadCount > 0) {
          return { ...item, badge: unreadCount };
        }
        return item;
      }),
    }));
  }, [baseNavigation, unreadCount]);

  // Get current page title
  const currentPageTitle = useMemo(() => {
    for (const section of navigation) {
      const item = section.items.find((i) => i.href === location.pathname);
      if (item) return item.name;
    }
    return 'Dashboard';
  }, [navigation, location.pathname]);

  // Loading state
  if (!isLoaded || loading) {
    return <PageLoader text="Loading dashboard..." />;
  }

  // Not signed in - redirect
  if (!isSignedIn) {
    navigate('/sign-in');
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar */}
      <Sidebar
        navigation={navigation}
        currentPath={location.pathname}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        userData={userData}
      />

      {/* Main content area */}
      <div className="lg:pl-[260px]">
        {/* Top bar */}
        <TopBar
          title={currentPageTitle}
          onMenuClick={() => setSidebarOpen(true)}
          onBellClick={() => setAnnouncementPanelOpen(true)}
          notificationCount={unreadCount}
        />

        {/* Page content */}
        <main className="p-4 lg:p-6">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Outlet context={{ userData, userRole }} />
          </motion.div>
        </main>
      </div>

      {/* Announcement Panel */}
      <AnnouncementPanel
        isOpen={announcementPanelOpen}
        onClose={() => setAnnouncementPanelOpen(false)}
        getToken={getToken}
        onUnreadChange={setUnreadCount}
      />
    </div>
  );
}

export default DashboardLayout;
