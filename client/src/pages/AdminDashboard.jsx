import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function AdminDashboard() {
  const { token, logout } = useAuth();
  const [userInfo, setUserInfo] = useState(null);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalUsers: 0,
    totalApplications: 0,
    totalMaterials: 0
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error("Failed to fetch user info");
        const data = await res.json();
        setUserInfo(data);
      } catch (err) {
        setError("Could not fetch user data");
      }
    };

    const fetchStats = async () => {
      try {
        const studentsRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/students`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (studentsRes.ok) {
          const studentsData = await studentsRes.json();
          setStats(prev => ({ ...prev, totalStudents: studentsData.students?.length || 0 }));
        }

        const usersRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/users`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (usersRes.ok) {
          const usersData = await usersRes.json();
          setStats(prev => ({ ...prev, totalUsers: usersData?.length || 0 }));
        }

        const appsRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/applications`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (appsRes.ok) {
          const appsData = await appsRes.json();
          const totalApps = (appsData.students?.length || 0) + (appsData.tutors?.length || 0);
          setStats(prev => ({ ...prev, totalApplications: totalApps }));
        }

        const materialsRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/materials`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (materialsRes.ok) {
          const materialsData = await materialsRes.json();
          setStats(prev => ({ ...prev, totalMaterials: materialsData?.length || 0 }));
        }
      } catch (err) {
        console.error("Error fetching stats:", err);
      }
    };

    fetchProfile();
    fetchStats();
  }, [token]);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!userInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    { icon: "👥", label: "Total Students", value: stats.totalStudents, color: "blue" },
    { icon: "👤", label: "Total Users", value: stats.totalUsers, color: "purple" },
    { icon: "📝", label: "Applications", value: stats.totalApplications, color: "green" },
    { icon: "📚", label: "Study Materials", value: stats.totalMaterials, color: "orange" }
  ];

  const sections = [
    {
      title: "User Management",
      items: [
        { to: "/admin/students", icon: "🎓", title: "Manage Students", desc: "Add, view, and manage student accounts" },
        { to: "/admin/users", icon: "👤", title: "Manage Users", desc: "View and manage all user accounts" }
      ]
    },
    {
      title: "Applications",
      items: [
        { to: "/admin/applications", icon: "📋", title: "View Applications", desc: "Review student and tutor applications" }
      ]
    },
    {
      title: "Content Management",
      items: [
        { to: "/upload", icon: "📤", title: "Upload Materials", desc: "Upload study materials and resources" },
        { to: "/materials", icon: "📖", title: "View Materials", desc: "Browse and manage study materials" },
        { to: "/create-exam", icon: "📝", title: "Create New Exam", desc: "Create exams for students" }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">
            Welcome back, <span className="font-semibold text-gray-800">{userInfo.name || userInfo.email}</span>
          </p>
          <div className="mt-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-700">
              {userInfo.role}
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {statCards.map((stat, index) => (
            <div key={index} className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                  stat.color === 'blue' ? 'bg-blue-100' :
                  stat.color === 'purple' ? 'bg-purple-100' :
                  stat.color === 'green' ? 'bg-green-100' : 'bg-orange-100'
                }`}>
                  {stat.icon}
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-800">{stat.value}</div>
                  <div className="text-sm text-gray-500">{stat.label}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Sections */}
        <div className="space-y-6">
          {sections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
              <h2 className="text-xl font-bold text-gray-800 mb-6 pb-4 border-b border-gray-100">
                {section.title}
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {section.items.map((item, itemIndex) => (
                  <Link
                    key={itemIndex}
                    to={item.to}
                    className="p-4 bg-gray-50 rounded-xl border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                        {item.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
                          {item.title}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">{item.desc}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}

          {/* System Section */}
          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6 pb-4 border-b border-gray-100">
              System
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Link
                to="/admin-dashboard"
                className="p-4 bg-gray-50 rounded-xl border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                    📊
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
                      Dashboard
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">View system overview and statistics</p>
                  </div>
                </div>
              </Link>

              <button
                onClick={logout}
                className="p-4 bg-red-50 rounded-xl border border-red-100 hover:shadow-md hover:border-red-200 transition-all group text-left"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                    🚪
                  </div>
                  <div>
                    <h3 className="font-semibold text-red-700 group-hover:text-red-800 transition-colors">
                      Logout
                    </h3>
                    <p className="text-sm text-red-500 mt-1">Sign out of your account</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
