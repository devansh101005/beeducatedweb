import { useState, useEffect } from "react";
import { useNavigate,Link } from "react-router-dom";
import "./StudentPortal.css";

function StudentPortal() {
  const [studentId, setStudentId] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [studentInfo, setStudentInfo] = useState(null);
  const [materials, setMaterials] = useState([]);
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [loadingExams, setLoadingExams] = useState(true);
  const [examError, setExamError] = useState(null);

  // Check if student is already logged in
  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");
    
    if (token && user) {
      try {
        const userData = JSON.parse(user);
        if (userData.role === "STUDENT") {
          setIsLoggedIn(true);
          setStudentInfo(userData);
          fetchMaterials();
          fetchExams();
        }
      } catch (err) {
        console.error("Error parsing user data:", err);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/student-auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, dateOfBirth })
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        setIsLoggedIn(true);
        setStudentInfo(data.user);
        setMessage("✅ Login successful!");
        fetchMaterials();
        fetchExams()
      } else {
        setMessage("❌ " + (data.error || "Login failed"));
      }
    } catch (err) {
      console.error(err);
      setMessage("❌ Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchMaterials = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/materials`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setMaterials(data);
      }
    } catch (err) {
      console.error("Error fetching materials:", err);
    }
  };

const fetchExams = async () => { 
      try {
          const token = localStorage.getItem('token');
          if (!token) {
              setExamError("Authentication required. Please log in again.");
              setLoadingExams(false);
              return;
          }

          const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/exams/available`, {
              headers: {
                  'Authorization': `Bearer ${token}`
              }
          });

          if (!res.ok) {
              throw new Error('Failed to fetch available exams');
          }

          const data = await res.json();
          if (data.success) {
              setExams(data.exams);
          } else {
              setExamError(data.message || 'Could not load exams.');
          }
      } catch (err) {
          setExamError(err.message);
      } finally {
          setLoadingExams(false);
      }
  };



  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsLoggedIn(false);
    setStudentInfo(null);
    setMaterials([]);
    setExams([]);
    setMessage("Logged out successfully");
  };

  const downloadMaterial = (url, title) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = title;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoggedIn && studentInfo) {
    return (
      <div className="student-portal">
        <div className="portal-header">
          <h1>🎓 Student Portal</h1>
          <div className="student-info">
            <p>Welcome, <strong>{studentInfo.name}</strong></p>
            <p>Student ID: <strong>{studentInfo.studentId}</strong></p>
            <p>Grade Level: <strong>{studentInfo.gradeLevel}</strong></p>
          </div>
          <button onClick={handleLogout} className="logout-btn">
            🚪 Logout
          </button>
        </div>

        <div className="portal-content">
          <div className="materials-section">
            <h2>📚 Study Materials</h2>
            {materials.length > 0 ? (
              <div className="materials-grid">
                {materials.map((material, index) => (
                  <div key={index} className="material-card">
                    <div className="material-icon">📄</div>
                    <div className="material-info">
                      <h3>{material.title}</h3>
                      <p>Category: {material.category}</p>
                      <p>Class Level: {material.classLevel}</p>
                    </div>
                    <button 
                      onClick={() => downloadMaterial(material.url, material.title)}
                      className="download-btn"
                    >
                      📥 Download
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-materials">
                <p>📭 No study materials available yet.</p>
                <p>Check back later for updates!</p>
              </div>
            )}
          </div>

           <section className="portal-section available-exams-section">
            <h2>📝 Available Exams</h2>
            {loadingExams && <p>Loading exams...</p>}
            {examError && <p className="error-message">{examError}</p>}
            {!loadingExams && !examError && (
                <div className="exams-list">
                    {exams.length > 0 ? (
                        exams.map(exam => (
                            <div key={exam.id} className="exam-card">
                                <h3>{exam.title}</h3>
                                <p><strong>Subject:</strong> {exam.subject}</p>
                                <p><strong>Duration:</strong> {exam.durationInMinutes} minutes</p>
                                <p><strong>Total Marks:</strong> {exam.totalMarks}</p>
                                <Link to={`/take-exam/${exam.id}`} className="start-exam-btn">
                                    Start Exam
                                </Link>
                            </div>
                        ))
                    ) : (
                        <div className="no-materials">
                           <p>🎉 No exams are currently available for you.</p>
                        </div>
                    )}
                </div>
            )}
          </section>

          <div className="quick-actions">
            <h2>⚡ Quick Actions</h2>
            <div className="actions-grid">
              <button onClick={() => navigate("/student-dashboard")} className="action-btn">
                📊 View Dashboard
              </button>
              <button onClick={() => navigate("/student-profile")} className="action-btn">
                👤 My Profile
              </button>
              <button onClick={() => navigate("/materials")} className="action-btn">
                📖 Browse Materials
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="student-portal-login">
      <div className="login-container">
        <div className="login-header">
          <h1>🎓 Student Portal</h1>
          <p>Access your study materials and resources</p>
        </div>

        {message && (
          <div className={`message ${message.includes("✅") ? "success" : "error"}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label>Student ID</label>
            <input
              type="text"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              placeholder="Enter your Student ID"
              required
            />
          </div>

          <div className="form-group">
            <label>Date of Birth</label>
            <input
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            className="login-btn"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login to Portal"}
          </button>
        </form>

        <div className="login-footer">
          <p>Don't have an account? Contact your administrator.</p>
          <button onClick={() => navigate("/")} className="back-btn">
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}

export default StudentPortal; 