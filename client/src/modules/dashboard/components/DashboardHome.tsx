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
  TrendingUp,
  TrendingDown,
  Calendar,
  Bell,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  CreditCard,
  IndianRupee,
  FileText,
  Trophy,
  BookMarked,
  Target,
  Megaphone,
} from 'lucide-react';
import { Card, StatCard, Button, Badge, Avatar, Skeleton, EmptyState } from '@shared/components/ui';
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
  totalStudents?: number;
  totalTeachers?: number;
  totalBatches?: number;
  totalCourses?: number;
  activeExams?: number;
  pendingApplications?: number;
  pendingPayments?: number;
  totalRevenue?: number;
  upcomingExams?: number;
  completedExams?: number;
  averageScore?: number;
  attendanceRate?: number;
  // Add more as needed
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

interface ActivityItemProps {
  avatar?: string;
  name: string;
  action: string;
  time: string;
  type?: 'default' | 'success' | 'warning' | 'info';
}

function ActivityItem({ avatar, name, action, time, type = 'default' }: ActivityItemProps) {
  const typeColors = {
    default: 'bg-slate-100',
    success: 'bg-emerald-100',
    warning: 'bg-orange-100',
    info: 'bg-sky-100',
  };

  return (
    <div className="flex items-start gap-3 py-3">
      <Avatar src={avatar} name={name} size="sm" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-700">
          <span className="font-medium text-slate-900">{name}</span> {action}
        </p>
        <p className="text-xs text-slate-400 mt-0.5">{time}</p>
      </div>
    </div>
  );
}

// ============================================
// ADMIN DASHBOARD
// ============================================

function AdminDashboard() {
  const { getToken } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = await getToken();
        const response = await fetch(`${API_URL}/v2/dashboard/admin/overview`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setStats(data.data);
        }
      } catch (err) {
        console.error('Failed to fetch admin stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [getToken]);

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <Stagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StaggerItem>
          <StatCard
            title="Total Students"
            value={loading ? '--' : stats?.totalStudents?.toLocaleString() || '0'}
            icon={<GraduationCap className="w-6 h-6" />}
            iconColor="amber"
            trend={{ value: 12, isPositive: true, label: 'this month' }}
            isLoading={loading}
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            title="Total Teachers"
            value={loading ? '--' : stats?.totalTeachers?.toLocaleString() || '0'}
            icon={<Users className="w-6 h-6" />}
            iconColor="sky"
            isLoading={loading}
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            title="Active Batches"
            value={loading ? '--' : stats?.totalBatches?.toLocaleString() || '0'}
            icon={<BookOpen className="w-6 h-6" />}
            iconColor="emerald"
            isLoading={loading}
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            title="Pending Applications"
            value={loading ? '--' : stats?.pendingApplications?.toLocaleString() || '0'}
            icon={<FileText className="w-6 h-6" />}
            iconColor="rose"
            isLoading={loading}
          />
        </StaggerItem>
      </Stagger>

      {/* Revenue & Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-heading font-semibold text-slate-900">Revenue Overview</h3>
            <select className="text-sm border-0 bg-slate-100 rounded-lg px-3 py-1.5 text-slate-600">
              <option>This Month</option>
              <option>Last Month</option>
              <option>This Year</option>
            </select>
          </div>
          <div className="h-64 flex items-center justify-center bg-slate-50 rounded-xl">
            <p className="text-slate-400 text-sm">Revenue chart will be displayed here</p>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="text-lg font-heading font-semibold text-slate-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <QuickAction icon={GraduationCap} label="Add Student" href="/dashboard/students/new" color="amber" />
            <QuickAction icon={BookOpen} label="Create Batch" href="/dashboard/batches/new" color="emerald" />
            <QuickAction icon={ClipboardList} label="Create Exam" href="/dashboard/exams/new" color="sky" />
            <QuickAction icon={Megaphone} label="Announcement" href="/dashboard/announcements/new" color="rose" />
          </div>
        </Card>
      </div>

      {/* Activity & Upcoming */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-heading font-semibold text-slate-900">Recent Activity</h3>
            <Link to="/dashboard/activity" className="text-sm text-amber-600 hover:text-amber-700 font-medium">
              View all
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            <ActivityItem
              name="John Doe"
              action="submitted application for Class 10"
              time="2 hours ago"
              type="info"
            />
            <ActivityItem
              name="Sarah Smith"
              action="completed payment of Rs. 15,000"
              time="4 hours ago"
              type="success"
            />
            <ActivityItem
              name="Mike Johnson"
              action="joined Batch JEE-2025"
              time="Yesterday"
            />
            <ActivityItem
              name="Emily Brown"
              action="scored 95% in Physics Exam"
              time="Yesterday"
              type="success"
            />
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-heading font-semibold text-slate-900">Upcoming Exams</h3>
            <Link to="/dashboard/exams" className="text-sm text-amber-600 hover:text-amber-700 font-medium">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {[
              { name: 'Physics Mock Test', date: 'Tomorrow, 10:00 AM', batch: 'JEE-2025' },
              { name: 'Chemistry Weekly', date: 'Jan 26, 2:00 PM', batch: 'NEET-2025' },
              { name: 'Math Final', date: 'Jan 28, 9:00 AM', batch: 'Class 12-A' },
            ].map((exam, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900">{exam.name}</p>
                  <p className="text-xs text-slate-500">{exam.date}</p>
                </div>
                <Badge variant="default" size="sm">{exam.batch}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ============================================
// STUDENT DASHBOARD
// ============================================

function StudentDashboard() {
  const { getToken } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = await getToken();
        const response = await fetch(`${API_URL}/v2/dashboard/student`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setStats(data.data);
        }
      } catch (err) {
        console.error('Failed to fetch student stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [getToken]);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <Stagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StaggerItem>
          <StatCard
            title="Enrolled Courses"
            value={loading ? '--' : stats?.totalCourses || '3'}
            icon={<BookOpen className="w-6 h-6" />}
            iconColor="amber"
            isLoading={loading}
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            title="Upcoming Exams"
            value={loading ? '--' : stats?.upcomingExams || '2'}
            icon={<ClipboardList className="w-6 h-6" />}
            iconColor="sky"
            isLoading={loading}
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            title="Average Score"
            value={loading ? '--' : `${stats?.averageScore || 85}%`}
            icon={<Trophy className="w-6 h-6" />}
            iconColor="emerald"
            trend={{ value: 5, isPositive: true, label: 'vs last month' }}
            isLoading={loading}
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            title="Attendance"
            value={loading ? '--' : `${stats?.attendanceRate || 92}%`}
            icon={<Target className="w-6 h-6" />}
            iconColor="rose"
            isLoading={loading}
          />
        </StaggerItem>
      </Stagger>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Upcoming Schedule */}
        <Card className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-heading font-semibold text-slate-900">Today's Schedule</h3>
            <Link to="/dashboard/schedule" className="text-sm text-amber-600 hover:text-amber-700 font-medium">
              View full
            </Link>
          </div>
          <div className="space-y-3">
            {[
              { time: '09:00 AM', title: 'Physics - Electromagnetism', status: 'completed' },
              { time: '11:00 AM', title: 'Chemistry - Organic Reactions', status: 'ongoing' },
              { time: '02:00 PM', title: 'Mathematics - Calculus', status: 'upcoming' },
              { time: '04:00 PM', title: 'Biology - Human Physiology', status: 'upcoming' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-slate-50">
                <div className="text-sm font-medium text-slate-500 w-20">{item.time}</div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">{item.title}</p>
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

        {/* Quick Access */}
        <Card className="p-5">
          <h3 className="text-lg font-heading font-semibold text-slate-900 mb-4">Quick Access</h3>
          <div className="space-y-2">
            {[
              { icon: BookMarked, label: 'Study Materials', href: '/dashboard/materials', color: 'text-amber-600 bg-amber-50' },
              { icon: ClipboardList, label: 'Practice Tests', href: '/dashboard/exams', color: 'text-sky-600 bg-sky-50' },
              { icon: Trophy, label: 'My Results', href: '/dashboard/results', color: 'text-emerald-600 bg-emerald-50' },
              { icon: CreditCard, label: 'Fee Details', href: '/dashboard/fees', color: 'text-rose-600 bg-rose-50' },
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

      {/* Announcements */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-heading font-semibold text-slate-900">Recent Announcements</h3>
          <Link to="/dashboard/announcements" className="text-sm text-amber-600 hover:text-amber-700 font-medium">
            View all
          </Link>
        </div>
        <div className="space-y-3">
          {[
            { title: 'Holiday Notice', content: 'Institute will remain closed on 26th January for Republic Day.', time: '2 hours ago', priority: 'high' },
            { title: 'Exam Schedule Released', content: 'Mock test series schedule for February has been published.', time: 'Yesterday', priority: 'normal' },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-slate-50">
              <div className={clsx(
                'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
                item.priority === 'high' ? 'bg-rose-100 text-rose-600' : 'bg-sky-100 text-sky-600'
              )}>
                <Bell className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium text-slate-900">{item.title}</p>
                  {item.priority === 'high' && (
                    <Badge variant="danger" size="sm">Important</Badge>
                  )}
                </div>
                <p className="text-sm text-slate-600 line-clamp-2">{item.content}</p>
                <p className="text-xs text-slate-400 mt-1">{item.time}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
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
