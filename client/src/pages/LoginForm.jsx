// import { useState } from "react";
// import "./LoginForm.css";

// function LoginForm() {
//   const [formData, setFormData] = useState({ email: "", password: "" });
//   const [message, setMessage] = useState("");

//   const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000";
  

//   const handleChange = (e) => {
//     setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();


//     try {
//      // const VITE_API_BASE_URL= "http://localhost:5000";
//       const res = await fetch(`${API_BASE}/api/auth/login`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(formData)
//       });

//       const data = await res.json();

//       if (res.ok) {
//         localStorage.setItem("token", data.token);
//         localStorage.setItem("user", JSON.stringify(data.user));
//         setMessage("✅ Login successful!");

//         // Redirect based on role
//         const role = data.user.role.toUpperCase();
//         if (role === "ADMIN") window.location.href = "/admin-dashboard";
//         else if (role === "TUTOR") window.location.href = "/tutor-dashboard";
//         else window.location.href = "/student-dashboard";
//       } else {
//         setMessage(data.error || "❌ Invalid credentials");
//       }
//     } catch (err) {
//       console.error(err);
//       setMessage("❌ Server error");
//     }
//   };

//   return (
//     <div className="page-container">
//       <div className="login-container">
//         <h2>Login</h2>
//         <form onSubmit={handleSubmit}>
//           <label>Email:</label>
//           <input
//             type="email"
//             name="email"
//             value={formData.email}
//             onChange={handleChange}
//             required
//           />

//           <label>Password:</label>
//           <input
//             type="password"
//             name="password"
//             value={formData.password}
//             onChange={handleChange}
//             required
//           />

//           <button type="submit">Login</button>
//         </form>
//         {message && <p className="msg">{message}</p>}
//       </div>
//     </div>
//   );
// }

// export default LoginForm;




import { useState } from "react";
import { useNavigate } from "react-router-dom";

function LoginForm() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000";

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        setMessage("✅ Login successful!");

        const role = data.user.role.toUpperCase();
        if (role === "ADMIN") navigate("/admin-dashboard", { replace: true });
        else if (role === "TUTOR") navigate("/tutor-dashboard", { replace: true });
        else navigate("/student-dashboard", { replace: true });
      } else {
        setMessage(data.error || "❌ Invalid credentials");
      }
    } catch (err) {
      console.error(err);
      setMessage("❌ Server error");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen px-4 py-8 bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="bg-white p-6 md:p-8 w-full max-w-md rounded-2xl shadow-xl border border-gray-100 animate-fade-in">
        <div className="mb-6 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Welcome Back</h2>
          <p className="text-gray-600 text-sm">Sign in to continue your learning journey</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-2 font-semibold text-gray-700 text-sm">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-gray-800"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label className="block mb-2 font-semibold text-gray-700 text-sm">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-gray-800"
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            className="w-full mt-6 py-3 bg-gradient-to-r from-purple-600 to-purple-800 text-white font-bold rounded-lg hover:from-purple-700 hover:to-purple-900 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            Sign In
          </button>
        </form>

        {message && (
          <p className={`mt-4 text-center font-semibold text-sm ${message.includes('✅') ? 'text-green-600' : 'text-red-600'}`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}

export default LoginForm;