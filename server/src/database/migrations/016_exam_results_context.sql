-- Migration 016: Add batch_type and class_grade context to exam_results
-- This allows filtering exam results by class type (coaching_offline, home_tuition, etc.)
-- and class grade (10th, 11th, 12th, etc.)

ALTER TABLE exam_results ADD COLUMN IF NOT EXISTS batch_type TEXT;
ALTER TABLE exam_results ADD COLUMN IF NOT EXISTS class_grade TEXT;

-- Index for filtering results by batch type and class grade
CREATE INDEX IF NOT EXISTS idx_exam_results_batch_type ON exam_results(batch_type);
CREATE INDEX IF NOT EXISTS idx_exam_results_class_grade ON exam_results(class_grade);
