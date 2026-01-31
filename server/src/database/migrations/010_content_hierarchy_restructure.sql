-- BeEducated Content Hierarchy Restructure
-- Phase 10: Link content with course_types → academic_classes → subjects → material_type
-- Run this in Supabase SQL Editor AFTER previous migrations

-- =============================================
-- MATERIAL TYPE ENUM
-- =============================================

CREATE TYPE material_type AS ENUM (
  'lecture',        -- Video lectures
  'notes',          -- Written notes/study materials
  'dpp',            -- Daily Practice Problems
  'dpp_solution',   -- DPP Solutions
  'ncert',          -- NCERT content/solutions
  'pyq'             -- Previous Year Questions
);

-- =============================================
-- CLASS SUBJECTS TABLE (Junction table)
-- =============================================
-- Defines which subjects are taught in which class

CREATE TABLE class_subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relations
  class_id UUID NOT NULL REFERENCES academic_classes(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,

  -- Display order within the class
  display_order INTEGER DEFAULT 0,

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- One subject per class
  UNIQUE(class_id, subject_id)
);

CREATE INDEX idx_class_subjects_class ON class_subjects(class_id);
CREATE INDEX idx_class_subjects_subject ON class_subjects(subject_id);
CREATE INDEX idx_class_subjects_active ON class_subjects(is_active);

-- =============================================
-- ALTER CONTENT TABLE - Add new columns
-- =============================================

-- Add class_id column (FK to academic_classes)
ALTER TABLE content ADD COLUMN class_id UUID REFERENCES academic_classes(id) ON DELETE SET NULL;

-- Add subject_id column (FK to subjects)
ALTER TABLE content ADD COLUMN subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL;

-- Add material_type column
ALTER TABLE content ADD COLUMN material_type material_type;

-- Create indexes for the new columns
CREATE INDEX idx_content_class ON content(class_id);
CREATE INDEX idx_content_subject ON content(subject_id);
CREATE INDEX idx_content_material_type ON content(material_type);

-- Composite index for common queries
CREATE INDEX idx_content_class_subject_type ON content(class_id, subject_id, material_type);

-- =============================================
-- UPDATE TRIGGERS
-- =============================================

CREATE TRIGGER update_class_subjects_updated_at
BEFORE UPDATE ON class_subjects
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- ROW LEVEL SECURITY FOR CLASS_SUBJECTS
-- =============================================

ALTER TABLE class_subjects ENABLE ROW LEVEL SECURITY;

-- Anyone can view active class-subject mappings
CREATE POLICY "Anyone can view class subjects" ON class_subjects
  FOR SELECT USING (is_active = true);

-- Admins can manage class subjects
CREATE POLICY "Admins can manage class subjects" ON class_subjects
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.clerk_id = auth.uid()::text
      AND users.role = 'admin'
    )
  );

-- Service role bypass
CREATE POLICY "Service role full access class_subjects" ON class_subjects
  FOR ALL USING (auth.role() = 'service_role');

-- =============================================
-- UPDATE CONTENT RLS POLICIES
-- =============================================

-- Students enrolled in a class can view content for that class
CREATE POLICY "Enrolled students can view class content" ON content
  FOR SELECT USING (
    is_published = true AND class_id IS NOT NULL AND (
      EXISTS (
        SELECT 1 FROM class_enrollments ce
        JOIN students s ON s.id = ce.student_id
        JOIN users u ON u.id = s.user_id
        WHERE u.clerk_id = auth.uid()::text
        AND ce.class_id = content.class_id
        AND ce.status = 'active'
      )
    )
  );

-- =============================================
-- SEED DATA: CLASS-SUBJECT MAPPINGS
-- =============================================

-- Helper function to get class_id by slug
CREATE OR REPLACE FUNCTION get_class_id(p_class_slug VARCHAR)
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT ac.id
    FROM academic_classes ac
    JOIN course_types ct ON ac.course_type_id = ct.id
    WHERE ac.slug = p_class_slug
    AND ct.slug = 'coaching_offline'
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql;

-- Helper function to get subject_id by code
CREATE OR REPLACE FUNCTION get_subject_id(p_subject_code VARCHAR)
RETURNS UUID AS $$
BEGIN
  RETURN (SELECT id FROM subjects WHERE code = p_subject_code LIMIT 1);
END;
$$ LANGUAGE plpgsql;

-- Class 6: Math, Science (combined Physics, Chemistry, Biology)
-- For middle school, we'll use all 4 subjects but Science is combined
INSERT INTO class_subjects (class_id, subject_id, display_order) VALUES
  (get_class_id('class-6'), get_subject_id('MATH'), 1),
  (get_class_id('class-6'), get_subject_id('PHY'), 2),  -- Science includes Physics
  (get_class_id('class-6'), get_subject_id('CHEM'), 3), -- Science includes Chemistry
  (get_class_id('class-6'), get_subject_id('BIO'), 4);  -- Science includes Biology

-- Class 7: Math, Science (Physics, Chemistry, Biology)
INSERT INTO class_subjects (class_id, subject_id, display_order) VALUES
  (get_class_id('class-7'), get_subject_id('MATH'), 1),
  (get_class_id('class-7'), get_subject_id('PHY'), 2),
  (get_class_id('class-7'), get_subject_id('CHEM'), 3),
  (get_class_id('class-7'), get_subject_id('BIO'), 4);

-- Class 8: Math, Science (Physics, Chemistry, Biology)
INSERT INTO class_subjects (class_id, subject_id, display_order) VALUES
  (get_class_id('class-8'), get_subject_id('MATH'), 1),
  (get_class_id('class-8'), get_subject_id('PHY'), 2),
  (get_class_id('class-8'), get_subject_id('CHEM'), 3),
  (get_class_id('class-8'), get_subject_id('BIO'), 4);

-- Class 9: Math, Physics, Chemistry, Biology (separate subjects now)
INSERT INTO class_subjects (class_id, subject_id, display_order) VALUES
  (get_class_id('class-9'), get_subject_id('MATH'), 1),
  (get_class_id('class-9'), get_subject_id('PHY'), 2),
  (get_class_id('class-9'), get_subject_id('CHEM'), 3),
  (get_class_id('class-9'), get_subject_id('BIO'), 4);

-- Class 10: Math, Physics, Chemistry, Biology
INSERT INTO class_subjects (class_id, subject_id, display_order) VALUES
  (get_class_id('class-10'), get_subject_id('MATH'), 1),
  (get_class_id('class-10'), get_subject_id('PHY'), 2),
  (get_class_id('class-10'), get_subject_id('CHEM'), 3),
  (get_class_id('class-10'), get_subject_id('BIO'), 4);

-- Class 11: Math, Physics, Chemistry, Biology (JEE/NEET preparation)
INSERT INTO class_subjects (class_id, subject_id, display_order) VALUES
  (get_class_id('class-11'), get_subject_id('MATH'), 1),
  (get_class_id('class-11'), get_subject_id('PHY'), 2),
  (get_class_id('class-11'), get_subject_id('CHEM'), 3),
  (get_class_id('class-11'), get_subject_id('BIO'), 4);

-- Class 12: Math, Physics, Chemistry, Biology (JEE/NEET preparation)
INSERT INTO class_subjects (class_id, subject_id, display_order) VALUES
  (get_class_id('class-12'), get_subject_id('MATH'), 1),
  (get_class_id('class-12'), get_subject_id('PHY'), 2),
  (get_class_id('class-12'), get_subject_id('CHEM'), 3),
  (get_class_id('class-12'), get_subject_id('BIO'), 4);

-- Drop helper functions (optional, you can keep them if useful)
DROP FUNCTION IF EXISTS get_class_id(VARCHAR);
DROP FUNCTION IF EXISTS get_subject_id(VARCHAR);

-- =============================================
-- VIEWS
-- =============================================

-- Content with full hierarchy view
CREATE OR REPLACE VIEW content_with_hierarchy AS
SELECT
  c.id,
  c.title,
  c.description,
  c.content_type,
  c.material_type,
  c.file_path,
  c.file_name,
  c.file_size,
  c.mime_type,
  c.duration_seconds,
  c.thumbnail_path,
  c.sequence_order,
  c.is_free,
  c.is_downloadable,
  c.is_published,
  c.published_at,
  c.tags,
  c.created_at,
  c.updated_at,
  -- Class info
  c.class_id,
  ac.name AS class_name,
  ac.slug AS class_slug,
  -- Course type info
  ct.id AS course_type_id,
  ct.name AS course_type_name,
  ct.slug AS course_type_slug,
  -- Subject info
  c.subject_id,
  s.name AS subject_name,
  s.code AS subject_code,
  s.color AS subject_color,
  -- Legacy course info (for backward compatibility)
  c.course_id,
  co.name AS course_name
FROM content c
LEFT JOIN academic_classes ac ON c.class_id = ac.id
LEFT JOIN course_types ct ON ac.course_type_id = ct.id
LEFT JOIN subjects s ON c.subject_id = s.id
LEFT JOIN courses co ON c.course_id = co.id;

-- Class subjects with details view
CREATE OR REPLACE VIEW class_subjects_details AS
SELECT
  cs.id,
  cs.class_id,
  cs.subject_id,
  cs.display_order,
  cs.is_active,
  -- Class info
  ac.name AS class_name,
  ac.slug AS class_slug,
  -- Course type info
  ct.id AS course_type_id,
  ct.name AS course_type_name,
  ct.slug AS course_type_slug,
  -- Subject info
  s.name AS subject_name,
  s.code AS subject_code,
  s.description AS subject_description,
  s.icon AS subject_icon,
  s.color AS subject_color
FROM class_subjects cs
JOIN academic_classes ac ON cs.class_id = ac.id
JOIN course_types ct ON ac.course_type_id = ct.id
JOIN subjects s ON cs.subject_id = s.id
WHERE cs.is_active = true
ORDER BY ct.display_order, ac.display_order, cs.display_order;

-- =============================================
-- HELPER FUNCTION: Get content for enrolled student
-- =============================================

CREATE OR REPLACE FUNCTION get_student_class_content(
  p_student_id UUID,
  p_class_id UUID DEFAULT NULL,
  p_subject_id UUID DEFAULT NULL,
  p_material_type material_type DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  title VARCHAR,
  description TEXT,
  content_type content_type,
  material_type material_type,
  file_path TEXT,
  duration_seconds INTEGER,
  thumbnail_path TEXT,
  subject_name VARCHAR,
  subject_code VARCHAR,
  class_name VARCHAR,
  is_completed BOOLEAN,
  progress_percent DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.title,
    c.description,
    c.content_type,
    c.material_type,
    c.file_path,
    c.duration_seconds,
    c.thumbnail_path,
    s.name AS subject_name,
    s.code AS subject_code,
    ac.name AS class_name,
    COALESCE(cp.completed, false) AS is_completed,
    COALESCE(cp.progress_percent, 0) AS progress_percent
  FROM content c
  JOIN academic_classes ac ON c.class_id = ac.id
  JOIN subjects s ON c.subject_id = s.id
  JOIN class_enrollments ce ON ce.class_id = ac.id
  LEFT JOIN content_progress cp ON cp.content_id = c.id AND cp.student_id = p_student_id
  WHERE ce.student_id = p_student_id
    AND ce.status = 'active'
    AND c.is_published = true
    AND (p_class_id IS NULL OR c.class_id = p_class_id)
    AND (p_subject_id IS NULL OR c.subject_id = p_subject_id)
    AND (p_material_type IS NULL OR c.material_type = p_material_type)
  ORDER BY c.sequence_order, c.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- COMMENTS
-- =============================================

COMMENT ON TYPE material_type IS 'Types of study materials: lecture, notes, dpp, dpp_solution, ncert, pyq';
COMMENT ON TABLE class_subjects IS 'Junction table mapping subjects to academic classes';
COMMENT ON COLUMN content.class_id IS 'Academic class this content belongs to';
COMMENT ON COLUMN content.subject_id IS 'Subject this content belongs to';
COMMENT ON COLUMN content.material_type IS 'Type of material: lecture, notes, dpp, etc.';
COMMENT ON VIEW content_with_hierarchy IS 'Content with full course_type → class → subject hierarchy';
COMMENT ON VIEW class_subjects_details IS 'Class-subject mappings with full details';
COMMENT ON FUNCTION get_student_class_content IS 'Get content accessible to an enrolled student';
