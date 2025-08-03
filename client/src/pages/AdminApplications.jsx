import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

function AdminApplications() {
  const { token } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

  useEffect(() => {
    const fetchApps = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/admin/applications`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setApplications(res.data); // Assuming res.data contains both students and tutors
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError("❌ Failed to load applications (unauthorized or server error).");
        setLoading(false);
      }
    };
    fetchApps();
  }, [token]);

  if (error) return <p>{error}</p>;
  if (loading) return <p>Loading...</p>;

  const students = applications.students || [];
  const tutors = applications.tutors || [];

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Student Applications</h2>
      <ul>
        {students.map((s) => (
          <li key={s.id}>
            <strong>{s.name}</strong> | {s.email}<br />
            <div>
              <strong>Resume:</strong>{" "}
              <a 
                href={`${API_BASE}/${s.resume}`}
                target="_blank"
                rel="noopener noreferrer"
                className="resume-link"
              >
                View Resume
              </a>
            </div>
            <div>
              <strong>Marksheets:</strong>{" "}
              {s.marksheets?.map((m, index) => (
                <a
                  key={index}
                  href={`${API_BASE}/${m}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="marksheet-link"
                >
                  Marksheet {index + 1}
                </a>
              ))}
            </div>
            <div>
              <strong>ID Proof:</strong>{" "}
              <a
                href={`${API_BASE}/${s.idcards?.[0]}`} // Assuming the first ID card is the primary one
                target="_blank"
                rel="noopener noreferrer"
                className="id-proof-link"
              >
                View ID Proof
              </a>
            </div>
            <br /><br />
          </li>
        ))}
      </ul>
      <h2>Tutor Applications</h2>
      <ul>
        {tutors.map((t) => (
          <li key={t.id}>
            <strong>{t.name}</strong> | {t.email}<br />
            <div>
              <strong>Resume:</strong>{" "}
              <a 
                href={`${API_BASE}/${t.resume}`}
                target="_blank"
                rel="noopener noreferrer"
                className="resume-link"
              >
                View Resume
              </a>
            </div>
            <div>
              <strong>ID Proof:</strong>{" "}
              <a
                href={`${API_BASE}/${t.idcards?.[0]}`} // Assuming the first ID card is the primary one
                target="_blank"
                rel="noopener noreferrer"
                className="id-proof-link"
              >
                View ID Proof
              </a>
            </div>
            <br /><br />
          </li>
        ))}
      </ul>
    </div>
  );
}

export default AdminApplications;