-- BeEducated Manual Enrollment Support
-- Migration 012: Add "Manual Enrollment" fee plans for all classes
-- This enables admin to create students with proper enrollments without requiring payment

-- =============================================
-- STEP 1: ADD plan_type COLUMN IF NOT EXISTS
-- =============================================

-- Check if plan_type column exists, if not add it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'class_fee_plans'
    AND column_name = 'plan_type'
  ) THEN
    ALTER TABLE class_fee_plans
    ADD COLUMN plan_type VARCHAR(50) DEFAULT 'standard';

    COMMENT ON COLUMN class_fee_plans.plan_type IS 'Type of fee plan: standard, manual, promotional, etc.';
  END IF;
END $$;

-- =============================================
-- STEP 2: CREATE MANUAL FEE PLANS FOR ALL CLASSES
-- =============================================

-- Insert a "Manual Enrollment - 1 Year" fee plan for each academic class
-- This fee plan has:
--   - Amount: 0 (free)
--   - Validity: 12 months
--   - plan_type: 'manual' to distinguish from paid plans
--   - is_active: true so it can be used

INSERT INTO class_fee_plans (
  class_id,
  name,
  description,
  registration_fee,
  tuition_fee,
  material_fee,
  exam_fee,
  discount_amount,
  total_amount,
  validity_months,
  plan_type,
  is_active,
  is_default,
  display_order,
  metadata
)
SELECT
  ac.id AS class_id,
  'Manual Enrollment - 1 Year' AS name,
  'Free enrollment created by admin for offline/manual students. Valid for 1 year.' AS description,
  0 AS registration_fee,
  0 AS tuition_fee,
  0 AS material_fee,
  0 AS exam_fee,
  0 AS discount_amount,
  0 AS total_amount,
  12 AS validity_months,
  'manual' AS plan_type,
  true AS is_active,
  false AS is_default,
  999 AS display_order,
  '{"features": ["Full content access", "Admin managed", "1 year validity"]}'::JSONB AS metadata
FROM academic_classes ac
WHERE NOT EXISTS (
  -- Only insert if a manual plan doesn't already exist for this class
  SELECT 1 FROM class_fee_plans cfp
  WHERE cfp.class_id = ac.id
  AND cfp.plan_type = 'manual'
);

-- =============================================
-- STEP 3: CREATE FUNCTION TO AUTO-CREATE MANUAL FEE PLAN
-- =============================================

-- This function automatically creates a manual fee plan when a new class is created
CREATE OR REPLACE FUNCTION create_manual_fee_plan_for_class()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert manual fee plan for new class
  INSERT INTO class_fee_plans (
    class_id,
    name,
    description,
    registration_fee,
    tuition_fee,
    material_fee,
    exam_fee,
    discount_amount,
    total_amount,
    validity_months,
    plan_type,
    is_active,
    is_default,
    display_order,
    metadata
  ) VALUES (
    NEW.id,
    'Manual Enrollment - 1 Year',
    'Free enrollment created by admin for offline/manual students. Valid for 1 year.',
    0,
    0,
    0,
    0,
    0,
    0,
    12,
    'manual',
    true,
    false,
    999,
    '{"features": ["Full content access", "Admin managed", "1 year validity"]}'::JSONB
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-create manual fee plan for new classes
DROP TRIGGER IF EXISTS trigger_create_manual_fee_plan ON academic_classes;
CREATE TRIGGER trigger_create_manual_fee_plan
  AFTER INSERT ON academic_classes
  FOR EACH ROW
  EXECUTE FUNCTION create_manual_fee_plan_for_class();

-- =============================================
-- STEP 4: CREATE INDEXES FOR FASTER LOOKUPS
-- =============================================

CREATE INDEX IF NOT EXISTS idx_class_fee_plans_plan_type ON class_fee_plans(plan_type);
CREATE INDEX IF NOT EXISTS idx_class_fee_plans_manual ON class_fee_plans(class_id) WHERE plan_type = 'manual';

-- =============================================
-- COMMENTS
-- =============================================

COMMENT ON FUNCTION create_manual_fee_plan_for_class() IS 'Automatically creates a manual enrollment fee plan when a new class is created';
