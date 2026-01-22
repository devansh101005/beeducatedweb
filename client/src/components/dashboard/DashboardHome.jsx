// Dashboard Home - Role-based dashboard content
import { useOutletContext } from "react-router-dom";

const DashboardHome = () => {
  const { userData, userRole } = useOutletContext();

  // Render different dashboards based on role
  const renderDashboard = () => {
    switch (userRole) {
      case "admin":
        return <AdminDashboard userData={userData} />;
      case "teacher":
        return <TeacherDashboard userData={userData} />;
      case "student":
        return <StudentDashboard userData={userData} />;
      case "parent":
        return <ParentDashboard userData={userData} />;
      default:
        return <DefaultDashboard userData={userData} />;
    }
  };

  return (
    <div>
      {/* Welcome Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Welcome back, {userData?.user?.firstName || "User"}!
        </h2>
        <p className="text-gray-600">
          Here's what's happening in your {userRole.replace("_", " ")} dashboard.
        </p>
      </div>

      {renderDashboard()}
    </div>
  );
};

// Admin Dashboard
const AdminDashboard = () => {
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Users" value="--" icon="👥" color="blue" />
        <StatCard title="Active Students" value="--" icon="🎓" color="green" />
        <StatCard title="Teachers" value="--" icon="👨‍🏫" color="purple" />
        <StatCard title="Pending Applications" value="--" icon="📝" color="orange" />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <QuickAction title="Add User" icon="➕" href="/dashboard/users/new" />
          <QuickAction title="Create Batch" icon="📚" href="/dashboard/batches/new" />
          <QuickAction title="View Applications" icon="📋" href="/dashboard/applications" />
          <QuickAction title="Create Exam" icon="📝" href="/dashboard/exams/new" />
        </div>
      </div>

      {/* Recent Activity Placeholder */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
        <p className="text-gray-500 text-center py-8">
          Activity feed coming soon...
        </p>
      </div>
    </div>
  );
};

// Teacher Dashboard
const TeacherDashboard = () => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="My Batches" value="--" icon="📚" color="blue" />
        <StatCard title="Total Students" value="--" icon="🎓" color="green" />
        <StatCard title="Upcoming Classes" value="--" icon="📅" color="purple" />
        <StatCard title="Pending Exams" value="--" icon="📝" color="orange" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Today's Schedule</h3>
          <p className="text-gray-500 text-center py-8">No classes scheduled today</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Submissions</h3>
          <p className="text-gray-500 text-center py-8">No recent submissions</p>
        </div>
      </div>
    </div>
  );
};

// Student Dashboard
const StudentDashboard = () => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Enrolled Courses" value="--" icon="📚" color="blue" />
        <StatCard title="Completed Exams" value="--" icon="✅" color="green" />
        <StatCard title="Upcoming Exams" value="--" icon="📝" color="orange" />
        <StatCard title="Average Score" value="--%" icon="🏆" color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Upcoming Classes</h3>
          <p className="text-gray-500 text-center py-8">No upcoming classes</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Materials</h3>
          <p className="text-gray-500 text-center py-8">No recent materials</p>
        </div>
      </div>
    </div>
  );
};

// Parent Dashboard
const ParentDashboard = () => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Children" value="--" icon="👨‍👧‍👦" color="blue" />
        <StatCard title="Attendance Rate" value="--%" icon="✅" color="green" />
        <StatCard title="Upcoming Payments" value="--" icon="💳" color="orange" />
        <StatCard title="Avg Performance" value="--%" icon="📈" color="purple" />
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Children's Progress</h3>
        <p className="text-gray-500 text-center py-8">
          Link your children to see their progress
        </p>
      </div>
    </div>
  );
};

// Default Dashboard
const DefaultDashboard = ({ userData }) => {
  return (
    <div className="bg-white rounded-lg shadow p-6 text-center">
      <div className="text-6xl mb-4">🎓</div>
      <h3 className="text-xl font-semibold mb-2">Welcome to BeEducated!</h3>
      <p className="text-gray-600">
        Your account is being set up. Please contact an administrator to assign
        your role.
      </p>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ title, value, icon, color }) => {
  const colorClasses = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    orange: "bg-orange-100 text-orange-600",
    purple: "bg-purple-100 text-purple-600",
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${colorClasses[color]}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
};

// Quick Action Component
const QuickAction = ({ title, icon, href }) => {
  return (
    <a
      href={href}
      className="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-amber-50 transition-colors"
    >
      <span className="text-2xl mb-2">{icon}</span>
      <span className="text-sm text-gray-700">{title}</span>
    </a>
  );
};

export default DashboardHome;
