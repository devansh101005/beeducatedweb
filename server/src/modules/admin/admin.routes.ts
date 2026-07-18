// Admin Routes - /api/v2/admin
// Composed from domain sub-routers; every route requires an admin session.
// Sub-routers are mounted in the same order the routes were originally
// declared so path-matching behavior is unchanged.

import { Router } from 'express';
import { requireAuth, attachUser, requireAdmin } from '../../middleware/auth.js';
import applicationsRoutes from './routes/applications.routes.js';
import usersRoutes from './routes/users.routes.js';
import studentsRoutes from './routes/students.routes.js';
import feesRoutes from './routes/fees.routes.js';
import teachersRoutes from './routes/teachers.routes.js';
import parentsRoutes from './routes/parents.routes.js';
import enrollmentsRoutes from './routes/enrollments.routes.js';
import statsRoutes from './routes/stats.routes.js';

const router = Router();

// All routes require admin authentication
router.use(requireAuth, attachUser, requireAdmin);

router.use(applicationsRoutes); // /applications/*
router.use(usersRoutes);        // /users/*
router.use(studentsRoutes);     // /students/*
router.use(feesRoutes);         // /fees/*
router.use(teachersRoutes);     // /teachers/*
router.use(parentsRoutes);      // /parents/*, /students-for-linking
router.use(enrollmentsRoutes);  // /enrollments/*
router.use(statsRoutes);        // /stats

export default router;
