import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

function TutorDashboard() {
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
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <h1>📚 Tutor Dashboard</h1>
      <h2>📘 Welcome, {userInfo.name} (Tutor)</h2>
      <p>Welcome, <strong>{userInfo.email}</strong></p>
      <p>Your Role: <strong>{userInfo.role}</strong></p>
      <button onClick={logout} style={{ marginTop: "1rem" }}>Logout</button>
    </div>
  );
}

export default TutorDashboard;
