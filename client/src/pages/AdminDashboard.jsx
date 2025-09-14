import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./AdminDashboard.css";

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
        setError("⚠️ Could not fetch user data");
      }
    };

    const fetchStats = async () => {
      try {
        // Fetch students count
        const studentsRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/students`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (studentsRes.ok) {
          const studentsData = await studentsRes.json();
          setStats(prev => ({ ...prev, totalStudents: studentsData.students?.length || 0 }));
        }

        // Fetch users count
        const usersRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/users`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (usersRes.ok) {
          const usersData = await usersRes.json();
          setStats(prev => ({ ...prev, totalUsers: usersData?.length || 0 }));
        }

        // Fetch applications count
        const appsRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/applications`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (appsRes.ok) {
          const appsData = await appsRes.json();
          const totalApps = (appsData.students?.length || 0) + (appsData.tutors?.length || 0);
          setStats(prev => ({ ...prev, totalApplications: totalApps }));
        }

        // Fetch materials count
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

  if (error) return <div className="error-message">{error}</div>;
  if (!userInfo) return <div className="loading">Loading...</div>;

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>👨‍💼 Admin Dashboard</h1>
        <p className="welcome-text">Welcome back, <strong>{userInfo.name || userInfo.email}</strong></p>
        <p className="role-text">Role: <span className="role-badge">{userInfo.role}</span></p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>{stats.totalStudents}</h3>
            <p>Total Students</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👤</div>
          <div className="stat-content">
            <h3>{stats.totalUsers}</h3>
            <p>Total Users</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-content">
            <h3>{stats.totalApplications}</h3>
            <p>Applications</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📚</div>
          <div className="stat-content">
            <h3>{stats.totalMaterials}</h3>
            <p>Study Materials</p>
          </div>
        </div>
      </div>

      <div className="admin-sections">
        <div className="section-group">
          <h2>👥 User Management</h2>
          <div className="action-grid">
            <Link to="/admin/students" className="action-card">
              <div className="action-icon">🎓</div>
              <h3>Manage Students</h3>
              <p>Add, view, and manage student accounts</p>
            </Link>
            <Link to="/admin/users" className="action-card">
              <div className="action-icon">👤</div>
              <h3>Manage Users</h3>
              <p>View and manage all user accounts</p>
            </Link>
          </div>
        </div>

        <div className="section-group">
          <h2>📝 Applications</h2>
          <div className="action-grid">
            <Link to="/admin/applications" className="action-card">
              <div className="action-icon">📋</div>
              <h3>View Applications</h3>
              <p>Review student and tutor applications</p>
            </Link>
          </div>
        </div>

        <div className="section-group">
          <h2>📚 Content Management</h2>
          <div className="action-grid">
            <Link to="/upload" className="action-card">
              <div className="action-icon">📤</div>
              <h3>Upload Materials</h3>
              <p>Upload study materials and resources</p>
            </Link>
            <Link to="/materials" className="action-card">
              <div className="action-icon">📖</div>
              <h3>View Materials</h3>
              <p>Browse and manage study materials</p>
            </Link>
            <Link to="/create-exam" className="action-button">
          Create New Exam
        </Link>
          </div>
        </div>

        <div className="section-group">
          <h2>🔧 System</h2>
          <div className="action-grid">
            <Link to="/admin-dashboard" className="action-card">
              <div className="action-icon">📊</div>
              <h3>Dashboard</h3>
              <p>View system overview and statistics</p>
            </Link>
            <button onClick={logout} className="action-card logout-card">
              <div className="action-icon">🚪</div>
              <h3>Logout</h3>
              <p>Sign out of your account</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;