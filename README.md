# BeEducated — EdTech Platform for Offline Coaching Institutes

**Production URL:** [beeducated.co.in](https://beeducated.co.in)

BeEducated is a full-stack Learning Management System built for an offline coaching institute in Uttar Pradesh,India. It handles student enrollment, fee collection via Razorpay(might be changed in future), exam management, content delivery, and multi-role dashboards — serving real students and parents in production.

I joined as the **Founding Engineer** (Aug 2025) and single-handedly architected and shipped the entire platform from scratch.

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | React 19 (Vite), TypeScript | Fast builds, modern React features (Suspense, transitions) |
| Styling | Tailwind CSS | Rapid UI development with consistent design system + polished animations |
| Auth | Clerk | Managed auth with webhook sync, JWT verification, role-based access — no custom auth headaches |
| Backend | Node.js, Express 5, TypeScript | Typed API layer with clean service separation |
| Database | PostgreSQL via Supabase | Row Level Security, real-time capabilities, managed infra |
| Storage | Supabase Storage | Signed URLs for private content, integrated with the DB layer |
| Payments | Razorpay | Indian payment gateway — UPI, cards, netbanking with webhook verification |
| Email | Resend | Transactional emails for enrollments, contact form |

---

## What I Built

### Multi-Role Access System
Five distinct roles — **Admin, Student, Teacher, Parent, Batch Manager** — each with their own dashboard, permissions, and data boundaries. Auth is handled via Clerk with JWT verification on every backend request. Roles are synced between Clerk metadata and the database.

### Enrollment + Payment Pipeline
End-to-end flow: student selects a course type and class → views fee plans → initiates Razorpay checkout → backend creates order, verifies signature → enrollment is created → batch is assigned → content access is unlocked.

### Content Management System
Hierarchical content delivery: Course Type → Class → Subject → Materials (PDFs, videos, documents). Files stored in Supabase Storage with signed URLs for access control. Only enrolled students can access content for their class.

### Admin Panel
20+ API modules, 50+ REST endpoints. Manage students, teachers, parents, batches, courses, exams, content, announcements, enrollments, payments, and reports — all from a single dashboard.

### Exam Engine
Full exam lifecycle: question bank (MCQ, numerical, true/false, subjective) → exam creation with sections → timed attempts with tab-switch tracking → auto-submission of expired attempts (background job every 2 min) → auto-grading → leaderboard with rank calculation.


### Fee Management
Class-based fee plans with installment support. Admin can track pending fees, mark offline payments (cash, cheque, UPI, bank transfer), and block access for fee defaulters. Full payment analytics dashboard.


---

## Architecture Overview

> Detailed system design: [ARCHITECTURE.md](ARCHITECTURE.md)

```
┌─────────────────────────────────────────────────────┐
│                    Frontend (React)                  │
│  Clerk Auth ─── API Client ─── Role-Based Routing   │
└──────────────────────┬──────────────────────────────┘
                       │ REST (JWT in every request)
                       ▼
┌─────────────────────────────────────────────────────┐
│                  Backend (Express)                   │
│  Middleware ─── Routes ─── Services ─── Supabase     │
│                                                     │
│  Webhooks: Clerk (user sync) + Razorpay (payments)  │
│  Background: Exam auto-submit (2 min interval)      │
└──────┬──────────────┬───────────────┬───────────────┘
       ▼              ▼               ▼
   Supabase DB    Supabase Storage   Razorpay
   (PostgreSQL)   (Files + CDN)      (Payments)
```

---

## Project Structure

```
client/                → React frontend (Vite + TypeScript)
├── src/modules/       → Feature modules (admin, student, teacher, parent, courses, payments, exams...)
├── src/pages/         → Public pages (Home, About, Courses, FAQ, Contact...)
├── src/shared/        → Reusable UI components, types, utils
└── src/api/           → API client with auto JWT injection

server/                → Express backend (TypeScript)
├── src/modules/       → 20 API modules (routes per feature)
├── src/services/      → 21 business logic services
├── src/middleware/     → Auth (Clerk JWT), error handling
├── src/webhooks/      → Clerk + Razorpay webhook handlers
└── src/database/      → 18 SQL migrations

packages/shared-types/ → Shared TypeScript types across client + server
docs/                  → API docs, data model, architecture audit
```

---

## Key Engineering Decisions

| Decision | Reasoning |
|----------|-----------|
| Supabase over raw PostgreSQL | RLS policies for data isolation, managed infra, built-in storage — one less service to manage |
| Clerk over custom auth | Webhook-based sync keeps DB in control while offloading auth complexity. Role caching on frontend reduces API calls |
| Service layer pattern | Routes stay thin, business logic is testable and reusable. Enrollment service alone is 44KB — it orchestrates payments, batch assignment, and access control |
| SQL migrations over ORM | Direct control over schema, indexes, RLS policies. 18 incremental migrations track every schema change |
| Razorpay webhooks over polling | Real-time payment confirmation. Signature verification prevents tampering. Idempotent handlers prevent duplicate enrollments |
| Background job for exams | Auto-submits expired attempts every 2 min. Prevents students from gaming the timer by closing the tab |

---

## Scale & Numbers

- **20+** API modules
- **50+** REST endpoints
- **18** database migrations
- **5** user roles with distinct dashboards
- **4** course types (2 active, 2 coming soon)

---

## Documentation

- [ARCHITECTURE.md](ARCHITECTURE.md) — System design, auth flow, payment flow, database design
- [PAYMENT_ARCHITECTURE.md](PAYMENT_ARCHITECTURE.md) — Deep dive into the 3-tier payment system
- [COURSES_ENROLLMENT_DESIGN.md](COURSES_ENROLLMENT_DESIGN.md) — Enrollment system design
- [docs/api/endpoints.md](docs/api/endpoints.md) — API endpoint reference
- [docs/architecture/data-model.md](docs/architecture/data-model.md) — Database schema and relationships
