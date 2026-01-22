// BeEducated Server - TypeScript Entry Point
// Phase 1: Core Auth & User Management

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
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
import clerkWebhook from './webhooks/clerk.js';

// Validate environment variables
validateEnv();

// Create Express app
const app: Express = express();

// ============================================
// CORS Configuration
// ============================================
const allowedOrigins = [
  env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:3000',
  // Add production domains here
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`CORS blocked request from: ${origin}`);
        callback(null, false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// ============================================
// Body Parsing Middleware
// ============================================
// Note: Webhook routes need raw body for signature verification
app.use('/api/v2/webhooks/clerk', express.raw({ type: 'application/json' }));
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

// Auth routes
app.use('/api/v2/auth', authRoutes);

// Admin routes
app.use('/api/v2/admin', adminRoutes);

// Batch routes (Phase 2)
app.use('/api/v2/batches', batchRoutes);

// Course routes (Phase 2)
app.use('/api/v2/courses', courseRoutes);

// Student routes (Phase 2)
app.use('/api/v2/students', studentRoutes);

// Parent routes (Phase 2)
app.use('/api/v2/parents', parentRoutes);

// Content routes (Phase 3)
app.use('/api/v2/content', contentRoutes);

// Announcement routes (Phase 3)
app.use('/api/v2/announcements', announcementRoutes);

// Exam routes (Phase 5)
app.use('/api/v2/exams', examRoutes);

// Question routes (Phase 5)
app.use('/api/v2/questions', questionRoutes);

// ============================================
// Root endpoint
// ============================================
app.get('/', (_req: Request, res: Response) => {
  res.json({
    name: 'BeEducated API',
    version: '2.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
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
    },
  });
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
  console.log('🐝 ================================');
  console.log('🐝  BeEducated Server Started');
  console.log('🐝 ================================');
  console.log(`🐝  Environment: ${env.NODE_ENV}`);
  console.log(`🐝  Port: ${PORT}`);
  console.log(`🐝  API Base: http://localhost:${PORT}/api/v2`);
  console.log('🐝 ================================');
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
