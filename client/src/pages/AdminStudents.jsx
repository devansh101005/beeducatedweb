import { useState, useEffect } from "react";
import "./AdminStudents.css";

function AdminStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    studentId: "",
    name: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    gradeLevel: ""
  });

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/students`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setStudents(data.students);
      } else {
        console.error("Failed to fetch students:", data.error);
      }
    } catch (err) {
      console.error("Error fetching students:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/students`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (res.ok) {
        alert("Student added successfully!");
        setShowAddForm(false);
        setFormData({
          studentId: "",
          name: "",
          email: "",
          phone: "",
          dateOfBirth: "",
          gradeLevel: ""
        });
        fetchStudents();
      } else {
        alert(data.error || "Failed to add student");
      }
    } catch (err) {
      console.error("Error adding student:", err);
      alert("Server error");
    }
  };

  const handleDeleteStudent = async (id) => {
    if (!confirm("Are you sure you want to delete this student?")) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/students/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        alert("Student deleted successfully!");
        fetchStudents();
      } else {
        alert("Failed to delete student");
      }
    } catch (err) {
      console.error("Error deleting student:", err);
      alert("Server error");
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="admin-students">
      <div className="header">
        <h2>📚 Student Management</h2>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="add-btn"
        >
          {showAddForm ? "Cancel" : "Add New Student"}
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddStudent} className="add-form">
          <h3>Add New Student</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Student ID *</label>
              <input
                type="text"
                value={formData.studentId}
                onChange={(e) => setFormData({...formData, studentId: e.target.value})}
                placeholder="e.g., 2024CS001"
                required
              />
            </div>
            <div className="form-group">
              <label>Full Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Enter full name"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="Enter email"
              />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                placeholder="Enter phone number"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Date of Birth *</label>
              <input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Grade Level *</label>
              <select
                value={formData.gradeLevel}
                onChange={(e) => setFormData({...formData, gradeLevel: e.target.value})}
                required
              >
                <option value="">Select Grade Level</option>
                <option value="Class UKG">Class UKG</option>
                <option value="Class LKG">Class LKG</option>
                <option value="Class 1">Class 1</option>
                <option value="Class 2">Class 2</option>
                <option value="Class 3">Class 3</option>
                <option value="Class 4">Class 4</option>
                <option value="Class 5">Class 5</option>
                <option value="Class 6">Class 6</option>
                <option value="Class 7">Class 7</option>
                <option value="Class 8">Class 8</option>
                <option value="Class 9">Class 9</option>
                <option value="Class 10">Class 10</option>
                <option value="Class 11">Class 11</option>
                <option value="Class 12">Class 12</option>
                <option value="B.Tech 1st Year">B.Tech 1st Year</option>
                {/* <option value="B.Tech 2nd Year">B.Tech 2nd Year</option>
                <option value="B.Tech 3rd Year">B.Tech 3rd Year</option>
                <option value="B.Tech 4th Year">B.Tech 4th Year</option> */}
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <button type="submit" className="submit-btn">Add Student</button>
        </form>
      )}

      <div className="students-list">
        <h3>Registered Students ({students.length})</h3>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Grade Level</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map(student => (
                <tr key={student.id}>
                  <td>{student.studentId}</td>
                  <td>{student.name}</td>
                  <td>{student.email || "-"}</td>
                  <td>{student.phone || "-"}</td>
                  <td>{student.gradeLevel}</td>
                  <td>
                    <button 
                      onClick={() => handleDeleteStudent(student.id)}
                      className="delete-btn"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {students.length === 0 && (
            <div className="no-students">
              <p>No students registered yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminStudents; 