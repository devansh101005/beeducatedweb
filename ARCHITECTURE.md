# Architecture — BeEducated Platform

This document covers the system design, key flows, and engineering decisions behind the BeEducated platform.

---

## System Overview

```
                         ┌──────────────┐
                         │   Clerk      │
                         │  (Auth SaaS) │
                         └──────┬───────┘
                    Webhook (user.created/updated)
                                │
┌──────────────┐    REST + JWT  │   ┌──────────────────────┐
│   React App  │ ◄────────────► │ ◄─┤   Express Backend     │
│   (Vite)     │                │   │                      │
│              │                │   │  ┌─── Auth Middleware │
│  - Clerk SDK │                │   │  │    (verify JWT)    │
│  - API Client│                │   │  │                    │
│  - Modules   │                │   │  ├─── Route Layer     │
│  - Router    │                │   │  │    (20 modules)    │
└──────────────┘                │   │  │                    │
                                │   │  ├─── Service Layer   │
                                │   │  │    (21 services)   │
                                │   │  │                    │
                                │   │  └─── Data Layer      │
                                │   │       (Supabase)      │
                                │   └──────────────────────┘
                                │              │
                         ┌──────┴───────┐      │
                         │  Razorpay    │◄─────┘
                         │  (Payments)  │  Webhook (payment.captured)
                         └──────────────┘
```

---

## Authentication Flow

Clerk handles all auth (signup, login, session management). The backend never stores passwords.

```
1. User signs up/in via Clerk (frontend)
2. Clerk issues a session JWT
3. Frontend API client attaches JWT to every request (Authorization: Bearer <token>)
4. Backend middleware:
   a. requireAuth  → verifies JWT with Clerk SDK
   b. attachUser   → looks up user in Supabase by clerk_id
                      if not found, auto-creates from Clerk data
   c. requireRole  → checks user.role against allowed roles
5. Clerk webhook (user.created/updated/deleted) keeps Supabase in sync
```

**Why this design:**
- Clerk owns the auth complexity (OAuth, MFA, session management)
- Backend owns the data — every user exists in Supabase with a `clerk_id` foreign key
- Webhook sync is the source of truth, but `attachUser` middleware acts as a safety net (auto-creates if webhook was delayed)
- Role is stored in both Clerk metadata (for frontend gating) and Supabase (for backend enforcement)

**Role Hierarchy:**
```
admin          → full access to everything
batch_manager  → manage batches, students within assigned batches
teacher        → manage own batches, grade submissions, create exams
parent         → view linked children's progress and payments
student        → access enrolled content, take exams, view results
```

---

## Payment & Enrollment Flow

This is the most critical flow — real money, real enrollments, zero room for error.

```
Student                    Frontend                  Backend                    Razorpay
  │                          │                         │                          │
  ├─ Select class ──────────►│                         │                          │
  │                          ├─ POST /payments/initiate│                          │
  │                          │─────────────────────────►│                          │
  │                          │                         ├─ Create Razorpay order ──►│
  │                          │                         │◄── order_id ──────────────┤
  │                          │                         │                          │
  │                          │                         ├─ Create payment record    │
  │                          │                         │   (status: pending)       │
  │                          │◄── order_id, key ───────┤                          │
  │                          │                         │                          │
  │◄── Razorpay checkout ───┤                         │                          │
  ├─ Pay (UPI/card/etc) ───►│                         │                          │
  │                          │                         │                          │
  │                          ├─ POST /payments/complete│                          │
  │                          │   (razorpay_payment_id, │                          │
  │                          │    razorpay_signature)  │                          │
  │                          │─────────────────────────►│                          │
  │                          │                         ├─ Verify signature         │
  │                          │                         ├─ Update payment: completed│
  │                          │                         ├─ Create enrollment        │
  │                          │                         ├─ Assign to batch          │
  │                          │                         ├─ Unlock content access    │
  │                          │◄── enrollment confirmed─┤                          │
  │◄── Success page ────────┤                         │                          │
```

**Failure handling:**
- Signature verification fails → payment marked `failed`, no enrollment
- Razorpay webhook arrives for unverified payment → cross-check and reconcile
- Duplicate completion requests → idempotent check on `razorpay_order_id`

**Admin manual enrollment:**
- Admin can enroll students without payment (offline cash, cheque, UPI, bank transfer)
- Creates enrollment + marks payment as the selected offline mode
- Same access control — enrolled = access, not enrolled = blocked

---

## Database Design

PostgreSQL via Supabase with Row Level Security (RLS).

### Core Tables & Relationships

```
users (clerk_id, role, email, name, phone)
  │
  ├── students (user_id → users, student_type, custom_student_id)
  │     ├── class_enrollments (student_id, class_id, payment_id)
  │     ├── batch_students (student_id, batch_id)
  │     ├── student_fees (student_id, fee details)
  │     ├── exam_attempts (student_id, exam_id, answers, score)
  │     └── content_progress (student_id, content_id, progress)
  │
  ├── teachers (user_id → users, specialization[])
  │     └── batch_teachers (teacher_id, batch_id)
  │
  └── parents (user_id → users)
        └── parent_students (parent_id, student_id)

course_types (coaching_offline, home_tuition, ...)
  └── academic_classes (class_6, class_7, ..., JEE, NEET)
        ├── class_fee_plans (class_id, plan_name, amount, installments)
        ├── class_subjects (class_id, subject_name)
        │     └── content (subject_id, type, file_path, signed_url)
        └── batches (class_id, name, timing, capacity)

exams (title, class_grade, batch_type, duration, total_marks)
  ├── exam_sections (exam_id, name, instructions)
  │     └── questions (section_id, type, text, options, correct_answer)
  └── exam_results (exam_id, student_id, score, rank)

enrollment_payments (enrollment_id, razorpay_order_id, amount, status)
announcements (title, content, target_class, target_batch)
```

### Key Constraints (Migration 017)
- Unique constraint on `(student_id, class_id)` in enrollments — no duplicate enrollments
- Unique constraint on `razorpay_order_id` in payments — no duplicate payments
- These were added after production bugs surfaced duplicate records

### Student Types & Access Matrix

| Type | Status | Enrollment | Payment |
|------|--------|-----------|---------|
| coaching_offline | Active | Via Razorpay or admin manual | Required |
| home_tuition | Active | Via Razorpay or admin manual | Required |
| coaching_online | Coming Soon | — | — |
| test_series | Coming Soon | — | — |

---

## Backend Architecture

### Layer Separation

```
Request → Middleware (auth, rate limit) → Route (validation, orchestration) → Service (business logic) → Supabase (data)
```

- **Routes** are thin — validate input, call services, return response
- **Services** own business logic — a single enrollment involves payment verification, record creation, batch assignment, and access control
- **Middleware** handles cross-cutting: JWT verification, role checks, rate limiting, error formatting

### Rate Limiting Strategy

| Endpoint Group | Limit | Window | Why |
|---------------|-------|--------|-----|
| General API | 100 req | 1 min | Standard abuse prevention |
| Auth | 100 req | 15 min | Prevent brute force |
| Payments | 15 req | 15 min | Prevent payment spam |
| Uploads | 20 req | 1 hour | Prevent storage abuse |

### Background Jobs

**Exam Auto-Submit** — runs every 2 minutes:
- Queries all exam attempts where `status = 'in_progress'` and `end_time < now()`
- Auto-submits with whatever answers were saved
- Prevents students from gaming the timer by closing the browser

---

## Frontend Architecture

### Module-Based Structure

Each feature is a self-contained module with its own pages, hooks, and types:

```
modules/
├── admin/        → 13 pages (users, students, batches, exams, payments...)
├── student/      → 5 pages (my courses, exams, results, study materials)
├── teacher/      → 4 pages (batches, students, grading, schedule)
├── parent/       → 3 pages (children, progress, payments)
├── courses/      → 4 pages (browse, enroll, class details)
├── payments/     → 3 pages (checkout, success, history)
├── exams/        → exam taking interface (handled via pages/)
├── announcements/→ feed + admin management
└── settings/     → user preferences
```

### Auth on Frontend

```
ClerkProvider (top-level)
  └── ApiSetup (captures getToken, injects into API client)
       └── ClerkProtectedRoute (per-route)
            ├── Checks Clerk session
            ├── Fetches role from backend (/auth/me)
            ├── Caches role for 5 minutes
            └── Blocks access if role doesn't match
```

### API Client

Custom fetch-based client (not Axios for new code):
- Auto-injects Clerk JWT on every request
- Typed responses via generics: `api.get<Student[]>('/students')`
- Handles 204 No Content, error message extraction
- Optional `skipAuth` for public endpoints

---

## Security Measures

| Layer | Measure |
|-------|---------|
| Transport | HTTPS everywhere |
| Headers | Helmet (CSP, HSTS, X-Frame-Options, etc.) |
| Auth | Clerk JWT verification on every protected route |
| Authorization | Role check middleware, RLS policies in database |
| Payments | Razorpay signature verification (HMAC SHA256) |
| Webhooks | Svix signature verification (Clerk), HMAC verification (Razorpay) |
| Input | Express body parsers with size limits |
| Rate limiting | Per-endpoint group rate limits |
| Storage | Signed URLs with expiry for private content |
| CORS | Whitelist of allowed origins (production + preview URLs) |

---

## Migration History

18 SQL migrations tracking every schema evolution:

| # | What | Why |
|---|------|-----|
| 001 | Core tables (users, students, teachers, parents, batches) | Foundation |
| 002 | Row Level Security policies | Data isolation |
| 003 | Courses, subjects, batch-course links | Academic structure |
| 004 | Content management, announcements | Learning materials |
| 005 | Exam engine (questions, attempts, results) | Assessment system |
| 006 | Dashboard analytics, reports | Admin visibility |
| 007 | Fee structure, payment tracking | Monetization |
| 008 | Course types, classes, fee plans, enrollment system | Enrollment pipeline |
| 009 | Manual enrollment support | Admin can enroll without payment |
| 010-011 | Content hierarchy restructure | Better content organization |
| 012 | Manual enrollment fee plan updates | Admin flexibility |
| 013 | Announcement class targeting | Targeted announcements |
| 014-016 | Exam targeting + result context | Exams scoped to batch/class |
| 017 | Production constraints | Fix duplicate enrollment/payment bugs |
| 018 | Coaching offline fee updates | Fee structure changes |

---

## What's Next

- **Coaching Online** — live class integration
- **Test Series** — standalone exam subscriptions
- **Mobile App** — React Native (planned)
- **Analytics** — deeper student performance insights
