import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";

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
        setMessage("Login successful!");
        fetchMaterials();
        fetchExams();
      } else {
        setMessage(data.error || "Login failed");
      }
    } catch (err) {
      console.error(err);
      setMessage("Server error. Please try again.");
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
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/exams/available`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await res.json();
      setExams(data);
    } catch (err) {
      setExamError("Unable to load exams.");
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Student Portal</h1>
                <div className="space-y-1 text-gray-600">
                  <p>Welcome, <span className="font-semibold text-gray-800">{studentInfo.name}</span></p>
                  <p>Student ID: <span className="font-semibold">{studentInfo.studentId}</span></p>
                  <p>Grade Level: <span className="font-semibold">{studentInfo.gradeLevel}</span></p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="px-6 py-3 bg-red-50 text-red-600 font-medium rounded-xl hover:bg-red-100 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Study Materials */}
          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6 pb-4 border-b border-gray-100">
              Study Materials
            </h2>

            {materials.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {materials.map((material, index) => (
                  <div
                    key={index}
                    className="p-4 bg-gray-50 rounded-xl border border-gray-100 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-xl">📄</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-800 truncate">{material.title}</h3>
                        <p className="text-sm text-gray-500">Category: {material.category}</p>
                        <p className="text-sm text-gray-500">Class: {material.classLevel}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => downloadMaterial(material.url, material.title)}
                      className="mt-3 w-full py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:shadow-md transition-all text-sm"
                    >
                      Download
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">📭</div>
                <p>No study materials available yet.</p>
                <p className="text-sm">Check back later for updates!</p>
              </div>
            )}
          </div>

          {/* Available Exams */}
          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6 pb-4 border-b border-gray-100">
              Available Exams
            </h2>

            {loadingExams && (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-gray-500">Loading exams...</p>
              </div>
            )}

            {examError && (
              <div className="p-4 bg-red-50 text-red-600 rounded-xl text-center">
                {examError}
              </div>
            )}

            {!loadingExams && !examError && (
              <>
                {exams.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {exams.map(exam => (
                      <div
                        key={exam.id}
                        className="p-4 bg-gray-50 rounded-xl border border-gray-100 hover:shadow-md transition-all"
                      >
                        <h3 className="font-bold text-gray-800 mb-2">{exam.title}</h3>
                        <div className="space-y-1 text-sm text-gray-600 mb-4">
                          <p><span className="font-medium">Subject:</span> {exam.subject}</p>
                          <p><span className="font-medium">Duration:</span> {exam.durationInMinutes} min</p>
                          <p><span className="font-medium">Total Marks:</span> {exam.totalMarks}</p>
                        </div>
                        <Link
                          to={`/take-exam/${exam.id}`}
                          className="block w-full py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium rounded-lg hover:shadow-md transition-all text-center text-sm"
                        >
                          Start Exam
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">🎉</div>
                    <p>No exams are currently available for you.</p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6 pb-4 border-b border-gray-100">
              Quick Actions
            </h2>

            <div className="grid gap-4 sm:grid-cols-3">
              <button
                onClick={() => navigate("/student-dashboard")}
                className="p-4 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition-colors text-center"
              >
                <span className="text-2xl block mb-1">📊</span>
                <span className="font-medium">View Dashboard</span>
              </button>
              <button
                onClick={() => navigate("/student-profile")}
                className="p-4 bg-purple-50 text-purple-700 rounded-xl hover:bg-purple-100 transition-colors text-center"
              >
                <span className="text-2xl block mb-1">👤</span>
                <span className="font-medium">My Profile</span>
              </button>
              <button
                onClick={() => navigate("/materials")}
                className="p-4 bg-green-50 text-green-700 rounded-xl hover:bg-green-100 transition-colors text-center"
              >
                <span className="text-2xl block mb-1">📖</span>
                <span className="font-medium">Browse Materials</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🎓</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Student Portal</h1>
            <p className="text-gray-600 mt-1">Access your study materials and resources</p>
          </div>

          {/* Message */}
          {message && (
            <div className={`mb-6 p-4 rounded-xl text-center font-medium ${
              message.includes("successful")
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}>
              {message.includes("successful") ? '✅' : '❌'} {message}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Student ID</label>
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="Enter your Student ID"
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading ? "Logging in..." : "Login to Portal"}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-gray-600 text-sm mb-4">
              Don't have an account? Contact your administrator.
            </p>
            <button
              onClick={() => navigate("/")}
              className="text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentPortal;
