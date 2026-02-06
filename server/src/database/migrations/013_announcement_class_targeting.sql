-- BeEducated: Add class targeting to announcements - PART 1
-- Run this FIRST in Supabase SQL Editor, then run Part 2
-- PostgreSQL requires new enum values to be committed before they can be used

-- =============================================
-- STEP 1: ADD 'class' TO announcement_target ENUM
-- =============================================

ALTER TYPE announcement_target ADD VALUE IF NOT EXISTS 'class';

-- =============================================
-- STEP 2: ADD target_class_id COLUMN (safe in same transaction)
-- =============================================

ALTER TABLE announcements
  ADD COLUMN IF NOT EXISTS target_class_id UUID REFERENCES academic_classes(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_announcements_class ON announcements(target_class_id);

COMMENT ON COLUMN announcements.target_class_id IS 'Academic class this announcement targets (Class 6, Class 7, etc.)';
