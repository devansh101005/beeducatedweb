// API response utilities
// Created in Phase 0

import { Response } from 'express';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedData<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message?: string,
  statusCode = 200
): void => {
  res.status(statusCode).json({
    success: true,
    data,
    message,
  } as ApiResponse<T>);
};

export const sendCreated = <T>(res: Response, data: T, message = 'Created successfully'): void => {
  sendSuccess(res, data, message, 201);
};

export const sendError = (res: Response, error: string, statusCode = 500): void => {
  res.status(statusCode).json({
    success: false,
    error,
  } as ApiResponse);
};

export const sendNotFound = (res: Response, resource = 'Resource'): void => {
  sendError(res, `${resource} not found`, 404);
};

export const sendUnauthorized = (res: Response, message = 'Unauthorized'): void => {
  sendError(res, message, 401);
};

export const sendForbidden = (res: Response, message = 'Forbidden'): void => {
  sendError(res, message, 403);
};

export const sendBadRequest = (res: Response, message = 'Bad request'): void => {
  sendError(res, message, 400);
};

export const sendValidationError = (
  res: Response,
  errors: Record<string, string> | string[]
): void => {
  res.status(400).json({
    success: false,
    error: 'Validation failed',
    details: errors,
  });
};

export const sendPaginated = <T>(
  res: Response,
  items: T[],
  total: number,
  page: number,
  pageSize: number
): void => {
  const totalPages = Math.ceil(total / pageSize);
  sendSuccess(res, {
    items,
    total,
    page,
    pageSize,
    totalPages,
  } as PaginatedData<T>);
};
