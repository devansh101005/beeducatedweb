import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

function AdminUsers() {
  const { token, user } = useAuth();
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchAllUsers = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setUsers(data);
      } catch (err) {
        console.error("Error loading users", err);
      }
    };

    if (user?.role === "ADMIN") {
      fetchAllUsers();
    }
  }, [token, user]);

  return (
    <div style={{ padding: "2rem" }}>
      <h2>🛠️ Admin: All Registered Users</h2>
      {users.length === 0 ? (
        <p>No users found.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ borderBottom: "1px solid #ccc" }}>Name</th>
              <th style={{ borderBottom: "1px solid #ccc" }}>Email</th>
              <th style={{ borderBottom: "1px solid #ccc" }}>Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td style={{ padding: "8px" }}>{u.name}</td>
                <td>{u.email}</td>
                <td>{u.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default AdminUsers;
