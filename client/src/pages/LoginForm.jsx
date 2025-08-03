// import { useState } from "react";
// import "./LoginForm.css";

// function LoginForm() {
//   const [formData, setFormData] = useState({ email: "", password: "" });
//   const [message, setMessage] = useState("");

//   const handleChange = (e) => {
//     setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     try {
//       const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/login`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(formData)
//       });
//       const data = await res.json();
//       if (res.ok) {
//         localStorage.setItem("token", data.token);
//         localStorage.setItem("user", JSON.stringify(data.user));
//         setMessage("✅ Login successful!");
//         if (data.user.role === "ADMIN") {
//           window.location.href = "/admin-dashboard";
//         } else if (data.user.role === "TUTOR") {
//           window.location.href = "/tutor-dashboard";
//         } else {
//           window.location.href = "/student-dashboard";
//         }
//       } else {
//         setMessage(data.error || "❌ Invalid credentials");
//       }
//     } catch (err) {
//       console.error(err);
//       setMessage("❌ Server error");
//     }
//   };

  
// return (
//   <div className="page-container">
//     <div className="login-container">
//       <h2>Login</h2>
//       <form onSubmit={handleSubmit}>
//         <label>Email:</label>
//         <input type="email" name="email" value={formData.email} onChange={handleChange} required />

//         <label>Password:</label>
//         <input type="password" name="password" value={formData.password} onChange={handleChange} required />

//         <button type="submit">Login</button>
//       </form>
//       {message && <p className="msg">{message}</p>}
//     </div>
//   </div>
// );




// }

// export default LoginForm;



import { useState } from "react";
import "./LoginForm.css";

function LoginForm() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");

  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"||"http://localhost:5174";

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

        // Redirect based on role
        const role = data.user.role.toUpperCase();
        if (role === "ADMIN") window.location.href = "/admin-dashboard";
        else if (role === "TUTOR") window.location.href = "/tutor-dashboard";
        else window.location.href = "/student-dashboard";
      } else {
        setMessage(data.error || "❌ Invalid credentials");
      }
    } catch (err) {
      console.error(err);
      setMessage("❌ Server error");
    }
  };

  return (
    <div className="page-container">
      <div className="login-container">
        <h2>Login</h2>
        <form onSubmit={handleSubmit}>
          <label>Email:</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <label>Password:</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />

          <button type="submit">Login</button>
        </form>
        {message && <p className="msg">{message}</p>}
      </div>
    </div>
  );
}

export default LoginForm;
