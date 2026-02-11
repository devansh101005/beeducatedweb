# PostgreSQL: From Zero to Production

A complete guide to learning PostgreSQL — written specifically for the BeEducated project stack.

---

## Table of Contents

1. [What is PostgreSQL?](#1-what-is-postgresql)
2. [Setting Up](#2-setting-up)
3. [SQL Fundamentals — CRUD](#3-sql-fundamentals--crud)
4. [Data Types](#4-data-types)
5. [Constraints & Relationships](#5-constraints--relationships)
6. [Querying — Filters, Sorting, Pagination](#6-querying--filters-sorting-pagination)
7. [JOINs — Combining Tables](#7-joins--combining-tables)
8. [Aggregations & GROUP BY](#8-aggregations--group-by)
9. [Subqueries](#9-subqueries)
10. [CTEs (Common Table Expressions)](#10-ctes-common-table-expressions)
11. [Window Functions](#11-window-functions)
12. [Indexes — Making Queries Fast](#12-indexes--making-queries-fast)
13. [Functions & Stored Procedures](#13-functions--stored-procedures)
14. [Triggers](#14-triggers)
15. [Views & Materialized Views](#15-views--materialized-views)
16. [Transactions](#16-transactions)
17. [Row Level Security (RLS)](#17-row-level-security-rls)
18. [JSON in PostgreSQL](#18-json-in-postgresql)
19. [Performance — EXPLAIN ANALYZE](#19-performance--explain-analyze)
20. [What BeEducated Actually Uses](#20-what-beeducated-actually-uses)
21. [Common Errors & How to Fix Them](#21-common-errors--how-to-fix-them)
22. [Resources & Roadmap](#22-resources--roadmap)

---

## 1. What is PostgreSQL?

PostgreSQL (often called "Postgres") is a relational database. It stores data in **tables** (rows and columns), and you query it using **SQL** (Structured Query Language).

Think of it like a very powerful, structured Excel:
- Each **table** = a spreadsheet
- Each **column** = a header (name, email, role)
- Each **row** = one record (one user, one student, one batch)
- **SQL** = the language you use to ask questions and make changes

### Why PostgreSQL over MySQL, SQLite, etc?

- Advanced features (JSON, arrays, full-text search, window functions)
- ACID compliant (your data won't corrupt)
- Extensible (custom types, functions, operators)
- Free and open source
- Used by: Instagram, Spotify, Reddit, Uber, Apple

---

## 2. Setting Up

### Option A: Supabase (What you already have)
Go to your Supabase project → SQL Editor. You can run any SQL there.

### Option B: Local PostgreSQL
```bash
# Install on Windows (using chocolatey)
choco install postgresql

# Install on Mac
brew install postgresql

# Install on Ubuntu
sudo apt install postgresql

# Connect
psql -U postgres
```

### Option C: Docker (Recommended for learning)
```bash
docker run --name learn-postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres:16
docker exec -it learn-postgres psql -U postgres
```

### Option D: Online (No install)
- https://www.db-fiddle.com/ (free, instant)
- https://pgplayground.com/

---

## 3. SQL Fundamentals — CRUD

CRUD = Create, Read, Update, Delete. This is 80% of what you'll ever do.

### CREATE a table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  role TEXT DEFAULT 'user',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

Breaking this down:
- `id UUID PRIMARY KEY` — unique identifier for each row
- `DEFAULT gen_random_uuid()` — auto-generates a UUID if you don't provide one
- `TEXT UNIQUE NOT NULL` — must have a value, and no two rows can have the same value
- `DEFAULT 'user'` — if you don't specify a role, it defaults to 'user'
- `TIMESTAMPTZ` — timestamp with timezone

### INSERT (Create)

```sql
-- Insert one row
INSERT INTO users (email, first_name, last_name, role)
VALUES ('john@example.com', 'John', 'Doe', 'student');

-- Insert and get back the created row
INSERT INTO users (email, first_name, role)
VALUES ('jane@example.com', 'Jane', 'teacher')
RETURNING *;

-- Insert multiple rows
INSERT INTO users (email, first_name, role) VALUES
  ('a@example.com', 'Alice', 'student'),
  ('b@example.com', 'Bob', 'student'),
  ('c@example.com', 'Charlie', 'teacher');
```

### SELECT (Read)

```sql
-- Get all users
SELECT * FROM users;

-- Get specific columns
SELECT email, first_name, role FROM users;

-- Get one user by email
SELECT * FROM users WHERE email = 'john@example.com';

-- Get active students
SELECT * FROM users WHERE role = 'student' AND is_active = true;

-- Get users created today
SELECT * FROM users WHERE created_at >= CURRENT_DATE;
```

### UPDATE

```sql
-- Update one user
UPDATE users
SET role = 'admin', updated_at = NOW()
WHERE email = 'john@example.com';

-- Update and return the result
UPDATE users
SET is_active = false
WHERE id = 'some-uuid-here'
RETURNING *;

-- Update multiple rows
UPDATE users
SET is_active = false
WHERE role = 'student' AND created_at < '2024-01-01';
```

### DELETE

```sql
-- Delete one user
DELETE FROM users WHERE id = 'some-uuid-here';

-- Delete and return what was deleted
DELETE FROM users WHERE is_active = false RETURNING *;

-- DANGER: Delete all rows (rarely do this)
DELETE FROM users;
```

### RETURNING clause
This is PostgreSQL-specific (MySQL doesn't have it). It lets you get back the rows you just inserted/updated/deleted. Your project uses this everywhere via Supabase's `.select()` after `.insert()` or `.update()`.

---

## 4. Data Types

### Types used in BeEducated:

| SQL Type | What it stores | Example | Used for |
|----------|---------------|---------|----------|
| `UUID` | Universally unique ID | `550e8400-e29b-41d4-a716-446655440000` | All primary keys |
| `TEXT` | Any length string | `'John Doe'` | Names, emails, descriptions |
| `VARCHAR(n)` | String with max length | `'ABC'` (max 10 chars) | Codes, short strings |
| `BOOLEAN` | true/false | `true` | is_active, is_published |
| `INTEGER` | Whole number | `42` | Counts, scores |
| `BIGINT` | Large whole number | `1000000000` | Payment amounts (in paise) |
| `NUMERIC(p,s)` | Exact decimal | `99.95` | Prices, percentages |
| `TIMESTAMPTZ` | Date + time + timezone | `2025-01-15 10:30:00+05:30` | created_at, updated_at |
| `DATE` | Just the date | `2025-01-15` | Birthdays, start dates |
| `JSONB` | JSON data (binary) | `{"key": "value"}` | Metadata, flexible fields |
| `TEXT[]` | Array of strings | `{'math','science'}` | Tags, roles |

### When to use JSONB vs a separate table?

```sql
-- Use JSONB for flexible, unstructured data
CREATE TABLE announcements (
  id UUID PRIMARY KEY,
  title TEXT,
  attachments JSONB DEFAULT '[]'  -- flexible structure
);

-- Use a separate table for structured, queryable data
CREATE TABLE announcement_attachments (
  id UUID PRIMARY KEY,
  announcement_id UUID REFERENCES announcements(id),
  file_name TEXT,
  file_url TEXT
);
```

Rule of thumb: If you need to query/filter BY the data → separate table. If it's just stored/displayed → JSONB.

---

## 5. Constraints & Relationships

### Primary Key
Every table needs one. It uniquely identifies each row.

```sql
-- UUID primary key (what BeEducated uses)
id UUID PRIMARY KEY DEFAULT gen_random_uuid()

-- Auto-incrementing integer (common alternative)
id SERIAL PRIMARY KEY
```

### Foreign Key
Links one table to another. This is how relationships work.

```sql
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  batch_id UUID REFERENCES batches(id) ON DELETE SET NULL,
  enrolled_at TIMESTAMPTZ DEFAULT NOW()
);
```

- `REFERENCES users(id)` — student.user_id MUST exist in users table
- `ON DELETE CASCADE` — if the user is deleted, delete the student too
- `ON DELETE SET NULL` — if the batch is deleted, set batch_id to NULL

### Other constraints

```sql
CREATE TABLE batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                          -- cannot be empty
  code TEXT UNIQUE NOT NULL,                   -- unique across all batches
  max_students INTEGER DEFAULT 30 CHECK (max_students > 0),  -- must be positive
  start_date DATE,
  end_date DATE,
  CHECK (end_date > start_date)                -- end must be after start
);
```

### Relationship types

```
1-to-1:   users ←→ students        (one user = one student profile)
1-to-many: batches ←→ students     (one batch has many students)
many-to-many: students ←→ courses  (via a junction table)
```

Many-to-many example:

```sql
-- Junction/bridge table
CREATE TABLE student_courses (
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (student_id, course_id)  -- composite primary key
);
```

---

## 6. Querying — Filters, Sorting, Pagination

### WHERE — Filtering

```sql
-- Equals
SELECT * FROM users WHERE role = 'student';

-- Not equals
SELECT * FROM users WHERE role != 'admin';

-- Multiple conditions
SELECT * FROM users WHERE role = 'student' AND is_active = true;

-- OR
SELECT * FROM users WHERE role = 'admin' OR role = 'teacher';

-- IN (shorthand for multiple OR)
SELECT * FROM users WHERE role IN ('admin', 'teacher', 'batch_manager');

-- LIKE (pattern matching)
SELECT * FROM users WHERE email LIKE '%@gmail.com';    -- ends with
SELECT * FROM users WHERE first_name LIKE 'J%';        -- starts with J
SELECT * FROM users WHERE first_name ILIKE 'john';     -- case-insensitive

-- NULL checks
SELECT * FROM users WHERE phone IS NULL;
SELECT * FROM users WHERE phone IS NOT NULL;

-- Date ranges
SELECT * FROM users WHERE created_at >= '2025-01-01'
                      AND created_at < '2025-02-01';

-- Between
SELECT * FROM users WHERE created_at BETWEEN '2025-01-01' AND '2025-01-31';
```

### ORDER BY — Sorting

```sql
-- Sort by name A-Z
SELECT * FROM users ORDER BY first_name ASC;

-- Sort by newest first
SELECT * FROM users ORDER BY created_at DESC;

-- Multiple sort columns
SELECT * FROM users ORDER BY role ASC, created_at DESC;

-- NULLs at the end
SELECT * FROM users ORDER BY phone NULLS LAST;
```

### LIMIT & OFFSET — Pagination

```sql
-- First 10 results
SELECT * FROM users LIMIT 10;

-- Page 2 (skip first 10, get next 10)
SELECT * FROM users LIMIT 10 OFFSET 10;

-- Page 3
SELECT * FROM users LIMIT 10 OFFSET 20;

-- General formula: OFFSET = (page - 1) * limit
```

This is exactly what Supabase's `.range(0, 9)` does — it maps to `LIMIT 10 OFFSET 0`.

### COUNT — Counting results

```sql
-- Total users
SELECT COUNT(*) FROM users;

-- Active students
SELECT COUNT(*) FROM users WHERE role = 'student' AND is_active = true;

-- Count with the data (Supabase uses this)
SELECT *, COUNT(*) OVER() as total_count
FROM users
WHERE role = 'student'
LIMIT 10 OFFSET 0;
```

---

## 7. JOINs — Combining Tables

JOINs are the most important concept in relational databases. They let you combine data from multiple tables.

### Setup for examples

```sql
-- users: {id, email, first_name, role}
-- students: {id, user_id, batch_id}
-- batches: {id, name, teacher_id}
```

### INNER JOIN — Only matching rows

```sql
-- Get students with their user info
SELECT s.id as student_id, u.email, u.first_name, u.role
FROM students s
INNER JOIN users u ON s.user_id = u.id;
```

If a student has no matching user (shouldn't happen with foreign keys), that row is excluded.

### LEFT JOIN — All from left table, matching from right

```sql
-- Get all users, and their student profile if they have one
SELECT u.email, u.role, s.id as student_id, s.batch_id
FROM users u
LEFT JOIN students s ON s.user_id = u.id;
```

Users without a student profile will show NULL for student_id and batch_id.

### Multiple JOINs

```sql
-- Get students with user info AND batch name AND teacher name
SELECT
  u.first_name || ' ' || u.last_name as student_name,
  u.email,
  b.name as batch_name,
  t_user.first_name as teacher_name
FROM students s
JOIN users u ON s.user_id = u.id
JOIN batches b ON s.batch_id = b.id
JOIN teachers t ON b.teacher_id = t.id
JOIN users t_user ON t.user_id = t_user.id
WHERE s.status = 'active';
```

### Visual representation

```
INNER JOIN:     Only where both tables have matching data
                A ∩ B

LEFT JOIN:      Everything from left table + matches from right
                A + (A ∩ B)

RIGHT JOIN:     Everything from right table + matches from left
                (A ∩ B) + B

FULL OUTER JOIN: Everything from both tables
                A + B
```

### Real example from BeEducated

When the teacher dashboard shows "My Students", the query conceptually does:

```sql
SELECT
  u.first_name,
  u.last_name,
  u.email,
  b.name as batch_name,
  bs.enrolled_at,
  bs.status
FROM batch_students bs
JOIN students s ON bs.student_id = s.id
JOIN users u ON s.user_id = u.id
JOIN batches b ON bs.batch_id = b.id
WHERE b.teacher_id = 'current-teacher-id'
ORDER BY u.first_name;
```

---

## 8. Aggregations & GROUP BY

Aggregations summarize data. GROUP BY groups rows before summarizing.

### Aggregate functions

```sql
-- Count students per role
SELECT role, COUNT(*) as count
FROM users
GROUP BY role;

-- Result:
-- role     | count
-- student  | 150
-- teacher  | 12
-- admin    | 3

-- Average score per exam
SELECT exam_id, AVG(percentage) as avg_score, MAX(percentage) as top_score
FROM exam_attempts
GROUP BY exam_id;

-- Total payment amount per month
SELECT
  DATE_TRUNC('month', created_at) as month,
  SUM(amount) as total_revenue,
  COUNT(*) as payment_count
FROM payments
WHERE status = 'completed'
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month;
```

### HAVING — Filter after grouping

```sql
-- Batches with more than 20 students
SELECT batch_id, COUNT(*) as student_count
FROM batch_students
GROUP BY batch_id
HAVING COUNT(*) > 20;
```

WHERE filters before grouping. HAVING filters after.

### Common aggregate functions

| Function | Does | Example |
|----------|------|---------|
| `COUNT(*)` | Count rows | `COUNT(*) → 42` |
| `COUNT(column)` | Count non-NULL values | `COUNT(phone) → 30` |
| `SUM(column)` | Add up values | `SUM(amount) → 50000` |
| `AVG(column)` | Average | `AVG(percentage) → 72.5` |
| `MIN(column)` | Minimum value | `MIN(score) → 12` |
| `MAX(column)` | Maximum value | `MAX(score) → 98` |
| `ARRAY_AGG(column)` | Collect into array | `ARRAY_AGG(name) → {A,B,C}` |
| `STRING_AGG(col, sep)` | Join strings | `STRING_AGG(name, ', ') → 'A, B, C'` |

---

## 9. Subqueries

A query inside another query. Used when you need the result of one query to feed into another.

### In WHERE clause

```sql
-- Students who have never taken an exam
SELECT * FROM students
WHERE id NOT IN (
  SELECT DISTINCT student_id FROM exam_attempts
);

-- Users whose students are in active batches
SELECT * FROM users
WHERE id IN (
  SELECT s.user_id FROM students s
  JOIN batch_students bs ON bs.student_id = s.id
  JOIN batches b ON bs.batch_id = b.id
  WHERE b.is_active = true
);
```

### In FROM clause (derived table)

```sql
-- Average students per batch
SELECT AVG(student_count) as avg_students_per_batch
FROM (
  SELECT batch_id, COUNT(*) as student_count
  FROM batch_students
  GROUP BY batch_id
) as batch_counts;
```

### EXISTS — Check if subquery returns any rows

```sql
-- Teachers who have at least one batch
SELECT * FROM teachers t
WHERE EXISTS (
  SELECT 1 FROM batches b WHERE b.teacher_id = t.id
);
```

---

## 10. CTEs (Common Table Expressions)

CTEs make complex queries readable by breaking them into named steps. Think of them as "temporary named queries".

```sql
-- WITHOUT CTE (hard to read)
SELECT * FROM (
  SELECT student_id, COUNT(*) as exam_count, AVG(percentage) as avg_score
  FROM exam_attempts
  WHERE status = 'graded'
  GROUP BY student_id
) scores
JOIN students s ON s.id = scores.student_id
JOIN users u ON u.id = s.user_id
WHERE scores.avg_score > 80;

-- WITH CTE (clear and readable)
WITH student_scores AS (
  SELECT
    student_id,
    COUNT(*) as exam_count,
    AVG(percentage) as avg_score
  FROM exam_attempts
  WHERE status = 'graded'
  GROUP BY student_id
)
SELECT
  u.first_name,
  u.email,
  ss.exam_count,
  ROUND(ss.avg_score, 1) as avg_score
FROM student_scores ss
JOIN students s ON s.id = ss.student_id
JOIN users u ON u.id = s.user_id
WHERE ss.avg_score > 80
ORDER BY ss.avg_score DESC;
```

### Multiple CTEs

```sql
WITH
  active_batches AS (
    SELECT * FROM batches WHERE is_active = true
  ),
  batch_student_counts AS (
    SELECT batch_id, COUNT(*) as student_count
    FROM batch_students
    WHERE status = 'active'
    GROUP BY batch_id
  ),
  batch_exam_stats AS (
    SELECT
      b.id as batch_id,
      AVG(ea.percentage) as avg_score
    FROM active_batches b
    JOIN exam_attempts ea ON ea.batch_id = b.id
    WHERE ea.status = 'graded'
    GROUP BY b.id
  )
SELECT
  ab.name as batch_name,
  COALESCE(bsc.student_count, 0) as students,
  ROUND(COALESCE(bes.avg_score, 0), 1) as avg_score
FROM active_batches ab
LEFT JOIN batch_student_counts bsc ON bsc.batch_id = ab.id
LEFT JOIN batch_exam_stats bes ON bes.batch_id = ab.id
ORDER BY ab.name;
```

---

## 11. Window Functions

Window functions perform calculations across rows related to the current row, without collapsing them into groups (unlike GROUP BY).

### ROW_NUMBER — Rank rows

```sql
-- Rank students by score within each batch
SELECT
  u.first_name,
  b.name as batch_name,
  ea.percentage,
  ROW_NUMBER() OVER (PARTITION BY b.id ORDER BY ea.percentage DESC) as rank
FROM exam_attempts ea
JOIN students s ON ea.student_id = s.id
JOIN users u ON s.user_id = u.id
JOIN batches b ON ea.batch_id = b.id;

-- Result:
-- first_name | batch_name | percentage | rank
-- Alice      | Batch A    | 95         | 1
-- Bob        | Batch A    | 87         | 2
-- Charlie    | Batch A    | 72         | 3
-- Dave       | Batch B    | 91         | 1
-- Eve        | Batch B    | 85         | 2
```

### LAG / LEAD — Access previous/next row

```sql
-- Compare each month's revenue with previous month
SELECT
  DATE_TRUNC('month', created_at) as month,
  SUM(amount) as revenue,
  LAG(SUM(amount)) OVER (ORDER BY DATE_TRUNC('month', created_at)) as prev_month_revenue
FROM payments
WHERE status = 'completed'
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month;
```

### Running totals

```sql
-- Cumulative student enrollments over time
SELECT
  DATE(created_at) as date,
  COUNT(*) as daily_enrollments,
  SUM(COUNT(*)) OVER (ORDER BY DATE(created_at)) as total_enrollments
FROM students
GROUP BY DATE(created_at)
ORDER BY date;
```

### Common window functions

| Function | Does |
|----------|------|
| `ROW_NUMBER()` | Sequential number (1, 2, 3...) |
| `RANK()` | Rank with gaps (1, 2, 2, 4) |
| `DENSE_RANK()` | Rank without gaps (1, 2, 2, 3) |
| `LAG(col, n)` | Value from n rows before |
| `LEAD(col, n)` | Value from n rows after |
| `SUM() OVER()` | Running sum |
| `AVG() OVER()` | Running average |
| `FIRST_VALUE()` | First value in window |
| `LAST_VALUE()` | Last value in window |

---

## 12. Indexes — Making Queries Fast

Without an index, PostgreSQL scans every row (slow). With an index, it jumps directly to the right rows (fast).

### When to add an index

```sql
-- Add index on columns you frequently search/filter by
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_clerk_id ON users(clerk_id);
CREATE INDEX idx_students_user_id ON students(user_id);
CREATE INDEX idx_batch_students_batch_id ON batch_students(batch_id);
CREATE INDEX idx_exam_attempts_student_id ON exam_attempts(student_id);
```

### UNIQUE index (already created by UNIQUE constraint)

```sql
-- This automatically creates a unique index
CREATE TABLE users (
  email TEXT UNIQUE  -- index created automatically
);

-- Equivalent to:
CREATE UNIQUE INDEX idx_users_email ON users(email);
```

### Composite index (multiple columns)

```sql
-- For queries that filter by BOTH batch_id AND status
CREATE INDEX idx_batch_students_batch_status
ON batch_students(batch_id, status);

-- This helps: WHERE batch_id = 'x' AND status = 'active'
-- This also helps: WHERE batch_id = 'x' (leftmost column)
-- This does NOT help: WHERE status = 'active' (not leftmost)
```

### Partial index (only index some rows)

```sql
-- Only index active users (smaller, faster index)
CREATE INDEX idx_active_users ON users(email) WHERE is_active = true;
```

### When NOT to index

- Small tables (< 1000 rows) — scanning is fast enough
- Columns that change very frequently — indexes slow down writes
- Columns with very low cardinality (e.g., boolean with only true/false)

---

## 13. Functions & Stored Procedures

Functions run SQL logic on the database server. Your project uses these.

### Basic function

```sql
-- Function to generate a batch code
CREATE OR REPLACE FUNCTION generate_batch_code(prefix TEXT)
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  counter INTEGER;
BEGIN
  -- Get the next number
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(code FROM LENGTH(prefix) + 2) AS INTEGER)
  ), 0) + 1
  INTO counter
  FROM batches
  WHERE code LIKE prefix || '-%';

  -- Format: PREFIX-001, PREFIX-002, etc.
  new_code := prefix || '-' || LPAD(counter::TEXT, 3, '0');

  RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Call it
SELECT generate_batch_code('BATCH');  -- Returns 'BATCH-001'
```

### Function with table access

```sql
-- Increment batch student count atomically
CREATE OR REPLACE FUNCTION increment_batch_students(batch_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE batches
  SET current_students = current_students + 1
  WHERE id = batch_id;
END;
$$ LANGUAGE plpgsql;

-- Call from Supabase JS:
-- await supabase.rpc('increment_batch_students', { batch_id: 'some-id' });
```

### Function that returns a table

```sql
-- Get dashboard stats
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS TABLE (
  total_students BIGINT,
  total_teachers BIGINT,
  total_batches BIGINT,
  active_batches BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM students WHERE status = 'active'),
    (SELECT COUNT(*) FROM teachers WHERE is_active = true),
    (SELECT COUNT(*) FROM batches),
    (SELECT COUNT(*) FROM batches WHERE is_active = true);
END;
$$ LANGUAGE plpgsql;
```

### Function to generate invoice numbers

```sql
-- Auto-incrementing invoice number: INV-2025-0001
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
  current_year TEXT;
  next_number INTEGER;
  invoice_number TEXT;
BEGIN
  current_year := TO_CHAR(NOW(), 'YYYY');

  SELECT COALESCE(MAX(
    CAST(SPLIT_PART(invoice_no, '-', 3) AS INTEGER)
  ), 0) + 1
  INTO next_number
  FROM invoices
  WHERE invoice_no LIKE 'INV-' || current_year || '-%';

  invoice_number := 'INV-' || current_year || '-' || LPAD(next_number::TEXT, 4, '0');

  RETURN invoice_number;
END;
$$ LANGUAGE plpgsql;
```

---

## 14. Triggers

Triggers automatically run a function when something happens to a table (INSERT, UPDATE, DELETE).

### Auto-update `updated_at` timestamp

```sql
-- The function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to users table
CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Apply to ANY table that has updated_at
CREATE TRIGGER students_updated_at
  BEFORE UPDATE ON students
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
```

Now whenever you `UPDATE users SET first_name = 'John' WHERE id = 'x'`, the `updated_at` column is automatically set to the current time.

### Audit trail trigger

```sql
-- Log every change to the users table
CREATE TABLE user_audit_log (
  id SERIAL PRIMARY KEY,
  user_id UUID,
  action TEXT,  -- 'INSERT', 'UPDATE', 'DELETE'
  old_data JSONB,
  new_data JSONB,
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION log_user_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO user_audit_log (user_id, action, new_data)
    VALUES (NEW.id, 'INSERT', to_jsonb(NEW));
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO user_audit_log (user_id, action, old_data, new_data)
    VALUES (NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW));
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO user_audit_log (user_id, action, old_data)
    VALUES (OLD.id, 'DELETE', to_jsonb(OLD));
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_changes
  AFTER INSERT OR UPDATE OR DELETE ON users
  FOR EACH ROW
  EXECUTE FUNCTION log_user_changes();
```

---

## 15. Views & Materialized Views

### Views — Saved queries

A view is a saved query that acts like a virtual table.

```sql
-- Create a view for active students with their info
CREATE VIEW active_students_view AS
SELECT
  s.id as student_id,
  u.first_name,
  u.last_name,
  u.email,
  b.name as batch_name,
  s.enrolled_at
FROM students s
JOIN users u ON s.user_id = u.id
LEFT JOIN batch_students bs ON bs.student_id = s.id AND bs.status = 'active'
LEFT JOIN batches b ON bs.batch_id = b.id
WHERE s.status = 'active';

-- Use it like a table
SELECT * FROM active_students_view WHERE batch_name = 'Batch A';
```

### Materialized Views — Cached query results

For expensive queries that don't need real-time data:

```sql
-- Dashboard statistics (refreshed periodically)
CREATE MATERIALIZED VIEW dashboard_stats AS
SELECT
  (SELECT COUNT(*) FROM users WHERE role = 'student') as total_students,
  (SELECT COUNT(*) FROM users WHERE role = 'teacher') as total_teachers,
  (SELECT COUNT(*) FROM batches WHERE is_active = true) as active_batches,
  (SELECT SUM(amount) FROM payments WHERE status = 'completed') as total_revenue;

-- Query it (instant, reads from cache)
SELECT * FROM dashboard_stats;

-- Refresh when data changes
REFRESH MATERIALIZED VIEW dashboard_stats;
```

---

## 16. Transactions

Transactions ensure multiple operations either ALL succeed or ALL fail. No partial updates.

```sql
-- Transfer a student from one batch to another
BEGIN;

  -- Remove from old batch
  UPDATE batch_students SET status = 'transferred'
  WHERE student_id = 'student-123' AND batch_id = 'old-batch';

  -- Add to new batch
  INSERT INTO batch_students (student_id, batch_id, status)
  VALUES ('student-123', 'new-batch', 'active');

  -- Update batch counts
  UPDATE batches SET current_students = current_students - 1
  WHERE id = 'old-batch';

  UPDATE batches SET current_students = current_students + 1
  WHERE id = 'new-batch';

COMMIT;  -- All 4 operations succeed together

-- If anything fails, use:
ROLLBACK;  -- Undo everything
```

Without transactions, if the server crashes between step 2 and 3, the student would be in BOTH batches with wrong counts.

---

## 17. Row Level Security (RLS)

RLS controls which rows each user can see/modify. Supabase uses this extensively.

```sql
-- Enable RLS on a table
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Students can only see their own data
CREATE POLICY students_own_data ON students
  FOR SELECT
  USING (user_id = auth.uid());

-- Teachers can see students in their batches
CREATE POLICY teachers_see_batch_students ON students
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM batch_students bs
      JOIN batches b ON bs.batch_id = b.id
      WHERE bs.student_id = students.id
        AND b.teacher_id = (
          SELECT id FROM teachers WHERE user_id = auth.uid()
        )
    )
  );

-- Admins can see everything
CREATE POLICY admins_see_all ON students
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

Note: Your BeEducated project uses `SERVICE_ROLE_KEY` which **bypasses RLS entirely**. The access control is done in your Express middleware instead (`requireAuth`, `requireAdmin`, etc.).

---

## 18. JSON in PostgreSQL

PostgreSQL has excellent JSON support. Your project stores metadata, attachments, and schedule data as JSONB.

```sql
-- JSONB column
CREATE TABLE batches (
  id UUID PRIMARY KEY,
  name TEXT,
  schedule JSONB DEFAULT '{}'
  -- schedule: {"Monday": ["10:00-12:00"], "Wednesday": ["14:00-16:00"]}
);

-- Query JSON fields
SELECT * FROM batches WHERE schedule->>'Monday' IS NOT NULL;

-- Get a nested value
SELECT schedule->'Monday'->0 as first_monday_slot FROM batches;

-- Filter by JSON content
SELECT * FROM batches
WHERE schedule @> '{"Monday": ["10:00-12:00"]}';

-- Update a JSON field
UPDATE batches
SET schedule = schedule || '{"Friday": ["09:00-11:00"]}'
WHERE id = 'batch-123';

-- JSON aggregation (build JSON from query results)
SELECT json_agg(json_build_object(
  'id', u.id,
  'name', u.first_name || ' ' || u.last_name,
  'email', u.email
)) as students
FROM users u
WHERE u.role = 'student';
```

### JSONB operators cheat sheet

| Operator | Does | Example |
|----------|------|---------|
| `->` | Get JSON element (as JSON) | `data->'name'` → `"John"` |
| `->>` | Get JSON element (as text) | `data->>'name'` → `John` |
| `@>` | Contains | `data @> '{"role":"admin"}'` |
| `?` | Key exists | `data ? 'phone'` |
| `\|\|` | Merge/concat | `data \|\| '{"new":"field"}'` |
| `-` | Remove key | `data - 'old_field'` |

---

## 19. Performance — EXPLAIN ANALYZE

When a query is slow, use `EXPLAIN ANALYZE` to see what PostgreSQL is actually doing.

```sql
EXPLAIN ANALYZE
SELECT u.first_name, u.email, b.name
FROM students s
JOIN users u ON s.user_id = u.id
JOIN batch_students bs ON bs.student_id = s.id
JOIN batches b ON bs.batch_id = b.id
WHERE b.is_active = true;
```

Output tells you:
- **Seq Scan** — scanning every row (slow for large tables, needs an index)
- **Index Scan** — using an index (fast)
- **Nested Loop** — joining strategy
- **actual time** — real execution time in milliseconds
- **rows** — how many rows at each step

### Common performance fixes

```sql
-- Problem: Seq Scan on large table
-- Fix: Add an index
CREATE INDEX idx_batch_students_batch_id ON batch_students(batch_id);

-- Problem: Query returns too many columns
-- Fix: Select only what you need
SELECT id, first_name, email FROM users;  -- Instead of SELECT *

-- Problem: N+1 queries (one query per student)
-- Fix: Use a single JOIN query instead of looping

-- Problem: Counting is slow
-- Fix: Use approximate count for display
SELECT reltuples::BIGINT as approximate_count
FROM pg_class
WHERE relname = 'users';
```

---

## 20. What BeEducated Actually Uses

Here's a mapping of PostgreSQL features to where they appear in your project:

### Tables (created in Supabase SQL Editor)
```
users, students, teachers, parents
batches, batch_students
courses/subjects, topics
course_types, academic_classes, fee_plans
enrollments, student_class_access
exams, exam_questions, exam_attempts, exam_responses
announcements, announcement_reads
content, student_content_progress
fees, fee_payments, invoices
payments
contact_messages
daily_stats
```

### Functions called via .rpc()
```sql
generate_batch_code(prefix)       -- Auto-generate batch codes
generate_course_code(prefix)      -- Auto-generate course codes
generate_payment_number()         -- Auto-generate payment IDs
generate_invoice_number()         -- Auto-generate invoice numbers
increment_batch_students(id)      -- Atomic counter increment
decrement_batch_students(id)      -- Atomic counter decrement
update_daily_stats(...)           -- Dashboard statistics update
```

### Triggers (running automatically)
```
updated_at triggers on all tables  -- Auto-update timestamps
```

### Supabase JS → SQL mapping

```typescript
// This Supabase code:
supabase.from('users').select('*').eq('role', 'student').order('created_at', {ascending: false}).range(0, 9)

// Translates to this SQL:
SELECT * FROM users WHERE role = 'student' ORDER BY created_at DESC LIMIT 10 OFFSET 0;
```

```typescript
// This:
supabase.from('users').select('*, students(*)').eq('id', userId).single()

// Translates to:
SELECT u.*, s.* FROM users u LEFT JOIN students s ON s.user_id = u.id WHERE u.id = 'userId' LIMIT 1;
```

```typescript
// This:
supabase.from('batch_students').select('*, student:students(*, user:users(*))', { count: 'exact' }).eq('batch_id', batchId)

// Translates to:
SELECT bs.*, s.*, u.*, COUNT(*) OVER() as total
FROM batch_students bs
JOIN students s ON bs.student_id = s.id
JOIN users u ON s.user_id = u.id
WHERE bs.batch_id = 'batchId';
```

---

## 21. Common Errors & How to Fix Them

### Error: duplicate key value violates unique constraint
```sql
-- You're trying to insert a row with a value that already exists in a UNIQUE column
-- Fix: Use ON CONFLICT to handle duplicates
INSERT INTO users (email, first_name)
VALUES ('john@example.com', 'John')
ON CONFLICT (email)
DO UPDATE SET first_name = EXCLUDED.first_name;
-- This is called "UPSERT" (insert or update)
```

### Error: null value in column violates not-null constraint
```sql
-- A required column is missing
-- Fix: Provide the value, or add a default
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'user';
```

### Error: insert or update violates foreign key constraint
```sql
-- You're referencing a row that doesn't exist
-- e.g., setting batch_id to a batch that was deleted
-- Fix: Check that the referenced row exists first
SELECT EXISTS(SELECT 1 FROM batches WHERE id = 'batch-123');
```

### Error: relation "table_name" does not exist
```sql
-- Table doesn't exist or wrong schema
-- Fix: Check the schema
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
```

### Error: permission denied for table
```sql
-- RLS is blocking access
-- Fix: Check RLS policies or use service_role key
ALTER TABLE users DISABLE ROW LEVEL SECURITY;  -- for testing only
```

### Error: deadlock detected
```sql
-- Two transactions are waiting for each other
-- Fix: Always lock tables/rows in the same order
-- Fix: Keep transactions short
-- Fix: Use SELECT ... FOR UPDATE SKIP LOCKED
```

---

## 22. Resources & Roadmap

### Learning Roadmap

```
Week 1-2: Foundations
├── SELECT, INSERT, UPDATE, DELETE
├── WHERE, ORDER BY, LIMIT
├── Data types & constraints
└── Practice: Write CRUD for a simple todo app

Week 3-4: Intermediate
├── JOINs (INNER, LEFT, RIGHT)
├── GROUP BY & aggregations
├── Subqueries
├── Indexes (when and why)
└── Practice: Query BeEducated's database

Week 5-6: Advanced
├── CTEs (WITH clauses)
├── Window functions
├── Functions & triggers
├── Transactions
└── Practice: Write stored procedures for BeEducated

Week 7-8: Production Skills
├── EXPLAIN ANALYZE & performance tuning
├── Index strategies
├── JSONB operations
├── RLS policies
├── Migrations & schema design
└── Practice: Optimize slow queries
```

### Free Resources (Best to Worst)

**Interactive (Learn by doing):**
1. **SQLBolt** — https://sqlbolt.com/ — Best starting point. Interactive exercises.
2. **PostgreSQL Exercises** — https://pgexercises.com/ — Real PostgreSQL exercises.
3. **Select Star SQL** — https://selectstarsql.com/ — Interactive book with a real dataset.

**Documentation:**
4. **PostgreSQL Official Docs** — https://www.postgresql.org/docs/current/ — The definitive reference. Use when you need exact syntax.
5. **Supabase Docs (SQL section)** — https://supabase.com/docs/guides/database — PostgreSQL concepts explained for Supabase users.

**Video:**
6. **Hussein Nasser (YouTube)** — Deep dives into database concepts, indexing, performance. Search "Hussein Nasser PostgreSQL".
7. **Fireship PostgreSQL in 100 Seconds** — Quick overview to understand the big picture.

**Books (when you're ready for depth):**
8. **"The Art of PostgreSQL"** by Dimitri Fontaine — Production-level PostgreSQL patterns.
9. **"PostgreSQL 14 Internals"** — How PostgreSQL works under the hood.

**Practice Platforms:**
10. **HackerRank SQL** — https://www.hackerrank.com/domains/sql
11. **LeetCode SQL** — https://leetcode.com/problemset/database/
12. **StrataScratch** — https://www.stratascratch.com/ — Real interview questions.

### Quick Reference

**The 20% of SQL that covers 80% of work:**

```sql
-- You'll use these every single day:
SELECT ... FROM ... WHERE ... ORDER BY ... LIMIT ...
INSERT INTO ... VALUES ... RETURNING *
UPDATE ... SET ... WHERE ... RETURNING *
DELETE FROM ... WHERE ...
JOIN ... ON ...
GROUP BY ... HAVING ...
COUNT(), SUM(), AVG(), MAX(), MIN()
CREATE INDEX ...

-- You'll use these weekly:
WITH ... AS (...)           -- CTEs
ROW_NUMBER() OVER (...)     -- Window functions
COALESCE(a, b)              -- First non-null value
CASE WHEN ... THEN ... END  -- Conditional logic
EXISTS (SELECT ...)         -- Check existence
ON CONFLICT DO UPDATE       -- Upsert

-- You'll use these monthly:
CREATE FUNCTION ...         -- Stored procedures
CREATE TRIGGER ...          -- Auto-actions
EXPLAIN ANALYZE ...         -- Performance debugging
CREATE MATERIALIZED VIEW    -- Cached queries
```

---

**Start with SQLBolt (resource #1), then come back to this guide as a reference. The best way to learn SQL is to write SQL — open your Supabase SQL Editor and start querying your own data.**
