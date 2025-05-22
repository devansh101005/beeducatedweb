import React, { useState } from "react";
import HomePage from "./pages/HomePage";
import { StudentDashboard, TeacherDashboard, AdminDashboard } from "./pages/Dashboards";
import "./App.css";

function App() {
  // Simulate role selection for demo (in real app, use auth/user context)
  const [role, setRole] = useState("");

  const renderDashboard = () => {
    if (role === "student") return <StudentDashboard />;
    if (role === "teacher") return <TeacherDashboard />;
    if (role === "admin") return <AdminDashboard />;
    return <HomePage />;
  };

  return (
    <div>
      <nav style={{textAlign: "right", padding: "10px 30px 0 0"}}>
        <label style={{marginRight: 8}}>Role:</label>
        <select value={role} onChange={e => setRole(e.target.value)}>
          <option value="">Home</option>
          <option value="student">Student</option>
          <option value="teacher">Teacher</option>
          <option value="admin">Admin</option>
        </select>
      </nav>
      {renderDashboard()}
    </div>
  );
}

export default App;
