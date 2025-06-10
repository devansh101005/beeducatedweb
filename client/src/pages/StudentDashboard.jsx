import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

function StudentDashboard() {
  const { token, logout } = useAuth();
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (res.ok) {
          setUserInfo(data.user);
        } else {
          console.error(data.error);
        }
      } catch (err) {
        console.error("Error fetching user:", err);
      }
    };

    if (token) fetchUser();
  }, [token]);

  if (!userInfo) return <p>Loading student info...</p>;

  return (
    <div className="dashboard">
      <h2>🎓 Welcome, {userInfo.name}</h2>
      <p>Email: {userInfo.email}</p>
      <p>Role: {userInfo.role}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

export default StudentDashboard;
