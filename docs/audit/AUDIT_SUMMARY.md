# BeEducated Legacy Code Audit Summary

## Date: Phase 0 - January 2025
## Audited By: [Your Name]

---

## Frontend Summary

### Technology Stack
- **Framework**: React 19 with Vite
- **Routing**: react-router-dom v7
- **Styling**: Tailwind CSS + custom CSS files
- **HTTP Client**: Axios
- **Auth (Legacy)**: Firebase + JWT with localStorage

### Pages Found (Total: 30+)

| Page | File Path | Status | Action |
|------|-----------|--------|--------|
| Home | `src/pages/Home.jsx` | ✅ Working | KEEP |
| About | `src/pages/About.jsx` | ✅ Working | KEEP |
| Contact | `src/pages/Contact.jsx` | ✅ Working | KEEP |
| Courses | `src/pages/Courses.jsx` | ✅ Working | KEEP |
| Faculty | `src/pages/FacultyPage.jsx` | ✅ Working | KEEP |
| Fee Structure | `src/pages/FeeStructure.jsx` | ✅ Working | KEEP |
| Login | `src/pages/LoginForm.jsx` | ⚠️ Firebase Auth | REPLACE with Clerk |
| Student Login | `src/pages/StudentLogin.jsx` | ⚠️ Firebase Auth | REPLACE with Clerk |
| Phone Login | `src/pages/PhoneLogin.jsx` | ⚠️ Firebase Auth | REPLACE with Clerk |
| OTP Login | `src/pages/StudentOtpLoginForm.jsx` | ⚠️ Firebase Auth | REPLACE with Clerk |
| Signup | `src/pages/SignupForm.jsx` | ⚠️ Firebase Auth | REPLACE with Clerk |
| Student Dashboard | `src/pages/StudentDashboard.jsx` | ⚠️ Needs Auth Update | REFACTOR |
| Tutor Dashboard | `src/pages/TutorDashboard.jsx` | ⚠️ Needs Auth Update | REFACTOR |
| Admin Dashboard | `src/pages/AdminDashboard.jsx` | ⚠️ Needs Auth Update | REFACTOR |
| Admin Users | `src/pages/AdminUsers.jsx` | ⚠️ Needs Auth Update | REFACTOR |
| Admin Students | `src/pages/AdminStudents.jsx` | ⚠️ Needs Auth Update | REFACTOR |
| Admin Applications | `src/pages/AdminApplications.jsx` | ⚠️ Needs Auth Update | REFACTOR |
| Study Materials | `src/pages/StudyMaterials.jsx` | ⚠️ Needs Auth Update | REFACTOR |
| Student Portal | `src/pages/StudentPortal.jsx` | ⚠️ Needs Auth Update | REFACTOR |
| Exam Creator | `src/pages/exam/ExamCreator.jsx` | ⚠️ Needs Auth Update | REFACTOR |
| Take Exam | `src/pages/exam/TakeExam.jsx` | ⚠️ Needs Auth Update | REFACTOR |
| Available Exams | `src/pages/exam/AvailableExams.jsx` | ⚠️ Needs Auth Update | REFACTOR |
| Exam Results | `src/pages/exam/ExamResults.jsx` | ⚠️ Needs Auth Update | REFACTOR |

### Components Found

| Component | File Path | Status | Action |
|-----------|-----------|--------|--------|
| Navbar | `src/components/Navbar.jsx` | ✅ Working | KEEP, minor updates |
| ProtectedRoute | `src/components/ProtectedRoute.jsx` | ⚠️ JWT-based | REPLACE with Clerk |
| RoleProtectedRoute | `src/components/RoleProtectedRoute.jsx` | ⚠️ JWT-based | REPLACE with Clerk |
| AnnouncementModal | `src/components/AnnouncementModal.jsx` | ✅ Working | KEEP |
| ExamTimer | `src/components/exam/ExamTimer.jsx` | ✅ Working | KEEP |
| QuestionDisplay | `src/components/exam/QuestionDisplay.jsx` | ✅ Working | KEEP |
| ProgressIndicator | `src/components/exam/ProgressIndicator.jsx` | ✅ Working | KEEP |
| TakeExam | `src/components/exam/TakeExam.jsx` | ⚠️ Duplicate? | REVIEW |
| ExamCreator | `src/components/exam/ExamCreator.jsx` | ⚠️ Duplicate? | REVIEW |

### Auth Status
- **Current**: Firebase Auth + JWT stored in localStorage
- **Context File**: `src/context/AuthContext.jsx`
- **Protected Route**: Custom `ProtectedRoute` and `RoleProtectedRoute` components
- **Target**: Clerk Auth with `@clerk/clerk-react`
- **Migration**: Phase 1

---

## Backend Summary

### Technology Stack
- **Framework**: Express 5
- **Database**: PostgreSQL via Prisma ORM
- **Auth (Legacy)**: Firebase Admin + JWT
- **Storage**: AWS S3
- **File Upload**: Multer

### Routes Found (Total: 12)

| File | Routes | Auth | Action |
|------|--------|------|--------|
| `authRoutes.js` | Login, Register | No | REPLACE with Clerk |
| `studentAuthRoutes.js` | Student auth | Firebase | REPLACE with Clerk |
| `offlineAuthRoutes.js` | Offline auth | Firebase | REPLACE with Clerk |
| `protectedRoutes.js` | Protected routes | JWT | REFACTOR |
| `tutorRoutes.js` | Tutor CRUD | JWT | REFACTOR auth |
| `StudentRoutes.js` | Student CRUD | JWT | REFACTOR auth |
| `adminRoutes.js` | Admin operations | JWT | REFACTOR auth |
| `examRoutes.js` | Exam CRUD | JWT | REFACTOR auth |
| `materialRoutes.js` | Materials | JWT | REFACTOR auth |
| `announcementRoutes.js` | Announcements | JWT | REFACTOR auth |
| `resourceRoutes.js` | Resources | JWT | REFACTOR auth |
| `applications.js` | Applications | JWT | REFACTOR auth |

### Middleware Found

| Middleware | File | Status | Action |
|------------|------|--------|--------|
| Auth | `middleware/auth.js` | ⚠️ JWT-based | REPLACE with Clerk |
| Auth Middleware | `middleware/authMiddleware.js` | ⚠️ JWT-based | REPLACE with Clerk |
| Upload | `middleware/upload.js` | ✅ Working | KEEP |
| Upload Middleware | `middleware/uploadMiddleware.js` | ✅ Working | KEEP |

### Database Status
- **Current ORM**: Prisma
- **Database**: PostgreSQL (local)
- **Target**: Supabase PostgreSQL
- **Migration**: Phase 2

---

## What to KEEP ✅

### Frontend
1. Public pages: Home, About, Contact, Courses, Faculty, Fee Structure
2. Navbar component (update auth state handling)
3. Announcement modal component
4. Exam components (Timer, QuestionDisplay, ProgressIndicator)
5. Tailwind CSS setup
6. Vite build configuration

### Backend
1. Express server setup
2. CORS configuration
3. Multer upload middleware
4. Prisma models (reference for Supabase migration)
5. AWS S3 integration (may keep or migrate to Supabase Storage)

---

## What to REFACTOR 🔄

### Frontend
1. `AuthContext.jsx` → Clerk's `useAuth` and `useUser`
2. `ProtectedRoute.jsx` → Clerk's `SignedIn` / `SignedOut`
3. `RoleProtectedRoute.jsx` → Custom Clerk role guard
4. All dashboard pages → Update auth context usage
5. All protected pages → Update route guards

### Backend
1. Auth middleware → Clerk JWT verification
2. All protected routes → Use new auth middleware
3. User model/routes → Sync with Clerk users
4. Database queries → Migrate to Supabase client

---

## What to REMOVE ❌

### After Clerk Migration (Phase 1)
1. `src/firebase.js` - Firebase config
2. `src/context/AuthContext.jsx` - Replace with Clerk
3. `src/pages/LoginForm.jsx` - Use Clerk SignIn
4. `src/pages/SignupForm.jsx` - Use Clerk SignUp
5. `src/pages/PhoneLogin.jsx` - Use Clerk with phone
6. `src/pages/StudentOtpLoginForm.jsx` - Use Clerk
7. `middleware/auth.js` - Replace with Clerk middleware
8. `middleware/authMiddleware.js` - Replace with Clerk middleware
9. `firebaseAdmin.js` - Firebase admin SDK

### After Supabase Migration (Phase 2)
1. Local PostgreSQL database
2. Prisma ORM (optional - can keep if preferred)

---

## What to FREEZE 🧊 (Don't Modify in Phase 0-1)

1. Exam system components (working, complex)
2. Material upload/download (working)
3. Announcement system (working)
4. Public pages content (working)

---

## Risk Assessment

### High Risk ⚠️
- User data migration from Firebase to Clerk
- Breaking existing user sessions during auth migration
- Exam system disruption

### Medium Risk ⚡
- Database migration from local PostgreSQL to Supabase
- File storage migration (if moving from S3 to Supabase Storage)
- API contract changes affecting frontend

### Low Risk ✅
- Static page modifications
- New TypeScript modules
- Adding new API endpoints

---

## Pre-Phase 1 Decisions Required

- [x] Keep existing DB temporarily during migration
- [ ] Soft launch (new users only) or migrate existing users?
- [ ] Parallel run old + new auth, or hard cutover?
- [ ] Keep AWS S3 or migrate to Supabase Storage?

---

## Migration Strategy

### Recommended Approach: Parallel Systems

1. **Phase 1**: Add Clerk alongside Firebase
   - New users go through Clerk
   - Existing users continue with Firebase
   - Gradual migration over 2-4 weeks

2. **Phase 2**: Add Supabase alongside existing DB
   - New data goes to Supabase
   - Existing data migrated in batches
   - Verify data integrity before cutover

3. **Phase 3+**: Remove legacy systems
   - Remove Firebase after all users migrated
   - Remove old DB after data verified
