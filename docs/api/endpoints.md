# BeEducated API Endpoints

## Overview

The API follows RESTful conventions with versioned endpoints.

- **Base URL**: `http://localhost:5000/api`
- **New API Version**: `/api/v2` (TypeScript)
- **Legacy API**: `/api` (JavaScript - to be migrated)

---

## Authentication

All protected endpoints require a valid Clerk JWT token in the Authorization header:

```
Authorization: Bearer <clerk_jwt_token>
```

---

## Health Endpoints

### GET /api/v2/health
Basic health check.

**Auth Required**: No

**Response**:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2025-01-18T12:00:00.000Z",
    "uptime": 3600
  }
}
```

### GET /api/v2/health/detailed
Detailed health check with service status.

**Auth Required**: No

**Response**:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2025-01-18T12:00:00.000Z",
    "uptime": 3600,
    "environment": "development",
    "version": "1.0.0",
    "services": {
      "supabase": "configured",
      "clerk": "configured",
      "razorpay": "not_configured"
    },
    "memory": {
      "used": 50,
      "total": 100,
      "unit": "MB"
    }
  }
}
```

### GET /api/v2/health/ready
Readiness probe for container orchestration.

### GET /api/v2/health/live
Liveness probe for container orchestration.

---

## Auth Endpoints (Phase 1)

### POST /api/v2/webhooks/clerk
Clerk webhook handler for user sync.

**Auth Required**: Webhook signature verification

**Events Handled**:
- `user.created`
- `user.updated`
- `user.deleted`

### GET /api/v2/auth/me
Get current authenticated user.

**Auth Required**: Yes

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "clerkId": "user_xxx",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "student",
    "accessStatus": "active"
  }
}
```

---

## User Endpoints (Phase 1)

### GET /api/v2/users
List all users (admin only).

**Auth Required**: Yes (Admin)

**Query Parameters**:
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| page | number | 1 | Page number |
| pageSize | number | 20 | Items per page |
| role | string | - | Filter by role |
| search | string | - | Search by name/email |

### POST /api/v2/users
Create a new user (admin only).

**Auth Required**: Yes (Admin)

**Body**:
```json
{
  "email": "user@example.com",
  "phone": "+919876543210",
  "firstName": "John",
  "lastName": "Doe",
  "role": "student",
  "studentType": "coaching_offline",
  "classId": "uuid",
  "batchId": "uuid"
}
```

### GET /api/v2/users/:id
Get user by ID.

**Auth Required**: Yes

### PUT /api/v2/users/:id
Update user.

**Auth Required**: Yes (Admin or self)

### DELETE /api/v2/users/:id
Deactivate user (soft delete).

**Auth Required**: Yes (Admin)

---

## Student Endpoints (Phase 1)

### GET /api/v2/students
List students.

**Auth Required**: Yes (Admin, Teacher, Batch Manager)

### GET /api/v2/students/:id
Get student details.

**Auth Required**: Yes

### PUT /api/v2/students/:id
Update student profile.

**Auth Required**: Yes (Admin or self)

### GET /api/v2/students/:id/fees
Get student fee records.

**Auth Required**: Yes (Admin, self, or parent)

---

## Class Endpoints (Phase 2)

### GET /api/v2/classes
List all classes.

### GET /api/v2/classes/:id
Get class details.

### POST /api/v2/classes
Create class (admin).

### PUT /api/v2/classes/:id
Update class (admin).

---

## Batch Endpoints (Phase 2)

### GET /api/v2/batches
List batches.

### GET /api/v2/batches/:id
Get batch details.

### GET /api/v2/batches/:id/students
List students in batch.

### POST /api/v2/batches
Create batch (admin).

### PUT /api/v2/batches/:id
Update batch (admin).

---

## Fee Endpoints (Phase 4)

### GET /api/v2/fees/plans
List fee plans.

### POST /api/v2/fees/plans
Create fee plan (admin).

### GET /api/v2/fees/student/:studentId
Get student fees.

### POST /api/v2/fees/generate
Generate fees for student (admin).

---

## Payment Endpoints (Phase 4)

### POST /api/v2/payments/create-order
Create Razorpay order.

### POST /api/v2/payments/verify
Verify payment.

### POST /api/v2/webhooks/razorpay
Razorpay webhook handler.

### GET /api/v2/payments
List payments.

### GET /api/v2/payments/:id/receipt
Download receipt.

### POST /api/v2/payments/offline
Record offline payment (admin).

### POST /api/v2/payments/:id/refund
Process refund (admin).

---

## Content Endpoints (Phase 3)

### GET /api/v2/content
List content.

### GET /api/v2/content/:id
Get content details.

### POST /api/v2/content
Upload content (admin).

### DELETE /api/v2/content/:id
Delete content (admin).

---

## Exam Endpoints (Phase 5)

### GET /api/v2/exams
List exams.

### GET /api/v2/exams/available
List available exams for student.

### GET /api/v2/exams/:id
Get exam details.

### POST /api/v2/exams
Create exam (admin, teacher).

### POST /api/v2/exams/:id/start
Start exam attempt.

### POST /api/v2/exams/:id/submit
Submit exam.

### GET /api/v2/exams/:id/result
Get exam result.

---

## Announcement Endpoints (Phase 3)

### GET /api/v2/announcements
List announcements.

### POST /api/v2/announcements
Create announcement (admin, batch manager).

### PUT /api/v2/announcements/:id
Update announcement.

### POST /api/v2/announcements/:id/read
Mark as read.

---

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "error": "Error message"
}
```

### Common HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 500 | Internal Server Error |
