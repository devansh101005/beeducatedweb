import { BrowserRouter, Routes, Route } from "react-router-dom";

// Public pages
import Home from "./pages/Home";
import About from "./pages/About";
import Courses from "./pages/Courses";
import FeeStructure from './pages/FeeStructure';
import FacultyPage from "./pages/FacultyPage";
import Contact from "./pages/Contact";
import FAQ from "./pages/FAQ";
import StudyMaterials from "./pages/StudyMaterials";

// Legacy auth pages (keep during migration)
import SignupForm from "./pages/SignupForm";
import LoginForm from "./pages/LoginForm";
import StudentOtpLoginForm from "./pages/StudentOtpLoginForm";
// import PhoneLogin from "./pages/PhoneLogin"; // Removed: Uses Firebase, replaced by Clerk
import StudentLogin from "./pages/StudentLogin";

// New Clerk auth pages
import { SignIn, SignUp, UserProfile } from "./pages/auth";

// Legacy dashboards (keep during migration)
import AdminUsers from "./pages/AdminUsers";
import TutorList from "./pages/TutorList";
import StudentDashboard from "./pages/StudentDashboard";
import TutorDashboard from "./pages/TutorDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import StudentProfile from "./pages/StudentProfile";
import AdminApplications from "./pages/AdminApplications";
import AdminStudents from "./pages/AdminStudents";
import StudentPortal from "./pages/StudentPortal";

// Application forms
import StudentApplyForm from "./pages/StudentApplyForm";
import TutorApplyForm from "./pages/TutorApplyForm";
import UploadForm from "./pages/uploadForm";

// Legacy protected routes
import ProtectedRoute from "./components/ProtectedRoute";
import RoleProtectedRoute from "./components/RoleProtectedRoute";

// New Clerk protected route
import { ClerkProtectedRoute } from "./components/auth";

// New dashboard components (Premium redesign)
import { DashboardLayout, DashboardHome } from "@modules/dashboard";

// Fee Management
import { FeeListPage, MyFeesPage } from "@modules/fees";

// Payments
import { PaymentPage, PaymentSuccessPage, PaymentHistoryPage } from "@modules/payments";

// Announcements
import { AnnouncementsPage } from "@modules/announcements";

// Admin Management
import { UsersPage, BatchesPage, CoursesPage, ExamsPage, ExamEditorPage, ApplicationsPage, StudentsPage, ParentsPage, ContentManagementPage, TeachersPage, AdminPaymentsPage, ReportsPage } from "@modules/admin";

// Student Pages
import { MyCoursesPage, StudyMaterialsPage, MyExamsPage, MyResultsPage } from "@modules/student";

// Teacher Pages
import { MyBatchesPage, MyStudentsPage, GradingPage, SchedulePage } from "@modules/teacher";

// Parent Pages
import { MyChildrenPage, ChildProgressPage, ParentPaymentsPage } from "@modules/parent";

// Settings
import { SettingsPage } from "@modules/settings";

// Courses & Enrollment Pages
import { CoursesPage as NewCoursesPage, ClassesPage, MyEnrollmentsPage } from "@modules/courses";

// Other pages
import Unauthorized from "./pages/Unauthorized";
import Navbar from "./components/Navbar";
import ExamCreator from "./pages/exam/ExamCreator";
import TakeExam from "./pages/exam/TakeExam";
import AvailableExams from "./pages/exam/AvailableExams";
import ExamResults from "./pages/exam/ExamResults";
import AuthTest from "./pages/AuthTest";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ============================================ */}
        {/* NEW Clerk Auth Routes (Phase 1) */}
        {/* ============================================ */}
        <Route path="/sign-in/*" element={<SignIn />} />
        <Route path="/sign-up/*" element={<SignUp />} />
        <Route path="/profile/*" element={
          <ClerkProtectedRoute>
            <UserProfile />
          </ClerkProtectedRoute>
        } />

        {/* ============================================ */}
        {/* NEW Dashboard Routes (Phase 1) */}
        {/* ============================================ */}
        <Route path="/dashboard" element={
          <ClerkProtectedRoute>
            <DashboardLayout />
          </ClerkProtectedRoute>
        }>
          <Route index element={<DashboardHome />} />

          {/* Fee Management */}
          <Route path="fees" element={<FeeListPage />} />
          <Route path="my-fees" element={<MyFeesPage />} />

          {/* Payments */}
          <Route path="pay/:feeId" element={<PaymentPage />} />
          <Route path="payment-success" element={<PaymentSuccessPage />} />
          <Route path="payment-history" element={<PaymentHistoryPage />} />

          {/* Announcements */}
          <Route path="announcements" element={<AnnouncementsPage />} />

          {/* Admin Management */}
          <Route path="applications" element={<ApplicationsPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="students" element={<StudentsPage />} />
          <Route path="parents" element={<ParentsPage />} />
          <Route path="batches" element={<BatchesPage />} />
          <Route path="courses" element={<CoursesPage />} />
          <Route path="exams" element={<ExamsPage />} />
          <Route path="exams/:examId/edit" element={<ExamEditorPage />} />
          <Route path="materials" element={<ContentManagementPage />} />
          <Route path="teachers" element={<TeachersPage />} />
          <Route path="payments" element={<AdminPaymentsPage />} />
          <Route path="reports" element={<ReportsPage />} />

          {/* Student Pages */}
          <Route path="my-courses" element={<MyCoursesPage />} />
          <Route path="my-enrollments" element={<MyEnrollmentsPage />} />
          <Route path="study-materials" element={<StudyMaterialsPage />} />
          <Route path="my-exams" element={<MyExamsPage />} />
          <Route path="my-results" element={<MyResultsPage />} />

          {/* Teacher Pages */}
          <Route path="my-batches" element={<MyBatchesPage />} />
          <Route path="my-students" element={<MyStudentsPage />} />
          <Route path="grading" element={<GradingPage />} />
          <Route path="schedule" element={<SchedulePage />} />

          {/* Parent Pages */}
          <Route path="children" element={<MyChildrenPage />} />
          <Route path="progress" element={<ChildProgressPage />} />
          <Route path="parent-payments" element={<ParentPaymentsPage />} />

          {/* Settings (all roles) */}
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* ============================================ */}
        {/* Public Pages (with Navbar) */}
        {/* ============================================ */}
        <Route path="/" element={<><Navbar /><Home /></>} />
        <Route path="/about" element={<><Navbar /><About /></>} />
        <Route path="/courses" element={<><Navbar /><NewCoursesPage /></>} />
        <Route path="/courses/:slug" element={<><Navbar /><ClassesPage /></>} />
        <Route path="/contact" element={<><Navbar /><Contact /></>} />
        <Route path="/fee-structure" element={<><Navbar /><FeeStructure /></>} />
        <Route path="/materials" element={<><Navbar /><StudyMaterials /></>} />
        <Route path="/faculty" element={<><Navbar /><FacultyPage /></>} />
        <Route path="/faq" element={<><Navbar /><FAQ /></>} />
        <Route path="/unauthorized" element={<><Navbar /><Unauthorized /></>} />
        <Route path="/auth-test" element={<><Navbar /><AuthTest /></>} />

        {/* Application Forms (Public) */}
        <Route path="/apply/student" element={<><Navbar /><StudentApplyForm /></>} />
        <Route path="/apply/tutor" element={<><Navbar /><TutorApplyForm /></>} />

        {/* ============================================ */}
        {/* Legacy Auth Routes (keep during migration) */}
        {/* ============================================ */}
        <Route path="/signup" element={<><Navbar /><SignupForm /></>} />
        <Route path="/login" element={<><Navbar /><LoginForm /></>} />
        <Route path="/student-id-login" element={<><Navbar /><StudentOtpLoginForm /></>} />
        {/* <Route path="/phone-login" element={<><Navbar /><PhoneLogin /></>} /> */} {/* Removed: Uses Firebase */}
        <Route path="/student-login" element={<><Navbar /><StudentLogin /></>} />
        <Route path="/student-portal" element={<><Navbar /><StudentPortal /></>} />
        <Route path="/upload" element={<><Navbar /><UploadForm /></>} />

        {/* ============================================ */}
        {/* Legacy Protected Routes (keep during migration) */}
        {/* ============================================ */}

        {/* Student Routes */}
        <Route
          path="/student-profile"
          element={
            <>
              <Navbar />
              <RoleProtectedRoute allowedRoles={["STUDENT"]}>
                <StudentProfile />
              </RoleProtectedRoute>
            </>
          }
        />
        <Route
          path="/student-dashboard"
          element={
            <>
              <Navbar />
              <RoleProtectedRoute allowedRoles={["STUDENT"]}>
                <StudentDashboard />
              </RoleProtectedRoute>
            </>
          }
        />
        <Route
          path="/find-tutors"
          element={
            <>
              <Navbar />
              <RoleProtectedRoute allowedRoles={["STUDENT"]}>
                <TutorList />
              </RoleProtectedRoute>
            </>
          }
        />

        {/* Tutor Route */}
        <Route
          path="/tutor-dashboard"
          element={
            <>
              <Navbar />
              <RoleProtectedRoute allowedRoles={["TUTOR"]}>
                <TutorDashboard />
              </RoleProtectedRoute>
            </>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin-dashboard"
          element={
            <>
              <Navbar />
              <RoleProtectedRoute allowedRoles={["ADMIN"]}>
                <AdminDashboard />
              </RoleProtectedRoute>
            </>
          }
        />
        <Route
          path="/admin/users"
          element={
            <>
              <Navbar />
              <RoleProtectedRoute allowedRoles={["ADMIN"]}>
                <AdminUsers />
              </RoleProtectedRoute>
            </>
          }
        />
        <Route
          path="/admin/students"
          element={
            <>
              <Navbar />
              <RoleProtectedRoute allowedRoles={["ADMIN"]}>
                <AdminStudents />
              </RoleProtectedRoute>
            </>
          }
        />
        <Route
          path="/admin/applications"
          element={
            <>
              <Navbar />
              <RoleProtectedRoute allowedRoles={["ADMIN"]}>
                <AdminApplications />
              </RoleProtectedRoute>
            </>
          }
        />

        {/* Exam Routes */}
        <Route
          path="/create-exam"
          element={
            <>
              <Navbar />
              <RoleProtectedRoute allowedRoles={["ADMIN", "TUTOR"]}>
                <ExamCreator />
              </RoleProtectedRoute>
            </>
          }
        />
        <Route
          path="/available-exams"
          element={
            <>
              <Navbar />
              <RoleProtectedRoute allowedRoles={["STUDENT"]}>
                <AvailableExams />
              </RoleProtectedRoute>
            </>
          }
        />
        <Route
          path="/take-exam/:examId"
          element={
            <ClerkProtectedRoute allowedRoles={["student"]}>
              <TakeExam />
            </ClerkProtectedRoute>
          }
        />
        <Route
          path="/exam-results/:examId"
          element={
            <ClerkProtectedRoute allowedRoles={["student"]}>
              <ExamResults />
            </ClerkProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
