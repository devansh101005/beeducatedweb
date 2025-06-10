import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

function StudentProfile() {
  const { token, user, logout } = useAuth();
  const [formData, setFormData] = useState({ name: "", email: "" });
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (user) {
      setFormData({ name: user.name || "", email: user.email || "" });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/student/update-profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("✅ Profile updated.");
      } else {
        setMessage(data.error || "❌ Update failed");
      }
    } catch (err) {
      console.error(err);
      setMessage("❌ Server error");
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h2>👤 Student Profile</h2>
      <form onSubmit={handleSubmit} style={{ maxWidth: "400px", marginTop: "1rem" }}>
        <label>Name:</label>
        <input name="name" value={formData.name} onChange={handleChange} required />

        <label>Email:</label>
        <input type="email" name="email" value={formData.email} onChange={handleChange} required />

        <button type="submit" style={{ marginTop: "1rem" }}>Save Changes</button>
      </form>
      {message && <p style={{ marginTop: "1rem" }}>{message}</p>}
    </div>
  );
}

export default StudentProfile;
