-- Migration 014: Add broad targeting fields to exams
-- Allows targeting exams by batch type (online/offline) and class grade (10th/11th/12th)

ALTER TABLE exams ADD COLUMN IF NOT EXISTS target_batch_type VARCHAR(50);
ALTER TABLE exams ADD COLUMN IF NOT EXISTS target_class VARCHAR(50);

-- Index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_exams_target_batch_type ON exams(target_batch_type) WHERE target_batch_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_exams_target_class ON exams(target_class) WHERE target_class IS NOT NULL;
