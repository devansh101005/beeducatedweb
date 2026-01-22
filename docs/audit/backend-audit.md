# Backend Audit - BeEducated

## Date: Phase 0 - January 2025

---

## Project Overview

| Property | Value |
|----------|-------|
| Framework | Express 5.1.0 |
| Runtime | Node.js (ESM modules) |
| Database | PostgreSQL (local) |
| ORM | Prisma 6.9.0 |
| Auth (Legacy) | Firebase Admin + JWT |
| Storage | AWS S3 |
| File Upload | Multer 2.0.1 |

---

## Folder Structure

```
server/
├── src/                    # NEW: TypeScript source
│   ├── config/            # Environment, Supabase, Clerk
│   ├── middleware/        # Error handlers
│   ├── modules/           # Feature modules
│   │   ├── health/       # Health check endpoints
│   │   └── users/        # User management (Phase 1)
│   ├── shared/           # Shared utilities
│   │   ├── types/        # TypeScript types
│   │   └── utils/        # Response helpers, errors
│   └── webhooks/         # Clerk, Razorpay webhooks
├── legacy/               # Will contain old JS files
├── routes/               # LEGACY: Express routes
├── middleware/           # LEGACY: Express middleware
├── prisma/               # Prisma schema & migrations
├── server.js             # LEGACY: Main server file
├── firebaseAdmin.js      # LEGACY: Firebase admin setup
└── test-exam.js          # Test file
```

---

## Routes Inventory

### Auth Routes (TO BE REPLACED)

| File | Method | Endpoint | Auth | Action |
|------|--------|----------|------|--------|
| `authRoutes.js` | POST | `/api/auth/register` | No | Replace with Clerk |
| `authRoutes.js` | POST | `/api/auth/login` | No | Replace with Clerk |
| `studentAuthRoutes.js` | POST | `/api/student/login` | Firebase | Replace with Clerk |
| `offlineAuthRoutes.js` | POST | `/api/offline/login` | Firebase | Replace with Clerk |

### Protected Routes

| File | Method | Endpoint | Auth | Status |
|------|--------|----------|------|--------|
| `protectedRoutes.js` | * | `/api/protected/*` | JWT | Refactor auth |

### Tutor Routes

| File | Method | Endpoint | Auth | Status |
|------|--------|----------|------|--------|
| `tutorRoutes.js` | GET | `/api/tutors` | No | ✅ Keep |
| `tutorRoutes.js` | GET | `/api/tutors/:id` | No | ✅ Keep |
| `tutorRoutes.js` | POST | `/api/tutors` | JWT | Refactor auth |
| `tutorRoutes.js` | PUT | `/api/tutors/:id` | JWT | Refactor auth |
| `tutorRoutes.js` | DELETE | `/api/tutors/:id` | JWT | Refactor auth |

### Student Routes

| File | Method | Endpoint | Auth | Status |
|------|--------|----------|------|--------|
| `StudentRoutes.js` | GET | `/api/students` | JWT | Refactor auth |
| `StudentRoutes.js` | GET | `/api/students/:id` | JWT | Refactor auth |
| `StudentRoutes.js` | POST | `/api/students` | JWT | Refactor auth |
| `StudentRoutes.js` | PUT | `/api/students/:id` | JWT | Refactor auth |
| `StudentRoutes.js` | DELETE | `/api/students/:id` | JWT | Refactor auth |

### Admin Routes

| File | Method | Endpoint | Auth | Status |
|------|--------|----------|------|--------|
| `adminRoutes.js` | * | `/api/admin/*` | JWT | Refactor auth |

### Exam Routes

| File | Method | Endpoint | Auth | Status |
|------|--------|----------|------|--------|
| `examRoutes.js` | GET | `/api/exams` | JWT | Refactor auth |
| `examRoutes.js` | GET | `/api/exams/:id` | JWT | Refactor auth |
| `examRoutes.js` | POST | `/api/exams` | JWT | Refactor auth |
| `examRoutes.js` | PUT | `/api/exams/:id` | JWT | Refactor auth |
| `examRoutes.js` | DELETE | `/api/exams/:id` | JWT | Refactor auth |

### Material Routes

| File | Method | Endpoint | Auth | Status |
|------|--------|----------|------|--------|
| `materialRoutes.js` | GET | `/api/materials` | JWT | Refactor auth |
| `materialRoutes.js` | POST | `/api/materials` | JWT | Refactor auth |
| `materialRoutes.js` | DELETE | `/api/materials/:id` | JWT | Refactor auth |

### Announcement Routes

| File | Method | Endpoint | Auth | Status |
|------|--------|----------|------|--------|
| `announcementRoutes.js` | GET | `/api/announcements` | JWT | Refactor auth |
| `announcementRoutes.js` | POST | `/api/announcements` | JWT | Refactor auth |

### Other Routes

| File | Method | Endpoint | Auth | Status |
|------|--------|----------|------|--------|
| `resourceRoutes.js` | * | `/api/resources/*` | JWT | Refactor auth |
| `applications.js` | * | `/api/applications/*` | JWT | Refactor auth |

---

## Middleware Inventory

### Auth Middleware (TO BE REPLACED)

| File | Purpose | Action |
|------|---------|--------|
| `auth.js` | JWT verification | Replace with Clerk |
| `authMiddleware.js` | Auth check | Replace with Clerk |

### Upload Middleware (KEEP)

| File | Purpose | Action |
|------|---------|--------|
| `upload.js` | Multer setup | ✅ Keep |
| `uploadMiddleware.js` | File handling | ✅ Keep |

---

## Database

### Current Setup
- **Database**: PostgreSQL (local)
- **ORM**: Prisma
- **Connection**: `DATABASE_URL` in .env

### Prisma Models (Reference)
Check `prisma/schema.prisma` for current models.

### Migration Plan
1. Create Supabase project
2. Design new schema based on requirements
3. Create tables in Supabase
4. Migrate data from local PostgreSQL
5. Update backend to use Supabase client

---

## External Services

### AWS S3
- **Purpose**: File storage (materials, uploads)
- **Config**: AWS credentials in .env
- **Bucket**: `beeducated-materials`
- **Region**: `ap-south-1`
- **Action**: Keep or migrate to Supabase Storage

### Firebase Admin
- **Purpose**: Authentication verification
- **Config**: Service account key
- **Action**: Replace with Clerk

### Twilio
- **Purpose**: SMS/OTP
- **Package**: `twilio@5.8.0`
- **Action**: Keep or use Clerk's built-in OTP

---

## Dependencies

### Production

| Package | Version | Purpose | Keep? |
|---------|---------|---------|-------|
| express | 5.1.0 | Web framework | ✅ |
| cors | 2.8.5 | CORS middleware | ✅ |
| dotenv | 16.5.0 | Environment vars | ✅ |
| @prisma/client | 6.9.0 | Database ORM | ⚠️ Optional |
| bcryptjs | 3.0.2 | Password hashing | ❌ (Clerk handles) |
| jsonwebtoken | 9.0.2 | JWT handling | ❌ (Clerk handles) |
| firebase-admin | 13.4.0 | Firebase auth | ❌ Remove |
| @aws-sdk/client-s3 | 3.857.0 | S3 uploads | ⚠️ Keep if using S3 |
| aws-sdk | 2.1692.0 | AWS SDK (old) | ⚠️ Redundant |
| multer | 2.0.1 | File uploads | ✅ |
| twilio | 5.8.0 | SMS | ⚠️ Optional |
| body-parser | 2.2.0 | Request parsing | ⚠️ Express has built-in |

### Development

| Package | Version | Purpose |
|---------|---------|---------|
| nodemon | 3.1.10 | Dev server |
| prisma | 6.9.0 | Prisma CLI |

### To Add (Phase 1)

| Package | Purpose |
|---------|---------|
| @clerk/clerk-sdk-node | Clerk authentication |
| @supabase/supabase-js | Supabase client |
| typescript | TypeScript compiler |
| @types/express | Express types |
| @types/node | Node types |
| tsx | TS execution |
| eslint | Linting |
| prettier | Formatting |

---

## Server.js Analysis

The main server file (`server.js`) likely contains:
- Express app setup
- Middleware registration
- Route mounting
- Error handling
- Server start

### Migration Plan
1. Keep `server.js` for legacy routes
2. Create new `src/app.ts` for new TypeScript code
3. Mount both legacy and new routes
4. Gradually migrate routes to TypeScript

---

## New API Structure (Phase 1+)

### Health Endpoints (NEW - TypeScript)
```
GET  /api/v2/health           # Basic health check
GET  /api/v2/health/detailed  # Detailed status
GET  /api/v2/health/ready     # Readiness probe
GET  /api/v2/health/live      # Liveness probe
```

### Auth Endpoints (NEW - Clerk)
```
POST /api/v2/auth/webhook     # Clerk webhook
GET  /api/v2/auth/me          # Get current user
```

### User Endpoints (NEW - Phase 1)
```
GET    /api/v2/users          # List users (admin)
POST   /api/v2/users          # Create user (admin)
GET    /api/v2/users/:id      # Get user
PUT    /api/v2/users/:id      # Update user
DELETE /api/v2/users/:id      # Delete user
```

---

## Action Items

### Immediate (Phase 0)
- [x] Create src folder structure
- [x] Add TypeScript configuration
- [x] Create health endpoints
- [x] Create shared utilities
- [x] Add environment templates

### Phase 1
- [ ] Install @clerk/clerk-sdk-node
- [ ] Install @supabase/supabase-js
- [ ] Create Clerk auth middleware
- [ ] Create Clerk webhook handler
- [ ] Add /api/v2 router

### Phase 2+
- [ ] Migrate routes to TypeScript
- [ ] Connect to Supabase
- [ ] Add validation middleware
- [ ] Add rate limiting
- [ ] Add logging
