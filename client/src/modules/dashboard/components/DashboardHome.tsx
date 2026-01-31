// Premium Dashboard Home
// Role-specific dashboard views with real-time data

import { useState, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { motion } from 'framer-motion';
import {
  Users,
  GraduationCap,
  BookOpen,
  ClipboardList,
  Bell,
  CheckCircle,
  ArrowRight,
  CreditCard,
  IndianRupee,
  FileText,
  Trophy,
  BookMarked,
  Target,
  Megaphone,
  UserPlus,
} from 'lucide-react';
import { Card, StatCard, Badge, Button, Avatar } from '@shared/components/ui';
import { Stagger, StaggerItem, fadeInUp } from '@shared/components/ui/motion';
import clsx from 'clsx';

// ============================================
// TYPES
// ============================================

type UserRole = 'admin' | 'teacher' | 'student' | 'parent' | 'batch_manager';

interface DashboardContext {
  userData: {
    user: {
      id: string;
      firstName: string;
      lastName: string;
      role: UserRole;
    };
  };
  userRole: UserRole;
}

interface DashboardStats {
  totalUsers?: number;
  totalStudents?: number;
  totalTeachers?: number;
  totalBatches?: number;
  totalCourses?: number;
  totalExams?: number;
  totalQuestions?: number;
  activeEnrollments?: number;
  pendingApplications?: number;
}

// ============================================
// API
// ============================================

const API_URL = import.meta.env.VITE_API_URL || '/api';

// ============================================
// SHARED COMPONENTS
// ============================================

function WelcomeHeader({ name, role }: { name: string; role: string }) {
  const greeting = getGreeting();

  return (
    <motion.div
      variants={fadeInUp}
      initial="initial"
      animate="animate"
      className="mb-8"
    >
      <h1 className="text-2xl lg:text-3xl font-heading font-semibold text-slate-900 mb-1">
        {greeting}, {name}!
      </h1>
      <p className="text-slate-500">
        Here's what's happening in your {role.replace('_', ' ')} dashboard today.
      </p>
    </motion.div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

interface QuickActionProps {
  icon: typeof Users;
  label: string;
  href: string;
  color: 'amber' | 'emerald' | 'sky' | 'rose';
}

function QuickAction({ icon: Icon, label, href, color }: QuickActionProps) {
  const colorClasses = {
    amber: 'bg-amber-50 text-amber-600 hover:bg-amber-100',
    emerald: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100',
    sky: 'bg-sky-50 text-sky-600 hover:bg-sky-100',
    rose: 'bg-rose-50 text-rose-600 hover:bg-rose-100',
  };

  return (
    <Link
      to={href}
      className={clsx(
        'flex flex-col items-center gap-2 p-4 rounded-xl transition-colors',
        colorClasses[color]
      )}
    >
      <Icon className="w-6 h-6" />
      <span className="text-xs font-medium text-center">{label}</span>
    </Link>
  );
}

// ============================================
// ADMIN DASHBOARD
// ============================================

interface EnrollmentStats {
  totalEnrollments: number;
  activeEnrollments: number;
  pendingEnrollments: number;
  totalRevenue: number;
  thisMonthEnrollments: number;
  thisMonthRevenue: number;
}

interface RecentEnrollment {
  id: string;
  enrollmentNumber: string;
  studentName: string;
  studentEmail: string;
  className: string;
  courseTypeName: string;
  status: string;
  amount: number;
  paymentType: string | null;
  enrolledAt: string | null;
  createdAt: string;
}

interface RecentActivityItem {
  id: string;
  userId: string | null;
  userName: string | null;
  activityType: string;
  entityType: string | null;
  entityId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

function AdminDashboard() {
  const { getToken } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [enrollmentStats, setEnrollmentStats] = useState<EnrollmentStats | null>(null);
  const [recentEnrollments, setRecentEnrollments] = useState<RecentEnrollment[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const token = await getToken();
        const headers = { Authorization: `Bearer ${token}` };

        const [overviewRes, enrollmentStatsRes, recentEnrollmentsRes, activityRes] = await Promise.all([
          fetch(`${API_URL}/v2/dashboard/admin/overview`, { headers }),
          fetch(`${API_URL}/v2/dashboard/admin/enrollment-stats`, { headers }),
          fetch(`${API_URL}/v2/dashboard/admin/recent-enrollments?limit=5`, { headers }),
          fetch(`${API_URL}/v2/dashboard/admin/activity?limit=5`, { headers }),
        ]);

        if (overviewRes.ok) {
          const data = await overviewRes.json();
          setStats(data.data);
        }
        if (enrollmentStatsRes.ok) {
          const data = await enrollmentStatsRes.json();
          setEnrollmentStats(data.data);
        }
        if (recentEnrollmentsRes.ok) {
          const data = await recentEnrollmentsRes.json();
          setRecentEnrollments(data.data || []);
        }
        if (activityRes.ok) {
          const data = await activityRes.json();
          setRecentActivity(data.data || []);
        }
      } catch (err) {
        console.error('Failed to fetch admin stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, [getToken]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  const getActivityDescription = (activity: RecentActivityItem) => {
    const name = activity.userName || 'Someone';
    switch (activity.activityType) {
      case 'enrollment_created':
        return `${name} enrolled in a course`;
      case 'payment_completed':
        return `${name} completed a payment`;
      case 'exam_submitted':
        return `${name} submitted an exam`;
      case 'user_registered':
        return `${name} registered`;
      default:
        return `${name} performed ${activity.activityType.replace(/_/g, ' ')}`;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-100 text-emerald-700';
      case 'pending': return 'bg-amber-100 text-amber-700';
      case 'expired': return 'bg-slate-100 text-slate-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Primary Stats Grid */}
      <Stagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StaggerItem>
          <StatCard
            title="Total Students"
            value={loading ? '--' : (stats?.totalStudents || 0).toLocaleString()}
            icon={<GraduationCap className="w-6 h-6" />}
            iconColor="amber"
            isLoading={loading}
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            title="Total Teachers"
            value={loading ? '--' : (stats?.totalTeachers || 0).toLocaleString()}
            icon={<Users className="w-6 h-6" />}
            iconColor="sky"
            isLoading={loading}
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            title="Active Enrollments"
            value={loading ? '--' : (enrollmentStats?.activeEnrollments || 0).toLocaleString()}
            icon={<BookOpen className="w-6 h-6" />}
            iconColor="emerald"
            isLoading={loading}
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            title="This Month Revenue"
            value={loading ? '--' : formatCurrency(enrollmentStats?.thisMonthRevenue || 0)}
            icon={<IndianRupee className="w-6 h-6" />}
            iconColor="rose"
            isLoading={loading}
          />
        </StaggerItem>
      </Stagger>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {loading ? '--' : stats?.totalBatches || 0}
              </p>
              <p className="text-xs text-slate-500">Active Batches</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-cyan-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {loading ? '--' : stats?.totalExams || 0}
              </p>
              <p className="text-xs text-slate-500">Total Exams</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
              <FileText className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {loading ? '--' : enrollmentStats?.pendingEnrollments || 0}
              </p>
              <p className="text-xs text-slate-500">Pending Payments</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {loading ? '--' : formatCurrency(enrollmentStats?.totalRevenue || 0)}
              </p>
              <p className="text-xs text-slate-500">Total Revenue</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions Section */}
      <Card className="p-5">
        <h3 className="text-lg font-heading font-semibold text-slate-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          <Link
            to="/dashboard/students?action=add"
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 transition-all shadow-sm hover:shadow-md"
          >
            <UserPlus className="w-6 h-6" />
            <span className="text-xs font-medium text-center">Add Student</span>
          </Link>
          <Link
            to="/dashboard/applications"
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
          >
            <FileText className="w-6 h-6" />
            <span className="text-xs font-medium text-center">Applications</span>
          </Link>
          <Link
            to="/dashboard/users"
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-sky-50 text-sky-700 hover:bg-sky-100 transition-colors"
          >
            <Users className="w-6 h-6" />
            <span className="text-xs font-medium text-center">All Users</span>
          </Link>
          <Link
            to="/dashboard/students"
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
          >
            <GraduationCap className="w-6 h-6" />
            <span className="text-xs font-medium text-center">Students</span>
          </Link>
          <Link
            to="/dashboard/batches"
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-violet-50 text-violet-700 hover:bg-violet-100 transition-colors"
          >
            <BookOpen className="w-6 h-6" />
            <span className="text-xs font-medium text-center">Batches</span>
          </Link>
          <Link
            to="/dashboard/courses"
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors"
          >
            <BookMarked className="w-6 h-6" />
            <span className="text-xs font-medium text-center">Courses</span>
          </Link>
          <Link
            to="/dashboard/exams"
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-cyan-50 text-cyan-700 hover:bg-cyan-100 transition-colors"
          >
            <ClipboardList className="w-6 h-6" />
            <span className="text-xs font-medium text-center">Exams</span>
          </Link>
        </div>
      </Card>

      {/* Recent Enrollments & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Enrollments */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-heading font-semibold text-slate-900">Recent Enrollments</h3>
            <Link to="/dashboard/enrollments" className="text-sm text-amber-600 hover:text-amber-700 font-medium">
              View all
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 animate-pulse">
                  <div className="w-10 h-10 rounded-lg bg-slate-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-32" />
                    <div className="h-3 bg-slate-200 rounded w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : recentEnrollments.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <GraduationCap className="w-12 h-12 mx-auto mb-2 text-slate-300" />
              <p className="text-sm">No enrollments yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentEnrollments.map((enrollment) => (
                <div key={enrollment.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-semibold text-sm">
                    {enrollment.studentName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{enrollment.studentName}</p>
                    <p className="text-xs text-slate-500 truncate">{enrollment.className}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-slate-900">{formatCurrency(enrollment.amount)}</p>
                    <span className={clsx('inline-block text-xs px-2 py-0.5 rounded-full', getStatusColor(enrollment.status))}>
                      {enrollment.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Recent Activity */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-heading font-semibold text-slate-900">Recent Activity</h3>
            <Link to="/dashboard/activity" className="text-sm text-amber-600 hover:text-amber-700 font-medium">
              View all
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start gap-3 py-3 animate-pulse">
                  <div className="w-8 h-8 rounded-full bg-slate-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-48" />
                    <div className="h-3 bg-slate-200 rounded w-20" />
                  </div>
                </div>
              ))}
            </div>
          ) : recentActivity.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Bell className="w-12 h-12 mx-auto mb-2 text-slate-300" />
              <p className="text-sm">No recent activity</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 py-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                    <Bell className="w-4 h-4 text-slate-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700">{getActivityDescription(activity)}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{formatTimeAgo(activity.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Management Links */}
      <Card className="p-5">
        <h3 className="text-lg font-heading font-semibold text-slate-900 mb-4">Management</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <Link
            to="/dashboard/applications"
            className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-amber-300 hover:bg-amber-50/50 transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center group-hover:bg-amber-200 transition-colors">
              <FileText className="w-6 h-6 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-slate-900">Pending Applications</p>
              <p className="text-sm text-slate-500">Review new applications</p>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-amber-600 transition-colors" />
          </Link>

          <Link
            to="/dashboard/users"
            className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-sky-300 hover:bg-sky-50/50 transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-sky-100 flex items-center justify-center group-hover:bg-sky-200 transition-colors">
              <Users className="w-6 h-6 text-sky-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-slate-900">User Management</p>
              <p className="text-sm text-slate-500">Manage all users</p>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-sky-600 transition-colors" />
          </Link>

          <Link
            to="/dashboard/students"
            className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
              <GraduationCap className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-slate-900">Student Directory</p>
              <p className="text-sm text-slate-500">View enrolled students</p>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 transition-colors" />
          </Link>

          <Link
            to="/dashboard/batches"
            className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-violet-300 hover:bg-violet-50/50 transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center group-hover:bg-violet-200 transition-colors">
              <BookOpen className="w-6 h-6 text-violet-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-slate-900">Batch Management</p>
              <p className="text-sm text-slate-500">Create and manage batches</p>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-violet-600 transition-colors" />
          </Link>

          <Link
            to="/dashboard/courses"
            className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-rose-300 hover:bg-rose-50/50 transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center group-hover:bg-rose-200 transition-colors">
              <BookMarked className="w-6 h-6 text-rose-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-slate-900">Course Settings</p>
              <p className="text-sm text-slate-500">Manage course types</p>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-rose-600 transition-colors" />
          </Link>

          <Link
            to="/dashboard/exams"
            className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-cyan-300 hover:bg-cyan-50/50 transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-cyan-100 flex items-center justify-center group-hover:bg-cyan-200 transition-colors">
              <ClipboardList className="w-6 h-6 text-cyan-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-slate-900">Exam Center</p>
              <p className="text-sm text-slate-500">Create and schedule exams</p>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-cyan-600 transition-colors" />
          </Link>
        </div>
      </Card>
    </div>
  );
}

// ============================================
// STUDENT DASHBOARD
// ============================================

interface StudentEnrollment {
  classId: string;
  className: string;
  courseTypeName: string;
  enrolledAt: string;
  expiresAt: string | null;
  daysRemaining: number | null;
}

interface StudyMaterial {
  id: string;
  title: string;
  type: string;
  materialType: string;
  className: string;
  subjectName: string;
}

interface StudentDashboardData {
  performance: {
    totalExamsAttempted: number;
    totalExamsPassed: number;
    averageScore: number;
    highestScore: number;
    currentStreak: number;
  };
  upcomingExams: Array<{
    id: string;
    title: string;
    start_time: string;
    duration_minutes: number;
    total_marks: number;
  }>;
  recentResults: Array<{
    id: string;
    total_marks_obtained: number;
    percentage_score: number;
    is_passed: boolean;
    calculated_at: string;
    exam_attempts: {
      exam_id: string;
      exams: { title: string };
    };
  }>;
  courseProgress: Array<{
    progress: number;
    status: string;
    courses: {
      id: string;
      name: string;
      thumbnail_url: string | null;
    };
  }>;
}

function StudentDashboard() {
  const { getToken } = useAuth();
  const [dashboardData, setDashboardData] = useState<StudentDashboardData | null>(null);
  const [enrollments, setEnrollments] = useState<StudentEnrollment[]>([]);
  const [recentMaterials, setRecentMaterials] = useState<StudyMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [materialsLoading, setMaterialsLoading] = useState(true);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const token = await getToken();
        const headers = { Authorization: `Bearer ${token}` };

        // Fetch dashboard data and materials in parallel
        const [dashboardRes, materialsRes] = await Promise.all([
          fetch(`${API_URL}/v2/dashboard/student`, { headers }),
          fetch(`${API_URL}/v2/student/materials?limit=5`, { headers }),
        ]);

        if (dashboardRes.ok) {
          const data = await dashboardRes.json();
          setDashboardData(data.data);
        }

        if (materialsRes.ok) {
          const data = await materialsRes.json();
          setRecentMaterials(data.data?.materials || []);
          setEnrollments(data.data?.enrolledClasses || []);
        }
      } catch (err) {
        console.error('Failed to fetch student data:', err);
      } finally {
        setLoading(false);
        setMaterialsLoading(false);
      }
    };
    fetchAllData();
  }, [getToken]);

  const formatExamTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getMaterialIcon = (type: string) => {
    switch (type) {
      case 'video': return <BookOpen className="w-5 h-5 text-sky-600" />;
      case 'pdf': return <FileText className="w-5 h-5 text-rose-600" />;
      default: return <BookMarked className="w-5 h-5 text-amber-600" />;
    }
  };

  const getMaterialTypeLabel = (type: string) => {
    switch (type) {
      case 'lecture': return 'Lecture';
      case 'notes': return 'Notes';
      case 'dpp': return 'DPP';
      case 'dpp_solution': return 'DPP Solution';
      case 'ncert': return 'NCERT';
      case 'pyq': return 'PYQ';
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <Stagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StaggerItem>
          <StatCard
            title="Enrolled Classes"
            value={loading ? '--' : String(enrollments.length || 0)}
            icon={<GraduationCap className="w-6 h-6" />}
            iconColor="amber"
            isLoading={loading}
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            title="Study Materials"
            value={materialsLoading ? '--' : String(recentMaterials.length || 0) + '+'}
            icon={<BookOpen className="w-6 h-6" />}
            iconColor="sky"
            isLoading={materialsLoading}
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            title="Average Score"
            value={loading ? '--' : `${Math.round(dashboardData?.performance?.averageScore || 0)}%`}
            icon={<Trophy className="w-6 h-6" />}
            iconColor="emerald"
            isLoading={loading}
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            title="Exams Passed"
            value={loading ? '--' : String(dashboardData?.performance?.totalExamsPassed || 0)}
            icon={<Target className="w-6 h-6" />}
            iconColor="rose"
            isLoading={loading}
          />
        </StaggerItem>
      </Stagger>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* My Enrolled Classes */}
        <Card className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-heading font-semibold text-slate-900">My Classes</h3>
            <Link to="/dashboard/my-enrollments" className="text-sm text-amber-600 hover:text-amber-700 font-medium">
              View all
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 animate-pulse">
                  <div className="w-12 h-12 bg-slate-200 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-32" />
                    <div className="h-3 bg-slate-200 rounded w-48" />
                  </div>
                </div>
              ))}
            </div>
          ) : enrollments.length === 0 ? (
            <div className="text-center py-8">
              <GraduationCap className="w-12 h-12 mx-auto mb-2 text-slate-300" />
              <p className="text-sm text-slate-500 mb-4">You haven't enrolled in any classes yet</p>
              <Link
                to="/courses"
                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors"
              >
                Browse Classes
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {enrollments.slice(0, 3).map((enrollment) => (
                <Link
                  key={enrollment.classId}
                  to={`/dashboard/study-materials?classId=${enrollment.classId}`}
                  className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white font-bold">
                    {enrollment.className.replace(/[^0-9]/g, '') || enrollment.className.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{enrollment.className}</p>
                    <p className="text-sm text-slate-500">{enrollment.courseTypeName}</p>
                  </div>
                  <div className="text-right">
                    {enrollment.daysRemaining !== null ? (
                      <Badge variant={enrollment.daysRemaining > 30 ? 'success' : enrollment.daysRemaining > 7 ? 'warning' : 'error'}>
                        {enrollment.daysRemaining} days left
                      </Badge>
                    ) : (
                      <Badge variant="success">Active</Badge>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>

        {/* Quick Access */}
        <Card className="p-5">
          <h3 className="text-lg font-heading font-semibold text-slate-900 mb-4">Quick Access</h3>
          <div className="space-y-2">
            {[
              { icon: BookOpen, label: 'Study Materials', href: '/dashboard/study-materials', color: 'text-amber-600 bg-amber-50' },
              { icon: ClipboardList, label: 'My Exams', href: '/dashboard/my-exams', color: 'text-sky-600 bg-sky-50' },
              { icon: Trophy, label: 'My Results', href: '/dashboard/my-results', color: 'text-emerald-600 bg-emerald-50' },
              { icon: CreditCard, label: 'My Enrollments', href: '/dashboard/my-enrollments', color: 'text-rose-600 bg-rose-50' },
              { icon: Bell, label: 'Announcements', href: '/dashboard/announcements', color: 'text-violet-600 bg-violet-50' },
            ].map((item, i) => (
              <Link
                key={i}
                to={item.href}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors"
              >
                <div className={clsx('w-10 h-10 rounded-lg flex items-center justify-center', item.color)}>
                  <item.icon className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium text-slate-700">{item.label}</span>
                <ArrowRight className="w-4 h-4 text-slate-400 ml-auto" />
              </Link>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent Study Materials */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-heading font-semibold text-slate-900">Recent Study Materials</h3>
          <Link to="/dashboard/study-materials" className="text-sm text-amber-600 hover:text-amber-700 font-medium">
            View all
          </Link>
        </div>
        {materialsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 rounded-xl bg-slate-50 animate-pulse">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-full" />
                    <div className="h-3 bg-slate-200 rounded w-2/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : recentMaterials.length === 0 ? (
          <div className="text-center py-8">
            <BookOpen className="w-12 h-12 mx-auto mb-2 text-slate-300" />
            <p className="text-sm text-slate-500 mb-2">No study materials available yet</p>
            <p className="text-xs text-slate-400">Materials will appear here once your teacher uploads them</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {recentMaterials.map((material) => (
              <Link
                key={material.id}
                to={`/dashboard/study-materials/${material.id}`}
                className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
                  {getMaterialIcon(material.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{material.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="default" size="sm">{material.className}</Badge>
                    {material.materialType && (
                      <span className="text-xs text-slate-500">{getMaterialTypeLabel(material.materialType)}</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>

      {/* Upcoming Exams */}
      {dashboardData?.upcomingExams && dashboardData.upcomingExams.length > 0 && (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-heading font-semibold text-slate-900">Upcoming Exams</h3>
            <Link to="/dashboard/my-exams" className="text-sm text-amber-600 hover:text-amber-700 font-medium">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {dashboardData.upcomingExams.slice(0, 3).map((exam) => (
              <div key={exam.id} className="flex items-center gap-4 p-3 rounded-xl bg-slate-50">
                <div className="w-12 h-12 rounded-xl bg-sky-100 flex items-center justify-center">
                  <ClipboardList className="w-6 h-6 text-sky-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-900">{exam.title}</p>
                  <p className="text-sm text-slate-500">{exam.duration_minutes} min | {exam.total_marks} marks</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-700">{formatExamTime(exam.start_time)}</p>
                  <Badge variant="primary" dot>upcoming</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// ============================================
// TEACHER DASHBOARD
// ============================================

function TeacherDashboard() {
  return (
    <div className="space-y-6">
      <Stagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StaggerItem>
          <StatCard
            title="My Batches"
            value="4"
            icon={<BookOpen className="w-6 h-6" />}
            iconColor="amber"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            title="Total Students"
            value="156"
            icon={<GraduationCap className="w-6 h-6" />}
            iconColor="sky"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            title="Exams This Week"
            value="3"
            icon={<ClipboardList className="w-6 h-6" />}
            iconColor="emerald"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            title="Pending Reviews"
            value="12"
            icon={<FileText className="w-6 h-6" />}
            iconColor="rose"
          />
        </StaggerItem>
      </Stagger>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-heading font-semibold text-slate-900">Today's Classes</h3>
            <Link to="/dashboard/schedule" className="text-sm text-amber-600 hover:text-amber-700 font-medium">
              View schedule
            </Link>
          </div>
          <div className="space-y-3">
            {[
              { time: '09:00 - 10:30', batch: 'JEE-2025', subject: 'Physics', students: 45, status: 'completed' },
              { time: '11:00 - 12:30', batch: 'NEET-2025', subject: 'Physics', students: 38, status: 'ongoing' },
              { time: '02:00 - 03:30', batch: 'Class 12-A', subject: 'Physics', students: 42, status: 'upcoming' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-slate-50">
                <div className="text-sm font-medium text-slate-500 w-28">{item.time}</div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">{item.subject}</p>
                  <p className="text-xs text-slate-500">{item.batch} - {item.students} students</p>
                </div>
                <Badge
                  variant={
                    item.status === 'completed' ? 'success' :
                    item.status === 'ongoing' ? 'primary' : 'default'
                  }
                  dot
                >
                  {item.status}
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-heading font-semibold text-slate-900">Quick Actions</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <QuickAction icon={ClipboardList} label="Create Exam" href="/dashboard/exams/new" color="amber" />
            <QuickAction icon={BookMarked} label="Upload Material" href="/dashboard/materials/new" color="emerald" />
            <QuickAction icon={CheckCircle} label="Take Attendance" href="/dashboard/attendance" color="sky" />
            <QuickAction icon={Megaphone} label="Announcement" href="/dashboard/announcements/new" color="rose" />
          </div>
        </Card>
      </div>
    </div>
  );
}

// ============================================
// PARENT DASHBOARD
// ============================================

function ParentDashboard() {
  return (
    <div className="space-y-6">
      <Stagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StaggerItem>
          <StatCard
            title="My Children"
            value="2"
            icon={<Users className="w-6 h-6" />}
            iconColor="amber"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            title="Avg. Attendance"
            value="94%"
            icon={<Target className="w-6 h-6" />}
            iconColor="emerald"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            title="Avg. Performance"
            value="88%"
            icon={<Trophy className="w-6 h-6" />}
            iconColor="sky"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            title="Pending Fees"
            value="Rs. 12,500"
            icon={<CreditCard className="w-6 h-6" />}
            iconColor="rose"
          />
        </StaggerItem>
      </Stagger>

      <Card className="p-5">
        <h3 className="text-lg font-heading font-semibold text-slate-900 mb-4">Children Overview</h3>
        <div className="space-y-4">
          {[
            { name: 'Rahul Sharma', class: 'Class 10', performance: 92, attendance: 96 },
            { name: 'Priya Sharma', class: 'Class 8', performance: 88, attendance: 94 },
          ].map((child, i) => (
            <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-slate-50">
              <Avatar name={child.name} size="lg" />
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900">{child.name}</p>
                <p className="text-xs text-slate-500">{child.class}</p>
              </div>
              <div className="text-center px-4">
                <p className="text-lg font-semibold text-emerald-600">{child.performance}%</p>
                <p className="text-xs text-slate-500">Performance</p>
              </div>
              <div className="text-center px-4">
                <p className="text-lg font-semibold text-sky-600">{child.attendance}%</p>
                <p className="text-xs text-slate-500">Attendance</p>
              </div>
              <Button variant="outline" size="sm">
                View Details
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function DashboardHome() {
  const { userData, userRole } = useOutletContext<DashboardContext>();
  const firstName = userData?.user?.firstName || 'User';

  const renderDashboard = () => {
    switch (userRole) {
      case 'admin':
        return <AdminDashboard />;
      case 'teacher':
        return <TeacherDashboard />;
      case 'student':
        return <StudentDashboard />;
      case 'parent':
        return <ParentDashboard />;
      case 'batch_manager':
        return <AdminDashboard />; // Similar to admin but limited
      default:
        return <StudentDashboard />;
    }
  };

  return (
    <div>
      <WelcomeHeader name={firstName} role={userRole} />
      {renderDashboard()}
    </div>
  );
}

export default DashboardHome;
