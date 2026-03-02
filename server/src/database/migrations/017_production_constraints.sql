-- Migration 017: Add unique constraints to prevent duplicate records
-- Covers fixes #3, #7, #20, #22 from production audit

-- Prevent duplicate active enrollments (same student + class with pending/active status)
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_enrollment
  ON class_enrollments(student_id, class_id) WHERE status IN ('pending', 'active');

-- Prevent multiple simultaneous exam attempts (same student + exam in_progress)
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_attempt
  ON exam_attempts(student_id, exam_id) WHERE status = 'in_progress';

-- Prevent duplicate content progress tracking
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_content_progress
  ON content_progress(student_id, content_id);

-- Prevent duplicate exam responses per attempt (enables upsert)
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_exam_response
  ON exam_responses(attempt_id, question_id);
