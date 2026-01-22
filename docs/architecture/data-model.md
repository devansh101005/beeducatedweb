# BeEducated Data Model

## Overview

This document describes the data model for the BeEducated EdTech platform.

---

## Student Types

BeEducated supports four types of students:

| Type | Code | Description |
|------|------|-------------|
| Coaching Online | `coaching_online` | Students attending online coaching classes |
| Coaching Offline | `coaching_offline` | Students attending physical coaching classes |
| Test Series | `test_series` | Students enrolled only for test series |
| Home Tuition | `home_tuition` | Students receiving home tuition services |

### Student Type Features Matrix

| Feature | coaching_online | coaching_offline | test_series | home_tuition |
|---------|-----------------|------------------|-------------|--------------|
| Has Batch | ✅ | ✅ | ❌ | Optional |
| Physical Attendance | ❌ | ✅ | ❌ | ✅ |
| Content Access | Full | Full | Limited | Custom |
| Exam Access | Full | Full | Full | Optional |
| Fee Structure | Registration + Installments | Registration + Installments | One-time | Custom/Monthly |

---

## Core Entities

### Users

Central user entity synced with Clerk.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | UUID | ✅ | Primary key |
| clerk_id | string | ✅ | Clerk user ID |
| email | string | - | Email address |
| phone | string | ✅ | Phone number (required for India) |
| first_name | string | ✅ | First name |
| last_name | string | - | Last name |
| role | enum | ✅ | User role |
| avatar_url | string | - | Profile picture URL |
| is_active | boolean | ✅ | Account active status |
| access_status | enum | ✅ | Access status (active, blocked, etc.) |
| access_blocked_reason | string | - | Reason for blocking |
| access_blocked_at | timestamp | - | When access was blocked |
| last_login_at | timestamp | - | Last login timestamp |
| created_at | timestamp | ✅ | Creation timestamp |
| updated_at | timestamp | ✅ | Last update timestamp |

**Roles**: `admin`, `student`, `parent`, `teacher`, `batch_manager`

**Access Status**: `active`, `blocked_fee_pending`, `blocked_manual`, `suspended`

---

### Students

Extended profile for student users.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | UUID | ✅ | Primary key |
| user_id | UUID | ✅ | FK to users (unique) |
| student_id | string | ✅ | Custom ID (e.g., "BEE2024001") |
| student_type | enum | ✅ | Type of student |
| class_id | UUID | - | FK to classes |
| batch_id | UUID | - | FK to batches |
| date_of_birth | date | - | Date of birth |
| gender | string | - | Gender |
| address | text | - | Full address |
| city | string | - | City |
| state | string | - | State |
| pincode | string | - | PIN code |
| school_name | string | - | Current school |
| board | string | - | Education board (CBSE, ICSE, etc.) |
| enrollment_date | date | ✅ | Enrollment date |
| valid_until | date | - | Subscription validity |
| notes | text | - | Admin notes |
| created_at | timestamp | ✅ | Creation timestamp |
| updated_at | timestamp | ✅ | Last update timestamp |

---

### Parents

Extended profile for parent users.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | UUID | ✅ | Primary key |
| user_id | UUID | ✅ | FK to users (unique) |
| parent_id | string | ✅ | Custom ID (e.g., "BEEP2024001") |
| relation | string | - | Relation to student |
| occupation | string | - | Occupation |
| alternate_phone | string | - | Alternate phone |
| created_at | timestamp | ✅ | Creation timestamp |
| updated_at | timestamp | ✅ | Last update timestamp |

---

### Teachers

Extended profile for teacher users.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | UUID | ✅ | Primary key |
| user_id | UUID | ✅ | FK to users (unique) |
| teacher_id | string | ✅ | Custom ID (e.g., "BEET001") |
| specialization | string[] | - | Subjects taught |
| qualification | string | - | Educational qualification |
| experience_years | integer | - | Years of experience |
| created_at | timestamp | ✅ | Creation timestamp |
| updated_at | timestamp | ✅ | Last update timestamp |

---

### Classes

Academic classes (e.g., Class 9, Class 10, IIT-JEE).

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | UUID | ✅ | Primary key |
| name | string | ✅ | Class name |
| description | text | - | Description |
| display_order | integer | ✅ | Sort order |
| is_active | boolean | ✅ | Active status |
| created_at | timestamp | ✅ | Creation timestamp |
| updated_at | timestamp | ✅ | Last update timestamp |

---

### Batches

Class batches (e.g., Morning Batch, Evening Batch).

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | UUID | ✅ | Primary key |
| class_id | UUID | ✅ | FK to classes |
| name | string | ✅ | Batch name |
| description | text | - | Description |
| timing | string | - | Batch timing (e.g., "7:00 AM - 9:00 AM") |
| batch_manager_id | UUID | - | FK to users (batch manager) |
| max_students | integer | ✅ | Maximum capacity |
| current_students | integer | ✅ | Current enrollment (auto-updated) |
| academic_year | string | ✅ | Academic year (e.g., "2024-25") |
| is_active | boolean | ✅ | Active status |
| created_at | timestamp | ✅ | Creation timestamp |
| updated_at | timestamp | ✅ | Last update timestamp |

---

## Relationships

```
users ─────────┬──────── 1:1 ──────── students
               │
               ├──────── 1:1 ──────── parents
               │
               └──────── 1:1 ──────── teachers

students ──────┬──────── M:1 ──────── classes
               │
               ├──────── M:1 ──────── batches
               │
               └──────── M:M ──────── parents (via student_parents)

batches ───────┬──────── M:1 ──────── classes
               │
               └──────── M:1 ──────── users (batch_manager)
```

---

## ID Generation Patterns

| Entity | Pattern | Example |
|--------|---------|---------|
| Student | BEE{YEAR}{SEQUENCE} | BEE2024001 |
| Parent | BEEP{YEAR}{SEQUENCE} | BEEP2024001 |
| Teacher | BEET{SEQUENCE} | BEET001 |
| Payment | PAY{YEAR}{SEQUENCE} | PAY2024000001 |
| Receipt | RCP{YEAR}{SEQUENCE} | RCP2024000001 |

---

## Future Entities (Phase 2+)

### Fee Plans
Template for different fee structures.

### Student Fees
Individual fee records for each student.

### Payments
Payment transaction records.

### Coupons
Discount coupons.

### Content
Learning materials (PDFs, videos).

### Exams
Online tests and quizzes.

### Questions
Exam questions.

### Exam Attempts
Student exam attempts and responses.

### Announcements
Notices and announcements.

---

## Indexes

### Recommended Indexes

```sql
-- Users
CREATE INDEX idx_users_clerk_id ON users(clerk_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_access_status ON users(access_status);

-- Students
CREATE INDEX idx_students_user_id ON students(user_id);
CREATE INDEX idx_students_student_id ON students(student_id);
CREATE INDEX idx_students_class_id ON students(class_id);
CREATE INDEX idx_students_batch_id ON students(batch_id);
CREATE INDEX idx_students_type ON students(student_type);

-- Batches
CREATE INDEX idx_batches_class_id ON batches(class_id);
CREATE INDEX idx_batches_manager_id ON batches(batch_manager_id);
```

---

## Row Level Security (RLS)

Supabase RLS policies will be configured to:

1. **Users can read their own data**
2. **Admin can access all data**
3. **Teachers can read their assigned class data**
4. **Parents can read their children's data**
5. **Batch managers can read their batch data**

Detailed RLS policies will be implemented in Phase 2.
