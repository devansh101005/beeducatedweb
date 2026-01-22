# Frontend Audit - BeEducated

## Date: Phase 0 - January 2025

---

## Project Overview

| Property | Value |
|----------|-------|
| Framework | React 19.1.0 |
| Bundler | Vite 6.3.5 |
| Routing | react-router-dom 7.6.2 |
| Styling | Tailwind CSS 3.4.19 |
| HTTP Client | Axios 1.9.0 |
| Icons | react-icons 5.5.0 |
| Legacy Auth | Firebase 10.7.1 |

---

## Folder Structure

```
client/src/
├── api/                    # NEW: API client (TypeScript)
├── assets/                 # Images, logos
├── components/             # LEGACY: Shared components
│   ├── exam/              # Exam-related components
│   ├── Navbar.jsx
│   ├── ProtectedRoute.jsx
│   ├── RoleProtectedRoute.jsx
│   └── AnnouncementModal.jsx
├── context/               # LEGACY: React contexts
│   └── AuthContext.jsx    # TO BE REPLACED with Clerk
├── modules/               # NEW: Feature modules (TypeScript)
│   ├── auth/
│   ├── dashboard/
│   └── ...
├── pages/                 # LEGACY: Page components
│   ├── exam/             # Exam pages
│   └── *.jsx             # Other pages
├── shared/               # NEW: Shared utilities (TypeScript)
│   ├── components/
│   ├── hooks/
│   ├── types/
│   └── utils/
├── App.jsx               # Main app component
├── main.jsx              # Entry point
├── firebase.js           # LEGACY: Firebase config
├── facultyData.js        # Static data
└── index.css            # Global styles
```

---

## Pages Inventory

### Public Pages (No Auth Required)
| Page | File | Route | Status |
|------|------|-------|--------|
| Home | `Home.jsx` | `/` | ✅ |
| About | `About.jsx` | `/about` | ✅ |
| Contact | `Contact.jsx` | `/contact` | ✅ |
| Courses | `Courses.jsx` | `/courses` | ✅ |
| Faculty | `FacultyPage.jsx` | `/faculty` | ✅ |
| Fee Structure | `FeeStructure.jsx` | `/fee-structure` | ✅ |
| Unauthorized | `Unauthorized.jsx` | `/unauthorized` | ✅ |
| Materials | `StudyMaterials.jsx` | `/materials` | ✅ |

### Auth Pages (To Be Replaced)
| Page | File | Route | Status |
|------|------|-------|--------|
| Login | `LoginForm.jsx` | `/login` | 🔄 Replace with Clerk |
| Signup | `SignupForm.jsx` | `/signup` | 🔄 Replace with Clerk |
| Phone Login | `PhoneLogin.jsx` | `/phone-login` | 🔄 Replace with Clerk |
| Student Login | `StudentLogin.jsx` | `/student-login` | 🔄 Replace with Clerk |
| OTP Login | `StudentOtpLoginForm.jsx` | `/student-id-login` | 🔄 Replace with Clerk |

### Protected Pages - Student
| Page | File | Route | Role |
|------|------|-------|------|
| Student Dashboard | `StudentDashboard.jsx` | `/student-dashboard` | STUDENT |
| Student Profile | `StudentProfile.jsx` | `/student-profile` | STUDENT |
| Student Portal | `StudentPortal.jsx` | `/student-portal` | STUDENT |
| Find Tutors | `TutorList.jsx` | `/find-tutors` | STUDENT |
| Available Exams | `exam/AvailableExams.jsx` | `/available-exams` | STUDENT |
| Take Exam | `exam/TakeExam.jsx` | `/take-exam/:examId` | STUDENT |
| Exam Results | `exam/ExamResults.jsx` | `/exam-results/:examId` | STUDENT |

### Protected Pages - Tutor
| Page | File | Route | Role |
|------|------|-------|------|
| Tutor Dashboard | `TutorDashboard.jsx` | `/tutor-dashboard` | TUTOR |
| Create Exam | `exam/ExamCreator.jsx` | `/create-exam` | TUTOR, ADMIN |

### Protected Pages - Admin
| Page | File | Route | Role |
|------|------|-------|------|
| Admin Dashboard | `AdminDashboard.jsx` | `/admin-dashboard` | ADMIN |
| Admin Users | `AdminUsers.jsx` | `/admin/users` | ADMIN |
| Admin Students | `AdminStudents.jsx` | `/admin/students` | ADMIN |
| Admin Applications | `AdminApplications.jsx` | `/admin/applications` | ADMIN |
| Upload Form | `uploadForm.jsx` | `/upload` | Public? |

### Application Forms
| Page | File | Route | Auth |
|------|------|-------|------|
| Student Apply | `StudentApplyForm.jsx` | `/apply/student` | Public |
| Tutor Apply | `TutorApplyForm.jsx` | `/apply/tutor` | Public |
| Admin Upload | `AdminUploadMaterials.jsx` | - | - |

---

## Components Inventory

### Layout Components
| Component | File | Usage |
|-----------|------|-------|
| Navbar | `Navbar.jsx` | All pages |

### Auth Components (Legacy)
| Component | File | Action |
|-----------|------|--------|
| ProtectedRoute | `ProtectedRoute.jsx` | Replace with Clerk |
| RoleProtectedRoute | `RoleProtectedRoute.jsx` | Replace with Clerk |

### Feature Components
| Component | File | Status |
|-----------|------|--------|
| AnnouncementModal | `AnnouncementModal.jsx` | ✅ Keep |

### Exam Components
| Component | File | Status |
|-----------|------|--------|
| ExamTimer | `exam/ExamTimer.jsx` | ✅ Keep |
| QuestionDisplay | `exam/QuestionDisplay.jsx` | ✅ Keep |
| ProgressIndicator | `exam/ProgressIndicator.jsx` | ✅ Keep |
| TakeExam | `exam/TakeExam.jsx` | ✅ Keep |
| ExamCreator | `exam/ExamCreator.jsx` | ✅ Keep |

---

## Current Auth Implementation

### AuthContext.jsx Analysis

```javascript
// Current implementation
- User state from localStorage
- Token state from localStorage
- login() - saves to localStorage
- logout() - clears localStorage
- isAuthenticated computed from user && token
```

### ProtectedRoute.jsx Analysis

```javascript
// Checks if user is authenticated
// Redirects to /login if not
// Uses AuthContext
```

### RoleProtectedRoute.jsx Analysis

```javascript
// Checks if user has required role
// Uses allowedRoles prop
// Redirects to /unauthorized if wrong role
```

### Migration Plan
1. Install `@clerk/clerk-react`
2. Wrap App with `ClerkProvider`
3. Replace `AuthContext` usage with `useAuth()` and `useUser()`
4. Replace `ProtectedRoute` with Clerk's `SignedIn`/`SignedOut`
5. Create new `AuthGuard` component for role-based access

---

## CSS Files

| File | Purpose |
|------|---------|
| `index.css` | Global styles + Tailwind |
| `App.css` | App-level styles |
| `Home.css` | Home page styles |
| `About.css` | About page styles |
| `Courses.css` | Courses page styles |
| `FacultyPage.css` | Faculty page styles |
| `FeeStructure.css` | Fee structure styles |
| `LoginForm.css` | Login form styles |
| `SignupForm.css` | Signup form styles |
| `StudentLogin.css` | Student login styles |
| `StudentOtpLoginForm.css` | OTP login styles |
| `StudentPortal.css` | Student portal styles |
| `StudyMaterials.css` | Materials page styles |
| `AdminDashboard.css` | Admin dashboard styles |
| `AdminStudents.css` | Admin students styles |
| `Navbar.css` | Navbar styles |
| `AnnouncementModal.css` | Modal styles |
| `exam/*.css` | Exam-related styles |

---

## Third-Party Dependencies

### Production
| Package | Version | Usage |
|---------|---------|-------|
| react | 19.1.0 | UI Framework |
| react-dom | 19.1.0 | DOM Rendering |
| react-router-dom | 7.6.2 | Routing |
| axios | 1.9.0 | HTTP Client |
| react-icons | 5.5.0 | Icons |
| firebase | 10.7.1 | Legacy Auth (TO REMOVE) |

### Development
| Package | Version | Usage |
|---------|---------|-------|
| vite | 6.3.5 | Bundler |
| @vitejs/plugin-react | 4.4.1 | React Plugin |
| tailwindcss | 3.4.19 | Styling |
| postcss | 8.5.6 | CSS Processing |
| autoprefixer | 10.4.23 | CSS Prefixes |
| eslint | 9.25.0 | Linting |
| typescript | - | To be added |

### To Add (Phase 1)
| Package | Purpose |
|---------|---------|
| @clerk/clerk-react | Authentication |
| typescript-eslint | TS Linting |

---

## Action Items

### Immediate (Phase 0)
- [x] Create modules folder structure
- [x] Add TypeScript configuration
- [x] Add path aliases
- [x] Create shared types

### Phase 1
- [ ] Install @clerk/clerk-react
- [ ] Create ClerkProvider wrapper
- [ ] Create AuthGuard component
- [ ] Migrate auth pages to Clerk
- [ ] Update protected routes

### Phase 2+
- [ ] Migrate pages to TypeScript (optional)
- [ ] Add unit tests
- [ ] Add E2E tests
