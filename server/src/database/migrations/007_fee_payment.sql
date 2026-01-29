-- BeEducated Fee & Payment System Schema
-- Phase 4: Fee structures, student fees, payments, and Razorpay integration
-- Run this in Supabase SQL Editor

-- =============================================
-- ENUMS
-- =============================================

-- Fee frequency
CREATE TYPE fee_frequency AS ENUM (
  'one_time',
  'monthly',
  'quarterly',
  'half_yearly',
  'yearly'
);

-- Fee type
CREATE TYPE fee_type AS ENUM (
  'tuition',
  'registration',
  'exam',
  'material',
  'library',
  'lab',
  'transport',
  'hostel',
  'other'
);

-- Payment status
CREATE TYPE payment_status AS ENUM (
  'pending',
  'processing',
  'completed',
  'failed',
  'refunded',
  'partially_refunded',
  'cancelled'
);

-- Payment method
CREATE TYPE payment_method AS ENUM (
  'razorpay',
  'bank_transfer',
  'cash',
  'cheque',
  'upi',
  'card',
  'wallet',
  'emi',
  'other'
);

-- Invoice status
CREATE TYPE invoice_status AS ENUM (
  'draft',
  'sent',
  'paid',
  'partially_paid',
  'overdue',
  'cancelled',
  'void'
);

-- =============================================
-- FEE STRUCTURES TABLE
-- =============================================
-- Defines fee templates for courses, batches, or general fees

CREATE TABLE fee_structures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Fee identification
  name VARCHAR(255) NOT NULL,
  description TEXT,
  fee_type fee_type NOT NULL DEFAULT 'tuition',

  -- Scope (can be global, course-specific, or batch-specific)
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  batch_id UUID REFERENCES batches(id) ON DELETE SET NULL,

  -- Amount details
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'INR',

  -- Frequency and duration
  frequency fee_frequency NOT NULL DEFAULT 'one_time',
  duration_months INTEGER, -- For recurring fees

  -- Validity period
  valid_from DATE,
  valid_until DATE,

  -- Tax and discounts
  tax_percentage DECIMAL(5, 2) DEFAULT 0,
  max_discount_percentage DECIMAL(5, 2) DEFAULT 0,

  -- Early bird discount
  early_bird_discount_percentage DECIMAL(5, 2) DEFAULT 0,
  early_bird_deadline DATE,

  -- Late fee
  late_fee_percentage DECIMAL(5, 2) DEFAULT 0,
  late_fee_fixed DECIMAL(10, 2) DEFAULT 0,
  grace_period_days INTEGER DEFAULT 0,

  -- Installment options
  allow_installments BOOLEAN DEFAULT false,
  max_installments INTEGER DEFAULT 1,
  installment_fee_percentage DECIMAL(5, 2) DEFAULT 0,

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_mandatory BOOLEAN DEFAULT true,

  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fee_structures_course ON fee_structures(course_id);
CREATE INDEX idx_fee_structures_batch ON fee_structures(batch_id);
CREATE INDEX idx_fee_structures_type ON fee_structures(fee_type);
CREATE INDEX idx_fee_structures_active ON fee_structures(is_active);

-- =============================================
-- STUDENT FEES TABLE
-- =============================================
-- Individual fee records assigned to students

CREATE TABLE student_fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relations
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  fee_structure_id UUID REFERENCES fee_structures(id) ON DELETE SET NULL,

  -- Fee details (can override fee structure)
  fee_type fee_type NOT NULL,
  description VARCHAR(255),

  -- Amount breakdown
  base_amount DECIMAL(10, 2) NOT NULL,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  discount_reason VARCHAR(255),
  tax_amount DECIMAL(10, 2) DEFAULT 0,
  late_fee_amount DECIMAL(10, 2) DEFAULT 0,
  total_amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'INR',

  -- Payment tracking
  amount_paid DECIMAL(10, 2) DEFAULT 0,
  amount_due DECIMAL(10, 2) NOT NULL,

  -- Due date
  due_date DATE NOT NULL,

  -- Installment info
  is_installment BOOLEAN DEFAULT false,
  installment_number INTEGER,
  total_installments INTEGER,
  parent_fee_id UUID REFERENCES student_fees(id), -- Link to main fee for installments

  -- Status
  status payment_status DEFAULT 'pending',
  paid_at TIMESTAMPTZ,

  -- Academic period
  academic_year VARCHAR(20), -- "2024-25"
  academic_term VARCHAR(50), -- "Term 1", "Semester 1", etc.

  -- Metadata
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_student_fees_student ON student_fees(student_id);
CREATE INDEX idx_student_fees_structure ON student_fees(fee_structure_id);
CREATE INDEX idx_student_fees_status ON student_fees(status);
CREATE INDEX idx_student_fees_due_date ON student_fees(due_date);
CREATE INDEX idx_student_fees_parent ON student_fees(parent_fee_id);

-- =============================================
-- PAYMENTS TABLE
-- =============================================
-- Payment records

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Payment identification
  payment_number VARCHAR(50) UNIQUE NOT NULL, -- "PAY-2024-0001"

  -- Relations
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  student_fee_id UUID REFERENCES student_fees(id) ON DELETE SET NULL,

  -- Amount
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'INR',

  -- Payment method
  payment_method payment_method NOT NULL,

  -- Razorpay specific fields
  razorpay_order_id VARCHAR(100),
  razorpay_payment_id VARCHAR(100),
  razorpay_signature VARCHAR(255),
  razorpay_invoice_id VARCHAR(100),

  -- Bank transfer specific fields
  bank_name VARCHAR(100),
  bank_reference VARCHAR(100),
  transaction_id VARCHAR(100),

  -- Cheque specific fields
  cheque_number VARCHAR(50),
  cheque_date DATE,
  cheque_bank VARCHAR(100),

  -- Payment status
  status payment_status DEFAULT 'pending',
  status_reason TEXT, -- Reason for failure, refund, etc.

  -- Refund details
  refund_amount DECIMAL(10, 2),
  refund_status VARCHAR(50),
  refund_id VARCHAR(100),
  refunded_at TIMESTAMPTZ,
  refund_reason TEXT,

  -- Timestamps
  initiated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  -- Receipt
  receipt_url TEXT,
  receipt_number VARCHAR(50),

  -- Payer info
  payer_name VARCHAR(255),
  payer_email VARCHAR(255),
  payer_phone VARCHAR(20),

  -- Metadata
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payments_student ON payments(student_id);
CREATE INDEX idx_payments_fee ON payments(student_fee_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_method ON payments(payment_method);
CREATE INDEX idx_payments_razorpay_order ON payments(razorpay_order_id);
CREATE INDEX idx_payments_razorpay_payment ON payments(razorpay_payment_id);
CREATE INDEX idx_payments_number ON payments(payment_number);

-- =============================================
-- PAYMENT TRANSACTIONS TABLE
-- =============================================
-- Detailed transaction log for auditing

CREATE TABLE payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relations
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,

  -- Transaction details
  transaction_type VARCHAR(50) NOT NULL, -- 'payment', 'refund', 'partial_refund', 'chargeback'
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'INR',

  -- Status
  status VARCHAR(50) NOT NULL,
  status_message TEXT,

  -- Gateway response
  gateway_response JSONB,
  gateway_transaction_id VARCHAR(100),

  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payment_transactions_payment ON payment_transactions(payment_id);
CREATE INDEX idx_payment_transactions_type ON payment_transactions(transaction_type);

-- =============================================
-- INVOICES TABLE
-- =============================================
-- Invoice generation and tracking

CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Invoice identification
  invoice_number VARCHAR(50) UNIQUE NOT NULL, -- "INV-2024-0001"

  -- Relations
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,

  -- Invoice details
  title VARCHAR(255),
  description TEXT,

  -- Amount breakdown
  subtotal DECIMAL(10, 2) NOT NULL,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  tax_amount DECIMAL(10, 2) DEFAULT 0,
  total_amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'INR',

  -- Line items
  line_items JSONB NOT NULL DEFAULT '[]',
  -- Format: [{ "description": "...", "quantity": 1, "unit_price": 1000, "amount": 1000 }]

  -- Status
  status invoice_status DEFAULT 'draft',

  -- Dates
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  paid_date DATE,

  -- Billing info
  billing_name VARCHAR(255),
  billing_email VARCHAR(255),
  billing_phone VARCHAR(20),
  billing_address TEXT,
  billing_gstin VARCHAR(20),

  -- Institute info (for invoice header)
  institute_gstin VARCHAR(20),
  institute_address TEXT,

  -- PDF storage
  pdf_url TEXT,

  -- Metadata
  notes TEXT,
  terms TEXT,
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_invoices_student ON invoices(student_id);
CREATE INDEX idx_invoices_payment ON invoices(payment_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_date ON invoices(invoice_date);

-- =============================================
-- DISCOUNT CODES TABLE
-- =============================================
-- Promotional and discount codes

CREATE TABLE discount_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Code details
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,

  -- Discount type
  discount_type VARCHAR(20) NOT NULL, -- 'percentage', 'fixed'
  discount_value DECIMAL(10, 2) NOT NULL,
  max_discount_amount DECIMAL(10, 2), -- Cap for percentage discounts

  -- Validity
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,

  -- Usage limits
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  max_uses_per_student INTEGER DEFAULT 1,

  -- Applicability
  applicable_courses UUID[], -- NULL means all courses
  applicable_batches UUID[], -- NULL means all batches
  applicable_fee_types fee_type[], -- NULL means all fee types
  min_purchase_amount DECIMAL(10, 2),

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_discount_codes_code ON discount_codes(code);
CREATE INDEX idx_discount_codes_active ON discount_codes(is_active);

-- =============================================
-- DISCOUNT CODE USAGE TABLE
-- =============================================
-- Track discount code usage by students

CREATE TABLE discount_code_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relations
  discount_code_id UUID NOT NULL REFERENCES discount_codes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
  student_fee_id UUID REFERENCES student_fees(id) ON DELETE SET NULL,

  -- Discount applied
  discount_amount DECIMAL(10, 2) NOT NULL,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(discount_code_id, payment_id)
);

CREATE INDEX idx_discount_usage_code ON discount_code_usage(discount_code_id);
CREATE INDEX idx_discount_usage_student ON discount_code_usage(student_id);

-- =============================================
-- TRIGGERS
-- =============================================

-- Update updated_at timestamp
CREATE TRIGGER update_fee_structures_updated_at BEFORE UPDATE ON fee_structures
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_fees_updated_at BEFORE UPDATE ON student_fees
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_discount_codes_updated_at BEFORE UPDATE ON discount_codes
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Generate payment number
CREATE OR REPLACE FUNCTION generate_payment_number()
RETURNS VARCHAR AS $$
DECLARE
  new_number VARCHAR;
  year_part VARCHAR;
  seq_num INTEGER;
BEGIN
  year_part := EXTRACT(YEAR FROM NOW())::VARCHAR;

  SELECT COALESCE(MAX(CAST(SUBSTRING(payment_number FROM 10) AS INTEGER)), 0) + 1
  INTO seq_num
  FROM payments
  WHERE payment_number LIKE 'PAY-' || year_part || '-%';

  new_number := 'PAY-' || year_part || '-' || LPAD(seq_num::VARCHAR, 6, '0');
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS VARCHAR AS $$
DECLARE
  new_number VARCHAR;
  year_part VARCHAR;
  seq_num INTEGER;
BEGIN
  year_part := EXTRACT(YEAR FROM NOW())::VARCHAR;

  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 10) AS INTEGER)), 0) + 1
  INTO seq_num
  FROM invoices
  WHERE invoice_number LIKE 'INV-' || year_part || '-%';

  new_number := 'INV-' || year_part || '-' || LPAD(seq_num::VARCHAR, 6, '0');
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Update student fee status after payment
CREATE OR REPLACE FUNCTION update_fee_status_after_payment()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND NEW.student_fee_id IS NOT NULL THEN
    UPDATE student_fees
    SET
      amount_paid = amount_paid + NEW.amount,
      amount_due = total_amount - (amount_paid + NEW.amount),
      status = CASE
        WHEN (amount_paid + NEW.amount) >= total_amount THEN 'completed'
        WHEN (amount_paid + NEW.amount) > 0 THEN 'processing'
        ELSE status
      END,
      paid_at = CASE
        WHEN (amount_paid + NEW.amount) >= total_amount THEN NOW()
        ELSE paid_at
      END,
      updated_at = NOW()
    WHERE id = NEW.student_fee_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_fee_after_payment
AFTER UPDATE ON payments
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION update_fee_status_after_payment();

-- Update discount code usage count
CREATE OR REPLACE FUNCTION update_discount_code_usage_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE discount_codes
    SET current_uses = current_uses + 1
    WHERE id = NEW.discount_code_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE discount_codes
    SET current_uses = current_uses - 1
    WHERE id = OLD.discount_code_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_discount_usage_count
AFTER INSERT OR DELETE ON discount_code_usage
FOR EACH ROW
EXECUTE FUNCTION update_discount_code_usage_count();

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE fee_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_code_usage ENABLE ROW LEVEL SECURITY;

-- Fee structures: Admin/Teacher can manage, everyone can view active
CREATE POLICY "fee_structures_select_active" ON fee_structures
  FOR SELECT USING (is_active = true OR auth.jwt() ->> 'role' IN ('admin', 'teacher'));

CREATE POLICY "fee_structures_admin_all" ON fee_structures
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Student fees: Students see own, Admin/Teacher see all
CREATE POLICY "student_fees_select_own" ON student_fees
  FOR SELECT USING (
    student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
    OR auth.jwt() ->> 'role' IN ('admin', 'teacher')
  );

CREATE POLICY "student_fees_admin_all" ON student_fees
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Payments: Students see own, Admin see all
CREATE POLICY "payments_select_own" ON payments
  FOR SELECT USING (
    student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
    OR auth.jwt() ->> 'role' IN ('admin', 'teacher')
  );

CREATE POLICY "payments_insert_own" ON payments
  FOR INSERT WITH CHECK (
    student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
    OR auth.jwt() ->> 'role' = 'admin'
  );

CREATE POLICY "payments_admin_all" ON payments
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Payment transactions: Same as payments
CREATE POLICY "payment_transactions_select" ON payment_transactions
  FOR SELECT USING (
    payment_id IN (
      SELECT id FROM payments WHERE
        student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
        OR auth.jwt() ->> 'role' IN ('admin', 'teacher')
    )
  );

CREATE POLICY "payment_transactions_admin_all" ON payment_transactions
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Invoices: Students see own, Admin see all
CREATE POLICY "invoices_select_own" ON invoices
  FOR SELECT USING (
    student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
    OR auth.jwt() ->> 'role' IN ('admin', 'teacher')
  );

CREATE POLICY "invoices_admin_all" ON invoices
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Discount codes: Admin manages, everyone can view active
CREATE POLICY "discount_codes_select_active" ON discount_codes
  FOR SELECT USING (is_active = true OR auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "discount_codes_admin_all" ON discount_codes
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Discount code usage
CREATE POLICY "discount_usage_select_own" ON discount_code_usage
  FOR SELECT USING (
    student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
    OR auth.jwt() ->> 'role' = 'admin'
  );

CREATE POLICY "discount_usage_insert" ON discount_code_usage
  FOR INSERT WITH CHECK (
    student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
    OR auth.jwt() ->> 'role' = 'admin'
  );

-- =============================================
-- VIEWS
-- =============================================

-- Student fee summary view
CREATE OR REPLACE VIEW student_fee_summary AS
SELECT
  s.id AS student_id,
  s.student_id AS student_code,
  u.first_name || ' ' || u.last_name AS student_name,
  COUNT(sf.id) AS total_fees,
  SUM(sf.total_amount) AS total_amount,
  SUM(sf.amount_paid) AS total_paid,
  SUM(sf.amount_due) AS total_due,
  COUNT(CASE WHEN sf.status = 'pending' THEN 1 END) AS pending_count,
  COUNT(CASE WHEN sf.status = 'completed' THEN 1 END) AS completed_count,
  COUNT(CASE WHEN sf.due_date < CURRENT_DATE AND sf.status = 'pending' THEN 1 END) AS overdue_count
FROM students s
JOIN users u ON s.user_id = u.id
LEFT JOIN student_fees sf ON s.id = sf.student_id
GROUP BY s.id, s.student_id, u.first_name, u.last_name;

-- Payment history view
CREATE OR REPLACE VIEW payment_history AS
SELECT
  p.*,
  s.student_id AS student_code,
  u.first_name || ' ' || u.last_name AS student_name,
  u.email AS student_email,
  sf.description AS fee_description,
  sf.fee_type
FROM payments p
JOIN students s ON p.student_id = s.id
JOIN users u ON s.user_id = u.id
LEFT JOIN student_fees sf ON p.student_fee_id = sf.id
ORDER BY p.created_at DESC;

-- =============================================
-- COMMENTS
-- =============================================

COMMENT ON TABLE fee_structures IS 'Fee templates for courses, batches, or general fees';
COMMENT ON TABLE student_fees IS 'Individual fee records assigned to students';
COMMENT ON TABLE payments IS 'Payment records with Razorpay integration';
COMMENT ON TABLE payment_transactions IS 'Detailed transaction log for auditing';
COMMENT ON TABLE invoices IS 'Invoice generation and tracking';
COMMENT ON TABLE discount_codes IS 'Promotional and discount codes';
COMMENT ON TABLE discount_code_usage IS 'Track discount code usage by students';
