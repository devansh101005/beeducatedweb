-- BeEducated Initial Database Schema
-- Phase 1: Core tables for users, students, parents, teachers, batches
-- Run this in Supabase SQL Editor

-- =============================================
-- ENUMS
-- =============================================

-- User roles enum
CREATE TYPE user_role AS ENUM (
  'admin',
  'student',
  'parent',
  'teacher',
  'batch_manager'
);

-- Student types enum
CREATE TYPE student_type AS ENUM (
  'coaching_online',
  'coaching_offline',
  'test_series',
  'home_tuition'
);

-- Subscription/Payment status
CREATE TYPE subscription_status AS ENUM (
  'active',
  'inactive',
  'pending',
  'expired',
  'cancelled'
);

-- Application status (for student/teacher applications)
CREATE TYPE application_status AS ENUM (
  'pending',
  'approved',
  'rejected'
);

-- =============================================
-- USERS TABLE (Core - synced from Clerk)
-- =============================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'student',
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  phone_verified BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX idx_users_clerk_id ON users(clerk_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- =============================================
-- STUDENTS TABLE
-- =============================================

CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  student_id VARCHAR(50) UNIQUE NOT NULL, -- Custom student ID like "BEE-2024-001"
  student_type student_type NOT NULL,

  -- Personal info
  date_of_birth DATE,
  gender VARCHAR(20),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(10),

  -- Academic info
  class_grade VARCHAR(20), -- "10th", "11th", "12th", "Dropper"
  school_name VARCHAR(255),
  board VARCHAR(50), -- "CBSE", "State", "ICSE"
  target_exam VARCHAR(100), -- "JEE Main", "JEE Advanced", "NEET", etc.
  target_year INTEGER,

  -- Parent/Guardian info (for quick access)
  parent_name VARCHAR(200),
  parent_phone VARCHAR(20),
  parent_email VARCHAR(255),

  -- Subscription
  subscription_status subscription_status DEFAULT 'pending',
  subscription_start_date DATE,
  subscription_end_date DATE,

  -- Status
  is_active BOOLEAN DEFAULT true,
  joined_at TIMESTAMPTZ DEFAULT NOW(),

  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_students_user_id ON students(user_id);
CREATE INDEX idx_students_student_id ON students(student_id);
CREATE INDEX idx_students_type ON students(student_type);
CREATE INDEX idx_students_active ON students(is_active);

-- =============================================
-- PARENTS TABLE
-- =============================================

CREATE TABLE parents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- Personal info
  occupation VARCHAR(100),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(10),

  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_parents_user_id ON parents(user_id);

-- =============================================
-- PARENT-STUDENT RELATIONSHIP
-- =============================================

CREATE TABLE parent_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES parents(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  relationship VARCHAR(50) DEFAULT 'parent', -- parent, guardian, etc.
  is_primary BOOLEAN DEFAULT false, -- Primary contact for the student
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(parent_id, student_id)
);

CREATE INDEX idx_parent_students_parent ON parent_students(parent_id);
CREATE INDEX idx_parent_students_student ON parent_students(student_id);

-- =============================================
-- TEACHERS TABLE
-- =============================================

CREATE TABLE teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  teacher_id VARCHAR(50) UNIQUE NOT NULL, -- Custom ID like "TCH-001"

  -- Professional info
  specialization VARCHAR(255), -- "Physics", "Chemistry", "Mathematics"
  subjects TEXT[], -- Array of subjects
  qualification VARCHAR(255),
  experience_years INTEGER,
  bio TEXT,

  -- Status
  is_active BOOLEAN DEFAULT true,
  joined_at TIMESTAMPTZ DEFAULT NOW(),

  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_teachers_user_id ON teachers(user_id);
CREATE INDEX idx_teachers_teacher_id ON teachers(teacher_id);
CREATE INDEX idx_teachers_active ON teachers(is_active);

-- =============================================
-- BATCHES TABLE
-- =============================================

CREATE TABLE batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_code VARCHAR(50) UNIQUE NOT NULL, -- "JEE-2024-A", "NEET-2025-B"
  name VARCHAR(255) NOT NULL,
  description TEXT,

  -- Batch type
  target_exam VARCHAR(100),
  target_year INTEGER,
  batch_type student_type,

  -- Schedule
  start_date DATE,
  end_date DATE,
  schedule JSONB, -- { "monday": ["10:00-12:00"], "wednesday": ["10:00-12:00"] }

  -- Capacity
  max_students INTEGER DEFAULT 50,
  current_students INTEGER DEFAULT 0,

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Manager
  manager_id UUID REFERENCES users(id),

  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_batches_code ON batches(batch_code);
CREATE INDEX idx_batches_active ON batches(is_active);
CREATE INDEX idx_batches_manager ON batches(manager_id);

-- =============================================
-- BATCH-STUDENT ENROLLMENT
-- =============================================

CREATE TABLE batch_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID REFERENCES batches(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'active', -- active, dropped, completed

  UNIQUE(batch_id, student_id)
);

CREATE INDEX idx_batch_students_batch ON batch_students(batch_id);
CREATE INDEX idx_batch_students_student ON batch_students(student_id);

-- =============================================
-- BATCH-TEACHER ASSIGNMENT
-- =============================================

CREATE TABLE batch_teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID REFERENCES batches(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
  subject VARCHAR(100),
  is_primary BOOLEAN DEFAULT false,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(batch_id, teacher_id, subject)
);

CREATE INDEX idx_batch_teachers_batch ON batch_teachers(batch_id);
CREATE INDEX idx_batch_teachers_teacher ON batch_teachers(teacher_id);

-- =============================================
-- APPLICATIONS TABLE (for student/teacher registrations)
-- =============================================

CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL, -- 'student', 'teacher'
  status application_status DEFAULT 'pending',

  -- Applicant info (before user account is created)
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  first_name VARCHAR(100),
  last_name VARCHAR(100),

  -- Application data (flexible JSON for different application types)
  application_data JSONB NOT NULL,

  -- Review
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,

  -- If approved, link to created user
  created_user_id UUID REFERENCES users(id),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_type ON applications(type);
CREATE INDEX idx_applications_email ON applications(email);

-- =============================================
-- UPDATED_AT TRIGGER FUNCTION
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_parents_updated_at BEFORE UPDATE ON parents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_teachers_updated_at BEFORE UPDATE ON teachers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_batches_updated_at BEFORE UPDATE ON batches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- HELPER FUNCTION: Generate Student ID
-- =============================================

CREATE OR REPLACE FUNCTION generate_student_id()
RETURNS VARCHAR AS $$
DECLARE
  new_id VARCHAR;
  year_part VARCHAR;
  seq_num INTEGER;
BEGIN
  year_part := EXTRACT(YEAR FROM NOW())::VARCHAR;

  SELECT COALESCE(MAX(CAST(SUBSTRING(student_id FROM 10) AS INTEGER)), 0) + 1
  INTO seq_num
  FROM students
  WHERE student_id LIKE 'BEE-' || year_part || '-%';

  new_id := 'BEE-' || year_part || '-' || LPAD(seq_num::VARCHAR, 4, '0');
  RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- HELPER FUNCTION: Generate Teacher ID
-- =============================================

CREATE OR REPLACE FUNCTION generate_teacher_id()
RETURNS VARCHAR AS $$
DECLARE
  new_id VARCHAR;
  seq_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(teacher_id FROM 5) AS INTEGER)), 0) + 1
  INTO seq_num
  FROM teachers;

  new_id := 'TCH-' || LPAD(seq_num::VARCHAR, 4, '0');
  RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================

COMMENT ON TABLE users IS 'Core user accounts synced from Clerk authentication';
COMMENT ON TABLE students IS 'Student profiles with academic and subscription info';
COMMENT ON TABLE parents IS 'Parent/guardian profiles';
COMMENT ON TABLE teachers IS 'Teacher profiles with qualifications';
COMMENT ON TABLE batches IS 'Class batches for different courses';
COMMENT ON TABLE applications IS 'Student and teacher registration applications';
COMMENT ON COLUMN students.student_type IS 'coaching_online, coaching_offline, test_series, home_tuition';
COMMENT ON COLUMN users.clerk_id IS 'Unique identifier from Clerk authentication service';
