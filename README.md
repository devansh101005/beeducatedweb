# BeEducated

[![CI](https://github.com/devansh101005/beeducatedweb/actions/workflows/ci.yml/badge.svg)](https://github.com/devansh101005/beeducatedweb/actions/workflows/ci.yml)

A full-stack Learning Management System for coaching institutes. Handles student enrollment, online fee payment, exams with auto-grading, study-material delivery, and dashboards for five user roles (admin, student, teacher, parent, batch manager).

**Live:** [beeducated.co.in](https://beeducated.co.in) *(currently offline — demo available on request)*

## Features

- **Enrollment & payments** — class enrollment with registration + tuition steps, Cashfree checkout (UPI/cards/netbanking), webhook-driven payment confirmation, installments, discount coupons, offline payment recording
- **Fee management** — class-based fee plans, late fees with grace periods, invoices, automated email reminders on an escalation schedule
- **Exam engine** — question bank (MCQ, numerical, true/false, subjective), sectioned timed exams, server-side time enforcement, auto-grading with negative marking, leaderboards
- **Content delivery** — PDFs, videos and documents organized by class and subject, served through signed URLs with enrollment-based access control
- **Role-based dashboards** — separate views and permissions for admin, student, teacher, parent, and batch manager
- **Announcements** — targeted by role, batch, class, or course, with read tracking

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, TypeScript, Tailwind CSS |
| Backend | Node.js, Express 5, TypeScript |
| Database | PostgreSQL (Supabase) with Row Level Security |
| Storage | Supabase Storage |
| Auth | Clerk |
| Payments | Cashfree |
| Email | Resend |

## Architecture

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
│  Webhooks: Clerk (user sync) + Cashfree (payments)  │
│  Background: Exam auto-submit + daily fee reminders │
└──────┬──────────────┬───────────────┬───────────────┘
       ▼              ▼               ▼
   Supabase DB    Supabase Storage   Cashfree
   (PostgreSQL)   (Files + CDN)      (Payments)
```

## Project Structure

```
client/                → React frontend (Vite)
├── src/modules/       → Feature modules (admin, student, teacher, parent, courses, payments, exams...)
├── src/pages/         → Public pages (Home, About, Courses, FAQ, Contact...)
├── src/shared/        → Reusable UI components, types, utils
└── src/api/           → API client with auto JWT injection

server/                → Express backend (TypeScript)
├── src/modules/       → API route modules (one per feature)
├── src/services/      → Business logic services
├── src/middleware/    → Auth (Clerk JWT), error handling
├── src/webhooks/      → Clerk + Cashfree webhook handlers
└── src/database/      → SQL migrations
```

## Running Locally

```bash
# Backend
cd server
cp .env.example .env        # fill in Supabase, Clerk, Cashfree, Resend keys
npm install
npm run dev                 # http://localhost:5000

# Frontend (separate terminal)
cd client
cp .env.example .env        # Clerk publishable key + API URL
npm install
npm run dev                 # http://localhost:5173
```

Database schema lives in `server/src/database/migrations/` — run the numbered SQL files in order in the Supabase SQL editor.

## Tests & Checks

```bash
cd server
npm run type-check
npm run lint
npm test
```

All three run on every push via GitHub Actions.

## License

Copyright © 2026 Devansh Pandey. All rights reserved — see [LICENSE](LICENSE). The source is viewable for evaluation purposes only.
