import { BrowserRouter, Routes, Route } from "react-router-dom";
import { auth } from "./firebase"; // Force early initialization

import Home from "./pages/Home";
import About from "./pages/About";
import AdminUsers from "./pages/AdminUsers";
import TutorList from "./pages/TutorList";
import SignupForm from "./pages/SignupForm";
import LoginForm from "./pages/LoginForm";
import StudentDashboard from "./pages/StudentDashboard";
import TutorDashboard from "./pages/TutorDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import StudentProfile from "./pages/StudentProfile";
import StudentApplyForm from "./pages/StudentApplyForm";
import TutorApplyForm from "./pages/TutorApplyForm";
import UploadForm from "./pages/uploadForm";
import AdminApplications from "./pages/AdminApplications";
import StudentOtpLoginForm from "./pages/StudentOtpLoginForm";
import PhoneLogin from "./pages/PhoneLogin";
import StudentLogin from "./pages/StudentLogin";
import AdminStudents from "./pages/AdminStudents";
import StudentPortal from "./pages/StudentPortal";

import ProtectedRoute from "./components/ProtectedRoute";
import RoleProtectedRoute from "./components/RoleProtectedRoute";
import Unauthorized from "./pages/Unauthorized";
import Navbar from "./components/Navbar";
//import UploadForm from "/src/pages/UploadForm.jsx";
import StudyMaterials from "./pages/StudyMaterials";
import Courses from "./pages/Courses";

//import StudyMaterials from "./pages/StudyMaterials";
import ExamCreator from "./pages/exam/ExamCreator";
import TakeExam from "./pages/exam/TakeExam";
import AvailableExams from "./pages/exam/AvailableExams";
import ExamResults from "./pages/exam/ExamResults";
import FeeStructure from './pages/FeeStructure';

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <main>
        <Routes>
          {/* Public Pages */}
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/signup" element={<SignupForm />} />
          <Route path="/login" element={<LoginForm />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="/upload" element={<UploadForm />} />
          <Route path="/fee-structure" element={<FeeStructure />} />
          <Route path="/materials" element={<StudyMaterials />} />
          <Route path="/student-id-login" element={<StudentOtpLoginForm />} />
          <Route path="/phone-login" element={<PhoneLogin />} />
          <Route path="/student-login" element={<StudentLogin />} />
          <Route path="/student-portal" element={<StudentPortal />} />

          {/* Student Routes */}
          <Route
            path="/student-profile"
            element={
              <RoleProtectedRoute allowedRoles={["STUDENT"]}>
                <StudentProfile />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/student-dashboard"
            element={
              <RoleProtectedRoute allowedRoles={["STUDENT"]}>
                <StudentDashboard />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/find-tutors"
            element={
              <RoleProtectedRoute allowedRoles={["STUDENT"]}>
                <TutorList />
              </RoleProtectedRoute>
            }
          />

          {/* Tutor Route */}
          <Route
            path="/tutor-dashboard"
            element={
              <RoleProtectedRoute allowedRoles={["TUTOR"]}>
                <TutorDashboard />
              </RoleProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin-dashboard"
            element={
              <RoleProtectedRoute allowedRoles={["ADMIN"]}>
                <AdminDashboard />
              </RoleProtectedRoute>
            }

          />
          <Route
            path="/admin/users"
            element={
              <RoleProtectedRoute allowedRoles={["ADMIN"]}>
                <AdminUsers />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/admin/students"
            element={
              <RoleProtectedRoute allowedRoles={["ADMIN"]}>
                <AdminStudents />
              </RoleProtectedRoute>
            }
          />
          <Route path="/apply/student" element={<StudentApplyForm />} />
          <Route path="/apply/tutor" element={<TutorApplyForm />} />
          <Route
            path="/admin/applications"
            element={
              <RoleProtectedRoute allowedRoles={["ADMIN"]}>
                <AdminApplications />
              </RoleProtectedRoute>
            }
          />


          <Route 
            path="/create-exam" 
            element={
              <RoleProtectedRoute allowedRoles={["ADMIN", "TUTOR"]}>
                <ExamCreator />
              </RoleProtectedRoute>
            } 
          />

          <Route 
            path="/available-exams" 
            element={
              <RoleProtectedRoute allowedRoles={["STUDENT"]}>
                <AvailableExams />
              </RoleProtectedRoute>
            } 
          />

          <Route 
            path="/take-exam/:examId" 
            element={
              <RoleProtectedRoute allowedRoles={["STUDENT"]}>
                <TakeExam />
              </RoleProtectedRoute>
            } 
          />

          <Route 
            path="/exam-results/:examId" 
            element={
              <RoleProtectedRoute allowedRoles={["STUDENT"]}>
                <ExamResults />
              </RoleProtectedRoute>
            } 
          />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default App;