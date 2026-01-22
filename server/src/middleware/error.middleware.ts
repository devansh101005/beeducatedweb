// Error handling middleware
// Created in Phase 0

import { Request, Response, NextFunction } from 'express';
import { AppError } from '../shared/utils/errors.js';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error('Error:', err);

  // Handle known operational errors
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
      ...(err.name === 'ValidationError' && { details: (err as any).errors }),
    });
    return;
  }

  // Handle Supabase errors
  if (err.message?.includes('supabase') || err.message?.includes('PostgreSQL')) {
    res.status(500).json({
      success: false,
      error: 'Database error',
    });
    return;
  }

  // Handle unknown errors
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
};

export const notFoundHandler = (_req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
};
