-- =============================================
-- MIGRATION 022: HOME TUITION — 3 LOCATIONS + 4 PLAN TYPES
-- =============================================
-- Changes:
--   1. Rename existing 15 classes → "(Lalganj)", add location metadata
--   2. Update display_order of existing Lalganj plans (C→2, D→3)
--   3. Add Monthly (+10%) and 4-Installment (5% OFF) plans for Lalganj
--   4. Create 15 Pratapgarh classes with 4 plans each
--   5. Create 15 Prayagraj classes with 4 plans each
--
-- Locations: Lalganj, Pratapgarh, Prayagraj
-- Plan types (per class):
--   M: Monthly (+10% surcharge, 12 monthly payments)
--   E: 4-Installment (5% OFF, quarterly)
--   C: 2-Installment (10% OFF) — DEFAULT
--   D: One-Time (15% OFF) — "Best Value"
--
-- Registration fee: ₹499 for all classes
-- =============================================

-- =============================================
-- STEP 1: Rename existing Lalganj classes + add location metadata
-- =============================================

UPDATE academic_classes SET name = 'Nursery (Lalganj)', slug = 'nursery-lalganj', metadata = '{"location":"lalganj"}'::jsonb, updated_at = NOW()
WHERE slug = 'nursery' AND course_type_id = (SELECT id FROM course_types WHERE slug = 'home_tuition');

UPDATE academic_classes SET name = 'LKG (Lalganj)', slug = 'lkg-lalganj', metadata = '{"location":"lalganj"}'::jsonb, updated_at = NOW()
WHERE slug = 'lkg' AND course_type_id = (SELECT id FROM course_types WHERE slug = 'home_tuition');

UPDATE academic_classes SET name = 'UKG (Lalganj)', slug = 'ukg-lalganj', metadata = '{"location":"lalganj"}'::jsonb, updated_at = NOW()
WHERE slug = 'ukg' AND course_type_id = (SELECT id FROM course_types WHERE slug = 'home_tuition');

UPDATE academic_classes SET name = 'Class 1 (Lalganj)', slug = 'class-1-lalganj', metadata = '{"location":"lalganj"}'::jsonb, updated_at = NOW()
WHERE slug = 'class-1' AND course_type_id = (SELECT id FROM course_types WHERE slug = 'home_tuition');

UPDATE academic_classes SET name = 'Class 2 (Lalganj)', slug = 'class-2-lalganj', metadata = '{"location":"lalganj"}'::jsonb, updated_at = NOW()
WHERE slug = 'class-2' AND course_type_id = (SELECT id FROM course_types WHERE slug = 'home_tuition');

UPDATE academic_classes SET name = 'Class 3 (Lalganj)', slug = 'class-3-lalganj', metadata = '{"location":"lalganj"}'::jsonb, updated_at = NOW()
WHERE slug = 'class-3' AND course_type_id = (SELECT id FROM course_types WHERE slug = 'home_tuition');

UPDATE academic_classes SET name = 'Class 4 (Lalganj)', slug = 'class-4-lalganj', metadata = '{"location":"lalganj"}'::jsonb, updated_at = NOW()
WHERE slug = 'class-4' AND course_type_id = (SELECT id FROM course_types WHERE slug = 'home_tuition');

UPDATE academic_classes SET name = 'Class 5 (Lalganj)', slug = 'class-5-lalganj', metadata = '{"location":"lalganj"}'::jsonb, updated_at = NOW()
WHERE slug = 'class-5' AND course_type_id = (SELECT id FROM course_types WHERE slug = 'home_tuition');

UPDATE academic_classes SET name = 'Class 6 (Lalganj)', slug = 'class-6-lalganj', metadata = '{"location":"lalganj"}'::jsonb, updated_at = NOW()
WHERE slug = 'class-6' AND course_type_id = (SELECT id FROM course_types WHERE slug = 'home_tuition');

UPDATE academic_classes SET name = 'Class 7 (Lalganj)', slug = 'class-7-lalganj', metadata = '{"location":"lalganj"}'::jsonb, updated_at = NOW()
WHERE slug = 'class-7' AND course_type_id = (SELECT id FROM course_types WHERE slug = 'home_tuition');

UPDATE academic_classes SET name = 'Class 8 (Lalganj)', slug = 'class-8-lalganj', metadata = '{"location":"lalganj"}'::jsonb, updated_at = NOW()
WHERE slug = 'class-8' AND course_type_id = (SELECT id FROM course_types WHERE slug = 'home_tuition');

UPDATE academic_classes SET name = 'Class 9 (Lalganj)', slug = 'class-9-lalganj', metadata = '{"location":"lalganj"}'::jsonb, updated_at = NOW()
WHERE slug = 'class-9' AND course_type_id = (SELECT id FROM course_types WHERE slug = 'home_tuition');

UPDATE academic_classes SET name = 'Class 10 (Lalganj)', slug = 'class-10-lalganj', metadata = '{"location":"lalganj"}'::jsonb, updated_at = NOW()
WHERE slug = 'class-10' AND course_type_id = (SELECT id FROM course_types WHERE slug = 'home_tuition');

UPDATE academic_classes SET name = 'Class 11 (Lalganj)', slug = 'class-11-lalganj', metadata = '{"location":"lalganj"}'::jsonb, updated_at = NOW()
WHERE slug = 'class-11' AND course_type_id = (SELECT id FROM course_types WHERE slug = 'home_tuition');

UPDATE academic_classes SET name = 'Class 12 (Lalganj)', slug = 'class-12-lalganj', metadata = '{"location":"lalganj"}'::jsonb, updated_at = NOW()
WHERE slug = 'class-12' AND course_type_id = (SELECT id FROM course_types WHERE slug = 'home_tuition');

-- =============================================
-- STEP 2: Update display_order of existing Lalganj plans
-- Plan C (2-inst) → display_order 2, Plan D (one-time) → display_order 3
-- =============================================

UPDATE class_fee_plans SET display_order = 2, updated_at = NOW()
WHERE metadata->>'plan_code' = 'C' AND class_id IN (
  SELECT ac.id FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
  WHERE ct.slug = 'home_tuition'
) AND is_active = true;

UPDATE class_fee_plans SET display_order = 3, updated_at = NOW()
WHERE metadata->>'plan_code' = 'D' AND class_id IN (
  SELECT ac.id FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
  WHERE ct.slug = 'home_tuition'
) AND is_active = true;

-- =============================================
-- STEP 3: Add Monthly (+10%) plans for Lalganj
-- Formula: surcharge = annual * 1.10, monthly = surcharge / 12, total = 499 + surcharge
-- =============================================

-- Nursery (annual: 24000, surcharge: 26400, monthly: 2200)
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, 'Monthly Plan (+10%)', 'Pay monthly with 10% annual surcharge. First month due at enrollment, remaining 11 months billed monthly.',
  499, 26400, 0, '+10% surcharge', 26899, false, 12, 'standard', 0, NULL,
  '{"plan_code":"M","installments":12,"discount_percent":-10,"annual_fee":24000,"surcharge_percent":10,"annual_with_surcharge":26400,"monthly_fee":2200}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'nursery-lalganj'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'M' AND cfp.is_active = true);

-- LKG (annual: 24600, surcharge: 27060, monthly: 2255)
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, 'Monthly Plan (+10%)', 'Pay monthly with 10% annual surcharge. First month due at enrollment, remaining 11 months billed monthly.',
  499, 27060, 0, '+10% surcharge', 27559, false, 12, 'standard', 0, NULL,
  '{"plan_code":"M","installments":12,"discount_percent":-10,"annual_fee":24600,"surcharge_percent":10,"annual_with_surcharge":27060,"monthly_fee":2255}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'lkg-lalganj'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'M' AND cfp.is_active = true);

-- UKG (annual: 25200, surcharge: 27720, monthly: 2310)
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, 'Monthly Plan (+10%)', 'Pay monthly with 10% annual surcharge. First month due at enrollment, remaining 11 months billed monthly.',
  499, 27720, 0, '+10% surcharge', 28219, false, 12, 'standard', 0, NULL,
  '{"plan_code":"M","installments":12,"discount_percent":-10,"annual_fee":25200,"surcharge_percent":10,"annual_with_surcharge":27720,"monthly_fee":2310}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'ukg-lalganj'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'M' AND cfp.is_active = true);

-- Class 1 (annual: 25800, surcharge: 28380, monthly: 2365)
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, 'Monthly Plan (+10%)', 'Pay monthly with 10% annual surcharge. First month due at enrollment, remaining 11 months billed monthly.',
  499, 28380, 0, '+10% surcharge', 28879, false, 12, 'standard', 0, NULL,
  '{"plan_code":"M","installments":12,"discount_percent":-10,"annual_fee":25800,"surcharge_percent":10,"annual_with_surcharge":28380,"monthly_fee":2365}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-1-lalganj'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'M' AND cfp.is_active = true);

-- Class 2 (annual: 26400, surcharge: 29040, monthly: 2420)
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, 'Monthly Plan (+10%)', 'Pay monthly with 10% annual surcharge. First month due at enrollment, remaining 11 months billed monthly.',
  499, 29040, 0, '+10% surcharge', 29539, false, 12, 'standard', 0, NULL,
  '{"plan_code":"M","installments":12,"discount_percent":-10,"annual_fee":26400,"surcharge_percent":10,"annual_with_surcharge":29040,"monthly_fee":2420}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-2-lalganj'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'M' AND cfp.is_active = true);

-- Class 3 (annual: 27000, surcharge: 29700, monthly: 2475)
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, 'Monthly Plan (+10%)', 'Pay monthly with 10% annual surcharge. First month due at enrollment, remaining 11 months billed monthly.',
  499, 29700, 0, '+10% surcharge', 30199, false, 12, 'standard', 0, NULL,
  '{"plan_code":"M","installments":12,"discount_percent":-10,"annual_fee":27000,"surcharge_percent":10,"annual_with_surcharge":29700,"monthly_fee":2475}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-3-lalganj'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'M' AND cfp.is_active = true);

-- Class 4 (annual: 27600, surcharge: 30360, monthly: 2530)
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, 'Monthly Plan (+10%)', 'Pay monthly with 10% annual surcharge. First month due at enrollment, remaining 11 months billed monthly.',
  499, 30360, 0, '+10% surcharge', 30859, false, 12, 'standard', 0, NULL,
  '{"plan_code":"M","installments":12,"discount_percent":-10,"annual_fee":27600,"surcharge_percent":10,"annual_with_surcharge":30360,"monthly_fee":2530}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-4-lalganj'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'M' AND cfp.is_active = true);

-- Class 5 (annual: 30000, surcharge: 33000, monthly: 2750)
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, 'Monthly Plan (+10%)', 'Pay monthly with 10% annual surcharge. First month due at enrollment, remaining 11 months billed monthly.',
  499, 33000, 0, '+10% surcharge', 33499, false, 12, 'standard', 0, NULL,
  '{"plan_code":"M","installments":12,"discount_percent":-10,"annual_fee":30000,"surcharge_percent":10,"annual_with_surcharge":33000,"monthly_fee":2750}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-5-lalganj'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'M' AND cfp.is_active = true);

-- Class 6 (annual: 31200, surcharge: 34320, monthly: 2860)
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, 'Monthly Plan (+10%)', 'Pay monthly with 10% annual surcharge. First month due at enrollment, remaining 11 months billed monthly.',
  499, 34320, 0, '+10% surcharge', 34819, false, 12, 'standard', 0, NULL,
  '{"plan_code":"M","installments":12,"discount_percent":-10,"annual_fee":31200,"surcharge_percent":10,"annual_with_surcharge":34320,"monthly_fee":2860}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-6-lalganj'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'M' AND cfp.is_active = true);

-- Class 7 (annual: 32400, surcharge: 35640, monthly: 2970)
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, 'Monthly Plan (+10%)', 'Pay monthly with 10% annual surcharge. First month due at enrollment, remaining 11 months billed monthly.',
  499, 35640, 0, '+10% surcharge', 36139, false, 12, 'standard', 0, NULL,
  '{"plan_code":"M","installments":12,"discount_percent":-10,"annual_fee":32400,"surcharge_percent":10,"annual_with_surcharge":35640,"monthly_fee":2970}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-7-lalganj'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'M' AND cfp.is_active = true);

-- Class 8 (annual: 33600, surcharge: 36960, monthly: 3080)
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, 'Monthly Plan (+10%)', 'Pay monthly with 10% annual surcharge. First month due at enrollment, remaining 11 months billed monthly.',
  499, 36960, 0, '+10% surcharge', 37459, false, 12, 'standard', 0, NULL,
  '{"plan_code":"M","installments":12,"discount_percent":-10,"annual_fee":33600,"surcharge_percent":10,"annual_with_surcharge":36960,"monthly_fee":3080}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-8-lalganj'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'M' AND cfp.is_active = true);

-- Class 9 (annual: 38400, surcharge: 42240, monthly: 3520)
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, 'Monthly Plan (+10%)', 'Pay monthly with 10% annual surcharge. First month due at enrollment, remaining 11 months billed monthly.',
  499, 42240, 0, '+10% surcharge', 42739, false, 12, 'standard', 0, NULL,
  '{"plan_code":"M","installments":12,"discount_percent":-10,"annual_fee":38400,"surcharge_percent":10,"annual_with_surcharge":42240,"monthly_fee":3520}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-9-lalganj'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'M' AND cfp.is_active = true);

-- Class 10 (annual: 42000, surcharge: 46200, monthly: 3850)
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, 'Monthly Plan (+10%)', 'Pay monthly with 10% annual surcharge. First month due at enrollment, remaining 11 months billed monthly.',
  499, 46200, 0, '+10% surcharge', 46699, false, 12, 'standard', 0, NULL,
  '{"plan_code":"M","installments":12,"discount_percent":-10,"annual_fee":42000,"surcharge_percent":10,"annual_with_surcharge":46200,"monthly_fee":3850}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-10-lalganj'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'M' AND cfp.is_active = true);

-- Class 11 (annual: 72000, surcharge: 79200, monthly: 6600)
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, 'Monthly Plan (+10%)', 'Pay monthly with 10% annual surcharge. First month due at enrollment, remaining 11 months billed monthly.',
  499, 79200, 0, '+10% surcharge', 79699, false, 12, 'standard', 0, NULL,
  '{"plan_code":"M","installments":12,"discount_percent":-10,"annual_fee":72000,"surcharge_percent":10,"annual_with_surcharge":79200,"monthly_fee":6600}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-11-lalganj'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'M' AND cfp.is_active = true);

-- Class 12 (annual: 78000, surcharge: 85800, monthly: 7150)
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, 'Monthly Plan (+10%)', 'Pay monthly with 10% annual surcharge. First month due at enrollment, remaining 11 months billed monthly.',
  499, 85800, 0, '+10% surcharge', 86299, false, 12, 'standard', 0, NULL,
  '{"plan_code":"M","installments":12,"discount_percent":-10,"annual_fee":78000,"surcharge_percent":10,"annual_with_surcharge":85800,"monthly_fee":7150}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-12-lalganj'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'M' AND cfp.is_active = true);

-- =============================================
-- STEP 4: Add 4-Installment (5% OFF) plans for Lalganj
-- Formula: discounted = annual * 0.95, quarterly = FLOOR(disc/4), inst_1 = disc - 3*quarterly
-- =============================================

-- Nursery (annual: 24000, disc: 22800, q: 5700)
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, '4-Installment Plan (5% OFF)', 'Pay in 4 quarterly installments with 5% discount. 1st at admission, rest every 3 months.',
  499, 24000, 1200, '5% OFF', 23299, false, 12, 'standard', 1, NULL,
  '{"plan_code":"E","installments":4,"discount_percent":5,"annual_fee":24000,"discounted_fee":22800,"installment_1":5700,"quarterly_fee":5700}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'nursery-lalganj'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'E' AND cfp.is_active = true);

-- LKG (annual: 24600, disc: 23370, q: 5842, i1: 5844)
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, '4-Installment Plan (5% OFF)', 'Pay in 4 quarterly installments with 5% discount. 1st at admission, rest every 3 months.',
  499, 24600, 1230, '5% OFF', 23869, false, 12, 'standard', 1, NULL,
  '{"plan_code":"E","installments":4,"discount_percent":5,"annual_fee":24600,"discounted_fee":23370,"installment_1":5844,"quarterly_fee":5842}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'lkg-lalganj'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'E' AND cfp.is_active = true);

-- UKG (annual: 25200, disc: 23940, q: 5985)
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, '4-Installment Plan (5% OFF)', 'Pay in 4 quarterly installments with 5% discount. 1st at admission, rest every 3 months.',
  499, 25200, 1260, '5% OFF', 24439, false, 12, 'standard', 1, NULL,
  '{"plan_code":"E","installments":4,"discount_percent":5,"annual_fee":25200,"discounted_fee":23940,"installment_1":5985,"quarterly_fee":5985}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'ukg-lalganj'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'E' AND cfp.is_active = true);

-- Class 1 (annual: 25800, disc: 24510, q: 6127, i1: 6129)
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, '4-Installment Plan (5% OFF)', 'Pay in 4 quarterly installments with 5% discount. 1st at admission, rest every 3 months.',
  499, 25800, 1290, '5% OFF', 25009, false, 12, 'standard', 1, NULL,
  '{"plan_code":"E","installments":4,"discount_percent":5,"annual_fee":25800,"discounted_fee":24510,"installment_1":6129,"quarterly_fee":6127}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-1-lalganj'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'E' AND cfp.is_active = true);

-- Class 2 (annual: 26400, disc: 25080, q: 6270)
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, '4-Installment Plan (5% OFF)', 'Pay in 4 quarterly installments with 5% discount. 1st at admission, rest every 3 months.',
  499, 26400, 1320, '5% OFF', 25579, false, 12, 'standard', 1, NULL,
  '{"plan_code":"E","installments":4,"discount_percent":5,"annual_fee":26400,"discounted_fee":25080,"installment_1":6270,"quarterly_fee":6270}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-2-lalganj'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'E' AND cfp.is_active = true);

-- Class 3 (annual: 27000, disc: 25650, q: 6412, i1: 6414)
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, '4-Installment Plan (5% OFF)', 'Pay in 4 quarterly installments with 5% discount. 1st at admission, rest every 3 months.',
  499, 27000, 1350, '5% OFF', 26149, false, 12, 'standard', 1, NULL,
  '{"plan_code":"E","installments":4,"discount_percent":5,"annual_fee":27000,"discounted_fee":25650,"installment_1":6414,"quarterly_fee":6412}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-3-lalganj'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'E' AND cfp.is_active = true);

-- Class 4 (annual: 27600, disc: 26220, q: 6555)
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, '4-Installment Plan (5% OFF)', 'Pay in 4 quarterly installments with 5% discount. 1st at admission, rest every 3 months.',
  499, 27600, 1380, '5% OFF', 26719, false, 12, 'standard', 1, NULL,
  '{"plan_code":"E","installments":4,"discount_percent":5,"annual_fee":27600,"discounted_fee":26220,"installment_1":6555,"quarterly_fee":6555}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-4-lalganj'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'E' AND cfp.is_active = true);

-- Class 5 (annual: 30000, disc: 28500, q: 7125)
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, '4-Installment Plan (5% OFF)', 'Pay in 4 quarterly installments with 5% discount. 1st at admission, rest every 3 months.',
  499, 30000, 1500, '5% OFF', 28999, false, 12, 'standard', 1, NULL,
  '{"plan_code":"E","installments":4,"discount_percent":5,"annual_fee":30000,"discounted_fee":28500,"installment_1":7125,"quarterly_fee":7125}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-5-lalganj'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'E' AND cfp.is_active = true);

-- Class 6 (annual: 31200, disc: 29640, q: 7410)
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, '4-Installment Plan (5% OFF)', 'Pay in 4 quarterly installments with 5% discount. 1st at admission, rest every 3 months.',
  499, 31200, 1560, '5% OFF', 30139, false, 12, 'standard', 1, NULL,
  '{"plan_code":"E","installments":4,"discount_percent":5,"annual_fee":31200,"discounted_fee":29640,"installment_1":7410,"quarterly_fee":7410}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-6-lalganj'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'E' AND cfp.is_active = true);

-- Class 7 (annual: 32400, disc: 30780, q: 7695)
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, '4-Installment Plan (5% OFF)', 'Pay in 4 quarterly installments with 5% discount. 1st at admission, rest every 3 months.',
  499, 32400, 1620, '5% OFF', 31279, false, 12, 'standard', 1, NULL,
  '{"plan_code":"E","installments":4,"discount_percent":5,"annual_fee":32400,"discounted_fee":30780,"installment_1":7695,"quarterly_fee":7695}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-7-lalganj'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'E' AND cfp.is_active = true);

-- Class 8 (annual: 33600, disc: 31920, q: 7980)
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, '4-Installment Plan (5% OFF)', 'Pay in 4 quarterly installments with 5% discount. 1st at admission, rest every 3 months.',
  499, 33600, 1680, '5% OFF', 32419, false, 12, 'standard', 1, NULL,
  '{"plan_code":"E","installments":4,"discount_percent":5,"annual_fee":33600,"discounted_fee":31920,"installment_1":7980,"quarterly_fee":7980}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-8-lalganj'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'E' AND cfp.is_active = true);

-- Class 9 (annual: 38400, disc: 36480, q: 9120)
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, '4-Installment Plan (5% OFF)', 'Pay in 4 quarterly installments with 5% discount. 1st at admission, rest every 3 months.',
  499, 38400, 1920, '5% OFF', 36979, false, 12, 'standard', 1, NULL,
  '{"plan_code":"E","installments":4,"discount_percent":5,"annual_fee":38400,"discounted_fee":36480,"installment_1":9120,"quarterly_fee":9120}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-9-lalganj'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'E' AND cfp.is_active = true);

-- Class 10 (annual: 42000, disc: 39900, q: 9975)
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, '4-Installment Plan (5% OFF)', 'Pay in 4 quarterly installments with 5% discount. 1st at admission, rest every 3 months.',
  499, 42000, 2100, '5% OFF', 40399, false, 12, 'standard', 1, NULL,
  '{"plan_code":"E","installments":4,"discount_percent":5,"annual_fee":42000,"discounted_fee":39900,"installment_1":9975,"quarterly_fee":9975}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-10-lalganj'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'E' AND cfp.is_active = true);

-- Class 11 (annual: 72000, disc: 68400, q: 17100)
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, '4-Installment Plan (5% OFF)', 'Pay in 4 quarterly installments with 5% discount. 1st at admission, rest every 3 months.',
  499, 72000, 3600, '5% OFF', 68899, false, 12, 'standard', 1, NULL,
  '{"plan_code":"E","installments":4,"discount_percent":5,"annual_fee":72000,"discounted_fee":68400,"installment_1":17100,"quarterly_fee":17100}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-11-lalganj'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'E' AND cfp.is_active = true);

-- Class 12 (annual: 78000, disc: 74100, q: 18525)
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, '4-Installment Plan (5% OFF)', 'Pay in 4 quarterly installments with 5% discount. 1st at admission, rest every 3 months.',
  499, 78000, 3900, '5% OFF', 74599, false, 12, 'standard', 1, NULL,
  '{"plan_code":"E","installments":4,"discount_percent":5,"annual_fee":78000,"discounted_fee":74100,"installment_1":18525,"quarterly_fee":18525}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-12-lalganj'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'E' AND cfp.is_active = true);

-- =============================================
-- STEP 5: Insert Pratapgarh classes (15)
-- Annual fees: Nursery=30000, LKG=30600, UKG=31200, 1=32400, 2=33600, 3=34800,
--   4=36000, 5=37200, 6=38400, 7=39600, 8=40800, 9=45600, 10=49200, 11=79200, 12=85200
-- =============================================

INSERT INTO academic_classes (course_type_id, name, slug, description, duration, features, display_order, metadata)
SELECT ct.id, 'Nursery (Pratapgarh)', 'nursery-pratapgarh', 'Personalized home tutoring for Nursery students in Pratapgarh.', '1 Year',
  ARRAY['Personalized 1-on-1 attention','Flexible scheduling','Play-based learning','Regular progress tracking'], 1, '{"location":"pratapgarh"}'::jsonb
FROM course_types ct WHERE ct.slug = 'home_tuition'
AND NOT EXISTS (SELECT 1 FROM academic_classes ac WHERE ac.course_type_id = ct.id AND ac.slug = 'nursery-pratapgarh');

INSERT INTO academic_classes (course_type_id, name, slug, description, duration, features, display_order, metadata)
SELECT ct.id, 'LKG (Pratapgarh)', 'lkg-pratapgarh', 'Personalized home tutoring for LKG students in Pratapgarh.', '1 Year',
  ARRAY['Personalized 1-on-1 attention','Flexible scheduling','Reading & writing readiness','Regular progress tracking'], 2, '{"location":"pratapgarh"}'::jsonb
FROM course_types ct WHERE ct.slug = 'home_tuition'
AND NOT EXISTS (SELECT 1 FROM academic_classes ac WHERE ac.course_type_id = ct.id AND ac.slug = 'lkg-pratapgarh');

INSERT INTO academic_classes (course_type_id, name, slug, description, duration, features, display_order, metadata)
SELECT ct.id, 'UKG (Pratapgarh)', 'ukg-pratapgarh', 'Personalized home tutoring for UKG students in Pratapgarh.', '1 Year',
  ARRAY['Personalized 1-on-1 attention','Flexible scheduling','School readiness prep','Regular progress tracking'], 3, '{"location":"pratapgarh"}'::jsonb
FROM course_types ct WHERE ct.slug = 'home_tuition'
AND NOT EXISTS (SELECT 1 FROM academic_classes ac WHERE ac.course_type_id = ct.id AND ac.slug = 'ukg-pratapgarh');

INSERT INTO academic_classes (course_type_id, name, slug, description, duration, features, display_order, metadata)
SELECT ct.id, 'Class 1 (Pratapgarh)', 'class-1-pratapgarh', 'Personalized home tutoring for Class 1 students in Pratapgarh.', '1 Year',
  ARRAY['Personalized 1-on-1 attention','Flexible scheduling','NCERT-aligned curriculum','Regular progress tracking'], 4, '{"location":"pratapgarh"}'::jsonb
FROM course_types ct WHERE ct.slug = 'home_tuition'
AND NOT EXISTS (SELECT 1 FROM academic_classes ac WHERE ac.course_type_id = ct.id AND ac.slug = 'class-1-pratapgarh');

INSERT INTO academic_classes (course_type_id, name, slug, description, duration, features, display_order, metadata)
SELECT ct.id, 'Class 2 (Pratapgarh)', 'class-2-pratapgarh', 'Personalized home tutoring for Class 2 students in Pratapgarh.', '1 Year',
  ARRAY['Personalized 1-on-1 attention','Flexible scheduling','NCERT-aligned curriculum','Regular progress tracking'], 5, '{"location":"pratapgarh"}'::jsonb
FROM course_types ct WHERE ct.slug = 'home_tuition'
AND NOT EXISTS (SELECT 1 FROM academic_classes ac WHERE ac.course_type_id = ct.id AND ac.slug = 'class-2-pratapgarh');

INSERT INTO academic_classes (course_type_id, name, slug, description, duration, features, display_order, metadata)
SELECT ct.id, 'Class 3 (Pratapgarh)', 'class-3-pratapgarh', 'Personalized home tutoring for Class 3 students in Pratapgarh.', '1 Year',
  ARRAY['Personalized 1-on-1 attention','Flexible scheduling','NCERT-aligned curriculum','Regular progress tracking'], 6, '{"location":"pratapgarh"}'::jsonb
FROM course_types ct WHERE ct.slug = 'home_tuition'
AND NOT EXISTS (SELECT 1 FROM academic_classes ac WHERE ac.course_type_id = ct.id AND ac.slug = 'class-3-pratapgarh');

INSERT INTO academic_classes (course_type_id, name, slug, description, duration, features, display_order, metadata)
SELECT ct.id, 'Class 4 (Pratapgarh)', 'class-4-pratapgarh', 'Personalized home tutoring for Class 4 students in Pratapgarh.', '1 Year',
  ARRAY['Personalized 1-on-1 attention','Flexible scheduling','NCERT-aligned curriculum','Regular progress tracking'], 7, '{"location":"pratapgarh"}'::jsonb
FROM course_types ct WHERE ct.slug = 'home_tuition'
AND NOT EXISTS (SELECT 1 FROM academic_classes ac WHERE ac.course_type_id = ct.id AND ac.slug = 'class-4-pratapgarh');

INSERT INTO academic_classes (course_type_id, name, slug, description, duration, features, display_order, metadata)
SELECT ct.id, 'Class 5 (Pratapgarh)', 'class-5-pratapgarh', 'Personalized home tutoring for Class 5 students in Pratapgarh.', '1 Year',
  ARRAY['Personalized 1-on-1 attention','Flexible scheduling','NCERT-aligned curriculum','Regular progress tracking'], 8, '{"location":"pratapgarh"}'::jsonb
FROM course_types ct WHERE ct.slug = 'home_tuition'
AND NOT EXISTS (SELECT 1 FROM academic_classes ac WHERE ac.course_type_id = ct.id AND ac.slug = 'class-5-pratapgarh');

INSERT INTO academic_classes (course_type_id, name, slug, description, duration, features, display_order, metadata)
SELECT ct.id, 'Class 6 (Pratapgarh)', 'class-6-pratapgarh', 'Personalized home tutoring for Class 6 students in Pratapgarh.', '1 Year',
  ARRAY['Personalized 1-on-1 attention','Flexible scheduling','NCERT-aligned curriculum','Regular progress tracking'], 9, '{"location":"pratapgarh"}'::jsonb
FROM course_types ct WHERE ct.slug = 'home_tuition'
AND NOT EXISTS (SELECT 1 FROM academic_classes ac WHERE ac.course_type_id = ct.id AND ac.slug = 'class-6-pratapgarh');

INSERT INTO academic_classes (course_type_id, name, slug, description, duration, features, display_order, metadata)
SELECT ct.id, 'Class 7 (Pratapgarh)', 'class-7-pratapgarh', 'Personalized home tutoring for Class 7 students in Pratapgarh.', '1 Year',
  ARRAY['Personalized 1-on-1 attention','Flexible scheduling','NCERT-aligned curriculum','Regular progress tracking'], 10, '{"location":"pratapgarh"}'::jsonb
FROM course_types ct WHERE ct.slug = 'home_tuition'
AND NOT EXISTS (SELECT 1 FROM academic_classes ac WHERE ac.course_type_id = ct.id AND ac.slug = 'class-7-pratapgarh');

INSERT INTO academic_classes (course_type_id, name, slug, description, duration, features, display_order, metadata)
SELECT ct.id, 'Class 8 (Pratapgarh)', 'class-8-pratapgarh', 'Personalized home tutoring for Class 8 students in Pratapgarh.', '1 Year',
  ARRAY['Personalized 1-on-1 attention','Flexible scheduling','NCERT-aligned curriculum','Regular progress tracking'], 11, '{"location":"pratapgarh"}'::jsonb
FROM course_types ct WHERE ct.slug = 'home_tuition'
AND NOT EXISTS (SELECT 1 FROM academic_classes ac WHERE ac.course_type_id = ct.id AND ac.slug = 'class-8-pratapgarh');

INSERT INTO academic_classes (course_type_id, name, slug, description, duration, features, display_order, metadata)
SELECT ct.id, 'Class 9 (Pratapgarh)', 'class-9-pratapgarh', 'Personalized home tutoring for Class 9 students in Pratapgarh.', '1 Year',
  ARRAY['Personalized 1-on-1 attention','Flexible scheduling','NCERT-aligned curriculum','Regular progress tracking'], 12, '{"location":"pratapgarh"}'::jsonb
FROM course_types ct WHERE ct.slug = 'home_tuition'
AND NOT EXISTS (SELECT 1 FROM academic_classes ac WHERE ac.course_type_id = ct.id AND ac.slug = 'class-9-pratapgarh');

INSERT INTO academic_classes (course_type_id, name, slug, description, duration, features, display_order, metadata)
SELECT ct.id, 'Class 10 (Pratapgarh)', 'class-10-pratapgarh', 'Personalized home tutoring for Class 10 students in Pratapgarh.', '1 Year',
  ARRAY['Personalized 1-on-1 attention','Flexible scheduling','NCERT-aligned curriculum','Regular progress tracking'], 13, '{"location":"pratapgarh"}'::jsonb
FROM course_types ct WHERE ct.slug = 'home_tuition'
AND NOT EXISTS (SELECT 1 FROM academic_classes ac WHERE ac.course_type_id = ct.id AND ac.slug = 'class-10-pratapgarh');

INSERT INTO academic_classes (course_type_id, name, slug, description, duration, features, display_order, metadata)
SELECT ct.id, 'Class 11 (Pratapgarh)', 'class-11-pratapgarh', 'Personalized home tutoring for Class 11 students in Pratapgarh.', '1 Year',
  ARRAY['Personalized 1-on-1 attention','Flexible scheduling','NCERT-aligned curriculum','Regular progress tracking'], 14, '{"location":"pratapgarh"}'::jsonb
FROM course_types ct WHERE ct.slug = 'home_tuition'
AND NOT EXISTS (SELECT 1 FROM academic_classes ac WHERE ac.course_type_id = ct.id AND ac.slug = 'class-11-pratapgarh');

INSERT INTO academic_classes (course_type_id, name, slug, description, duration, features, display_order, metadata)
SELECT ct.id, 'Class 12 (Pratapgarh)', 'class-12-pratapgarh', 'Personalized home tutoring for Class 12 students in Pratapgarh.', '1 Year',
  ARRAY['Personalized 1-on-1 attention','Flexible scheduling','NCERT-aligned curriculum','Regular progress tracking'], 15, '{"location":"pratapgarh"}'::jsonb
FROM course_types ct WHERE ct.slug = 'home_tuition'
AND NOT EXISTS (SELECT 1 FROM academic_classes ac WHERE ac.course_type_id = ct.id AND ac.slug = 'class-12-pratapgarh');

-- =============================================
-- STEP 6: Insert Prayagraj classes (15)
-- Annual fees: Nursery=36000, LKG=36600, UKG=37200, 1=38400, 2=39600, 3=40800,
--   4=42000, 5=43200, 6=44400, 7=45600, 8=46800, 9=51600, 10=56400, 11=86400, 12=92400
-- =============================================

INSERT INTO academic_classes (course_type_id, name, slug, description, duration, features, display_order, metadata)
SELECT ct.id, 'Nursery (Prayagraj)', 'nursery-prayagraj', 'Personalized home tutoring for Nursery students in Prayagraj.', '1 Year',
  ARRAY['Personalized 1-on-1 attention','Flexible scheduling','Play-based learning','Regular progress tracking'], 1, '{"location":"prayagraj"}'::jsonb
FROM course_types ct WHERE ct.slug = 'home_tuition'
AND NOT EXISTS (SELECT 1 FROM academic_classes ac WHERE ac.course_type_id = ct.id AND ac.slug = 'nursery-prayagraj');

INSERT INTO academic_classes (course_type_id, name, slug, description, duration, features, display_order, metadata)
SELECT ct.id, 'LKG (Prayagraj)', 'lkg-prayagraj', 'Personalized home tutoring for LKG students in Prayagraj.', '1 Year',
  ARRAY['Personalized 1-on-1 attention','Flexible scheduling','Reading & writing readiness','Regular progress tracking'], 2, '{"location":"prayagraj"}'::jsonb
FROM course_types ct WHERE ct.slug = 'home_tuition'
AND NOT EXISTS (SELECT 1 FROM academic_classes ac WHERE ac.course_type_id = ct.id AND ac.slug = 'lkg-prayagraj');

INSERT INTO academic_classes (course_type_id, name, slug, description, duration, features, display_order, metadata)
SELECT ct.id, 'UKG (Prayagraj)', 'ukg-prayagraj', 'Personalized home tutoring for UKG students in Prayagraj.', '1 Year',
  ARRAY['Personalized 1-on-1 attention','Flexible scheduling','School readiness prep','Regular progress tracking'], 3, '{"location":"prayagraj"}'::jsonb
FROM course_types ct WHERE ct.slug = 'home_tuition'
AND NOT EXISTS (SELECT 1 FROM academic_classes ac WHERE ac.course_type_id = ct.id AND ac.slug = 'ukg-prayagraj');

INSERT INTO academic_classes (course_type_id, name, slug, description, duration, features, display_order, metadata)
SELECT ct.id, 'Class 1 (Prayagraj)', 'class-1-prayagraj', 'Personalized home tutoring for Class 1 students in Prayagraj.', '1 Year',
  ARRAY['Personalized 1-on-1 attention','Flexible scheduling','NCERT-aligned curriculum','Regular progress tracking'], 4, '{"location":"prayagraj"}'::jsonb
FROM course_types ct WHERE ct.slug = 'home_tuition'
AND NOT EXISTS (SELECT 1 FROM academic_classes ac WHERE ac.course_type_id = ct.id AND ac.slug = 'class-1-prayagraj');

INSERT INTO academic_classes (course_type_id, name, slug, description, duration, features, display_order, metadata)
SELECT ct.id, 'Class 2 (Prayagraj)', 'class-2-prayagraj', 'Personalized home tutoring for Class 2 students in Prayagraj.', '1 Year',
  ARRAY['Personalized 1-on-1 attention','Flexible scheduling','NCERT-aligned curriculum','Regular progress tracking'], 5, '{"location":"prayagraj"}'::jsonb
FROM course_types ct WHERE ct.slug = 'home_tuition'
AND NOT EXISTS (SELECT 1 FROM academic_classes ac WHERE ac.course_type_id = ct.id AND ac.slug = 'class-2-prayagraj');

INSERT INTO academic_classes (course_type_id, name, slug, description, duration, features, display_order, metadata)
SELECT ct.id, 'Class 3 (Prayagraj)', 'class-3-prayagraj', 'Personalized home tutoring for Class 3 students in Prayagraj.', '1 Year',
  ARRAY['Personalized 1-on-1 attention','Flexible scheduling','NCERT-aligned curriculum','Regular progress tracking'], 6, '{"location":"prayagraj"}'::jsonb
FROM course_types ct WHERE ct.slug = 'home_tuition'
AND NOT EXISTS (SELECT 1 FROM academic_classes ac WHERE ac.course_type_id = ct.id AND ac.slug = 'class-3-prayagraj');

INSERT INTO academic_classes (course_type_id, name, slug, description, duration, features, display_order, metadata)
SELECT ct.id, 'Class 4 (Prayagraj)', 'class-4-prayagraj', 'Personalized home tutoring for Class 4 students in Prayagraj.', '1 Year',
  ARRAY['Personalized 1-on-1 attention','Flexible scheduling','NCERT-aligned curriculum','Regular progress tracking'], 7, '{"location":"prayagraj"}'::jsonb
FROM course_types ct WHERE ct.slug = 'home_tuition'
AND NOT EXISTS (SELECT 1 FROM academic_classes ac WHERE ac.course_type_id = ct.id AND ac.slug = 'class-4-prayagraj');

INSERT INTO academic_classes (course_type_id, name, slug, description, duration, features, display_order, metadata)
SELECT ct.id, 'Class 5 (Prayagraj)', 'class-5-prayagraj', 'Personalized home tutoring for Class 5 students in Prayagraj.', '1 Year',
  ARRAY['Personalized 1-on-1 attention','Flexible scheduling','NCERT-aligned curriculum','Regular progress tracking'], 8, '{"location":"prayagraj"}'::jsonb
FROM course_types ct WHERE ct.slug = 'home_tuition'
AND NOT EXISTS (SELECT 1 FROM academic_classes ac WHERE ac.course_type_id = ct.id AND ac.slug = 'class-5-prayagraj');

INSERT INTO academic_classes (course_type_id, name, slug, description, duration, features, display_order, metadata)
SELECT ct.id, 'Class 6 (Prayagraj)', 'class-6-prayagraj', 'Personalized home tutoring for Class 6 students in Prayagraj.', '1 Year',
  ARRAY['Personalized 1-on-1 attention','Flexible scheduling','NCERT-aligned curriculum','Regular progress tracking'], 9, '{"location":"prayagraj"}'::jsonb
FROM course_types ct WHERE ct.slug = 'home_tuition'
AND NOT EXISTS (SELECT 1 FROM academic_classes ac WHERE ac.course_type_id = ct.id AND ac.slug = 'class-6-prayagraj');

INSERT INTO academic_classes (course_type_id, name, slug, description, duration, features, display_order, metadata)
SELECT ct.id, 'Class 7 (Prayagraj)', 'class-7-prayagraj', 'Personalized home tutoring for Class 7 students in Prayagraj.', '1 Year',
  ARRAY['Personalized 1-on-1 attention','Flexible scheduling','NCERT-aligned curriculum','Regular progress tracking'], 10, '{"location":"prayagraj"}'::jsonb
FROM course_types ct WHERE ct.slug = 'home_tuition'
AND NOT EXISTS (SELECT 1 FROM academic_classes ac WHERE ac.course_type_id = ct.id AND ac.slug = 'class-7-prayagraj');

INSERT INTO academic_classes (course_type_id, name, slug, description, duration, features, display_order, metadata)
SELECT ct.id, 'Class 8 (Prayagraj)', 'class-8-prayagraj', 'Personalized home tutoring for Class 8 students in Prayagraj.', '1 Year',
  ARRAY['Personalized 1-on-1 attention','Flexible scheduling','NCERT-aligned curriculum','Regular progress tracking'], 11, '{"location":"prayagraj"}'::jsonb
FROM course_types ct WHERE ct.slug = 'home_tuition'
AND NOT EXISTS (SELECT 1 FROM academic_classes ac WHERE ac.course_type_id = ct.id AND ac.slug = 'class-8-prayagraj');

INSERT INTO academic_classes (course_type_id, name, slug, description, duration, features, display_order, metadata)
SELECT ct.id, 'Class 9 (Prayagraj)', 'class-9-prayagraj', 'Personalized home tutoring for Class 9 students in Prayagraj.', '1 Year',
  ARRAY['Personalized 1-on-1 attention','Flexible scheduling','NCERT-aligned curriculum','Regular progress tracking'], 12, '{"location":"prayagraj"}'::jsonb
FROM course_types ct WHERE ct.slug = 'home_tuition'
AND NOT EXISTS (SELECT 1 FROM academic_classes ac WHERE ac.course_type_id = ct.id AND ac.slug = 'class-9-prayagraj');

INSERT INTO academic_classes (course_type_id, name, slug, description, duration, features, display_order, metadata)
SELECT ct.id, 'Class 10 (Prayagraj)', 'class-10-prayagraj', 'Personalized home tutoring for Class 10 students in Prayagraj.', '1 Year',
  ARRAY['Personalized 1-on-1 attention','Flexible scheduling','NCERT-aligned curriculum','Regular progress tracking'], 13, '{"location":"prayagraj"}'::jsonb
FROM course_types ct WHERE ct.slug = 'home_tuition'
AND NOT EXISTS (SELECT 1 FROM academic_classes ac WHERE ac.course_type_id = ct.id AND ac.slug = 'class-10-prayagraj');

INSERT INTO academic_classes (course_type_id, name, slug, description, duration, features, display_order, metadata)
SELECT ct.id, 'Class 11 (Prayagraj)', 'class-11-prayagraj', 'Personalized home tutoring for Class 11 students in Prayagraj.', '1 Year',
  ARRAY['Personalized 1-on-1 attention','Flexible scheduling','NCERT-aligned curriculum','Regular progress tracking'], 14, '{"location":"prayagraj"}'::jsonb
FROM course_types ct WHERE ct.slug = 'home_tuition'
AND NOT EXISTS (SELECT 1 FROM academic_classes ac WHERE ac.course_type_id = ct.id AND ac.slug = 'class-11-prayagraj');

INSERT INTO academic_classes (course_type_id, name, slug, description, duration, features, display_order, metadata)
SELECT ct.id, 'Class 12 (Prayagraj)', 'class-12-prayagraj', 'Personalized home tutoring for Class 12 students in Prayagraj.', '1 Year',
  ARRAY['Personalized 1-on-1 attention','Flexible scheduling','NCERT-aligned curriculum','Regular progress tracking'], 15, '{"location":"prayagraj"}'::jsonb
FROM course_types ct WHERE ct.slug = 'home_tuition'
AND NOT EXISTS (SELECT 1 FROM academic_classes ac WHERE ac.course_type_id = ct.id AND ac.slug = 'class-12-prayagraj');

-- =============================================
-- STEP 7: Fee plans for Pratapgarh (4 plans x 15 classes)
-- =============================================

-- Nursery (Pratapgarh, annual: 30000)
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, 'Monthly Plan (+10%)', 'Pay monthly with 10% annual surcharge. First month due at enrollment, remaining 11 months billed monthly.',
  499, 33000, 0, '+10% surcharge', 33499, false, 12, 'standard', 0, NULL,
  '{"plan_code":"M","installments":12,"discount_percent":-10,"annual_fee":30000,"surcharge_percent":10,"annual_with_surcharge":33000,"monthly_fee":2750}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'nursery-pratapgarh'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'M' AND cfp.is_active = true);

INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, '4-Installment Plan (5% OFF)', 'Pay in 4 quarterly installments with 5% discount. 1st at admission, rest every 3 months.',
  499, 30000, 1500, '5% OFF', 28999, false, 12, 'standard', 1, NULL,
  '{"plan_code":"E","installments":4,"discount_percent":5,"annual_fee":30000,"discounted_fee":28500,"installment_1":7125,"quarterly_fee":7125}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'nursery-pratapgarh'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'E' AND cfp.is_active = true);

INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, '2-Installment Plan (10% OFF)', 'Pay in 2 easy installments with 10% discount. 1st at admission, 2nd after 6 months.',
  499, 30000, 3000, '10% OFF', 27499, true, 12, 'standard', 2, NULL,
  '{"plan_code":"C","installments":2,"discount_percent":10,"annual_fee":30000,"discounted_fee":27000,"installment_1":13500,"installment_2":13500}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'nursery-pratapgarh'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'C' AND cfp.is_active = true);

INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, 'One-Time Payment (15% OFF)', 'Pay the full amount at once and get 15% discount on annual fee.',
  499, 30000, 4500, '15% OFF', 25999, false, 12, 'standard', 3, 'Best Value',
  '{"plan_code":"D","installments":1,"discount_percent":15,"annual_fee":30000,"discounted_fee":25500}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'nursery-pratapgarh'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'D' AND cfp.is_active = true);

-- LKG (Pratapgarh, annual: 30600)
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, 'Monthly Plan (+10%)', 'Pay monthly with 10% annual surcharge. First month due at enrollment, remaining 11 months billed monthly.',
  499, 33660, 0, '+10% surcharge', 34159, false, 12, 'standard', 0, NULL,
  '{"plan_code":"M","installments":12,"discount_percent":-10,"annual_fee":30600,"surcharge_percent":10,"annual_with_surcharge":33660,"monthly_fee":2805}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'lkg-pratapgarh'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'M' AND cfp.is_active = true);

INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, '4-Installment Plan (5% OFF)', 'Pay in 4 quarterly installments with 5% discount. 1st at admission, rest every 3 months.',
  499, 30600, 1530, '5% OFF', 29569, false, 12, 'standard', 1, NULL,
  '{"plan_code":"E","installments":4,"discount_percent":5,"annual_fee":30600,"discounted_fee":29070,"installment_1":7269,"quarterly_fee":7267}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'lkg-pratapgarh'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'E' AND cfp.is_active = true);

INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, '2-Installment Plan (10% OFF)', 'Pay in 2 easy installments with 10% discount. 1st at admission, 2nd after 6 months.',
  499, 30600, 3060, '10% OFF', 28039, true, 12, 'standard', 2, NULL,
  '{"plan_code":"C","installments":2,"discount_percent":10,"annual_fee":30600,"discounted_fee":27540,"installment_1":13770,"installment_2":13770}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'lkg-pratapgarh'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'C' AND cfp.is_active = true);

INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, 'One-Time Payment (15% OFF)', 'Pay the full amount at once and get 15% discount on annual fee.',
  499, 30600, 4590, '15% OFF', 26509, false, 12, 'standard', 3, 'Best Value',
  '{"plan_code":"D","installments":1,"discount_percent":15,"annual_fee":30600,"discounted_fee":26010}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'lkg-pratapgarh'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'D' AND cfp.is_active = true);

-- UKG (Pratapgarh, annual: 31200)
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, 'Monthly Plan (+10%)', 'Pay monthly with 10% annual surcharge. First month due at enrollment, remaining 11 months billed monthly.',
  499, 34320, 0, '+10% surcharge', 34819, false, 12, 'standard', 0, NULL,
  '{"plan_code":"M","installments":12,"discount_percent":-10,"annual_fee":31200,"surcharge_percent":10,"annual_with_surcharge":34320,"monthly_fee":2860}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'ukg-pratapgarh'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'M' AND cfp.is_active = true);

INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, '4-Installment Plan (5% OFF)', 'Pay in 4 quarterly installments with 5% discount. 1st at admission, rest every 3 months.',
  499, 31200, 1560, '5% OFF', 30139, false, 12, 'standard', 1, NULL,
  '{"plan_code":"E","installments":4,"discount_percent":5,"annual_fee":31200,"discounted_fee":29640,"installment_1":7410,"quarterly_fee":7410}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'ukg-pratapgarh'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'E' AND cfp.is_active = true);

INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, '2-Installment Plan (10% OFF)', 'Pay in 2 easy installments with 10% discount. 1st at admission, 2nd after 6 months.',
  499, 31200, 3120, '10% OFF', 28579, true, 12, 'standard', 2, NULL,
  '{"plan_code":"C","installments":2,"discount_percent":10,"annual_fee":31200,"discounted_fee":28080,"installment_1":14040,"installment_2":14040}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'ukg-pratapgarh'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'C' AND cfp.is_active = true);

INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, 'One-Time Payment (15% OFF)', 'Pay the full amount at once and get 15% discount on annual fee.',
  499, 31200, 4680, '15% OFF', 27019, false, 12, 'standard', 3, 'Best Value',
  '{"plan_code":"D","installments":1,"discount_percent":15,"annual_fee":31200,"discounted_fee":26520}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'ukg-pratapgarh'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'D' AND cfp.is_active = true);

-- Class 1 (Pratapgarh, annual: 32400)
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, 'Monthly Plan (+10%)', 'Pay monthly with 10% annual surcharge. First month due at enrollment, remaining 11 months billed monthly.',
  499, 35640, 0, '+10% surcharge', 36139, false, 12, 'standard', 0, NULL,
  '{"plan_code":"M","installments":12,"discount_percent":-10,"annual_fee":32400,"surcharge_percent":10,"annual_with_surcharge":35640,"monthly_fee":2970}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-1-pratapgarh'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'M' AND cfp.is_active = true);

INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, '4-Installment Plan (5% OFF)', 'Pay in 4 quarterly installments with 5% discount. 1st at admission, rest every 3 months.',
  499, 32400, 1620, '5% OFF', 31279, false, 12, 'standard', 1, NULL,
  '{"plan_code":"E","installments":4,"discount_percent":5,"annual_fee":32400,"discounted_fee":30780,"installment_1":7695,"quarterly_fee":7695}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-1-pratapgarh'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'E' AND cfp.is_active = true);

INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, '2-Installment Plan (10% OFF)', 'Pay in 2 easy installments with 10% discount. 1st at admission, 2nd after 6 months.',
  499, 32400, 3240, '10% OFF', 29659, true, 12, 'standard', 2, NULL,
  '{"plan_code":"C","installments":2,"discount_percent":10,"annual_fee":32400,"discounted_fee":29160,"installment_1":14580,"installment_2":14580}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-1-pratapgarh'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'C' AND cfp.is_active = true);

INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, 'One-Time Payment (15% OFF)', 'Pay the full amount at once and get 15% discount on annual fee.',
  499, 32400, 4860, '15% OFF', 28039, false, 12, 'standard', 3, 'Best Value',
  '{"plan_code":"D","installments":1,"discount_percent":15,"annual_fee":32400,"discounted_fee":27540}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-1-pratapgarh'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'D' AND cfp.is_active = true);

-- Class 2 (Pratapgarh, annual: 33600)
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, 'Monthly Plan (+10%)', 'Pay monthly with 10% annual surcharge. First month due at enrollment, remaining 11 months billed monthly.',
  499, 36960, 0, '+10% surcharge', 37459, false, 12, 'standard', 0, NULL,
  '{"plan_code":"M","installments":12,"discount_percent":-10,"annual_fee":33600,"surcharge_percent":10,"annual_with_surcharge":36960,"monthly_fee":3080}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-2-pratapgarh'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'M' AND cfp.is_active = true);

INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, '4-Installment Plan (5% OFF)', 'Pay in 4 quarterly installments with 5% discount. 1st at admission, rest every 3 months.',
  499, 33600, 1680, '5% OFF', 32419, false, 12, 'standard', 1, NULL,
  '{"plan_code":"E","installments":4,"discount_percent":5,"annual_fee":33600,"discounted_fee":31920,"installment_1":7980,"quarterly_fee":7980}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-2-pratapgarh'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'E' AND cfp.is_active = true);

INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, '2-Installment Plan (10% OFF)', 'Pay in 2 easy installments with 10% discount. 1st at admission, 2nd after 6 months.',
  499, 33600, 3360, '10% OFF', 30739, true, 12, 'standard', 2, NULL,
  '{"plan_code":"C","installments":2,"discount_percent":10,"annual_fee":33600,"discounted_fee":30240,"installment_1":15120,"installment_2":15120}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-2-pratapgarh'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'C' AND cfp.is_active = true);

INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, 'One-Time Payment (15% OFF)', 'Pay the full amount at once and get 15% discount on annual fee.',
  499, 33600, 5040, '15% OFF', 29059, false, 12, 'standard', 3, 'Best Value',
  '{"plan_code":"D","installments":1,"discount_percent":15,"annual_fee":33600,"discounted_fee":28560}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-2-pratapgarh'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'D' AND cfp.is_active = true);

-- Class 3 (Pratapgarh, annual: 34800)
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, 'Monthly Plan (+10%)', 'Pay monthly with 10% annual surcharge. First month due at enrollment, remaining 11 months billed monthly.',
  499, 38280, 0, '+10% surcharge', 38779, false, 12, 'standard', 0, NULL,
  '{"plan_code":"M","installments":12,"discount_percent":-10,"annual_fee":34800,"surcharge_percent":10,"annual_with_surcharge":38280,"monthly_fee":3190}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-3-pratapgarh'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'M' AND cfp.is_active = true);

INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, '4-Installment Plan (5% OFF)', 'Pay in 4 quarterly installments with 5% discount. 1st at admission, rest every 3 months.',
  499, 34800, 1740, '5% OFF', 33559, false, 12, 'standard', 1, NULL,
  '{"plan_code":"E","installments":4,"discount_percent":5,"annual_fee":34800,"discounted_fee":33060,"installment_1":8265,"quarterly_fee":8265}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-3-pratapgarh'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'E' AND cfp.is_active = true);

INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, '2-Installment Plan (10% OFF)', 'Pay in 2 easy installments with 10% discount. 1st at admission, 2nd after 6 months.',
  499, 34800, 3480, '10% OFF', 31819, true, 12, 'standard', 2, NULL,
  '{"plan_code":"C","installments":2,"discount_percent":10,"annual_fee":34800,"discounted_fee":31320,"installment_1":15660,"installment_2":15660}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-3-pratapgarh'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'C' AND cfp.is_active = true);

INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, 'One-Time Payment (15% OFF)', 'Pay the full amount at once and get 15% discount on annual fee.',
  499, 34800, 5220, '15% OFF', 30079, false, 12, 'standard', 3, 'Best Value',
  '{"plan_code":"D","installments":1,"discount_percent":15,"annual_fee":34800,"discounted_fee":29580}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-3-pratapgarh'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'D' AND cfp.is_active = true);

-- Class 4 (Pratapgarh, annual: 36000)
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, 'Monthly Plan (+10%)', 'Pay monthly with 10% annual surcharge. First month due at enrollment, remaining 11 months billed monthly.',
  499, 39600, 0, '+10% surcharge', 40099, false, 12, 'standard', 0, NULL,
  '{"plan_code":"M","installments":12,"discount_percent":-10,"annual_fee":36000,"surcharge_percent":10,"annual_with_surcharge":39600,"monthly_fee":3300}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-4-pratapgarh'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'M' AND cfp.is_active = true);

INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, '4-Installment Plan (5% OFF)', 'Pay in 4 quarterly installments with 5% discount. 1st at admission, rest every 3 months.',
  499, 36000, 1800, '5% OFF', 34699, false, 12, 'standard', 1, NULL,
  '{"plan_code":"E","installments":4,"discount_percent":5,"annual_fee":36000,"discounted_fee":34200,"installment_1":8550,"quarterly_fee":8550}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-4-pratapgarh'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'E' AND cfp.is_active = true);

INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, '2-Installment Plan (10% OFF)', 'Pay in 2 easy installments with 10% discount. 1st at admission, 2nd after 6 months.',
  499, 36000, 3600, '10% OFF', 32899, true, 12, 'standard', 2, NULL,
  '{"plan_code":"C","installments":2,"discount_percent":10,"annual_fee":36000,"discounted_fee":32400,"installment_1":16200,"installment_2":16200}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-4-pratapgarh'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'C' AND cfp.is_active = true);

INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, 'One-Time Payment (15% OFF)', 'Pay the full amount at once and get 15% discount on annual fee.',
  499, 36000, 5400, '15% OFF', 31099, false, 12, 'standard', 3, 'Best Value',
  '{"plan_code":"D","installments":1,"discount_percent":15,"annual_fee":36000,"discounted_fee":30600}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-4-pratapgarh'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'D' AND cfp.is_active = true);

-- Class 5 (Pratapgarh, annual: 37200)
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, 'Monthly Plan (+10%)', 'Pay monthly with 10% annual surcharge. First month due at enrollment, remaining 11 months billed monthly.',
  499, 40920, 0, '+10% surcharge', 41419, false, 12, 'standard', 0, NULL,
  '{"plan_code":"M","installments":12,"discount_percent":-10,"annual_fee":37200,"surcharge_percent":10,"annual_with_surcharge":40920,"monthly_fee":3410}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-5-pratapgarh'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'M' AND cfp.is_active = true);

INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, '4-Installment Plan (5% OFF)', 'Pay in 4 quarterly installments with 5% discount. 1st at admission, rest every 3 months.',
  499, 37200, 1860, '5% OFF', 35839, false, 12, 'standard', 1, NULL,
  '{"plan_code":"E","installments":4,"discount_percent":5,"annual_fee":37200,"discounted_fee":35340,"installment_1":8835,"quarterly_fee":8835}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-5-pratapgarh'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'E' AND cfp.is_active = true);

INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, '2-Installment Plan (10% OFF)', 'Pay in 2 easy installments with 10% discount. 1st at admission, 2nd after 6 months.',
  499, 37200, 3720, '10% OFF', 33979, true, 12, 'standard', 2, NULL,
  '{"plan_code":"C","installments":2,"discount_percent":10,"annual_fee":37200,"discounted_fee":33480,"installment_1":16740,"installment_2":16740}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-5-pratapgarh'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'C' AND cfp.is_active = true);

INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, 'One-Time Payment (15% OFF)', 'Pay the full amount at once and get 15% discount on annual fee.',
  499, 37200, 5580, '15% OFF', 32119, false, 12, 'standard', 3, 'Best Value',
  '{"plan_code":"D","installments":1,"discount_percent":15,"annual_fee":37200,"discounted_fee":31620}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-5-pratapgarh'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'D' AND cfp.is_active = true);

-- Class 6 (Pratapgarh, annual: 38400)
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, 'Monthly Plan (+10%)', 'Pay monthly with 10% annual surcharge. First month due at enrollment, remaining 11 months billed monthly.',
  499, 42240, 0, '+10% surcharge', 42739, false, 12, 'standard', 0, NULL,
  '{"plan_code":"M","installments":12,"discount_percent":-10,"annual_fee":38400,"surcharge_percent":10,"annual_with_surcharge":42240,"monthly_fee":3520}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-6-pratapgarh'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'M' AND cfp.is_active = true);

INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, '4-Installment Plan (5% OFF)', 'Pay in 4 quarterly installments with 5% discount. 1st at admission, rest every 3 months.',
  499, 38400, 1920, '5% OFF', 36979, false, 12, 'standard', 1, NULL,
  '{"plan_code":"E","installments":4,"discount_percent":5,"annual_fee":38400,"discounted_fee":36480,"installment_1":9120,"quarterly_fee":9120}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-6-pratapgarh'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'E' AND cfp.is_active = true);

INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, '2-Installment Plan (10% OFF)', 'Pay in 2 easy installments with 10% discount. 1st at admission, 2nd after 6 months.',
  499, 38400, 3840, '10% OFF', 35059, true, 12, 'standard', 2, NULL,
  '{"plan_code":"C","installments":2,"discount_percent":10,"annual_fee":38400,"discounted_fee":34560,"installment_1":17280,"installment_2":17280}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-6-pratapgarh'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'C' AND cfp.is_active = true);

INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, 'One-Time Payment (15% OFF)', 'Pay the full amount at once and get 15% discount on annual fee.',
  499, 38400, 5760, '15% OFF', 33139, false, 12, 'standard', 3, 'Best Value',
  '{"plan_code":"D","installments":1,"discount_percent":15,"annual_fee":38400,"discounted_fee":32640}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-6-pratapgarh'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'D' AND cfp.is_active = true);

-- Class 7 (Pratapgarh, annual: 39600)
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, 'Monthly Plan (+10%)', 'Pay monthly with 10% annual surcharge. First month due at enrollment, remaining 11 months billed monthly.',
  499, 43560, 0, '+10% surcharge', 44059, false, 12, 'standard', 0, NULL,
  '{"plan_code":"M","installments":12,"discount_percent":-10,"annual_fee":39600,"surcharge_percent":10,"annual_with_surcharge":43560,"monthly_fee":3630}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-7-pratapgarh'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'M' AND cfp.is_active = true);

INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, '4-Installment Plan (5% OFF)', 'Pay in 4 quarterly installments with 5% discount. 1st at admission, rest every 3 months.',
  499, 39600, 1980, '5% OFF', 38119, false, 12, 'standard', 1, NULL,
  '{"plan_code":"E","installments":4,"discount_percent":5,"annual_fee":39600,"discounted_fee":37620,"installment_1":9405,"quarterly_fee":9405}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-7-pratapgarh'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'E' AND cfp.is_active = true);

INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, '2-Installment Plan (10% OFF)', 'Pay in 2 easy installments with 10% discount. 1st at admission, 2nd after 6 months.',
  499, 39600, 3960, '10% OFF', 36139, true, 12, 'standard', 2, NULL,
  '{"plan_code":"C","installments":2,"discount_percent":10,"annual_fee":39600,"discounted_fee":35640,"installment_1":17820,"installment_2":17820}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-7-pratapgarh'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'C' AND cfp.is_active = true);

INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, 'One-Time Payment (15% OFF)', 'Pay the full amount at once and get 15% discount on annual fee.',
  499, 39600, 5940, '15% OFF', 34159, false, 12, 'standard', 3, 'Best Value',
  '{"plan_code":"D","installments":1,"discount_percent":15,"annual_fee":39600,"discounted_fee":33660}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-7-pratapgarh'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'D' AND cfp.is_active = true);

-- Class 8 (Pratapgarh, annual: 40800)
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, 'Monthly Plan (+10%)', 'Pay monthly with 10% annual surcharge. First month due at enrollment, remaining 11 months billed monthly.',
  499, 44880, 0, '+10% surcharge', 45379, false, 12, 'standard', 0, NULL,
  '{"plan_code":"M","installments":12,"discount_percent":-10,"annual_fee":40800,"surcharge_percent":10,"annual_with_surcharge":44880,"monthly_fee":3740}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-8-pratapgarh'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'M' AND cfp.is_active = true);

INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, '4-Installment Plan (5% OFF)', 'Pay in 4 quarterly installments with 5% discount. 1st at admission, rest every 3 months.',
  499, 40800, 2040, '5% OFF', 39259, false, 12, 'standard', 1, NULL,
  '{"plan_code":"E","installments":4,"discount_percent":5,"annual_fee":40800,"discounted_fee":38760,"installment_1":9690,"quarterly_fee":9690}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-8-pratapgarh'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'E' AND cfp.is_active = true);

INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, '2-Installment Plan (10% OFF)', 'Pay in 2 easy installments with 10% discount. 1st at admission, 2nd after 6 months.',
  499, 40800, 4080, '10% OFF', 37219, true, 12, 'standard', 2, NULL,
  '{"plan_code":"C","installments":2,"discount_percent":10,"annual_fee":40800,"discounted_fee":36720,"installment_1":18360,"installment_2":18360}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-8-pratapgarh'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'C' AND cfp.is_active = true);

INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, 'One-Time Payment (15% OFF)', 'Pay the full amount at once and get 15% discount on annual fee.',
  499, 40800, 6120, '15% OFF', 35179, false, 12, 'standard', 3, 'Best Value',
  '{"plan_code":"D","installments":1,"discount_percent":15,"annual_fee":40800,"discounted_fee":34680}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-8-pratapgarh'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'D' AND cfp.is_active = true);

-- Class 9 (Pratapgarh, annual: 45600)
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, 'Monthly Plan (+10%)', 'Pay monthly with 10% annual surcharge. First month due at enrollment, remaining 11 months billed monthly.',
  499, 50160, 0, '+10% surcharge', 50659, false, 12, 'standard', 0, NULL,
  '{"plan_code":"M","installments":12,"discount_percent":-10,"annual_fee":45600,"surcharge_percent":10,"annual_with_surcharge":50160,"monthly_fee":4180}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-9-pratapgarh'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'M' AND cfp.is_active = true);

INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, '4-Installment Plan (5% OFF)', 'Pay in 4 quarterly installments with 5% discount. 1st at admission, rest every 3 months.',
  499, 45600, 2280, '5% OFF', 43819, false, 12, 'standard', 1, NULL,
  '{"plan_code":"E","installments":4,"discount_percent":5,"annual_fee":45600,"discounted_fee":43320,"installment_1":10830,"quarterly_fee":10830}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-9-pratapgarh'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'E' AND cfp.is_active = true);

INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, '2-Installment Plan (10% OFF)', 'Pay in 2 easy installments with 10% discount. 1st at admission, 2nd after 6 months.',
  499, 45600, 4560, '10% OFF', 41539, true, 12, 'standard', 2, NULL,
  '{"plan_code":"C","installments":2,"discount_percent":10,"annual_fee":45600,"discounted_fee":41040,"installment_1":20520,"installment_2":20520}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-9-pratapgarh'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'C' AND cfp.is_active = true);

INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, 'One-Time Payment (15% OFF)', 'Pay the full amount at once and get 15% discount on annual fee.',
  499, 45600, 6840, '15% OFF', 39259, false, 12, 'standard', 3, 'Best Value',
  '{"plan_code":"D","installments":1,"discount_percent":15,"annual_fee":45600,"discounted_fee":38760}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-9-pratapgarh'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'D' AND cfp.is_active = true);

-- Class 10 (Pratapgarh, annual: 49200)
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, 'Monthly Plan (+10%)', 'Pay monthly with 10% annual surcharge. First month due at enrollment, remaining 11 months billed monthly.',
  499, 54120, 0, '+10% surcharge', 54619, false, 12, 'standard', 0, NULL,
  '{"plan_code":"M","installments":12,"discount_percent":-10,"annual_fee":49200,"surcharge_percent":10,"annual_with_surcharge":54120,"monthly_fee":4510}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-10-pratapgarh'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'M' AND cfp.is_active = true);

INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, '4-Installment Plan (5% OFF)', 'Pay in 4 quarterly installments with 5% discount. 1st at admission, rest every 3 months.',
  499, 49200, 2460, '5% OFF', 47239, false, 12, 'standard', 1, NULL,
  '{"plan_code":"E","installments":4,"discount_percent":5,"annual_fee":49200,"discounted_fee":46740,"installment_1":11685,"quarterly_fee":11685}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-10-pratapgarh'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'E' AND cfp.is_active = true);

INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, '2-Installment Plan (10% OFF)', 'Pay in 2 easy installments with 10% discount. 1st at admission, 2nd after 6 months.',
  499, 49200, 4920, '10% OFF', 44779, true, 12, 'standard', 2, NULL,
  '{"plan_code":"C","installments":2,"discount_percent":10,"annual_fee":49200,"discounted_fee":44280,"installment_1":22140,"installment_2":22140}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-10-pratapgarh'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'C' AND cfp.is_active = true);

INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, 'One-Time Payment (15% OFF)', 'Pay the full amount at once and get 15% discount on annual fee.',
  499, 49200, 7380, '15% OFF', 42319, false, 12, 'standard', 3, 'Best Value',
  '{"plan_code":"D","installments":1,"discount_percent":15,"annual_fee":49200,"discounted_fee":41820}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-10-pratapgarh'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'D' AND cfp.is_active = true);

-- Class 11 (Pratapgarh, annual: 79200)
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, 'Monthly Plan (+10%)', 'Pay monthly with 10% annual surcharge. First month due at enrollment, remaining 11 months billed monthly.',
  499, 87120, 0, '+10% surcharge', 87619, false, 12, 'standard', 0, NULL,
  '{"plan_code":"M","installments":12,"discount_percent":-10,"annual_fee":79200,"surcharge_percent":10,"annual_with_surcharge":87120,"monthly_fee":7260}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-11-pratapgarh'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'M' AND cfp.is_active = true);

INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, '4-Installment Plan (5% OFF)', 'Pay in 4 quarterly installments with 5% discount. 1st at admission, rest every 3 months.',
  499, 79200, 3960, '5% OFF', 75739, false, 12, 'standard', 1, NULL,
  '{"plan_code":"E","installments":4,"discount_percent":5,"annual_fee":79200,"discounted_fee":75240,"installment_1":18810,"quarterly_fee":18810}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-11-pratapgarh'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'E' AND cfp.is_active = true);

INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, '2-Installment Plan (10% OFF)', 'Pay in 2 easy installments with 10% discount. 1st at admission, 2nd after 6 months.',
  499, 79200, 7920, '10% OFF', 71779, true, 12, 'standard', 2, NULL,
  '{"plan_code":"C","installments":2,"discount_percent":10,"annual_fee":79200,"discounted_fee":71280,"installment_1":35640,"installment_2":35640}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-11-pratapgarh'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'C' AND cfp.is_active = true);

INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, 'One-Time Payment (15% OFF)', 'Pay the full amount at once and get 15% discount on annual fee.',
  499, 79200, 11880, '15% OFF', 67819, false, 12, 'standard', 3, 'Best Value',
  '{"plan_code":"D","installments":1,"discount_percent":15,"annual_fee":79200,"discounted_fee":67320}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-11-pratapgarh'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'D' AND cfp.is_active = true);

-- Class 12 (Pratapgarh, annual: 85200)
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, 'Monthly Plan (+10%)', 'Pay monthly with 10% annual surcharge. First month due at enrollment, remaining 11 months billed monthly.',
  499, 93720, 0, '+10% surcharge', 94219, false, 12, 'standard', 0, NULL,
  '{"plan_code":"M","installments":12,"discount_percent":-10,"annual_fee":85200,"surcharge_percent":10,"annual_with_surcharge":93720,"monthly_fee":7810}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-12-pratapgarh'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'M' AND cfp.is_active = true);

INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, '4-Installment Plan (5% OFF)', 'Pay in 4 quarterly installments with 5% discount. 1st at admission, rest every 3 months.',
  499, 85200, 4260, '5% OFF', 81439, false, 12, 'standard', 1, NULL,
  '{"plan_code":"E","installments":4,"discount_percent":5,"annual_fee":85200,"discounted_fee":80940,"installment_1":20235,"quarterly_fee":20235}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-12-pratapgarh'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'E' AND cfp.is_active = true);

INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, '2-Installment Plan (10% OFF)', 'Pay in 2 easy installments with 10% discount. 1st at admission, 2nd after 6 months.',
  499, 85200, 8520, '10% OFF', 77179, true, 12, 'standard', 2, NULL,
  '{"plan_code":"C","installments":2,"discount_percent":10,"annual_fee":85200,"discounted_fee":76680,"installment_1":38340,"installment_2":38340}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-12-pratapgarh'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'C' AND cfp.is_active = true);

INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, 'One-Time Payment (15% OFF)', 'Pay the full amount at once and get 15% discount on annual fee.',
  499, 85200, 12780, '15% OFF', 72919, false, 12, 'standard', 3, 'Best Value',
  '{"plan_code":"D","installments":1,"discount_percent":15,"annual_fee":85200,"discounted_fee":72420}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-12-pratapgarh'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'D' AND cfp.is_active = true);

-- =============================================
-- STEP 8: Fee plans for Prayagraj (4 plans x 15 classes)
-- =============================================

-- Nursery (Prayagraj, annual: 36000)
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, 'Monthly Plan (+10%)', 'Pay monthly with 10% annual surcharge. First month due at enrollment, remaining 11 months billed monthly.',
  499, 39600, 0, '+10% surcharge', 40099, false, 12, 'standard', 0, NULL,
  '{"plan_code":"M","installments":12,"discount_percent":-10,"annual_fee":36000,"surcharge_percent":10,"annual_with_surcharge":39600,"monthly_fee":3300}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'nursery-prayagraj'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'M' AND cfp.is_active = true);

INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, '4-Installment Plan (5% OFF)', 'Pay in 4 quarterly installments with 5% discount. 1st at admission, rest every 3 months.',
  499, 36000, 1800, '5% OFF', 34699, false, 12, 'standard', 1, NULL,
  '{"plan_code":"E","installments":4,"discount_percent":5,"annual_fee":36000,"discounted_fee":34200,"installment_1":8550,"quarterly_fee":8550}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'nursery-prayagraj'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'E' AND cfp.is_active = true);

INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, '2-Installment Plan (10% OFF)', 'Pay in 2 easy installments with 10% discount. 1st at admission, 2nd after 6 months.',
  499, 36000, 3600, '10% OFF', 32899, true, 12, 'standard', 2, NULL,
  '{"plan_code":"C","installments":2,"discount_percent":10,"annual_fee":36000,"discounted_fee":32400,"installment_1":16200,"installment_2":16200}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'nursery-prayagraj'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'C' AND cfp.is_active = true);

INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, 'One-Time Payment (15% OFF)', 'Pay the full amount at once and get 15% discount on annual fee.',
  499, 36000, 5400, '15% OFF', 31099, false, 12, 'standard', 3, 'Best Value',
  '{"plan_code":"D","installments":1,"discount_percent":15,"annual_fee":36000,"discounted_fee":30600}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'nursery-prayagraj'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'D' AND cfp.is_active = true);

-- LKG (Prayagraj, annual: 36600)
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, 'Monthly Plan (+10%)', 'Pay monthly with 10% annual surcharge. First month due at enrollment, remaining 11 months billed monthly.',
  499, 40260, 0, '+10% surcharge', 40759, false, 12, 'standard', 0, NULL,
  '{"plan_code":"M","installments":12,"discount_percent":-10,"annual_fee":36600,"surcharge_percent":10,"annual_with_surcharge":40260,"monthly_fee":3355}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'lkg-prayagraj'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'M' AND cfp.is_active = true);

INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, '4-Installment Plan (5% OFF)', 'Pay in 4 quarterly installments with 5% discount. 1st at admission, rest every 3 months.',
  499, 36600, 1830, '5% OFF', 35269, false, 12, 'standard', 1, NULL,
  '{"plan_code":"E","installments":4,"discount_percent":5,"annual_fee":36600,"discounted_fee":34770,"installment_1":8694,"quarterly_fee":8692}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'lkg-prayagraj'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'E' AND cfp.is_active = true);

INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, '2-Installment Plan (10% OFF)', 'Pay in 2 easy installments with 10% discount. 1st at admission, 2nd after 6 months.',
  499, 36600, 3660, '10% OFF', 33439, true, 12, 'standard', 2, NULL,
  '{"plan_code":"C","installments":2,"discount_percent":10,"annual_fee":36600,"discounted_fee":32940,"installment_1":16470,"installment_2":16470}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'lkg-prayagraj'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'C' AND cfp.is_active = true);

INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, 'One-Time Payment (15% OFF)', 'Pay the full amount at once and get 15% discount on annual fee.',
  499, 36600, 5490, '15% OFF', 31609, false, 12, 'standard', 3, 'Best Value',
  '{"plan_code":"D","installments":1,"discount_percent":15,"annual_fee":36600,"discounted_fee":31110}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'lkg-prayagraj'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'D' AND cfp.is_active = true);

-- UKG (Prayagraj, annual: 37200)
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, 'Monthly Plan (+10%)', 'Pay monthly with 10% annual surcharge. First month due at enrollment, remaining 11 months billed monthly.',
  499, 40920, 0, '+10% surcharge', 41419, false, 12, 'standard', 0, NULL,
  '{"plan_code":"M","installments":12,"discount_percent":-10,"annual_fee":37200,"surcharge_percent":10,"annual_with_surcharge":40920,"monthly_fee":3410}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'ukg-prayagraj'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'M' AND cfp.is_active = true);

INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, '4-Installment Plan (5% OFF)', 'Pay in 4 quarterly installments with 5% discount. 1st at admission, rest every 3 months.',
  499, 37200, 1860, '5% OFF', 35839, false, 12, 'standard', 1, NULL,
  '{"plan_code":"E","installments":4,"discount_percent":5,"annual_fee":37200,"discounted_fee":35340,"installment_1":8835,"quarterly_fee":8835}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'ukg-prayagraj'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'E' AND cfp.is_active = true);

INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, '2-Installment Plan (10% OFF)', 'Pay in 2 easy installments with 10% discount. 1st at admission, 2nd after 6 months.',
  499, 37200, 3720, '10% OFF', 33979, true, 12, 'standard', 2, NULL,
  '{"plan_code":"C","installments":2,"discount_percent":10,"annual_fee":37200,"discounted_fee":33480,"installment_1":16740,"installment_2":16740}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'ukg-prayagraj'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'C' AND cfp.is_active = true);

INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, 'One-Time Payment (15% OFF)', 'Pay the full amount at once and get 15% discount on annual fee.',
  499, 37200, 5580, '15% OFF', 32119, false, 12, 'standard', 3, 'Best Value',
  '{"plan_code":"D","installments":1,"discount_percent":15,"annual_fee":37200,"discounted_fee":31620}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'ukg-prayagraj'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'D' AND cfp.is_active = true);

-- Class 1 (Prayagraj, annual: 38400)
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, 'Monthly Plan (+10%)', 'Pay monthly with 10% annual surcharge. First month due at enrollment, remaining 11 months billed monthly.',
  499, 42240, 0, '+10% surcharge', 42739, false, 12, 'standard', 0, NULL,
  '{"plan_code":"M","installments":12,"discount_percent":-10,"annual_fee":38400,"surcharge_percent":10,"annual_with_surcharge":42240,"monthly_fee":3520}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-1-prayagraj'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'M' AND cfp.is_active = true);

INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, '4-Installment Plan (5% OFF)', 'Pay in 4 quarterly installments with 5% discount. 1st at admission, rest every 3 months.',
  499, 38400, 1920, '5% OFF', 36979, false, 12, 'standard', 1, NULL,
  '{"plan_code":"E","installments":4,"discount_percent":5,"annual_fee":38400,"discounted_fee":36480,"installment_1":9120,"quarterly_fee":9120}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-1-prayagraj'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'E' AND cfp.is_active = true);

INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, '2-Installment Plan (10% OFF)', 'Pay in 2 easy installments with 10% discount. 1st at admission, 2nd after 6 months.',
  499, 38400, 3840, '10% OFF', 35059, true, 12, 'standard', 2, NULL,
  '{"plan_code":"C","installments":2,"discount_percent":10,"annual_fee":38400,"discounted_fee":34560,"installment_1":17280,"installment_2":17280}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-1-prayagraj'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'C' AND cfp.is_active = true);

INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, 'One-Time Payment (15% OFF)', 'Pay the full amount at once and get 15% discount on annual fee.',
  499, 38400, 5760, '15% OFF', 33139, false, 12, 'standard', 3, 'Best Value',
  '{"plan_code":"D","installments":1,"discount_percent":15,"annual_fee":38400,"discounted_fee":32640}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-1-prayagraj'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'D' AND cfp.is_active = true);

-- Class 2 (Prayagraj, annual: 39600)
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, 'Monthly Plan (+10%)', 'Pay monthly with 10% annual surcharge. First month due at enrollment, remaining 11 months billed monthly.',
  499, 43560, 0, '+10% surcharge', 44059, false, 12, 'standard', 0, NULL,
  '{"plan_code":"M","installments":12,"discount_percent":-10,"annual_fee":39600,"surcharge_percent":10,"annual_with_surcharge":43560,"monthly_fee":3630}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-2-prayagraj'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'M' AND cfp.is_active = true);

INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, '4-Installment Plan (5% OFF)', 'Pay in 4 quarterly installments with 5% discount. 1st at admission, rest every 3 months.',
  499, 39600, 1980, '5% OFF', 38119, false, 12, 'standard', 1, NULL,
  '{"plan_code":"E","installments":4,"discount_percent":5,"annual_fee":39600,"discounted_fee":37620,"installment_1":9405,"quarterly_fee":9405}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-2-prayagraj'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'E' AND cfp.is_active = true);

INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, '2-Installment Plan (10% OFF)', 'Pay in 2 easy installments with 10% discount. 1st at admission, 2nd after 6 months.',
  499, 39600, 3960, '10% OFF', 36139, true, 12, 'standard', 2, NULL,
  '{"plan_code":"C","installments":2,"discount_percent":10,"annual_fee":39600,"discounted_fee":35640,"installment_1":17820,"installment_2":17820}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-2-prayagraj'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'C' AND cfp.is_active = true);

INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, 'One-Time Payment (15% OFF)', 'Pay the full amount at once and get 15% discount on annual fee.',
  499, 39600, 5940, '15% OFF', 34159, false, 12, 'standard', 3, 'Best Value',
  '{"plan_code":"D","installments":1,"discount_percent":15,"annual_fee":39600,"discounted_fee":33660}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-2-prayagraj'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'D' AND cfp.is_active = true);

-- Class 3 (Prayagraj, annual: 40800)
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, 'Monthly Plan (+10%)', 'Pay monthly with 10% annual surcharge. First month due at enrollment, remaining 11 months billed monthly.',
  499, 44880, 0, '+10% surcharge', 45379, false, 12, 'standard', 0, NULL,
  '{"plan_code":"M","installments":12,"discount_percent":-10,"annual_fee":40800,"surcharge_percent":10,"annual_with_surcharge":44880,"monthly_fee":3740}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-3-prayagraj'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'M' AND cfp.is_active = true);

INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, '4-Installment Plan (5% OFF)', 'Pay in 4 quarterly installments with 5% discount. 1st at admission, rest every 3 months.',
  499, 40800, 2040, '5% OFF', 39259, false, 12, 'standard', 1, NULL,
  '{"plan_code":"E","installments":4,"discount_percent":5,"annual_fee":40800,"discounted_fee":38760,"installment_1":9690,"quarterly_fee":9690}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-3-prayagraj'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'E' AND cfp.is_active = true);

INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, '2-Installment Plan (10% OFF)', 'Pay in 2 easy installments with 10% discount. 1st at admission, 2nd after 6 months.',
  499, 40800, 4080, '10% OFF', 37219, true, 12, 'standard', 2, NULL,
  '{"plan_code":"C","installments":2,"discount_percent":10,"annual_fee":40800,"discounted_fee":36720,"installment_1":18360,"installment_2":18360}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-3-prayagraj'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'C' AND cfp.is_active = true);

INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, 'One-Time Payment (15% OFF)', 'Pay the full amount at once and get 15% discount on annual fee.',
  499, 40800, 6120, '15% OFF', 35179, false, 12, 'standard', 3, 'Best Value',
  '{"plan_code":"D","installments":1,"discount_percent":15,"annual_fee":40800,"discounted_fee":34680}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-3-prayagraj'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'D' AND cfp.is_active = true);

-- Class 4 (Prayagraj, annual: 42000)
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, 'Monthly Plan (+10%)', 'Pay monthly with 10% annual surcharge. First month due at enrollment, remaining 11 months billed monthly.',
  499, 46200, 0, '+10% surcharge', 46699, false, 12, 'standard', 0, NULL,
  '{"plan_code":"M","installments":12,"discount_percent":-10,"annual_fee":42000,"surcharge_percent":10,"annual_with_surcharge":46200,"monthly_fee":3850}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-4-prayagraj'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'M' AND cfp.is_active = true);

INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, '4-Installment Plan (5% OFF)', 'Pay in 4 quarterly installments with 5% discount. 1st at admission, rest every 3 months.',
  499, 42000, 2100, '5% OFF', 40399, false, 12, 'standard', 1, NULL,
  '{"plan_code":"E","installments":4,"discount_percent":5,"annual_fee":42000,"discounted_fee":39900,"installment_1":9975,"quarterly_fee":9975}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-4-prayagraj'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'E' AND cfp.is_active = true);

INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, '2-Installment Plan (10% OFF)', 'Pay in 2 easy installments with 10% discount. 1st at admission, 2nd after 6 months.',
  499, 42000, 4200, '10% OFF', 38299, true, 12, 'standard', 2, NULL,
  '{"plan_code":"C","installments":2,"discount_percent":10,"annual_fee":42000,"discounted_fee":37800,"installment_1":18900,"installment_2":18900}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-4-prayagraj'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'C' AND cfp.is_active = true);

INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, 'One-Time Payment (15% OFF)', 'Pay the full amount at once and get 15% discount on annual fee.',
  499, 42000, 6300, '15% OFF', 36199, false, 12, 'standard', 3, 'Best Value',
  '{"plan_code":"D","installments":1,"discount_percent":15,"annual_fee":42000,"discounted_fee":35700}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-4-prayagraj'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'D' AND cfp.is_active = true);

-- Class 5 (Prayagraj, annual: 43200)
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, 'Monthly Plan (+10%)', 'Pay monthly with 10% annual surcharge. First month due at enrollment, remaining 11 months billed monthly.',
  499, 47520, 0, '+10% surcharge', 48019, false, 12, 'standard', 0, NULL,
  '{"plan_code":"M","installments":12,"discount_percent":-10,"annual_fee":43200,"surcharge_percent":10,"annual_with_surcharge":47520,"monthly_fee":3960}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-5-prayagraj'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'M' AND cfp.is_active = true);

INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, '4-Installment Plan (5% OFF)', 'Pay in 4 quarterly installments with 5% discount. 1st at admission, rest every 3 months.',
  499, 43200, 2160, '5% OFF', 41539, false, 12, 'standard', 1, NULL,
  '{"plan_code":"E","installments":4,"discount_percent":5,"annual_fee":43200,"discounted_fee":41040,"installment_1":10260,"quarterly_fee":10260}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-5-prayagraj'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'E' AND cfp.is_active = true);

INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, '2-Installment Plan (10% OFF)', 'Pay in 2 easy installments with 10% discount. 1st at admission, 2nd after 6 months.',
  499, 43200, 4320, '10% OFF', 39379, true, 12, 'standard', 2, NULL,
  '{"plan_code":"C","installments":2,"discount_percent":10,"annual_fee":43200,"discounted_fee":38880,"installment_1":19440,"installment_2":19440}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-5-prayagraj'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'C' AND cfp.is_active = true);

INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, 'One-Time Payment (15% OFF)', 'Pay the full amount at once and get 15% discount on annual fee.',
  499, 43200, 6480, '15% OFF', 37219, false, 12, 'standard', 3, 'Best Value',
  '{"plan_code":"D","installments":1,"discount_percent":15,"annual_fee":43200,"discounted_fee":36720}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-5-prayagraj'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'D' AND cfp.is_active = true);

-- Class 6 (Prayagraj, annual: 44400)
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, 'Monthly Plan (+10%)', 'Pay monthly with 10% annual surcharge. First month due at enrollment, remaining 11 months billed monthly.',
  499, 48840, 0, '+10% surcharge', 49339, false, 12, 'standard', 0, NULL,
  '{"plan_code":"M","installments":12,"discount_percent":-10,"annual_fee":44400,"surcharge_percent":10,"annual_with_surcharge":48840,"monthly_fee":4070}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-6-prayagraj'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'M' AND cfp.is_active = true);

INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, '4-Installment Plan (5% OFF)', 'Pay in 4 quarterly installments with 5% discount. 1st at admission, rest every 3 months.',
  499, 44400, 2220, '5% OFF', 42679, false, 12, 'standard', 1, NULL,
  '{"plan_code":"E","installments":4,"discount_percent":5,"annual_fee":44400,"discounted_fee":42180,"installment_1":10545,"quarterly_fee":10545}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-6-prayagraj'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'E' AND cfp.is_active = true);

INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, '2-Installment Plan (10% OFF)', 'Pay in 2 easy installments with 10% discount. 1st at admission, 2nd after 6 months.',
  499, 44400, 4440, '10% OFF', 40459, true, 12, 'standard', 2, NULL,
  '{"plan_code":"C","installments":2,"discount_percent":10,"annual_fee":44400,"discounted_fee":39960,"installment_1":19980,"installment_2":19980}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-6-prayagraj'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'C' AND cfp.is_active = true);

INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, 'One-Time Payment (15% OFF)', 'Pay the full amount at once and get 15% discount on annual fee.',
  499, 44400, 6660, '15% OFF', 38239, false, 12, 'standard', 3, 'Best Value',
  '{"plan_code":"D","installments":1,"discount_percent":15,"annual_fee":44400,"discounted_fee":37740}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-6-prayagraj'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'D' AND cfp.is_active = true);

-- Class 7 (Prayagraj, annual: 45600)
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, 'Monthly Plan (+10%)', 'Pay monthly with 10% annual surcharge. First month due at enrollment, remaining 11 months billed monthly.',
  499, 50160, 0, '+10% surcharge', 50659, false, 12, 'standard', 0, NULL,
  '{"plan_code":"M","installments":12,"discount_percent":-10,"annual_fee":45600,"surcharge_percent":10,"annual_with_surcharge":50160,"monthly_fee":4180}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-7-prayagraj'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'M' AND cfp.is_active = true);

INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, '4-Installment Plan (5% OFF)', 'Pay in 4 quarterly installments with 5% discount. 1st at admission, rest every 3 months.',
  499, 45600, 2280, '5% OFF', 43819, false, 12, 'standard', 1, NULL,
  '{"plan_code":"E","installments":4,"discount_percent":5,"annual_fee":45600,"discounted_fee":43320,"installment_1":10830,"quarterly_fee":10830}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-7-prayagraj'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'E' AND cfp.is_active = true);

INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, '2-Installment Plan (10% OFF)', 'Pay in 2 easy installments with 10% discount. 1st at admission, 2nd after 6 months.',
  499, 45600, 4560, '10% OFF', 41539, true, 12, 'standard', 2, NULL,
  '{"plan_code":"C","installments":2,"discount_percent":10,"annual_fee":45600,"discounted_fee":41040,"installment_1":20520,"installment_2":20520}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-7-prayagraj'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'C' AND cfp.is_active = true);

INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, 'One-Time Payment (15% OFF)', 'Pay the full amount at once and get 15% discount on annual fee.',
  499, 45600, 6840, '15% OFF', 39259, false, 12, 'standard', 3, 'Best Value',
  '{"plan_code":"D","installments":1,"discount_percent":15,"annual_fee":45600,"discounted_fee":38760}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-7-prayagraj'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'D' AND cfp.is_active = true);

-- Class 8 (Prayagraj, annual: 46800)
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, 'Monthly Plan (+10%)', 'Pay monthly with 10% annual surcharge. First month due at enrollment, remaining 11 months billed monthly.',
  499, 51480, 0, '+10% surcharge', 51979, false, 12, 'standard', 0, NULL,
  '{"plan_code":"M","installments":12,"discount_percent":-10,"annual_fee":46800,"surcharge_percent":10,"annual_with_surcharge":51480,"monthly_fee":4290}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-8-prayagraj'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'M' AND cfp.is_active = true);

INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, '4-Installment Plan (5% OFF)', 'Pay in 4 quarterly installments with 5% discount. 1st at admission, rest every 3 months.',
  499, 46800, 2340, '5% OFF', 44959, false, 12, 'standard', 1, NULL,
  '{"plan_code":"E","installments":4,"discount_percent":5,"annual_fee":46800,"discounted_fee":44460,"installment_1":11115,"quarterly_fee":11115}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-8-prayagraj'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'E' AND cfp.is_active = true);

INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, '2-Installment Plan (10% OFF)', 'Pay in 2 easy installments with 10% discount. 1st at admission, 2nd after 6 months.',
  499, 46800, 4680, '10% OFF', 42619, true, 12, 'standard', 2, NULL,
  '{"plan_code":"C","installments":2,"discount_percent":10,"annual_fee":46800,"discounted_fee":42120,"installment_1":21060,"installment_2":21060}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-8-prayagraj'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'C' AND cfp.is_active = true);

INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, 'One-Time Payment (15% OFF)', 'Pay the full amount at once and get 15% discount on annual fee.',
  499, 46800, 7020, '15% OFF', 40279, false, 12, 'standard', 3, 'Best Value',
  '{"plan_code":"D","installments":1,"discount_percent":15,"annual_fee":46800,"discounted_fee":39780}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-8-prayagraj'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'D' AND cfp.is_active = true);

-- Class 9 (Prayagraj, annual: 51600)
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, 'Monthly Plan (+10%)', 'Pay monthly with 10% annual surcharge. First month due at enrollment, remaining 11 months billed monthly.',
  499, 56760, 0, '+10% surcharge', 57259, false, 12, 'standard', 0, NULL,
  '{"plan_code":"M","installments":12,"discount_percent":-10,"annual_fee":51600,"surcharge_percent":10,"annual_with_surcharge":56760,"monthly_fee":4730}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-9-prayagraj'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'M' AND cfp.is_active = true);

INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, '4-Installment Plan (5% OFF)', 'Pay in 4 quarterly installments with 5% discount. 1st at admission, rest every 3 months.',
  499, 51600, 2580, '5% OFF', 49519, false, 12, 'standard', 1, NULL,
  '{"plan_code":"E","installments":4,"discount_percent":5,"annual_fee":51600,"discounted_fee":49020,"installment_1":12255,"quarterly_fee":12255}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-9-prayagraj'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'E' AND cfp.is_active = true);

INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, '2-Installment Plan (10% OFF)', 'Pay in 2 easy installments with 10% discount. 1st at admission, 2nd after 6 months.',
  499, 51600, 5160, '10% OFF', 46939, true, 12, 'standard', 2, NULL,
  '{"plan_code":"C","installments":2,"discount_percent":10,"annual_fee":51600,"discounted_fee":46440,"installment_1":23220,"installment_2":23220}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-9-prayagraj'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'C' AND cfp.is_active = true);

INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, 'One-Time Payment (15% OFF)', 'Pay the full amount at once and get 15% discount on annual fee.',
  499, 51600, 7740, '15% OFF', 44359, false, 12, 'standard', 3, 'Best Value',
  '{"plan_code":"D","installments":1,"discount_percent":15,"annual_fee":51600,"discounted_fee":43860}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-9-prayagraj'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'D' AND cfp.is_active = true);

-- Class 10 (Prayagraj, annual: 56400)
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, 'Monthly Plan (+10%)', 'Pay monthly with 10% annual surcharge. First month due at enrollment, remaining 11 months billed monthly.',
  499, 62040, 0, '+10% surcharge', 62539, false, 12, 'standard', 0, NULL,
  '{"plan_code":"M","installments":12,"discount_percent":-10,"annual_fee":56400,"surcharge_percent":10,"annual_with_surcharge":62040,"monthly_fee":5170}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-10-prayagraj'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'M' AND cfp.is_active = true);

INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, '4-Installment Plan (5% OFF)', 'Pay in 4 quarterly installments with 5% discount. 1st at admission, rest every 3 months.',
  499, 56400, 2820, '5% OFF', 54079, false, 12, 'standard', 1, NULL,
  '{"plan_code":"E","installments":4,"discount_percent":5,"annual_fee":56400,"discounted_fee":53580,"installment_1":13395,"quarterly_fee":13395}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-10-prayagraj'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'E' AND cfp.is_active = true);

INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, '2-Installment Plan (10% OFF)', 'Pay in 2 easy installments with 10% discount. 1st at admission, 2nd after 6 months.',
  499, 56400, 5640, '10% OFF', 51259, true, 12, 'standard', 2, NULL,
  '{"plan_code":"C","installments":2,"discount_percent":10,"annual_fee":56400,"discounted_fee":50760,"installment_1":25380,"installment_2":25380}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-10-prayagraj'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'C' AND cfp.is_active = true);

INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, 'One-Time Payment (15% OFF)', 'Pay the full amount at once and get 15% discount on annual fee.',
  499, 56400, 8460, '15% OFF', 48439, false, 12, 'standard', 3, 'Best Value',
  '{"plan_code":"D","installments":1,"discount_percent":15,"annual_fee":56400,"discounted_fee":47940}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-10-prayagraj'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'D' AND cfp.is_active = true);

-- Class 11 (Prayagraj, annual: 86400)
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, 'Monthly Plan (+10%)', 'Pay monthly with 10% annual surcharge. First month due at enrollment, remaining 11 months billed monthly.',
  499, 95040, 0, '+10% surcharge', 95539, false, 12, 'standard', 0, NULL,
  '{"plan_code":"M","installments":12,"discount_percent":-10,"annual_fee":86400,"surcharge_percent":10,"annual_with_surcharge":95040,"monthly_fee":7920}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-11-prayagraj'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'M' AND cfp.is_active = true);

INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, '4-Installment Plan (5% OFF)', 'Pay in 4 quarterly installments with 5% discount. 1st at admission, rest every 3 months.',
  499, 86400, 4320, '5% OFF', 82579, false, 12, 'standard', 1, NULL,
  '{"plan_code":"E","installments":4,"discount_percent":5,"annual_fee":86400,"discounted_fee":82080,"installment_1":20520,"quarterly_fee":20520}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-11-prayagraj'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'E' AND cfp.is_active = true);

INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, '2-Installment Plan (10% OFF)', 'Pay in 2 easy installments with 10% discount. 1st at admission, 2nd after 6 months.',
  499, 86400, 8640, '10% OFF', 78259, true, 12, 'standard', 2, NULL,
  '{"plan_code":"C","installments":2,"discount_percent":10,"annual_fee":86400,"discounted_fee":77760,"installment_1":38880,"installment_2":38880}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-11-prayagraj'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'C' AND cfp.is_active = true);

INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, 'One-Time Payment (15% OFF)', 'Pay the full amount at once and get 15% discount on annual fee.',
  499, 86400, 12960, '15% OFF', 73939, false, 12, 'standard', 3, 'Best Value',
  '{"plan_code":"D","installments":1,"discount_percent":15,"annual_fee":86400,"discounted_fee":73440}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-11-prayagraj'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'D' AND cfp.is_active = true);

-- Class 12 (Prayagraj, annual: 92400)
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, 'Monthly Plan (+10%)', 'Pay monthly with 10% annual surcharge. First month due at enrollment, remaining 11 months billed monthly.',
  499, 101640, 0, '+10% surcharge', 102139, false, 12, 'standard', 0, NULL,
  '{"plan_code":"M","installments":12,"discount_percent":-10,"annual_fee":92400,"surcharge_percent":10,"annual_with_surcharge":101640,"monthly_fee":8470}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-12-prayagraj'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'M' AND cfp.is_active = true);

INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, '4-Installment Plan (5% OFF)', 'Pay in 4 quarterly installments with 5% discount. 1st at admission, rest every 3 months.',
  499, 92400, 4620, '5% OFF', 88279, false, 12, 'standard', 1, NULL,
  '{"plan_code":"E","installments":4,"discount_percent":5,"annual_fee":92400,"discounted_fee":87780,"installment_1":21945,"quarterly_fee":21945}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-12-prayagraj'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'E' AND cfp.is_active = true);

INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, '2-Installment Plan (10% OFF)', 'Pay in 2 easy installments with 10% discount. 1st at admission, 2nd after 6 months.',
  499, 92400, 9240, '10% OFF', 83659, true, 12, 'standard', 2, NULL,
  '{"plan_code":"C","installments":2,"discount_percent":10,"annual_fee":92400,"discounted_fee":83160,"installment_1":41580,"installment_2":41580}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-12-prayagraj'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'C' AND cfp.is_active = true);

INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id, 'One-Time Payment (15% OFF)', 'Pay the full amount at once and get 15% discount on annual fee.',
  499, 92400, 13860, '15% OFF', 79039, false, 12, 'standard', 3, 'Best Value',
  '{"plan_code":"D","installments":1,"discount_percent":15,"annual_fee":92400,"discounted_fee":78540}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-12-prayagraj'
AND NOT EXISTS (SELECT 1 FROM class_fee_plans cfp WHERE cfp.class_id = ac.id AND cfp.metadata->>'plan_code' = 'D' AND cfp.is_active = true);
