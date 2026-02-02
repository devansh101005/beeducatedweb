// Premium Dashboard Layout
// Role-based navigation with smooth animations

import { useState, useEffect, useMemo } from 'react';
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
} from 'lucide-react';
import clsx from 'clsx';
import { IconButton } from '@shared/components/ui';
import { PageLoader, Spinner } from '@shared/components/ui';

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
        { name: 'Attendance', href: '/dashboard/attendance', icon: CheckSquare },
        { name: 'Payments', href: '/dashboard/payments', icon: CreditCard },
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
            <div className="w-9 h-9 bg-amber-500 rounded-xl flex items-center justify-center">
              <span className="text-lg font-bold text-white">B</span>
            </div>
            <span className="text-lg font-heading font-semibold text-slate-900">
              BeEducated
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
// TOP BAR COMPONENT
// ============================================

interface TopBarProps {
  title: string;
  onMenuClick: () => void;
  notificationCount?: number;
}

function TopBar({ title, onMenuClick, notificationCount = 0 }: TopBarProps) {
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
          />
          {notificationCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-semibold bg-rose-500 text-white rounded-full">
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
  const { user: clerkUser } = useUser();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
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

  // Get navigation for current role
  const userRole = (userData?.user?.role as UserRole) || 'student';
  const navigation = useMemo(
    () => navigationByRole[userRole] || navigationByRole.student,
    [userRole]
  );

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
          notificationCount={3}
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
    </div>
  );
}

export default DashboardLayout;
