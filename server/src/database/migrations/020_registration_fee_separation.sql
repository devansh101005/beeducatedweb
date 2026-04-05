-- =============================================
-- MIGRATION 020: REGISTRATION FEE SEPARATION
-- =============================================
-- Separates ₹499 registration fee as a standalone first payment.
-- Students must pay registration before they can pay tuition.
--
-- New enrollment flow:
--   1. Student initiates enrollment → pays registration_fee (₹499)
--   2. Registration verified → enrollment stays 'pending', registration_paid = true
--   3. Student initiates tuition payment → pays (total_amount - registration_fee)
--   4. Tuition verified → enrollment becomes 'active'
--
-- For plans with registration_fee = 0 (e.g., manual plans), skip step 1-2.
-- =============================================

-- =============================================
-- STEP 1: Add registration tracking to class_enrollments
-- =============================================

ALTER TABLE class_enrollments
  ADD COLUMN IF NOT EXISTS registration_paid BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS registration_paid_at TIMESTAMPTZ;

COMMENT ON COLUMN class_enrollments.registration_paid IS 'Whether ₹499 registration fee has been paid';
COMMENT ON COLUMN class_enrollments.registration_paid_at IS 'Timestamp when registration fee was paid';

-- =============================================
-- STEP 2: Add payment_purpose to enrollment_payments
-- =============================================
-- Tracks what each payment is for: registration, tuition, installment, etc.

ALTER TABLE enrollment_payments
  ADD COLUMN IF NOT EXISTS payment_purpose VARCHAR(30) DEFAULT 'full_payment';

COMMENT ON COLUMN enrollment_payments.payment_purpose IS 'Purpose: registration, tuition, installment_1, installment_2, full_payment';

-- =============================================
-- STEP 3: Backfill existing data
-- =============================================

-- All existing active enrollments have already paid registration
UPDATE class_enrollments
SET registration_paid = true,
    registration_paid_at = enrolled_at
WHERE status = 'active';

-- All existing paid enrollment_payments were full payments (registration + tuition bundled)
UPDATE enrollment_payments
SET payment_purpose = 'full_payment'
WHERE payment_purpose IS NULL OR payment_purpose = 'full_payment';
