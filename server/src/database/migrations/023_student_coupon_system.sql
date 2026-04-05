-- =============================================
-- MIGRATION 023: STUDENT-SPECIFIC COUPON SYSTEM
-- =============================================
-- Changes:
--   1. Add assigned_student_id to discount_codes (NULL = public coupon, set = student-specific)
--   2. Add applicable_classes column for class-level targeting
--   3. Add index for student-specific lookups
-- =============================================

-- Add assigned_student_id: when set, only this student can use the coupon
ALTER TABLE discount_codes
ADD COLUMN IF NOT EXISTS assigned_student_id UUID REFERENCES students(id) ON DELETE SET NULL;

-- Add applicable_classes: restrict coupon to specific academic classes
ALTER TABLE discount_codes
ADD COLUMN IF NOT EXISTS applicable_classes UUID[];

-- Index for fast student-specific coupon lookups
CREATE INDEX IF NOT EXISTS idx_discount_codes_student ON discount_codes(assigned_student_id) WHERE assigned_student_id IS NOT NULL;
