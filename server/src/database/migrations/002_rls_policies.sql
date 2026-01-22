-- BeEducated Row Level Security (RLS) Policies
-- Phase 1: Secure access to all tables based on user roles
-- Run this in Supabase SQL Editor AFTER 001_initial_schema.sql

-- =============================================
-- ENABLE RLS ON ALL TABLES
-- =============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- =============================================
-- HELPER FUNCTION: Get current user's role
-- =============================================

CREATE OR REPLACE FUNCTION get_user_role(user_clerk_id TEXT)
RETURNS user_role AS $$
DECLARE
  role user_role;
BEGIN
  SELECT u.role INTO role FROM users u WHERE u.clerk_id = user_clerk_id;
  RETURN role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- HELPER FUNCTION: Check if user is admin
-- =============================================

CREATE OR REPLACE FUNCTION is_admin(user_clerk_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN get_user_role(user_clerk_id) = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- USERS TABLE POLICIES
-- =============================================

-- Admins can do everything
CREATE POLICY "Admins can manage all users"
  ON users
  FOR ALL
  TO authenticated
  USING (is_admin(auth.jwt()->>'sub'))
  WITH CHECK (is_admin(auth.jwt()->>'sub'));

-- Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (clerk_id = auth.jwt()->>'sub');

-- Users can update their own profile (limited fields)
CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (clerk_id = auth.jwt()->>'sub')
  WITH CHECK (clerk_id = auth.jwt()->>'sub');

-- Service role can do everything (for webhooks)
CREATE POLICY "Service role full access to users"
  ON users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =============================================
-- STUDENTS TABLE POLICIES
-- =============================================

-- Admins and batch managers can see all students
CREATE POLICY "Admins can manage all students"
  ON students
  FOR ALL
  TO authenticated
  USING (is_admin(auth.jwt()->>'sub'))
  WITH CHECK (is_admin(auth.jwt()->>'sub'));

-- Students can view their own profile
CREATE POLICY "Students can view own profile"
  ON students
  FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT id FROM users WHERE clerk_id = auth.jwt()->>'sub')
  );

-- Students can update their own profile
CREATE POLICY "Students can update own profile"
  ON students
  FOR UPDATE
  TO authenticated
  USING (
    user_id = (SELECT id FROM users WHERE clerk_id = auth.jwt()->>'sub')
  )
  WITH CHECK (
    user_id = (SELECT id FROM users WHERE clerk_id = auth.jwt()->>'sub')
  );

-- Teachers can view students in their batches
CREATE POLICY "Teachers can view batch students"
  ON students
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM batch_students bs
      JOIN batch_teachers bt ON bs.batch_id = bt.batch_id
      JOIN teachers t ON bt.teacher_id = t.id
      JOIN users u ON t.user_id = u.id
      WHERE bs.student_id = students.id
      AND u.clerk_id = auth.jwt()->>'sub'
    )
  );

-- Parents can view their linked students
CREATE POLICY "Parents can view their students"
  ON students
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM parent_students ps
      JOIN parents p ON ps.parent_id = p.id
      JOIN users u ON p.user_id = u.id
      WHERE ps.student_id = students.id
      AND u.clerk_id = auth.jwt()->>'sub'
    )
  );

-- Service role full access
CREATE POLICY "Service role full access to students"
  ON students
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =============================================
-- PARENTS TABLE POLICIES
-- =============================================

-- Admins can manage all parents
CREATE POLICY "Admins can manage all parents"
  ON parents
  FOR ALL
  TO authenticated
  USING (is_admin(auth.jwt()->>'sub'))
  WITH CHECK (is_admin(auth.jwt()->>'sub'));

-- Parents can view and update their own profile
CREATE POLICY "Parents can manage own profile"
  ON parents
  FOR ALL
  TO authenticated
  USING (
    user_id = (SELECT id FROM users WHERE clerk_id = auth.jwt()->>'sub')
  )
  WITH CHECK (
    user_id = (SELECT id FROM users WHERE clerk_id = auth.jwt()->>'sub')
  );

-- Service role full access
CREATE POLICY "Service role full access to parents"
  ON parents
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =============================================
-- TEACHERS TABLE POLICIES
-- =============================================

-- Admins can manage all teachers
CREATE POLICY "Admins can manage all teachers"
  ON teachers
  FOR ALL
  TO authenticated
  USING (is_admin(auth.jwt()->>'sub'))
  WITH CHECK (is_admin(auth.jwt()->>'sub'));

-- Teachers can view and update their own profile
CREATE POLICY "Teachers can manage own profile"
  ON teachers
  FOR ALL
  TO authenticated
  USING (
    user_id = (SELECT id FROM users WHERE clerk_id = auth.jwt()->>'sub')
  )
  WITH CHECK (
    user_id = (SELECT id FROM users WHERE clerk_id = auth.jwt()->>'sub')
  );

-- Students can view teachers (for faculty page)
CREATE POLICY "Students can view teachers"
  ON teachers
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Public can view active teachers (for faculty page)
CREATE POLICY "Public can view active teachers"
  ON teachers
  FOR SELECT
  TO anon
  USING (is_active = true);

-- Service role full access
CREATE POLICY "Service role full access to teachers"
  ON teachers
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =============================================
-- BATCHES TABLE POLICIES
-- =============================================

-- Admins can manage all batches
CREATE POLICY "Admins can manage all batches"
  ON batches
  FOR ALL
  TO authenticated
  USING (is_admin(auth.jwt()->>'sub'))
  WITH CHECK (is_admin(auth.jwt()->>'sub'));

-- Batch managers can manage their batches
CREATE POLICY "Batch managers can manage their batches"
  ON batches
  FOR ALL
  TO authenticated
  USING (
    manager_id = (SELECT id FROM users WHERE clerk_id = auth.jwt()->>'sub')
  )
  WITH CHECK (
    manager_id = (SELECT id FROM users WHERE clerk_id = auth.jwt()->>'sub')
  );

-- Teachers can view batches they're assigned to
CREATE POLICY "Teachers can view their batches"
  ON batches
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM batch_teachers bt
      JOIN teachers t ON bt.teacher_id = t.id
      JOIN users u ON t.user_id = u.id
      WHERE bt.batch_id = batches.id
      AND u.clerk_id = auth.jwt()->>'sub'
    )
  );

-- Students can view batches they're enrolled in
CREATE POLICY "Students can view their batches"
  ON batches
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM batch_students bs
      JOIN students s ON bs.student_id = s.id
      JOIN users u ON s.user_id = u.id
      WHERE bs.batch_id = batches.id
      AND u.clerk_id = auth.jwt()->>'sub'
    )
  );

-- Service role full access
CREATE POLICY "Service role full access to batches"
  ON batches
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =============================================
-- BATCH_STUDENTS TABLE POLICIES
-- =============================================

-- Admins can manage all enrollments
CREATE POLICY "Admins can manage batch students"
  ON batch_students
  FOR ALL
  TO authenticated
  USING (is_admin(auth.jwt()->>'sub'))
  WITH CHECK (is_admin(auth.jwt()->>'sub'));

-- Teachers can view students in their batches
CREATE POLICY "Teachers can view batch students"
  ON batch_students
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM batch_teachers bt
      JOIN teachers t ON bt.teacher_id = t.id
      JOIN users u ON t.user_id = u.id
      WHERE bt.batch_id = batch_students.batch_id
      AND u.clerk_id = auth.jwt()->>'sub'
    )
  );

-- Students can view their own enrollments
CREATE POLICY "Students can view own enrollments"
  ON batch_students
  FOR SELECT
  TO authenticated
  USING (
    student_id IN (
      SELECT s.id FROM students s
      JOIN users u ON s.user_id = u.id
      WHERE u.clerk_id = auth.jwt()->>'sub'
    )
  );

-- Service role full access
CREATE POLICY "Service role full access to batch_students"
  ON batch_students
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =============================================
-- BATCH_TEACHERS TABLE POLICIES
-- =============================================

-- Admins can manage all teacher assignments
CREATE POLICY "Admins can manage batch teachers"
  ON batch_teachers
  FOR ALL
  TO authenticated
  USING (is_admin(auth.jwt()->>'sub'))
  WITH CHECK (is_admin(auth.jwt()->>'sub'));

-- Teachers can view their assignments
CREATE POLICY "Teachers can view own assignments"
  ON batch_teachers
  FOR SELECT
  TO authenticated
  USING (
    teacher_id IN (
      SELECT t.id FROM teachers t
      JOIN users u ON t.user_id = u.id
      WHERE u.clerk_id = auth.jwt()->>'sub'
    )
  );

-- Service role full access
CREATE POLICY "Service role full access to batch_teachers"
  ON batch_teachers
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =============================================
-- PARENT_STUDENTS TABLE POLICIES
-- =============================================

-- Admins can manage all relationships
CREATE POLICY "Admins can manage parent students"
  ON parent_students
  FOR ALL
  TO authenticated
  USING (is_admin(auth.jwt()->>'sub'))
  WITH CHECK (is_admin(auth.jwt()->>'sub'));

-- Parents can view their relationships
CREATE POLICY "Parents can view their relationships"
  ON parent_students
  FOR SELECT
  TO authenticated
  USING (
    parent_id IN (
      SELECT p.id FROM parents p
      JOIN users u ON p.user_id = u.id
      WHERE u.clerk_id = auth.jwt()->>'sub'
    )
  );

-- Service role full access
CREATE POLICY "Service role full access to parent_students"
  ON parent_students
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =============================================
-- APPLICATIONS TABLE POLICIES
-- =============================================

-- Admins can manage all applications
CREATE POLICY "Admins can manage all applications"
  ON applications
  FOR ALL
  TO authenticated
  USING (is_admin(auth.jwt()->>'sub'))
  WITH CHECK (is_admin(auth.jwt()->>'sub'));

-- Anyone can create an application (for registration)
CREATE POLICY "Anyone can create applications"
  ON applications
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Applicants can view their own application by email
CREATE POLICY "Applicants can view own application"
  ON applications
  FOR SELECT
  TO authenticated
  USING (
    email = (SELECT u.email FROM users u WHERE u.clerk_id = auth.jwt()->>'sub')
  );

-- Service role full access
CREATE POLICY "Service role full access to applications"
  ON applications
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =============================================
-- GRANT PERMISSIONS
-- =============================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant select on all tables to authenticated users (RLS will filter)
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;

-- Grant insert, update, delete to authenticated (RLS will filter)
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

-- Grant insert on applications to anon (for public registration)
GRANT INSERT ON applications TO anon;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION get_user_role(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_student_id() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION generate_teacher_id() TO authenticated, service_role;
