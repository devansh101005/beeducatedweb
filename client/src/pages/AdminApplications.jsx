import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

function AdminApplications() {
  const { token } = useAuth();
  //const [students, setStudents] = useState([]);
  //const [tutors, setTutors] = useState([]);
  
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchApps = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/admin/applications`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setStudents(res.data.students || []);
        setTutors(res.data.tutors || []);
      } catch (err) {
        console.error(err);
        setError("❌ Failed to load applications (unauthorized or server error).");
      }
    };
    fetchApps();
  }, [token]);

  if (error) return <p>{error}</p>;
  if (!students || !tutors) return <p>Loading...</p>;

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Student Applications</h2>
      <ul>
        {students.map((s) => (
          <li key={s.id}>
            <strong>{s.name}</strong> | {s.email}<br />
            Resume: {s.resume ? (
              <a
                href={`/${s.resume}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                View
              </a>
            ) : "N/A"}<br />
            Marksheets:
            {Array.isArray(s.marksheets) && s.marksheets.map((m, i) => (
              <a
                key={i}
                href={`/${m}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ marginRight: "5px" }}
              >
                [{i + 1}]
              </a>
            ))}
            <br />
            ID Cards:
            {Array.isArray(s.idcards) && s.idcards.map((id, i) => (
              <a
                key={i}
                href={`/${id}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ marginRight: "5px" }}
              >
                [{i + 1}]
              </a>
            ))}
            <br /><br />
          </li>
        ))}
      </ul>
      <h2>Tutor Applications</h2>
      <ul>
        {tutors.map((t) => (
          <li key={t.id}>
            <strong>{t.name}</strong> | {t.email}<br />
            Resume: {t.resume ? (
              <a
                href={`/${t.resume}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                View
              </a>
            ) : "N/A"}<br />
            ID Cards:
            {Array.isArray(t.idcards) && t.idcards.map((id, i) => (
              <a
                key={i}
                href={`/${id}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ marginRight: "5px" }}
              >
                [{i + 1}]
              </a>
            ))}
            <br /><br />
          </li>
        ))}
      </ul>
    </div>
  );
}

export default AdminApplications;