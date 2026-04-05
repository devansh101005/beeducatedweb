-- =============================================
-- Migration 019: Cashfree Payment Gateway Migration
-- =============================================
-- Adds Cashfree columns alongside existing Razorpay columns
-- Existing Razorpay data is preserved for historical records
-- New payments default to 'cashfree' gateway

-- Add payment_gateway column to enrollment_payments
ALTER TABLE enrollment_payments
  ADD COLUMN IF NOT EXISTS payment_gateway VARCHAR(20) DEFAULT 'cashfree',
  ADD COLUMN IF NOT EXISTS cashfree_order_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS cashfree_payment_id VARCHAR(255);

-- Add payment_gateway column to payments (general fee payments)
ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS payment_gateway VARCHAR(20) DEFAULT 'cashfree',
  ADD COLUMN IF NOT EXISTS cashfree_order_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS cashfree_payment_id VARCHAR(255);

-- Mark all existing records as razorpay
UPDATE enrollment_payments SET payment_gateway = 'razorpay' WHERE razorpay_order_id IS NOT NULL;
UPDATE payments SET payment_gateway = 'razorpay' WHERE razorpay_order_id IS NOT NULL;

-- Indexes for Cashfree lookups
CREATE INDEX IF NOT EXISTS idx_enrollment_payments_cashfree_order ON enrollment_payments(cashfree_order_id) WHERE cashfree_order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payments_cashfree_order ON payments(cashfree_order_id) WHERE cashfree_order_id IS NOT NULL;

-- Comments
COMMENT ON COLUMN enrollment_payments.payment_gateway IS 'Payment gateway used: razorpay or cashfree';
COMMENT ON COLUMN enrollment_payments.cashfree_order_id IS 'Cashfree order ID (cf_order_id)';
COMMENT ON COLUMN enrollment_payments.cashfree_payment_id IS 'Cashfree payment ID (cf_payment_id)';
COMMENT ON COLUMN payments.payment_gateway IS 'Payment gateway used: razorpay or cashfree';
COMMENT ON COLUMN payments.cashfree_order_id IS 'Cashfree order ID';
COMMENT ON COLUMN payments.cashfree_payment_id IS 'Cashfree payment ID';
