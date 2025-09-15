import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./StudentLogin.css";

function StudentLogin() {
  const [studentId, setStudentId] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();

  // Additional fields for registration
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const endpoint = isLogin ? "/api/student-auth/login" : "/api/student-auth/register";
      const body = isLogin 
        ? { studentId, dateOfBirth }
        : { studentId, name, email, phone, dateOfBirth, gradeLevel };


      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        setMessage("✅ " + data.message);
        setTimeout(() => {
          navigate("/student-dashboard");
        }, 1000);
      } else {
        setMessage("❌ " + (data.error || "Operation failed"));
      }
    } catch (err) {
      console.error(err);
      setMessage("❌ Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="student-auth-container">
      <div className="auth-card">
        <h2>{isLogin ? "📚 Student Login" : "📝 Student Registration"}</h2>
        
        {message && (
          <div className={`message ${message.includes("✅") ? "success" : "error"}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Student ID *</label>
            <input
              type="text"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              placeholder="e.g., 2024CS001"
              required
            />
          </div>

          {!isLogin && (
            <>
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email (optional)"
                />
              </div>

              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter your phone (optional)"
                />
              </div>

              <div className="form-group">
                <label>Grade Level *</label>
                <select
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(e.target.value)}
                  required
                >
                  <option value="">Select Grade Level</option>
                  <option value="Class 9">Class 9</option>
                  <option value="Class 10">Class 10</option>
                  <option value="Class 11">Class 11</option>
                  <option value="Class 12">Class 12</option>
                  <option value="B.Tech 1st Year">B.Tech 1st Year</option>
                  <option value="B.Tech 2nd Year">B.Tech 2nd Year</option>
                  <option value="B.Tech 3rd Year">B.Tech 3rd Year</option>
                  <option value="B.Tech 4th Year">B.Tech 4th Year</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </>
          )}

          <div className="form-group">
            <label>Date of Birth *</label>
            <input
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            className="submit-btn"
            disabled={loading}
          >
            {loading ? "Processing..." : (isLogin ? "Login" : "Register")}
          </button>
        </form>

        <div className="auth-switch">
          <p>
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button 
              onClick={() => {
                setIsLogin(!isLogin);
                setMessage("");
                setStudentId("");
                setDateOfBirth("");
                setName("");
                setEmail("");
                setPhone("");
                setGradeLevel("");
              }}
              className="switch-btn"
            >
              {isLogin ? "Register here" : "Login here"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default StudentLogin; 