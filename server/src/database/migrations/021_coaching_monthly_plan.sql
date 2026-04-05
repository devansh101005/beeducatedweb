-- =============================================
-- MIGRATION 021: COACHING OFFLINE - ADD MONTHLY PLAN, DEACTIVATE PLAN A
-- =============================================
-- Changes:
--   1. Deactivate Plan A (70/30 installment) for all coaching_offline classes
--   2. Add new Monthly Plan with 10% surcharge for each coaching_offline class
--   3. Make Plan B (50/50) the default plan
--
-- Monthly fee formula: CEIL(annual_fee * 1.10 / 12)
-- Annual fees: Class 6=9799, 7=10799, 8=11999, 9=17000, 10=21000, 11=26000, 12=33000
-- =============================================

-- =============================================
-- STEP 1: Deactivate Plan A (70/30) for coaching_offline
-- =============================================

UPDATE class_fee_plans
SET is_active = false, is_default = false, updated_at = NOW()
WHERE metadata->>'plan_code' = 'A'
  AND class_id IN (
    SELECT ac.id FROM academic_classes ac
    JOIN course_types ct ON ac.course_type_id = ct.id
    WHERE ct.slug = 'coaching_offline'
  )
  AND is_active = true;

-- =============================================
-- STEP 2: Make Plan B the default (since Plan A was default)
-- =============================================

UPDATE class_fee_plans
SET is_default = true, updated_at = NOW()
WHERE metadata->>'plan_code' = 'B'
  AND class_id IN (
    SELECT ac.id FROM academic_classes ac
    JOIN course_types ct ON ac.course_type_id = ct.id
    WHERE ct.slug = 'coaching_offline'
  )
  AND is_active = true;

-- =============================================
-- STEP 3: Insert Monthly Plans (1 per class)
-- =============================================
-- Monthly plan: 10% surcharge on annual, divided into 12 monthly payments.
-- Student pays first month at enrollment; remaining 11 are auto-generated as student_fees.
-- total_amount = registration_fee + (annual_fee * 1.10)  [theoretical yearly total]
-- monthly_fee = CEIL(annual_fee * 1.10 / 12)

-- Class 6 (annual: 9799, monthly: CEIL(9799*1.10/12) = 899)
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id,
  'Monthly Plan (+10%)',
  'Pay monthly with 10% annual surcharge. First month due at enrollment, remaining 11 months billed monthly.',
  499, 10779, 0, '+10% surcharge', 11278, false, 12, 'standard', 0, NULL,
  '{"plan_code":"M","installments":12,"discount_percent":-10,"annual_fee":9799,"surcharge_percent":10,"annual_with_surcharge":10779,"monthly_fee":899}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'coaching_offline' AND ac.slug = 'class-6'
AND NOT EXISTS (
  SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'M' AND cfp.is_active = true
);

-- Class 7 (annual: 10799, monthly: CEIL(10799*1.10/12) = 990)
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id,
  'Monthly Plan (+10%)',
  'Pay monthly with 10% annual surcharge. First month due at enrollment, remaining 11 months billed monthly.',
  499, 11879, 0, '+10% surcharge', 12378, false, 12, 'standard', 0, NULL,
  '{"plan_code":"M","installments":12,"discount_percent":-10,"annual_fee":10799,"surcharge_percent":10,"annual_with_surcharge":11879,"monthly_fee":990}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'coaching_offline' AND ac.slug = 'class-7'
AND NOT EXISTS (
  SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'M' AND cfp.is_active = true
);

-- Class 8 (annual: 11999, monthly: CEIL(11999*1.10/12) = 1100)
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id,
  'Monthly Plan (+10%)',
  'Pay monthly with 10% annual surcharge. First month due at enrollment, remaining 11 months billed monthly.',
  499, 13199, 0, '+10% surcharge', 13698, false, 12, 'standard', 0, NULL,
  '{"plan_code":"M","installments":12,"discount_percent":-10,"annual_fee":11999,"surcharge_percent":10,"annual_with_surcharge":13199,"monthly_fee":1100}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'coaching_offline' AND ac.slug = 'class-8'
AND NOT EXISTS (
  SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'M' AND cfp.is_active = true
);

-- Class 9 (annual: 17000, monthly: CEIL(17000*1.10/12) = 1559)
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id,
  'Monthly Plan (+10%)',
  'Pay monthly with 10% annual surcharge. First month due at enrollment, remaining 11 months billed monthly.',
  499, 18700, 0, '+10% surcharge', 19199, false, 12, 'standard', 0, NULL,
  '{"plan_code":"M","installments":12,"discount_percent":-10,"annual_fee":17000,"surcharge_percent":10,"annual_with_surcharge":18700,"monthly_fee":1559}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'coaching_offline' AND ac.slug = 'class-9'
AND NOT EXISTS (
  SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'M' AND cfp.is_active = true
);

-- Class 10 (annual: 21000, monthly: CEIL(21000*1.10/12) = 1925)
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id,
  'Monthly Plan (+10%)',
  'Pay monthly with 10% annual surcharge. First month due at enrollment, remaining 11 months billed monthly.',
  499, 23100, 0, '+10% surcharge', 23599, false, 12, 'standard', 0, NULL,
  '{"plan_code":"M","installments":12,"discount_percent":-10,"annual_fee":21000,"surcharge_percent":10,"annual_with_surcharge":23100,"monthly_fee":1925}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'coaching_offline' AND ac.slug = 'class-10'
AND NOT EXISTS (
  SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'M' AND cfp.is_active = true
);

-- Class 11 (annual: 26000, monthly: CEIL(26000*1.10/12) = 2384)
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id,
  'Monthly Plan (+10%)',
  'Pay monthly with 10% annual surcharge. First month due at enrollment, remaining 11 months billed monthly.',
  499, 28600, 0, '+10% surcharge', 29099, false, 12, 'standard', 0, NULL,
  '{"plan_code":"M","installments":12,"discount_percent":-10,"annual_fee":26000,"surcharge_percent":10,"annual_with_surcharge":28600,"monthly_fee":2384}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'coaching_offline' AND ac.slug = 'class-11'
AND NOT EXISTS (
  SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'M' AND cfp.is_active = true
);

-- Class 12 (annual: 33000, monthly: CEIL(33000*1.10/12) = 3025)
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id,
  'Monthly Plan (+10%)',
  'Pay monthly with 10% annual surcharge. First month due at enrollment, remaining 11 months billed monthly.',
  499, 36300, 0, '+10% surcharge', 36799, false, 12, 'standard', 0, NULL,
  '{"plan_code":"M","installments":12,"discount_percent":-10,"annual_fee":33000,"surcharge_percent":10,"annual_with_surcharge":36300,"monthly_fee":3025}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'coaching_offline' AND ac.slug = 'class-12'
AND NOT EXISTS (
  SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'M' AND cfp.is_active = true
);
