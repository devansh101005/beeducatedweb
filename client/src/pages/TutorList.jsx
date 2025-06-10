import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

function TutorList() {
  const { token, user } = useAuth();
  const [tutors, setTutors] = useState([]);

  useEffect(() => {
    const fetchTutors = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/tutors`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setTutors(data);
      } catch (err) {
        console.error("Error fetching tutors:", err);
      }
    };

    if (user?.role === "STUDENT") {
      fetchTutors();
    }
  }, [token, user]);

  return (
    <div style={{ padding: "2rem" }}>
      <h2>🎓 Available Tutors</h2>
      {tutors.length === 0 ? (
        <p>No tutors found.</p>
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
          {tutors.map((tutor) => (
            <div
              key={tutor.id}
              style={{
                border: "1px solid #ccc",
                padding: "1rem",
                borderRadius: "8px",
                width: "250px",
                backgroundColor: "#f9f9f9"
              }}
            >
              <h3>{tutor.name}</h3>
              <p>Email: {tutor.email}</p>
              <p>Role: {tutor.role}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TutorList;
