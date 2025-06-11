import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./AdminDashboard.css";

function AdminDashboard() {
  const { token, logout } = useAuth();
  const [userInfo, setUserInfo] = useState(null);
  const [error, setError] = useState("");

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
    fetchProfile();
  }, [token]);

  if (error) return <p>{error}</p>;
  if (!userInfo) return <p>Loading...</p>;

  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>
      <p>Welcome, <strong>{userInfo.email}</strong></p>
      <p>Your Role: <strong>{userInfo.role}</strong></p>
      <Link to="/admin/applications" className="application-link">
        View Submitted Applications
      </Link>
      <button onClick={logout} className="logout-button">
        Logout
      </button>
    </div>
  );
}

export default AdminDashboard;