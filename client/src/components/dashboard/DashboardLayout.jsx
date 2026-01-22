// Dashboard Layout with Role-Based Navigation
import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { useAuth, useUser, UserButton } from "@clerk/clerk-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Navigation items by role
const navigationByRole = {
  admin: [
    { name: "Dashboard", href: "/dashboard", icon: "📊" },
    { name: "Users", href: "/dashboard/users", icon: "👥" },
    { name: "Students", href: "/dashboard/students", icon: "🎓" },
    { name: "Teachers", href: "/dashboard/teachers", icon: "👨‍🏫" },
    { name: "Batches", href: "/dashboard/batches", icon: "📚" },
    { name: "Applications", href: "/dashboard/applications", icon: "📝" },
    { name: "Exams", href: "/dashboard/exams", icon: "📋" },
    { name: "Materials", href: "/dashboard/materials", icon: "📁" },
    { name: "Settings", href: "/dashboard/settings", icon: "⚙️" },
  ],
  teacher: [
    { name: "Dashboard", href: "/dashboard", icon: "📊" },
    { name: "My Batches", href: "/dashboard/my-batches", icon: "📚" },
    { name: "Students", href: "/dashboard/students", icon: "🎓" },
    { name: "Exams", href: "/dashboard/exams", icon: "📋" },
    { name: "Materials", href: "/dashboard/materials", icon: "📁" },
    { name: "Schedule", href: "/dashboard/schedule", icon: "📅" },
  ],
  student: [
    { name: "Dashboard", href: "/dashboard", icon: "📊" },
    { name: "My Courses", href: "/dashboard/courses", icon: "📚" },
    { name: "Exams", href: "/dashboard/exams", icon: "📋" },
    { name: "Materials", href: "/dashboard/materials", icon: "📁" },
    { name: "Results", href: "/dashboard/results", icon: "🏆" },
    { name: "Schedule", href: "/dashboard/schedule", icon: "📅" },
  ],
  parent: [
    { name: "Dashboard", href: "/dashboard", icon: "📊" },
    { name: "My Children", href: "/dashboard/children", icon: "👨‍👧‍👦" },
    { name: "Progress", href: "/dashboard/progress", icon: "📈" },
    { name: "Attendance", href: "/dashboard/attendance", icon: "✅" },
    { name: "Payments", href: "/dashboard/payments", icon: "💳" },
  ],
  batch_manager: [
    { name: "Dashboard", href: "/dashboard", icon: "📊" },
    { name: "Batches", href: "/dashboard/batches", icon: "📚" },
    { name: "Students", href: "/dashboard/students", icon: "🎓" },
    { name: "Schedule", href: "/dashboard/schedule", icon: "📅" },
    { name: "Attendance", href: "/dashboard/attendance", icon: "✅" },
  ],
};

const DashboardLayout = () => {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { user: clerkUser } = useUser();
  const [userData, setUserData] = useState(null);
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
        console.error("Error fetching user data:", err);
      } finally {
        setLoading(false);
      }
    };

    if (isLoaded) {
      fetchUserData();
    }
  }, [isLoaded, isSignedIn, getToken]);

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (!isSignedIn) {
    navigate("/sign-in");
    return null;
  }

  const userRole = userData?.user?.role || "student";
  const navigation = navigationByRole[userRole] || navigationByRole.student;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-center border-b border-gray-200">
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-2xl">🐝</span>
            <span className="text-xl font-bold text-amber-600">BeEducated</span>
          </Link>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "w-10 h-10",
                  },
                }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {userData?.user?.firstName} {userData?.user?.lastName}
              </p>
              <p className="text-xs text-gray-500 truncate capitalize">
                {userRole.replace("_", " ")}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  isActive
                    ? "bg-amber-100 text-amber-700"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <span className="mr-3 text-lg">{item.icon}</span>
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Back to Home */}
        <div className="p-4 border-t border-gray-200">
          <Link
            to="/"
            className="flex items-center px-4 py-2 text-sm text-gray-600 hover:text-amber-600"
          >
            <span className="mr-2">🏠</span>
            Back to Home
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Top Header */}
        <header className="sticky top-0 z-10 bg-white shadow-sm">
          <div className="flex items-center justify-between h-16 px-4">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>

            {/* Page title */}
            <h1 className="text-lg font-semibold text-gray-900 lg:text-xl">
              {navigation.find((n) => n.href === location.pathname)?.name ||
                "Dashboard"}
            </h1>

            {/* Right side actions */}
            <div className="flex items-center space-x-4">
              {/* Notifications placeholder */}
              <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-full relative">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {/* Profile dropdown (Clerk UserButton handles this) */}
              <div className="hidden lg:block">
                <UserButton
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      avatarBox: "w-8 h-8",
                    },
                  }}
                />
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-6">
          <Outlet context={{ userData, userRole }} />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
