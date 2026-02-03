-- BeEducated Content & Subjects Restructure
-- Phase 11: Add new subjects and update class-subject mappings
-- Run this in Supabase SQL Editor AFTER previous migrations

-- =============================================
-- ADD NEW SUBJECTS
-- =============================================

-- Insert new subjects if they don't exist
INSERT INTO subjects (code, name, description, icon, color, display_order, is_active) VALUES
  ('ENG', 'English', 'English language, grammar, and literature', 'book-open', '#EC4899', 5, true),
  ('SCI', 'Science', 'Combined Science for middle school (Physics, Chemistry, Biology)', 'beaker', '#06B6D4', 6, true),
  ('SST', 'Social Science', 'History, Geography, Civics, and Economics combined', 'globe', '#8B5CF6', 7, true),
  ('GK', 'General Knowledge', 'General awareness, current affairs, and general knowledge', 'brain', '#F97316', 8, true),
  ('MM', 'Mental Maths', 'Mental mathematics, Vedic maths, and quick calculations', 'calculator', '#14B8A6', 9, true),
  ('HIST', 'History', 'World history and Indian history', 'landmark', '#A855F7', 10, true),
  ('GEO', 'Geography', 'Physical and human geography', 'map', '#22C55E', 11, true),
  ('POL', 'Political Science', 'Political science and civics', 'building', '#3B82F6', 12, true),
  ('ECO', 'Economics', 'Microeconomics and macroeconomics', 'trending-up', '#EAB308', 13, true)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  color = EXCLUDED.color,
  is_active = true;

-- =============================================
-- UPDATE MATERIAL_TYPE ENUM
-- =============================================

-- First, drop views that depend on material_type column
DROP VIEW IF EXISTS content_with_hierarchy;

-- Drop functions that depend on material_type
DROP FUNCTION IF EXISTS get_student_class_content(UUID, UUID, UUID, material_type);

-- We need to recreate the enum with new values
-- First, alter the content table to use text temporarily
ALTER TABLE content ALTER COLUMN material_type TYPE TEXT USING material_type::TEXT;

-- Drop the old type
DROP TYPE IF EXISTS material_type;

-- Create the new enum with updated values
CREATE TYPE material_type AS ENUM (
  'lecture',      -- Video lectures
  'notes',        -- Written notes/study materials
  'dpp',          -- Daily Practice Problems (general)
  'dpp_pdf',      -- DPP in PDF format
  'dpp_video',    -- DPP solutions in video format
  'quiz'          -- Interactive quizzes
);

-- Convert content back to enum
ALTER TABLE content ALTER COLUMN material_type TYPE material_type USING
  CASE
    WHEN material_type = 'dpp_solution' THEN 'dpp_video'::material_type
    WHEN material_type = 'ncert' THEN 'notes'::material_type
    WHEN material_type = 'pyq' THEN 'dpp_pdf'::material_type
    WHEN material_type IS NOT NULL THEN material_type::material_type
    ELSE NULL
  END;

-- Recreate the content_with_hierarchy view
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

-- =============================================
-- CLEAR EXISTING CLASS-SUBJECT MAPPINGS
-- =============================================

-- Remove existing mappings (we'll recreate them properly)
DELETE FROM class_subjects;

-- =============================================
-- HELPER FUNCTIONS FOR INSERTION
-- =============================================

-- Get class ID by slug (more reliable than name matching)
CREATE OR REPLACE FUNCTION get_class_id_by_slug(p_class_slug VARCHAR)
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

CREATE OR REPLACE FUNCTION get_subject_id_by_code(p_subject_code VARCHAR)
RETURNS UUID AS $$
BEGIN
  RETURN (SELECT id FROM subjects WHERE code = p_subject_code LIMIT 1);
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- CLASS 6, 7, 8 SUBJECT MAPPINGS
-- Subjects: Mathematics, English, Science, Social Science, General Knowledge, Mental Maths
-- =============================================

-- Class 6 subjects
INSERT INTO class_subjects (class_id, subject_id, display_order)
SELECT get_class_id_by_slug('class-6'), get_subject_id_by_code('MATH'), 1
WHERE get_class_id_by_slug('class-6') IS NOT NULL AND get_subject_id_by_code('MATH') IS NOT NULL;

INSERT INTO class_subjects (class_id, subject_id, display_order)
SELECT get_class_id_by_slug('class-6'), get_subject_id_by_code('ENG'), 2
WHERE get_class_id_by_slug('class-6') IS NOT NULL AND get_subject_id_by_code('ENG') IS NOT NULL;

INSERT INTO class_subjects (class_id, subject_id, display_order)
SELECT get_class_id_by_slug('class-6'), get_subject_id_by_code('SCI'), 3
WHERE get_class_id_by_slug('class-6') IS NOT NULL AND get_subject_id_by_code('SCI') IS NOT NULL;

INSERT INTO class_subjects (class_id, subject_id, display_order)
SELECT get_class_id_by_slug('class-6'), get_subject_id_by_code('SST'), 4
WHERE get_class_id_by_slug('class-6') IS NOT NULL AND get_subject_id_by_code('SST') IS NOT NULL;

INSERT INTO class_subjects (class_id, subject_id, display_order)
SELECT get_class_id_by_slug('class-6'), get_subject_id_by_code('GK'), 5
WHERE get_class_id_by_slug('class-6') IS NOT NULL AND get_subject_id_by_code('GK') IS NOT NULL;

INSERT INTO class_subjects (class_id, subject_id, display_order)
SELECT get_class_id_by_slug('class-6'), get_subject_id_by_code('MM'), 6
WHERE get_class_id_by_slug('class-6') IS NOT NULL AND get_subject_id_by_code('MM') IS NOT NULL;

-- Class 7 subjects (same as Class 6)
INSERT INTO class_subjects (class_id, subject_id, display_order)
SELECT get_class_id_by_slug('class-7'), get_subject_id_by_code('MATH'), 1
WHERE get_class_id_by_slug('class-7') IS NOT NULL AND get_subject_id_by_code('MATH') IS NOT NULL;

INSERT INTO class_subjects (class_id, subject_id, display_order)
SELECT get_class_id_by_slug('class-7'), get_subject_id_by_code('ENG'), 2
WHERE get_class_id_by_slug('class-7') IS NOT NULL AND get_subject_id_by_code('ENG') IS NOT NULL;

INSERT INTO class_subjects (class_id, subject_id, display_order)
SELECT get_class_id_by_slug('class-7'), get_subject_id_by_code('SCI'), 3
WHERE get_class_id_by_slug('class-7') IS NOT NULL AND get_subject_id_by_code('SCI') IS NOT NULL;

INSERT INTO class_subjects (class_id, subject_id, display_order)
SELECT get_class_id_by_slug('class-7'), get_subject_id_by_code('SST'), 4
WHERE get_class_id_by_slug('class-7') IS NOT NULL AND get_subject_id_by_code('SST') IS NOT NULL;

INSERT INTO class_subjects (class_id, subject_id, display_order)
SELECT get_class_id_by_slug('class-7'), get_subject_id_by_code('GK'), 5
WHERE get_class_id_by_slug('class-7') IS NOT NULL AND get_subject_id_by_code('GK') IS NOT NULL;

INSERT INTO class_subjects (class_id, subject_id, display_order)
SELECT get_class_id_by_slug('class-7'), get_subject_id_by_code('MM'), 6
WHERE get_class_id_by_slug('class-7') IS NOT NULL AND get_subject_id_by_code('MM') IS NOT NULL;

-- Class 8 subjects (same as Class 6 & 7)
INSERT INTO class_subjects (class_id, subject_id, display_order)
SELECT get_class_id_by_slug('class-8'), get_subject_id_by_code('MATH'), 1
WHERE get_class_id_by_slug('class-8') IS NOT NULL AND get_subject_id_by_code('MATH') IS NOT NULL;

INSERT INTO class_subjects (class_id, subject_id, display_order)
SELECT get_class_id_by_slug('class-8'), get_subject_id_by_code('ENG'), 2
WHERE get_class_id_by_slug('class-8') IS NOT NULL AND get_subject_id_by_code('ENG') IS NOT NULL;

INSERT INTO class_subjects (class_id, subject_id, display_order)
SELECT get_class_id_by_slug('class-8'), get_subject_id_by_code('SCI'), 3
WHERE get_class_id_by_slug('class-8') IS NOT NULL AND get_subject_id_by_code('SCI') IS NOT NULL;

INSERT INTO class_subjects (class_id, subject_id, display_order)
SELECT get_class_id_by_slug('class-8'), get_subject_id_by_code('SST'), 4
WHERE get_class_id_by_slug('class-8') IS NOT NULL AND get_subject_id_by_code('SST') IS NOT NULL;

INSERT INTO class_subjects (class_id, subject_id, display_order)
SELECT get_class_id_by_slug('class-8'), get_subject_id_by_code('GK'), 5
WHERE get_class_id_by_slug('class-8') IS NOT NULL AND get_subject_id_by_code('GK') IS NOT NULL;

INSERT INTO class_subjects (class_id, subject_id, display_order)
SELECT get_class_id_by_slug('class-8'), get_subject_id_by_code('MM'), 6
WHERE get_class_id_by_slug('class-8') IS NOT NULL AND get_subject_id_by_code('MM') IS NOT NULL;

-- =============================================
-- CLASS 9, 10 SUBJECT MAPPINGS
-- Subjects: Mathematics, Physics, Chemistry, Biology, English, History, Geography,
--           Political Science, Economics, General Knowledge
-- =============================================

-- Class 9 subjects
INSERT INTO class_subjects (class_id, subject_id, display_order)
SELECT get_class_id_by_slug('class-9'), get_subject_id_by_code('MATH'), 1
WHERE get_class_id_by_slug('class-9') IS NOT NULL AND get_subject_id_by_code('MATH') IS NOT NULL;

INSERT INTO class_subjects (class_id, subject_id, display_order)
SELECT get_class_id_by_slug('class-9'), get_subject_id_by_code('PHY'), 2
WHERE get_class_id_by_slug('class-9') IS NOT NULL AND get_subject_id_by_code('PHY') IS NOT NULL;

INSERT INTO class_subjects (class_id, subject_id, display_order)
SELECT get_class_id_by_slug('class-9'), get_subject_id_by_code('CHEM'), 3
WHERE get_class_id_by_slug('class-9') IS NOT NULL AND get_subject_id_by_code('CHEM') IS NOT NULL;

INSERT INTO class_subjects (class_id, subject_id, display_order)
SELECT get_class_id_by_slug('class-9'), get_subject_id_by_code('BIO'), 4
WHERE get_class_id_by_slug('class-9') IS NOT NULL AND get_subject_id_by_code('BIO') IS NOT NULL;

INSERT INTO class_subjects (class_id, subject_id, display_order)
SELECT get_class_id_by_slug('class-9'), get_subject_id_by_code('ENG'), 5
WHERE get_class_id_by_slug('class-9') IS NOT NULL AND get_subject_id_by_code('ENG') IS NOT NULL;

INSERT INTO class_subjects (class_id, subject_id, display_order)
SELECT get_class_id_by_slug('class-9'), get_subject_id_by_code('HIST'), 6
WHERE get_class_id_by_slug('class-9') IS NOT NULL AND get_subject_id_by_code('HIST') IS NOT NULL;

INSERT INTO class_subjects (class_id, subject_id, display_order)
SELECT get_class_id_by_slug('class-9'), get_subject_id_by_code('GEO'), 7
WHERE get_class_id_by_slug('class-9') IS NOT NULL AND get_subject_id_by_code('GEO') IS NOT NULL;

INSERT INTO class_subjects (class_id, subject_id, display_order)
SELECT get_class_id_by_slug('class-9'), get_subject_id_by_code('POL'), 8
WHERE get_class_id_by_slug('class-9') IS NOT NULL AND get_subject_id_by_code('POL') IS NOT NULL;

INSERT INTO class_subjects (class_id, subject_id, display_order)
SELECT get_class_id_by_slug('class-9'), get_subject_id_by_code('ECO'), 9
WHERE get_class_id_by_slug('class-9') IS NOT NULL AND get_subject_id_by_code('ECO') IS NOT NULL;

INSERT INTO class_subjects (class_id, subject_id, display_order)
SELECT get_class_id_by_slug('class-9'), get_subject_id_by_code('GK'), 10
WHERE get_class_id_by_slug('class-9') IS NOT NULL AND get_subject_id_by_code('GK') IS NOT NULL;

-- Class 10 subjects (same as Class 9)
INSERT INTO class_subjects (class_id, subject_id, display_order)
SELECT get_class_id_by_slug('class-10'), get_subject_id_by_code('MATH'), 1
WHERE get_class_id_by_slug('class-10') IS NOT NULL AND get_subject_id_by_code('MATH') IS NOT NULL;

INSERT INTO class_subjects (class_id, subject_id, display_order)
SELECT get_class_id_by_slug('class-10'), get_subject_id_by_code('PHY'), 2
WHERE get_class_id_by_slug('class-10') IS NOT NULL AND get_subject_id_by_code('PHY') IS NOT NULL;

INSERT INTO class_subjects (class_id, subject_id, display_order)
SELECT get_class_id_by_slug('class-10'), get_subject_id_by_code('CHEM'), 3
WHERE get_class_id_by_slug('class-10') IS NOT NULL AND get_subject_id_by_code('CHEM') IS NOT NULL;

INSERT INTO class_subjects (class_id, subject_id, display_order)
SELECT get_class_id_by_slug('class-10'), get_subject_id_by_code('BIO'), 4
WHERE get_class_id_by_slug('class-10') IS NOT NULL AND get_subject_id_by_code('BIO') IS NOT NULL;

INSERT INTO class_subjects (class_id, subject_id, display_order)
SELECT get_class_id_by_slug('class-10'), get_subject_id_by_code('ENG'), 5
WHERE get_class_id_by_slug('class-10') IS NOT NULL AND get_subject_id_by_code('ENG') IS NOT NULL;

INSERT INTO class_subjects (class_id, subject_id, display_order)
SELECT get_class_id_by_slug('class-10'), get_subject_id_by_code('HIST'), 6
WHERE get_class_id_by_slug('class-10') IS NOT NULL AND get_subject_id_by_code('HIST') IS NOT NULL;

INSERT INTO class_subjects (class_id, subject_id, display_order)
SELECT get_class_id_by_slug('class-10'), get_subject_id_by_code('GEO'), 7
WHERE get_class_id_by_slug('class-10') IS NOT NULL AND get_subject_id_by_code('GEO') IS NOT NULL;

INSERT INTO class_subjects (class_id, subject_id, display_order)
SELECT get_class_id_by_slug('class-10'), get_subject_id_by_code('POL'), 8
WHERE get_class_id_by_slug('class-10') IS NOT NULL AND get_subject_id_by_code('POL') IS NOT NULL;

INSERT INTO class_subjects (class_id, subject_id, display_order)
SELECT get_class_id_by_slug('class-10'), get_subject_id_by_code('ECO'), 9
WHERE get_class_id_by_slug('class-10') IS NOT NULL AND get_subject_id_by_code('ECO') IS NOT NULL;

INSERT INTO class_subjects (class_id, subject_id, display_order)
SELECT get_class_id_by_slug('class-10'), get_subject_id_by_code('GK'), 10
WHERE get_class_id_by_slug('class-10') IS NOT NULL AND get_subject_id_by_code('GK') IS NOT NULL;

-- =============================================
-- CLASS 11, 12 SUBJECT MAPPINGS
-- Subjects: Physics, Chemistry, Mathematics, Biology, English, General Knowledge
-- =============================================

-- Class 11 subjects
INSERT INTO class_subjects (class_id, subject_id, display_order)
SELECT get_class_id_by_slug('class-11'), get_subject_id_by_code('PHY'), 1
WHERE get_class_id_by_slug('class-11') IS NOT NULL AND get_subject_id_by_code('PHY') IS NOT NULL;

INSERT INTO class_subjects (class_id, subject_id, display_order)
SELECT get_class_id_by_slug('class-11'), get_subject_id_by_code('CHEM'), 2
WHERE get_class_id_by_slug('class-11') IS NOT NULL AND get_subject_id_by_code('CHEM') IS NOT NULL;

INSERT INTO class_subjects (class_id, subject_id, display_order)
SELECT get_class_id_by_slug('class-11'), get_subject_id_by_code('MATH'), 3
WHERE get_class_id_by_slug('class-11') IS NOT NULL AND get_subject_id_by_code('MATH') IS NOT NULL;

INSERT INTO class_subjects (class_id, subject_id, display_order)
SELECT get_class_id_by_slug('class-11'), get_subject_id_by_code('BIO'), 4
WHERE get_class_id_by_slug('class-11') IS NOT NULL AND get_subject_id_by_code('BIO') IS NOT NULL;

INSERT INTO class_subjects (class_id, subject_id, display_order)
SELECT get_class_id_by_slug('class-11'), get_subject_id_by_code('ENG'), 5
WHERE get_class_id_by_slug('class-11') IS NOT NULL AND get_subject_id_by_code('ENG') IS NOT NULL;

INSERT INTO class_subjects (class_id, subject_id, display_order)
SELECT get_class_id_by_slug('class-11'), get_subject_id_by_code('GK'), 6
WHERE get_class_id_by_slug('class-11') IS NOT NULL AND get_subject_id_by_code('GK') IS NOT NULL;

-- Class 12 subjects (same as Class 11)
INSERT INTO class_subjects (class_id, subject_id, display_order)
SELECT get_class_id_by_slug('class-12'), get_subject_id_by_code('PHY'), 1
WHERE get_class_id_by_slug('class-12') IS NOT NULL AND get_subject_id_by_code('PHY') IS NOT NULL;

INSERT INTO class_subjects (class_id, subject_id, display_order)
SELECT get_class_id_by_slug('class-12'), get_subject_id_by_code('CHEM'), 2
WHERE get_class_id_by_slug('class-12') IS NOT NULL AND get_subject_id_by_code('CHEM') IS NOT NULL;

INSERT INTO class_subjects (class_id, subject_id, display_order)
SELECT get_class_id_by_slug('class-12'), get_subject_id_by_code('MATH'), 3
WHERE get_class_id_by_slug('class-12') IS NOT NULL AND get_subject_id_by_code('MATH') IS NOT NULL;

INSERT INTO class_subjects (class_id, subject_id, display_order)
SELECT get_class_id_by_slug('class-12'), get_subject_id_by_code('BIO'), 4
WHERE get_class_id_by_slug('class-12') IS NOT NULL AND get_subject_id_by_code('BIO') IS NOT NULL;

INSERT INTO class_subjects (class_id, subject_id, display_order)
SELECT get_class_id_by_slug('class-12'), get_subject_id_by_code('ENG'), 5
WHERE get_class_id_by_slug('class-12') IS NOT NULL AND get_subject_id_by_code('ENG') IS NOT NULL;

INSERT INTO class_subjects (class_id, subject_id, display_order)
SELECT get_class_id_by_slug('class-12'), get_subject_id_by_code('GK'), 6
WHERE get_class_id_by_slug('class-12') IS NOT NULL AND get_subject_id_by_code('GK') IS NOT NULL;

-- =============================================
-- CLEANUP HELPER FUNCTIONS
-- =============================================

DROP FUNCTION IF EXISTS get_class_id_by_slug(VARCHAR);
DROP FUNCTION IF EXISTS get_subject_id_by_code(VARCHAR);

-- =============================================
-- UPDATE STORED FUNCTION FOR NEW MATERIAL TYPES
-- =============================================

-- Drop and recreate the get_student_class_content function with updated material_type
DROP FUNCTION IF EXISTS get_student_class_content(UUID, UUID, UUID, material_type);

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

COMMENT ON TYPE material_type IS 'Types of study materials: lecture, notes, dpp, dpp_pdf, dpp_video, quiz';
