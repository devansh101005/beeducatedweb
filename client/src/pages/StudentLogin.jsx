import { useState } from "react";
import { useNavigate } from "react-router-dom";

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 via-purple-600 to-purple-800 px-5 py-8">
      <div className="bg-white p-8 md:p-10 rounded-2xl shadow-2xl w-full max-w-md animate-fade-in">
        <h2 className="text-center text-gray-800 mb-8 text-2xl font-bold">
          {isLogin ? "📚 Student Login" : "📝 Student Registration"}
        </h2>

        {message && (
          <div className={`p-3 rounded-lg mb-5 font-medium ${
            message.includes("✅")
              ? "bg-green-100 text-green-800 border border-green-200"
              : "bg-red-100 text-red-800 border border-red-200"
          }`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block mb-2 font-semibold text-gray-700">Student ID *</label>
            <input
              type="text"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              placeholder="e.g., 2024CS001"
              required
              className="w-full px-3 py-3 border-2 border-gray-200 rounded-lg text-base transition-colors duration-300 focus:outline-none focus:border-indigo-600"
            />
          </div>

          {!isLogin && (
            <>
              <div>
                <label className="block mb-2 font-semibold text-gray-700">Full Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  required
                  className="w-full px-3 py-3 border-2 border-gray-200 rounded-lg text-base transition-colors duration-300 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block mb-2 font-semibold text-gray-700">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email (optional)"
                  className="w-full px-3 py-3 border-2 border-gray-200 rounded-lg text-base transition-colors duration-300 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block mb-2 font-semibold text-gray-700">Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter your phone (optional)"
                  className="w-full px-3 py-3 border-2 border-gray-200 rounded-lg text-base transition-colors duration-300 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block mb-2 font-semibold text-gray-700">Grade Level *</label>
                <select
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(e.target.value)}
                  required
                  className="w-full px-3 py-3 border-2 border-gray-200 rounded-lg text-base transition-colors duration-300 focus:outline-none focus:border-indigo-600 bg-white"
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

          <div>
            <label className="block mb-2 font-semibold text-gray-700">Date of Birth *</label>
            <input
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              required
              className="w-full px-3 py-3 border-2 border-gray-200 rounded-lg text-base transition-colors duration-300 focus:outline-none focus:border-indigo-600"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-none rounded-lg text-base font-semibold cursor-pointer transition-transform duration-200 mt-2.5 hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            disabled={loading}
          >
            {loading ? "Processing..." : (isLogin ? "Login" : "Register")}
          </button>
        </form>

        <div className="text-center mt-5 pt-5 border-t border-gray-200">
          <p className="m-0 text-gray-600">
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
              className="bg-none border-none text-indigo-600 font-semibold cursor-pointer underline ml-1 hover:text-purple-600 transition-colors duration-200"
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