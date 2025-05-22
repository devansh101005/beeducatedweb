import React from "react";

const StudentDashboard = () => (
  <div className="dashboard">
    <h2>Student Dashboard</h2>
    <ul>
      <li>View Class Schedule</li>
      <li>Download Study Material</li>
      <li>Attendance & Progress</li>
      <li>Fee Payment & History</li>
      <li>Notifications</li>
    </ul>
  </div>
);

const TeacherDashboard = () => (
  <div className="dashboard">
    <h2>Teacher Dashboard</h2>
    <ul>
      <li>Mark Attendance</li>
      <li>Upload Study Material</li>
      <li>View Schedule</li>
      <li>Student List & Progress</li>
      <li>Notifications</li>
    </ul>
  </div>
);

const AdminDashboard = () => (
  <div className="dashboard">
    <h2>Admin Dashboard</h2>
    <ul>
      <li>Manage Students & Teachers</li>
      <li>View All Schedules</li>
      <li>Attendance Reports</li>
      <li>Fee Management</li>
      <li>Send Notifications</li>
    </ul>
  </div>
);

export { StudentDashboard, TeacherDashboard, AdminDashboard };
