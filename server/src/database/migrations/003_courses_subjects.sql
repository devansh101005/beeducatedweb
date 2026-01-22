-- BeEducated Course & Subject Schema
-- Phase 2: Courses, subjects, and batch-course relationships
-- Run this in Supabase SQL Editor AFTER migrations 001 and 002

-- =============================================
-- ENUMS
-- =============================================

-- Course level
CREATE TYPE course_level AS ENUM (
  'beginner',
  'intermediate',
  'advanced'
);

-- Course status
CREATE TYPE course_status AS ENUM (
  'draft',
  'published',
  'archived'
);

-- =============================================
-- SUBJECTS TABLE
-- =============================================

CREATE TABLE subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(20) UNIQUE NOT NULL, -- "PHY", "CHEM", "MATH", "BIO"
  name VARCHAR(100) NOT NULL,
  description TEXT,

  -- Target exams this subject applies to
  target_exams TEXT[], -- ["JEE Main", "JEE Advanced", "NEET"]

  -- Display
  icon VARCHAR(50), -- Icon name for UI
  color VARCHAR(20), -- Hex color for UI
  display_order INTEGER DEFAULT 0,

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subjects_code ON subjects(code);
CREATE INDEX idx_subjects_active ON subjects(is_active);

-- =============================================
-- COURSES TABLE
-- =============================================

CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL, -- "JEE-PHY-11", "NEET-BIO-12"
  name VARCHAR(255) NOT NULL,
  description TEXT,

  -- Course classification
  subject_id UUID REFERENCES subjects(id),
  target_exam VARCHAR(100), -- "JEE Main", "JEE Advanced", "NEET"
  class_grade VARCHAR(20), -- "11th", "12th", "Dropper"
  level course_level DEFAULT 'intermediate',

  -- Content info
  duration_weeks INTEGER,
  total_lectures INTEGER,
  total_hours DECIMAL(5,1),

  -- Pricing
  price DECIMAL(10,2),
  discount_price DECIMAL(10,2),

  -- Course type (maps to student_type)
  course_type student_type, -- coaching_online, coaching_offline, test_series, home_tuition

  -- Status
  status course_status DEFAULT 'draft',
  is_active BOOLEAN DEFAULT true,

  -- Instructor
  primary_teacher_id UUID REFERENCES teachers(id),

  -- Media
  thumbnail_url TEXT,
  preview_video_url TEXT,

  -- SEO/Display
  slug VARCHAR(255) UNIQUE,

  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_courses_code ON courses(code);
CREATE INDEX idx_courses_subject ON courses(subject_id);
CREATE INDEX idx_courses_target_exam ON courses(target_exam);
CREATE INDEX idx_courses_status ON courses(status);
CREATE INDEX idx_courses_active ON courses(is_active);
CREATE INDEX idx_courses_slug ON courses(slug);

-- =============================================
-- TOPICS TABLE (Course Chapters/Units)
-- =============================================

CREATE TABLE topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,

  name VARCHAR(255) NOT NULL,
  description TEXT,

  -- Ordering
  sequence_number INTEGER NOT NULL,

  -- Duration
  estimated_hours DECIMAL(4,1),

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_topics_course ON topics(course_id);
CREATE INDEX idx_topics_sequence ON topics(course_id, sequence_number);

-- =============================================
-- BATCH-COURSE RELATIONSHIP
-- =============================================

CREATE TABLE batch_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID REFERENCES batches(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,

  -- Schedule override for this batch
  start_date DATE,
  end_date DATE,

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(batch_id, course_id)
);

CREATE INDEX idx_batch_courses_batch ON batch_courses(batch_id);
CREATE INDEX idx_batch_courses_course ON batch_courses(course_id);

-- =============================================
-- STUDENT-COURSE ENROLLMENT (Direct enrollment without batch)
-- =============================================

CREATE TABLE student_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,

  -- Enrollment info
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,

  -- Progress
  progress_percent DECIMAL(5,2) DEFAULT 0,
  last_accessed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Status
  status VARCHAR(50) DEFAULT 'active', -- active, paused, completed, expired

  -- Payment reference (if purchased directly)
  payment_id VARCHAR(255),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(student_id, course_id)
);

CREATE INDEX idx_student_courses_student ON student_courses(student_id);
CREATE INDEX idx_student_courses_course ON student_courses(course_id);
CREATE INDEX idx_student_courses_status ON student_courses(status);

-- =============================================
-- HELPER FUNCTION: Generate Course Code
-- =============================================

CREATE OR REPLACE FUNCTION generate_course_code(
  p_target_exam VARCHAR,
  p_subject_code VARCHAR,
  p_class_grade VARCHAR
)
RETURNS VARCHAR AS $$
DECLARE
  exam_prefix VARCHAR;
  grade_suffix VARCHAR;
  seq_num INTEGER;
  new_code VARCHAR;
BEGIN
  -- Map exam to prefix
  exam_prefix := CASE
    WHEN p_target_exam ILIKE '%JEE%Advanced%' THEN 'JEEA'
    WHEN p_target_exam ILIKE '%JEE%' THEN 'JEE'
    WHEN p_target_exam ILIKE '%NEET%' THEN 'NEET'
    ELSE 'GEN'
  END;

  -- Map grade
  grade_suffix := CASE
    WHEN p_class_grade = '11th' THEN '11'
    WHEN p_class_grade = '12th' THEN '12'
    WHEN p_class_grade ILIKE '%drop%' THEN 'D'
    ELSE 'X'
  END;

  -- Get sequence for this combination
  SELECT COALESCE(COUNT(*), 0) + 1
  INTO seq_num
  FROM courses
  WHERE code LIKE exam_prefix || '-' || p_subject_code || '-' || grade_suffix || '%';

  -- Generate code
  IF seq_num = 1 THEN
    new_code := exam_prefix || '-' || p_subject_code || '-' || grade_suffix;
  ELSE
    new_code := exam_prefix || '-' || p_subject_code || '-' || grade_suffix || '-' || seq_num;
  END IF;

  RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- HELPER FUNCTION: Generate Batch Code
-- =============================================

CREATE OR REPLACE FUNCTION generate_batch_code(
  p_target_exam VARCHAR,
  p_target_year INTEGER
)
RETURNS VARCHAR AS $$
DECLARE
  exam_prefix VARCHAR;
  batch_letter CHAR;
  existing_count INTEGER;
BEGIN
  -- Map exam to prefix
  exam_prefix := CASE
    WHEN p_target_exam ILIKE '%JEE%Advanced%' THEN 'JEEA'
    WHEN p_target_exam ILIKE '%JEE%' THEN 'JEE'
    WHEN p_target_exam ILIKE '%NEET%' THEN 'NEET'
    ELSE 'GEN'
  END;

  -- Count existing batches for this exam/year
  SELECT COUNT(*)
  INTO existing_count
  FROM batches
  WHERE target_exam = p_target_exam AND target_year = p_target_year;

  -- Convert count to letter (A, B, C, ...)
  batch_letter := CHR(65 + existing_count); -- 65 is ASCII for 'A'

  RETURN exam_prefix || '-' || p_target_year || '-' || batch_letter;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- UPDATE TRIGGERS
-- =============================================

CREATE TRIGGER update_subjects_updated_at BEFORE UPDATE ON subjects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_topics_updated_at BEFORE UPDATE ON topics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_student_courses_updated_at BEFORE UPDATE ON student_courses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- SEED DEFAULT SUBJECTS
-- =============================================

INSERT INTO subjects (code, name, description, target_exams, icon, color, display_order) VALUES
  ('PHY', 'Physics', 'Mechanics, Thermodynamics, Electromagnetism, Optics, Modern Physics', ARRAY['JEE Main', 'JEE Advanced', 'NEET'], 'atom', '#3B82F6', 1),
  ('CHEM', 'Chemistry', 'Organic, Inorganic, and Physical Chemistry', ARRAY['JEE Main', 'JEE Advanced', 'NEET'], 'flask', '#10B981', 2),
  ('MATH', 'Mathematics', 'Algebra, Calculus, Coordinate Geometry, Trigonometry', ARRAY['JEE Main', 'JEE Advanced'], 'calculator', '#F59E0B', 3),
  ('BIO', 'Biology', 'Botany, Zoology, Human Physiology', ARRAY['NEET'], 'leaf', '#8B5CF6', 4);

-- =============================================
-- RLS POLICIES FOR NEW TABLES
-- =============================================

ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_courses ENABLE ROW LEVEL SECURITY;

-- Subjects: Public read, admin write
CREATE POLICY "Anyone can view active subjects" ON subjects
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage subjects" ON subjects
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.clerk_id = auth.uid()::text
      AND users.role = 'admin'
    )
  );

-- Courses: Public read for published, admin/teacher write
CREATE POLICY "Anyone can view published courses" ON courses
  FOR SELECT USING (status = 'published' AND is_active = true);

CREATE POLICY "Admins can manage all courses" ON courses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.clerk_id = auth.uid()::text
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Teachers can manage own courses" ON courses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN teachers t ON t.user_id = u.id
      WHERE u.clerk_id = auth.uid()::text
      AND courses.primary_teacher_id = t.id
    )
  );

-- Topics: Same as courses
CREATE POLICY "Anyone can view topics of published courses" ON topics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = topics.course_id
      AND courses.status = 'published'
      AND courses.is_active = true
    )
  );

CREATE POLICY "Admins can manage topics" ON topics
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.clerk_id = auth.uid()::text
      AND users.role = 'admin'
    )
  );

-- Batch Courses: Admin/Manager access
CREATE POLICY "Admins can manage batch courses" ON batch_courses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.clerk_id = auth.uid()::text
      AND users.role IN ('admin', 'batch_manager')
    )
  );

CREATE POLICY "Teachers can view their batch courses" ON batch_courses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN teachers t ON t.user_id = u.id
      JOIN batch_teachers bt ON bt.teacher_id = t.id
      WHERE u.clerk_id = auth.uid()::text
      AND bt.batch_id = batch_courses.batch_id
    )
  );

-- Student Courses: Students see own, admins see all
CREATE POLICY "Students can view own enrollments" ON student_courses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN students s ON s.user_id = u.id
      WHERE u.clerk_id = auth.uid()::text
      AND s.id = student_courses.student_id
    )
  );

CREATE POLICY "Admins can manage student courses" ON student_courses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.clerk_id = auth.uid()::text
      AND users.role = 'admin'
    )
  );

-- Service role bypass
CREATE POLICY "Service role full access subjects" ON subjects FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access courses" ON courses FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access topics" ON topics FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access batch_courses" ON batch_courses FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access student_courses" ON student_courses FOR ALL USING (auth.role() = 'service_role');

-- =============================================
-- COMMENTS
-- =============================================

COMMENT ON TABLE subjects IS 'Academic subjects like Physics, Chemistry, Math, Biology';
COMMENT ON TABLE courses IS 'Courses available for purchase or included in batches';
COMMENT ON TABLE topics IS 'Chapters/units within a course';
COMMENT ON TABLE batch_courses IS 'Courses included in a batch';
COMMENT ON TABLE student_courses IS 'Direct course enrollments (outside of batches)';
COMMENT ON FUNCTION generate_course_code IS 'Generates unique course codes like JEE-PHY-11';
COMMENT ON FUNCTION generate_batch_code IS 'Generates unique batch codes like JEE-2024-A';
