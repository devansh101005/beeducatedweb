// Health check routes
// Created in Phase 0

import { Router, Request, Response } from 'express';
import { sendSuccess } from '../../shared/utils/response.js';
import { isSupabaseConfigured } from '../../config/supabase.js';
import { env } from '../../config/env.js';

const router = Router();

// Basic health check
router.get('/', (_req: Request, res: Response) => {
  sendSuccess(res, {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Detailed health check
router.get('/detailed', async (_req: Request, res: Response) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0',
    services: {
      supabase: isSupabaseConfigured() ? 'configured' : 'not_configured',
      clerk: env.CLERK_SECRET_KEY ? 'configured' : 'not_configured',
      razorpay: env.RAZORPAY_KEY_ID ? 'configured' : 'not_configured',
    },
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      unit: 'MB',
    },
  };

  sendSuccess(res, health);
});

// Readiness probe (for k8s/docker)
router.get('/ready', async (_req: Request, res: Response) => {
  // Add checks for required services here
  const ready = true; // Will add DB check when configured

  if (ready) {
    sendSuccess(res, { ready: true });
  } else {
    res.status(503).json({ success: false, ready: false });
  }
});

// Liveness probe (for k8s/docker)
router.get('/live', (_req: Request, res: Response) => {
  sendSuccess(res, { alive: true });
});

export default router;
