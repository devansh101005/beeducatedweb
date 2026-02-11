// BeEducated Server - TypeScript Entry Point
// Phase 1: Core Auth & User Management

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env, validateEnv } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';

// Route imports
import healthRoutes from './modules/health/health.routes.js';
import { authRoutes } from './modules/auth/index.js';
import { adminRoutes } from './modules/admin/index.js';
import { batchRoutes } from './modules/batches/index.js';
import { courseRoutes } from './modules/courses/index.js';
import { studentRoutes } from './modules/students/index.js';
import { parentRoutes } from './modules/parents/index.js';
import { contentRoutes } from './modules/content/index.js';
import { announcementRoutes } from './modules/announcements/index.js';
import { examRoutes } from './modules/exams/index.js';
import { questionRoutes } from './modules/questions/index.js';
import { dashboardRoutes } from './modules/dashboard/index.js';
import { reportRoutes } from './modules/reports/index.js';
import { feeRoutes } from './modules/fees/index.js';
import { paymentRoutes } from './modules/payments/index.js';
import { contactRoutes } from './modules/contact/index.js';
import { courseTypesRoutes } from './modules/courseTypes/index.js';
import { teacherRoutes } from './modules/teacher/index.js';
import clerkWebhook from './webhooks/clerk.js';
import razorpayWebhook from './webhooks/razorpay.js';

// Validate environment variables
validateEnv();

// Create Express app
const app: Express = express();

// ============================================
// Trust Proxy (Required for Render, Vercel, etc.)
// ============================================
// Trust only the first proxy (Render's load balancer)
// This is more secure than 'trust proxy: true' which trusts all proxies
app.set('trust proxy', 1);

// ============================================
// Security Headers (Helmet)
// ============================================
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for now (frontend serves its own assets)
  crossOriginEmbedderPolicy: false, // Allow embedded content (videos, images)
}));

// ============================================
// CORS Configuration
// ============================================
const allowedOrigins = [
  env.FRONTEND_URL,
  // Production domains
  'https://beeducated.co.in',
  'https://www.beeducated.co.in',
  ...(env.NODE_ENV === 'development'
    ? ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000']
    : []),
];

app.use(
  cors({
    origin: (origin, callback) => {
      // In production, require a valid origin
      if (!origin) {
        if (env.NODE_ENV === 'development') return callback(null, true);
        // Allow webhooks and health checks (no browser origin)
        return callback(null, true);
      }

      // Check if origin is in allowed origins list
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Allow Vercel preview deployments (*.vercel.app)
      if (origin.endsWith('.vercel.app')) {
        return callback(null, true);
      }

      console.warn(`CORS blocked request from: ${origin}`);
      callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// ============================================
// Rate Limiting
// ============================================
const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 auth requests per 15 min per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts, please try again later' },
});

const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // 15 payment requests per 15 min per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many payment requests, please try again later' },
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 uploads per hour per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Upload limit reached, please try again later' },
});

// Apply general limiter to all API routes
app.use('/api/', generalLimiter);

// ============================================
// Body Parsing Middleware
// ============================================
// Note: Webhook routes need raw body for signature verification
app.use('/api/v2/webhooks/clerk', express.raw({ type: 'application/json' }));
app.use('/api/v2/webhooks/razorpay', express.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================
// Request Logging (Development)
// ============================================
if (env.NODE_ENV === 'development') {
  app.use((req: Request, _res: Response, next: NextFunction) => {
    console.log(`${new Date().toISOString()} | ${req.method} ${req.url}`);
    next();
  });
}

// ============================================
// API Routes v2 (New TypeScript routes)
// ============================================

// Health checks
app.use('/api/v2/health', healthRoutes);

// Webhooks (must come before auth middleware)
app.use('/api/v2/webhooks/clerk', clerkWebhook);
app.use('/api/v2/webhooks/razorpay', razorpayWebhook);

// Auth routes (stricter rate limit)
app.use('/api/v2/auth', authLimiter, authRoutes);

// Admin routes
app.use('/api/v2/admin', adminRoutes);

// Batch routes (Phase 2)
app.use('/api/v2/batches', batchRoutes);

// Course routes (Phase 2)
app.use('/api/v2/courses', courseRoutes);

// Student routes (Phase 2)
app.use('/api/v2/students', studentRoutes);
app.use('/api/v2/student', studentRoutes); // Alias for frontend compatibility

// Parent routes (Phase 2)
app.use('/api/v2/parents', parentRoutes);

// Content routes (Phase 3 - upload rate limit)
app.use('/api/v2/content', uploadLimiter, contentRoutes);

// Announcement routes (Phase 3)
app.use('/api/v2/announcements', announcementRoutes);

// Exam routes (Phase 5)
app.use('/api/v2/exams', examRoutes);

// Question routes (Phase 5)
app.use('/api/v2/questions', questionRoutes);

// Dashboard routes (Phase 6)
app.use('/api/v2/dashboard', dashboardRoutes);

// Report routes (Phase 6)
app.use('/api/v2/reports', reportRoutes);

// Fee routes (Phase 4)
app.use('/api/v2/fees', feeRoutes);

// Payment routes (Phase 4 - stricter rate limit)
app.use('/api/v2/payments', paymentLimiter, paymentRoutes);

// Contact routes (Public)
app.use('/api/v2/contact', contactRoutes);

// Course Types routes (Courses & Enrollment)
app.use('/api/v2/course-types', courseTypesRoutes);

// Teacher routes (Teacher dashboard features)
app.use('/api/v2/teacher', teacherRoutes);

// ============================================
// Root endpoint
// ============================================
const apiInfo = {
  name: 'BeEducated API',
  version: '2.0.0',
  status: 'running',
  endpoints: {
    health: '/api/v2/health',
    auth: '/api/v2/auth',
    admin: '/api/v2/admin',
    batches: '/api/v2/batches',
    courses: '/api/v2/courses',
    students: '/api/v2/students',
    parents: '/api/v2/parents',
    content: '/api/v2/content',
    announcements: '/api/v2/announcements',
    exams: '/api/v2/exams',
    questions: '/api/v2/questions',
    dashboard: '/api/v2/dashboard',
    reports: '/api/v2/reports',
    fees: '/api/v2/fees',
    payments: '/api/v2/payments',
    contact: '/api/v2/contact',
    courseTypes: '/api/v2/course-types',
    teacher: '/api/v2/teacher',
  },
};

app.get('/', (_req: Request, res: Response) => {
  res.json({ ...apiInfo, timestamp: new Date().toISOString() });
});

app.get('/api/v2', (_req: Request, res: Response) => {
  res.json({ ...apiInfo, timestamp: new Date().toISOString() });
});

// ============================================
// Error Handling
// ============================================
app.use(notFoundHandler);
app.use(errorHandler);

// ============================================
// Start Server
// ============================================
const PORT = env.PORT;

app.listen(PORT, () => {
  console.log('');
  console.log(' ================================');
  console.log('  BeEducated Server Started');
  console.log(' ================================');
  console.log(`  Environment: ${env.NODE_ENV}`);
  console.log(`  Port: ${PORT}`);
  console.log(`  API Base: http://localhost:${PORT}/api/v2`);
  console.log(' ================================');
  console.log('');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: Error) => {
  console.error('Unhandled Rejection:', reason);
  // Don't exit in development
  if (env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

export default app;
