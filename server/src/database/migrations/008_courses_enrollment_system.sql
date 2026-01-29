-- BeEducated Course Types & Enrollment System
-- Phase 8: Course types, classes, fee plans, and enrollment with Razorpay payment
-- Run this in Supabase SQL Editor AFTER previous migrations

-- =============================================
-- COURSE TYPES TABLE
-- =============================================
-- The 4 main course categories (coaching_offline, coaching_online, test_series, home_tuition)

CREATE TABLE course_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identification
  slug VARCHAR(50) UNIQUE NOT NULL,           -- 'coaching_offline', 'coaching_online', etc.
  name VARCHAR(100) NOT NULL,                 -- 'Coaching (Offline)'
  short_name VARCHAR(50),                     -- 'Offline Coaching'

  -- Content
  description TEXT,
  long_description TEXT,

  -- Display
  icon VARCHAR(50),                           -- Icon name for frontend (lucide icons)
  color VARCHAR(20),                          -- Hex color for UI
  image_url TEXT,                             -- Background/card image
  display_order INTEGER DEFAULT 0,

  -- Status
  is_active BOOLEAN DEFAULT false,            -- Only coaching_offline is active initially
  coming_soon_message VARCHAR(255),           -- Message to show when inactive

  -- Metadata
  features TEXT[],                            -- Array of features/benefits
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_course_types_slug ON course_types(slug);
CREATE INDEX idx_course_types_active ON course_types(is_active);
CREATE INDEX idx_course_types_order ON course_types(display_order);

-- =============================================
-- ACADEMIC CLASSES TABLE
-- =============================================
-- Classes within each course type (Class 9, 10, 11, 12, etc.)

CREATE TABLE academic_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relations
  course_type_id UUID NOT NULL REFERENCES course_types(id) ON DELETE CASCADE,

  -- Identification
  name VARCHAR(100) NOT NULL,                 -- 'Class 9', 'Class 10', 'JEE Foundation'
  slug VARCHAR(100),                          -- 'class-9', 'class-10'

  -- Content
  description TEXT,
  long_description TEXT,
  duration VARCHAR(50),                       -- '1 Year', '6 Months'

  -- Display
  image_url TEXT,
  display_order INTEGER DEFAULT 0,

  -- Features and syllabus
  features TEXT[],                            -- Array of features
  syllabus TEXT[],                            -- Array of syllabus topics

  -- Capacity
  max_students INTEGER,                       -- NULL means unlimited
  current_students INTEGER DEFAULT 0,

  -- Academic info
  target_board VARCHAR(50),                   -- 'CBSE', 'UP Board', 'ICSE'
  target_exam VARCHAR(100),                   -- 'Board Exams', 'JEE', 'NEET'

  -- Status
  is_active BOOLEAN DEFAULT true,
  enrollment_open BOOLEAN DEFAULT true,

  -- Dates
  session_start_date DATE,
  session_end_date DATE,

  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(course_type_id, slug)
);

CREATE INDEX idx_academic_classes_course_type ON academic_classes(course_type_id);
CREATE INDEX idx_academic_classes_slug ON academic_classes(slug);
CREATE INDEX idx_academic_classes_active ON academic_classes(is_active);
CREATE INDEX idx_academic_classes_order ON academic_classes(course_type_id, display_order);

-- =============================================
-- CLASS FEE PLANS TABLE
-- =============================================
-- Fee breakdown for each class

CREATE TABLE class_fee_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relations
  class_id UUID NOT NULL REFERENCES academic_classes(id) ON DELETE CASCADE,

  -- Plan identification
  name VARCHAR(100) NOT NULL,                 -- 'Standard Plan', 'Premium Plan'
  description TEXT,

  -- Fee breakdown
  registration_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
  tuition_fee DECIMAL(10,2) NOT NULL,
  material_fee DECIMAL(10,2) DEFAULT 0,
  exam_fee DECIMAL(10,2) DEFAULT 0,

  -- Discounts
  discount_amount DECIMAL(10,2) DEFAULT 0,
  discount_label VARCHAR(100),                -- 'Early Bird Discount', 'Sibling Discount'
  discount_valid_until DATE,

  -- Total (calculated)
  total_amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'INR',

  -- Validity
  validity_months INTEGER DEFAULT 12,         -- How long enrollment is valid

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,           -- Default plan shown for class

  -- Display
  display_order INTEGER DEFAULT 0,
  highlight_label VARCHAR(50),                -- 'Popular', 'Best Value'

  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_class_fee_plans_class ON class_fee_plans(class_id);
CREATE INDEX idx_class_fee_plans_active ON class_fee_plans(is_active);
CREATE INDEX idx_class_fee_plans_default ON class_fee_plans(class_id, is_default);

-- =============================================
-- CLASS ENROLLMENTS TABLE
-- =============================================
-- Student enrollment in classes

CREATE TYPE enrollment_status AS ENUM (
  'pending',      -- Payment initiated
  'active',       -- Enrolled and active
  'expired',      -- Enrollment period ended
  'cancelled',    -- Manually cancelled
  'refunded'      -- Payment refunded
);

CREATE TABLE class_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relations
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES academic_classes(id) ON DELETE CASCADE,
  fee_plan_id UUID NOT NULL REFERENCES class_fee_plans(id),

  -- Enrollment number
  enrollment_number VARCHAR(50) UNIQUE,       -- 'ENR-2026-000001'

  -- Status
  status enrollment_status NOT NULL DEFAULT 'pending',

  -- Timestamps
  initiated_at TIMESTAMPTZ DEFAULT NOW(),     -- When enrollment started (payment initiated)
  enrolled_at TIMESTAMPTZ,                    -- When payment completed
  expires_at TIMESTAMPTZ,                     -- When enrollment expires
  cancelled_at TIMESTAMPTZ,

  -- Payment info (linked to enrollment_payments)
  amount_paid DECIMAL(10,2),

  -- Notes
  notes TEXT,
  cancellation_reason TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- One enrollment per class per student
  UNIQUE(student_id, class_id)
);

CREATE INDEX idx_class_enrollments_student ON class_enrollments(student_id);
CREATE INDEX idx_class_enrollments_class ON class_enrollments(class_id);
CREATE INDEX idx_class_enrollments_status ON class_enrollments(status);
CREATE INDEX idx_class_enrollments_number ON class_enrollments(enrollment_number);

-- =============================================
-- ENROLLMENT PAYMENTS TABLE
-- =============================================
-- Payment records for class enrollments

CREATE TYPE enrollment_payment_status AS ENUM (
  'pending',      -- Order created, awaiting payment
  'processing',   -- Payment in progress
  'paid',         -- Payment successful
  'failed',       -- Payment failed
  'refunded',     -- Full refund
  'partially_refunded'
);

CREATE TABLE enrollment_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relations
  enrollment_id UUID NOT NULL REFERENCES class_enrollments(id) ON DELETE CASCADE,

  -- Razorpay fields
  razorpay_order_id VARCHAR(100) UNIQUE NOT NULL,
  razorpay_payment_id VARCHAR(100),
  razorpay_signature VARCHAR(500),

  -- Amount details
  amount DECIMAL(10,2) NOT NULL,              -- Amount in rupees
  amount_paise INTEGER NOT NULL,              -- Amount in paise for Razorpay
  currency VARCHAR(3) DEFAULT 'INR',

  -- Status
  status enrollment_payment_status NOT NULL DEFAULT 'pending',

  -- Payment details
  payment_method VARCHAR(50),                 -- 'card', 'upi', 'netbanking', 'wallet'
  bank VARCHAR(100),
  wallet VARCHAR(50),
  vpa VARCHAR(100),                           -- UPI VPA

  -- Card details (masked)
  card_last4 VARCHAR(4),
  card_network VARCHAR(20),                   -- 'Visa', 'Mastercard'

  -- Error handling
  error_code VARCHAR(100),
  error_description TEXT,
  error_source VARCHAR(50),
  error_step VARCHAR(50),
  error_reason VARCHAR(100),

  -- Refund details
  refund_id VARCHAR(100),
  refund_amount DECIMAL(10,2),
  refund_status VARCHAR(50),
  refunded_at TIMESTAMPTZ,

  -- Timestamps
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_enrollment_payments_enrollment ON enrollment_payments(enrollment_id);
CREATE INDEX idx_enrollment_payments_order ON enrollment_payments(razorpay_order_id);
CREATE INDEX idx_enrollment_payments_payment ON enrollment_payments(razorpay_payment_id);
CREATE INDEX idx_enrollment_payments_status ON enrollment_payments(status);

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Generate enrollment number
CREATE OR REPLACE FUNCTION generate_enrollment_number()
RETURNS VARCHAR AS $$
DECLARE
  new_number VARCHAR;
  year_part VARCHAR;
  seq_num INTEGER;
BEGIN
  year_part := EXTRACT(YEAR FROM NOW())::VARCHAR;

  SELECT COALESCE(MAX(CAST(SUBSTRING(enrollment_number FROM 10) AS INTEGER)), 0) + 1
  INTO seq_num
  FROM class_enrollments
  WHERE enrollment_number LIKE 'ENR-' || year_part || '-%';

  new_number := 'ENR-' || year_part || '-' || LPAD(seq_num::VARCHAR, 6, '0');
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Auto-generate enrollment number on insert
CREATE OR REPLACE FUNCTION set_enrollment_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.enrollment_number IS NULL THEN
    NEW.enrollment_number := generate_enrollment_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_enrollment_number
BEFORE INSERT ON class_enrollments
FOR EACH ROW
EXECUTE FUNCTION set_enrollment_number();

-- Update class current_students count
CREATE OR REPLACE FUNCTION update_class_student_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
    UPDATE academic_classes
    SET current_students = current_students + 1
    WHERE id = NEW.class_id;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Status changed TO active
    IF OLD.status != 'active' AND NEW.status = 'active' THEN
      UPDATE academic_classes
      SET current_students = current_students + 1
      WHERE id = NEW.class_id;
    -- Status changed FROM active
    ELSIF OLD.status = 'active' AND NEW.status != 'active' THEN
      UPDATE academic_classes
      SET current_students = GREATEST(current_students - 1, 0)
      WHERE id = NEW.class_id;
    END IF;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'active' THEN
    UPDATE academic_classes
    SET current_students = GREATEST(current_students - 1, 0)
    WHERE id = OLD.class_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_class_student_count
AFTER INSERT OR UPDATE OR DELETE ON class_enrollments
FOR EACH ROW
EXECUTE FUNCTION update_class_student_count();

-- =============================================
-- UPDATE TRIGGERS
-- =============================================

CREATE TRIGGER update_course_types_updated_at
BEFORE UPDATE ON course_types
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_academic_classes_updated_at
BEFORE UPDATE ON academic_classes
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_class_fee_plans_updated_at
BEFORE UPDATE ON class_fee_plans
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_class_enrollments_updated_at
BEFORE UPDATE ON class_enrollments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_enrollment_payments_updated_at
BEFORE UPDATE ON enrollment_payments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE course_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_fee_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollment_payments ENABLE ROW LEVEL SECURITY;

-- Course types: Public read
CREATE POLICY "Anyone can view course types" ON course_types
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage course types" ON course_types
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Academic classes: Public read for active
CREATE POLICY "Anyone can view active classes" ON academic_classes
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage classes" ON academic_classes
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Fee plans: Public read for active
CREATE POLICY "Anyone can view active fee plans" ON class_fee_plans
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage fee plans" ON class_fee_plans
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Enrollments: Students see own, admins see all
CREATE POLICY "Students can view own enrollments" ON class_enrollments
  FOR SELECT USING (
    student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
    OR auth.jwt() ->> 'role' IN ('admin', 'teacher')
  );

CREATE POLICY "Students can create own enrollments" ON class_enrollments
  FOR INSERT WITH CHECK (
    student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can manage all enrollments" ON class_enrollments
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Payments: Students see own, admins see all
CREATE POLICY "Students can view own payments" ON enrollment_payments
  FOR SELECT USING (
    enrollment_id IN (
      SELECT id FROM class_enrollments
      WHERE student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
    )
    OR auth.jwt() ->> 'role' IN ('admin', 'teacher')
  );

CREATE POLICY "Admins can manage all payments" ON enrollment_payments
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Service role bypass
CREATE POLICY "Service role full access course_types" ON course_types FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access academic_classes" ON academic_classes FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access class_fee_plans" ON class_fee_plans FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access class_enrollments" ON class_enrollments FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access enrollment_payments" ON enrollment_payments FOR ALL USING (auth.role() = 'service_role');

-- =============================================
-- SEED DATA: COURSE TYPES
-- =============================================

INSERT INTO course_types (slug, name, short_name, description, icon, color, is_active, coming_soon_message, features, display_order) VALUES
(
  'coaching_offline',
  'Classroom Coaching',
  'Offline',
  'In-person classroom coaching with experienced faculty. Small batch sizes ensure personalized attention and interactive learning.',
  'School',
  '#3B82F6',
  true,
  NULL,
  ARRAY[
    'Small batch sizes (max 15 students)',
    'Face-to-face interaction with teachers',
    'Regular doubt clearing sessions',
    'Weekly tests and assessments',
    'Study materials included',
    'Parent-teacher meetings'
  ],
  1
),
(
  'coaching_online',
  'Online Coaching',
  'Online',
  'Live interactive online classes from the comfort of your home. Access recorded lectures anytime.',
  'Monitor',
  '#10B981',
  false,
  'Coming Soon! We are preparing an amazing online learning experience for you.',
  ARRAY[
    'Live interactive classes',
    'Recorded lectures for revision',
    'Digital study materials',
    'Online doubt sessions',
    'Learn from anywhere'
  ],
  2
),
(
  'test_series',
  'Test Series',
  'Tests',
  'Comprehensive test series with detailed analysis. Practice with previous year papers and mock tests.',
  'FileText',
  '#F59E0B',
  false,
  'Coming Soon! Our comprehensive test series is being prepared.',
  ARRAY[
    'Chapter-wise tests',
    'Full-length mock tests',
    'Previous year papers',
    'Detailed performance analysis',
    'All-India ranking'
  ],
  3
),
(
  'home_tuition',
  'Home Tuition',
  'Home',
  'Personalized one-on-one tutoring at your home. Customized learning pace based on student needs.',
  'Home',
  '#8B5CF6',
  false,
  'Coming Soon! Premium home tutoring service launching soon.',
  ARRAY[
    'One-on-one attention',
    'Flexible scheduling',
    'Customized curriculum',
    'Progress tracking',
    'Home visits by qualified teachers'
  ],
  4
);

-- =============================================
-- SEED DATA: ACADEMIC CLASSES (for coaching_offline)
-- =============================================

-- Class 6
INSERT INTO academic_classes (course_type_id, name, slug, description, duration, features, target_board, display_order)
SELECT
  ct.id,
  'Class 6',
  'class-6',
  'Strong foundation building for Class 6 students. Focus on conceptual understanding and developing interest in learning.',
  '1 Year',
  ARRAY[
    'Complete NCERT coverage',
    'Conceptual understanding focus',
    'Regular assignments',
    'Monthly parent updates',
    'Doubt clearing sessions'
  ],
  'CBSE/UP Board',
  1
FROM course_types ct WHERE ct.slug = 'coaching_offline';

-- Class 7
INSERT INTO academic_classes (course_type_id, name, slug, description, duration, features, target_board, display_order)
SELECT
  ct.id,
  'Class 7',
  'class-7',
  'Building strong fundamentals for Class 7 students. Comprehensive coverage with focus on analytical thinking.',
  '1 Year',
  ARRAY[
    'Complete NCERT coverage',
    'Analytical thinking development',
    'Regular assignments',
    'Monthly parent updates',
    'Doubt clearing sessions'
  ],
  'CBSE/UP Board',
  2
FROM course_types ct WHERE ct.slug = 'coaching_offline';

-- Class 8
INSERT INTO academic_classes (course_type_id, name, slug, description, duration, features, target_board, display_order)
SELECT
  ct.id,
  'Class 8',
  'class-8',
  'Pre-board preparation for Class 8 students. Foundation for high school concepts with increased rigor.',
  '1 Year',
  ARRAY[
    'Complete NCERT coverage',
    'High school preparation',
    'Regular assignments',
    'Monthly parent updates',
    'Doubt clearing sessions'
  ],
  'CBSE/UP Board',
  3
FROM course_types ct WHERE ct.slug = 'coaching_offline';

-- Class 9
INSERT INTO academic_classes (course_type_id, name, slug, description, duration, features, target_board, display_order)
SELECT
  ct.id,
  'Class 9',
  'class-9',
  'Foundation building course for Class 9 students. Covers complete NCERT syllabus with additional practice problems and conceptual clarity.',
  '1 Year',
  ARRAY[
    'Complete NCERT coverage',
    'Foundation for competitive exams',
    'Regular assignments',
    'Monthly parent updates',
    'Doubt clearing sessions'
  ],
  'CBSE/UP Board',
  4
FROM course_types ct WHERE ct.slug = 'coaching_offline';

-- Class 10
INSERT INTO academic_classes (course_type_id, name, slug, description, duration, features, target_board, display_order)
SELECT
  ct.id,
  'Class 10',
  'class-10',
  'Board exam preparation course for Class 10. Focused on scoring maximum marks with comprehensive revision and practice.',
  '1 Year',
  ARRAY[
    'Board exam focused preparation',
    'Previous year papers practice',
    'Sample papers with solutions',
    'Pre-board mock tests',
    'Extra classes for weak students'
  ],
  'CBSE/UP Board',
  5
FROM course_types ct WHERE ct.slug = 'coaching_offline';

-- Class 11
INSERT INTO academic_classes (course_type_id, name, slug, description, duration, features, target_board, display_order)
SELECT
  ct.id,
  'Class 11',
  'class-11',
  'Critical foundation year for Class 11 students. Strong conceptual base for both boards and competitive exams like JEE/NEET.',
  '1 Year',
  ARRAY[
    'Strong conceptual foundation',
    'JEE/NEET pattern questions',
    'NCERT + advanced problems',
    'Regular chapter tests',
    'Dedicated faculty for each subject'
  ],
  'CBSE/UP Board',
  6
FROM course_types ct WHERE ct.slug = 'coaching_offline';

-- Class 12
INSERT INTO academic_classes (course_type_id, name, slug, description, duration, features, target_board, display_order)
SELECT
  ct.id,
  'Class 12',
  'class-12',
  'Board exam and competitive exam preparation for Class 12. Balanced approach for both board excellence and entrance success.',
  '1 Year',
  ARRAY[
    'Board + Competitive dual focus',
    'Complete syllabus coverage',
    'Intensive revision program',
    'Mock tests every week',
    'Performance tracking & feedback'
  ],
  'CBSE/UP Board',
  7
FROM course_types ct WHERE ct.slug = 'coaching_offline';

-- =============================================
-- SEED DATA: FEE PLANS
-- =============================================
-- Registration fee (admission): ₹499 for all classes
-- Tuition fee (course fee): varies by class

-- Class 6 Fee Plan (₹499 admission + ₹7499 course = ₹7998 total)
INSERT INTO class_fee_plans (class_id, name, registration_fee, tuition_fee, material_fee, discount_amount, total_amount, is_default, validity_months)
SELECT
  ac.id,
  'Standard Plan',
  499,
  7499,
  0,
  0,
  7998,
  true,
  12
FROM academic_classes ac
JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'coaching_offline' AND ac.slug = 'class-6';

-- Class 7 Fee Plan (₹499 admission + ₹8499 course = ₹8998 total)
INSERT INTO class_fee_plans (class_id, name, registration_fee, tuition_fee, material_fee, discount_amount, total_amount, is_default, validity_months)
SELECT
  ac.id,
  'Standard Plan',
  499,
  8499,
  0,
  0,
  8998,
  true,
  12
FROM academic_classes ac
JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'coaching_offline' AND ac.slug = 'class-7';

-- Class 8 Fee Plan (₹499 admission + ₹9499 course = ₹9998 total)
INSERT INTO class_fee_plans (class_id, name, registration_fee, tuition_fee, material_fee, discount_amount, total_amount, is_default, validity_months)
SELECT
  ac.id,
  'Standard Plan',
  499,
  9499,
  0,
  0,
  9998,
  true,
  12
FROM academic_classes ac
JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'coaching_offline' AND ac.slug = 'class-8';

-- Class 9 Fee Plan (₹499 admission + ₹14999 course = ₹15498 total)
INSERT INTO class_fee_plans (class_id, name, registration_fee, tuition_fee, material_fee, discount_amount, total_amount, is_default, validity_months)
SELECT
  ac.id,
  'Standard Plan',
  499,
  14999,
  0,
  0,
  15498,
  true,
  12
FROM academic_classes ac
JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'coaching_offline' AND ac.slug = 'class-9';

-- Class 10 Fee Plan (₹499 admission + ₹15999 course = ₹16498 total)
INSERT INTO class_fee_plans (class_id, name, registration_fee, tuition_fee, material_fee, discount_amount, total_amount, is_default, validity_months)
SELECT
  ac.id,
  'Standard Plan',
  499,
  15999,
  0,
  0,
  16498,
  true,
  12
FROM academic_classes ac
JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'coaching_offline' AND ac.slug = 'class-10';

-- Class 11 Fee Plan (₹499 admission + ₹17999 course = ₹18498 total)
INSERT INTO class_fee_plans (class_id, name, registration_fee, tuition_fee, material_fee, discount_amount, total_amount, is_default, validity_months)
SELECT
  ac.id,
  'Standard Plan',
  499,
  17999,
  0,
  0,
  18498,
  true,
  12
FROM academic_classes ac
JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'coaching_offline' AND ac.slug = 'class-11';

-- Class 12 Fee Plan (₹499 admission + ₹18999 course = ₹19498 total)
INSERT INTO class_fee_plans (class_id, name, registration_fee, tuition_fee, material_fee, discount_amount, total_amount, is_default, validity_months)
SELECT
  ac.id,
  'Standard Plan',
  499,
  18999,
  0,
  0,
  19498,
  true,
  12
FROM academic_classes ac
JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'coaching_offline' AND ac.slug = 'class-12';

-- =============================================
-- VIEWS
-- =============================================

-- Class with fee plan view
CREATE OR REPLACE VIEW class_with_fees AS
SELECT
  ac.*,
  ct.slug AS course_type_slug,
  ct.name AS course_type_name,
  ct.is_active AS course_type_active,
  cfp.id AS fee_plan_id,
  cfp.name AS fee_plan_name,
  cfp.registration_fee,
  cfp.tuition_fee,
  cfp.material_fee,
  cfp.discount_amount,
  cfp.discount_label,
  cfp.total_amount,
  cfp.validity_months
FROM academic_classes ac
JOIN course_types ct ON ac.course_type_id = ct.id
LEFT JOIN class_fee_plans cfp ON cfp.class_id = ac.id AND cfp.is_default = true AND cfp.is_active = true
WHERE ac.is_active = true;

-- Student enrollment summary view
CREATE OR REPLACE VIEW student_enrollment_summary AS
SELECT
  ce.id AS enrollment_id,
  ce.enrollment_number,
  ce.status,
  ce.enrolled_at,
  ce.expires_at,
  s.id AS student_id,
  s.student_id AS student_code,
  u.first_name || ' ' || COALESCE(u.last_name, '') AS student_name,
  u.email AS student_email,
  ac.id AS class_id,
  ac.name AS class_name,
  ct.name AS course_type_name,
  cfp.total_amount,
  ce.amount_paid,
  ep.razorpay_payment_id,
  ep.paid_at AS payment_date
FROM class_enrollments ce
JOIN students s ON ce.student_id = s.id
JOIN users u ON s.user_id = u.id
JOIN academic_classes ac ON ce.class_id = ac.id
JOIN course_types ct ON ac.course_type_id = ct.id
JOIN class_fee_plans cfp ON ce.fee_plan_id = cfp.id
LEFT JOIN enrollment_payments ep ON ep.enrollment_id = ce.id AND ep.status = 'paid';

-- =============================================
-- COMMENTS
-- =============================================

COMMENT ON TABLE course_types IS 'Main course categories: coaching_offline, coaching_online, test_series, home_tuition';
COMMENT ON TABLE academic_classes IS 'Classes within each course type (Class 9, 10, 11, 12, etc.)';
COMMENT ON TABLE class_fee_plans IS 'Fee breakdown for each class';
COMMENT ON TABLE class_enrollments IS 'Student enrollment records with payment status';
COMMENT ON TABLE enrollment_payments IS 'Razorpay payment records for enrollments';

COMMENT ON FUNCTION generate_enrollment_number IS 'Generates unique enrollment numbers like ENR-2026-000001';
