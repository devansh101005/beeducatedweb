-- BeEducated Manual Enrollment Support
-- Phase 9: Allow admin to manually enroll students with cash/offline payments
-- Run this in Supabase SQL Editor AFTER migration 008

-- =============================================
-- PAYMENT TYPE ENUM
-- =============================================
-- Support for different payment methods beyond Razorpay

CREATE TYPE payment_type AS ENUM (
  'razorpay',       -- Online payment via Razorpay
  'cash',           -- Cash payment at center
  'bank_transfer',  -- Direct bank transfer/NEFT/IMPS
  'cheque',         -- Cheque payment
  'upi_direct'      -- Direct UPI (not via Razorpay)
);

-- =============================================
-- ALTER ENROLLMENT_PAYMENTS TABLE
-- =============================================
-- Make Razorpay fields nullable and add manual payment fields

-- Add payment_type column
ALTER TABLE enrollment_payments
ADD COLUMN payment_type payment_type NOT NULL DEFAULT 'razorpay';

-- Make razorpay_order_id nullable (required only for razorpay payments)
ALTER TABLE enrollment_payments
ALTER COLUMN razorpay_order_id DROP NOT NULL;

-- Drop the unique constraint temporarily and recreate with condition
ALTER TABLE enrollment_payments
DROP CONSTRAINT IF EXISTS enrollment_payments_razorpay_order_id_key;

-- Create partial unique index (only for non-null razorpay_order_id)
CREATE UNIQUE INDEX idx_enrollment_payments_razorpay_order_unique
ON enrollment_payments(razorpay_order_id)
WHERE razorpay_order_id IS NOT NULL;

-- Add fields for manual/cash payments
ALTER TABLE enrollment_payments
ADD COLUMN receipt_number VARCHAR(100),
ADD COLUMN received_by UUID REFERENCES users(id),
ADD COLUMN received_at TIMESTAMPTZ,
ADD COLUMN payment_notes TEXT;

-- Index for receipt number lookup
CREATE INDEX idx_enrollment_payments_receipt ON enrollment_payments(receipt_number)
WHERE receipt_number IS NOT NULL;

-- Index for payment type
CREATE INDEX idx_enrollment_payments_type ON enrollment_payments(payment_type);

-- =============================================
-- GENERATE RECEIPT NUMBER FUNCTION
-- =============================================
-- Auto-generate receipt numbers for manual payments: CASH-2026-000001

CREATE OR REPLACE FUNCTION generate_payment_receipt_number(p_type payment_type)
RETURNS VARCHAR AS $$
DECLARE
  new_number VARCHAR;
  year_part VARCHAR;
  seq_num INTEGER;
  prefix VARCHAR;
BEGIN
  year_part := EXTRACT(YEAR FROM NOW())::VARCHAR;

  -- Set prefix based on payment type
  CASE p_type
    WHEN 'cash' THEN prefix := 'CASH';
    WHEN 'bank_transfer' THEN prefix := 'BANK';
    WHEN 'cheque' THEN prefix := 'CHQ';
    WHEN 'upi_direct' THEN prefix := 'UPI';
    ELSE prefix := 'RCP';
  END CASE;

  -- Find next sequence number for this type and year
  SELECT COALESCE(MAX(CAST(SUBSTRING(receipt_number FROM LENGTH(prefix) + 7) AS INTEGER)), 0) + 1
  INTO seq_num
  FROM enrollment_payments
  WHERE receipt_number LIKE prefix || '-' || year_part || '-%';

  new_number := prefix || '-' || year_part || '-' || LPAD(seq_num::VARCHAR, 6, '0');
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- UPDATE RLS POLICIES
-- =============================================
-- Allow admins to insert manual payments

-- Drop existing insert policy if exists
DROP POLICY IF EXISTS "Admins can insert payments" ON enrollment_payments;

-- Create policy for admin payment insertion
CREATE POLICY "Admins can insert payments" ON enrollment_payments
  FOR INSERT WITH CHECK (
    auth.jwt() ->> 'role' = 'admin'
    OR (
      -- Students can only insert for their own enrollments (via Razorpay flow)
      enrollment_id IN (
        SELECT id FROM class_enrollments
        WHERE student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
      )
      AND payment_type = 'razorpay'
    )
  );

-- =============================================
-- COMMENTS
-- =============================================

COMMENT ON COLUMN enrollment_payments.payment_type IS 'Type of payment: razorpay (online), cash, bank_transfer, cheque, upi_direct';
COMMENT ON COLUMN enrollment_payments.receipt_number IS 'Receipt number for manual payments (auto-generated)';
COMMENT ON COLUMN enrollment_payments.received_by IS 'Admin user who received the manual payment';
COMMENT ON COLUMN enrollment_payments.received_at IS 'When the manual payment was received';
COMMENT ON COLUMN enrollment_payments.payment_notes IS 'Additional notes about the payment (e.g., installment info)';
COMMENT ON FUNCTION generate_payment_receipt_number IS 'Generates receipt numbers like CASH-2026-000001 for manual payments';
