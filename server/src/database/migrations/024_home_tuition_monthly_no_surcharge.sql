-- =============================================
-- MIGRATION 024: HOME TUITION — REMOVE 10% SURCHARGE FROM MONTHLY PLANS
-- =============================================
-- Monthly fee = annual_fee / 12 (no surcharge)
-- Applies to all 3 locations x 15 classes = 45 monthly plans
-- =============================================

-- =============================================
-- LALGANJ
-- =============================================
-- Nursery: annual=24000, monthly=2000
UPDATE class_fee_plans SET
  name = 'Monthly Plan',
  description = 'Pay monthly. First month due at enrollment, remaining 11 months billed monthly.',
  tuition_fee = 24000, discount_label = NULL, total_amount = 24499,
  metadata = '{"plan_code":"M","installments":12,"annual_fee":24000,"monthly_fee":2000}'::jsonb
WHERE class_id = (SELECT id FROM academic_classes WHERE name = 'Nursery (Lalganj)' AND course_type_id = (SELECT id FROM course_types WHERE slug = 'home_tuition') LIMIT 1)
  AND metadata->>'plan_code' = 'M';

-- LKG: annual=24600, monthly=2050
UPDATE class_fee_plans SET
  name = 'Monthly Plan',
  description = 'Pay monthly. First month due at enrollment, remaining 11 months billed monthly.',
  tuition_fee = 24600, discount_label = NULL, total_amount = 25099,
  metadata = '{"plan_code":"M","installments":12,"annual_fee":24600,"monthly_fee":2050}'::jsonb
WHERE class_id = (SELECT id FROM academic_classes WHERE name = 'LKG (Lalganj)' AND course_type_id = (SELECT id FROM course_types WHERE slug = 'home_tuition') LIMIT 1)
  AND metadata->>'plan_code' = 'M';

-- UKG: annual=25200, monthly=2100
UPDATE class_fee_plans SET
  name = 'Monthly Plan',
  description = 'Pay monthly. First month due at enrollment, remaining 11 months billed monthly.',
  tuition_fee = 25200, discount_label = NULL, total_amount = 25699,
  metadata = '{"plan_code":"M","installments":12,"annual_fee":25200,"monthly_fee":2100}'::jsonb
WHERE class_id = (SELECT id FROM academic_classes WHERE name = 'UKG (Lalganj)' AND course_type_id = (SELECT id FROM course_types WHERE slug = 'home_tuition') LIMIT 1)
  AND metadata->>'plan_code' = 'M';

-- Class 1: annual=25800, monthly=2150
UPDATE class_fee_plans SET
  name = 'Monthly Plan',
  description = 'Pay monthly. First month due at enrollment, remaining 11 months billed monthly.',
  tuition_fee = 25800, discount_label = NULL, total_amount = 26299,
  metadata = '{"plan_code":"M","installments":12,"annual_fee":25800,"monthly_fee":2150}'::jsonb
WHERE class_id = (SELECT id FROM academic_classes WHERE name = 'Class 1 (Lalganj)' AND course_type_id = (SELECT id FROM course_types WHERE slug = 'home_tuition') LIMIT 1)
  AND metadata->>'plan_code' = 'M';

-- Class 2: annual=26400, monthly=2200
UPDATE class_fee_plans SET
  name = 'Monthly Plan',
  description = 'Pay monthly. First month due at enrollment, remaining 11 months billed monthly.',
  tuition_fee = 26400, discount_label = NULL, total_amount = 26899,
  metadata = '{"plan_code":"M","installments":12,"annual_fee":26400,"monthly_fee":2200}'::jsonb
WHERE class_id = (SELECT id FROM academic_classes WHERE name = 'Class 2 (Lalganj)' AND course_type_id = (SELECT id FROM course_types WHERE slug = 'home_tuition') LIMIT 1)
  AND metadata->>'plan_code' = 'M';

-- Class 3: annual=27000, monthly=2250
UPDATE class_fee_plans SET
  name = 'Monthly Plan',
  description = 'Pay monthly. First month due at enrollment, remaining 11 months billed monthly.',
  tuition_fee = 27000, discount_label = NULL, total_amount = 27499,
  metadata = '{"plan_code":"M","installments":12,"annual_fee":27000,"monthly_fee":2250}'::jsonb
WHERE class_id = (SELECT id FROM academic_classes WHERE name = 'Class 3 (Lalganj)' AND course_type_id = (SELECT id FROM course_types WHERE slug = 'home_tuition') LIMIT 1)
  AND metadata->>'plan_code' = 'M';

-- Class 4: annual=27600, monthly=2300
UPDATE class_fee_plans SET
  name = 'Monthly Plan',
  description = 'Pay monthly. First month due at enrollment, remaining 11 months billed monthly.',
  tuition_fee = 27600, discount_label = NULL, total_amount = 28099,
  metadata = '{"plan_code":"M","installments":12,"annual_fee":27600,"monthly_fee":2300}'::jsonb
WHERE class_id = (SELECT id FROM academic_classes WHERE name = 'Class 4 (Lalganj)' AND course_type_id = (SELECT id FROM course_types WHERE slug = 'home_tuition') LIMIT 1)
  AND metadata->>'plan_code' = 'M';

-- Class 5: annual=30000, monthly=2500
UPDATE class_fee_plans SET
  name = 'Monthly Plan',
  description = 'Pay monthly. First month due at enrollment, remaining 11 months billed monthly.',
  tuition_fee = 30000, discount_label = NULL, total_amount = 30499,
  metadata = '{"plan_code":"M","installments":12,"annual_fee":30000,"monthly_fee":2500}'::jsonb
WHERE class_id = (SELECT id FROM academic_classes WHERE name = 'Class 5 (Lalganj)' AND course_type_id = (SELECT id FROM course_types WHERE slug = 'home_tuition') LIMIT 1)
  AND metadata->>'plan_code' = 'M';

-- Class 6: annual=31200, monthly=2600
UPDATE class_fee_plans SET
  name = 'Monthly Plan',
  description = 'Pay monthly. First month due at enrollment, remaining 11 months billed monthly.',
  tuition_fee = 31200, discount_label = NULL, total_amount = 31699,
  metadata = '{"plan_code":"M","installments":12,"annual_fee":31200,"monthly_fee":2600}'::jsonb
WHERE class_id = (SELECT id FROM academic_classes WHERE name = 'Class 6 (Lalganj)' AND course_type_id = (SELECT id FROM course_types WHERE slug = 'home_tuition') LIMIT 1)
  AND metadata->>'plan_code' = 'M';

-- Class 7: annual=32400, monthly=2700
UPDATE class_fee_plans SET
  name = 'Monthly Plan',
  description = 'Pay monthly. First month due at enrollment, remaining 11 months billed monthly.',
  tuition_fee = 32400, discount_label = NULL, total_amount = 32899,
  metadata = '{"plan_code":"M","installments":12,"annual_fee":32400,"monthly_fee":2700}'::jsonb
WHERE class_id = (SELECT id FROM academic_classes WHERE name = 'Class 7 (Lalganj)' AND course_type_id = (SELECT id FROM course_types WHERE slug = 'home_tuition') LIMIT 1)
  AND metadata->>'plan_code' = 'M';

-- Class 8: annual=33600, monthly=2800
UPDATE class_fee_plans SET
  name = 'Monthly Plan',
  description = 'Pay monthly. First month due at enrollment, remaining 11 months billed monthly.',
  tuition_fee = 33600, discount_label = NULL, total_amount = 34099,
  metadata = '{"plan_code":"M","installments":12,"annual_fee":33600,"monthly_fee":2800}'::jsonb
WHERE class_id = (SELECT id FROM academic_classes WHERE name = 'Class 8 (Lalganj)' AND course_type_id = (SELECT id FROM course_types WHERE slug = 'home_tuition') LIMIT 1)
  AND metadata->>'plan_code' = 'M';

-- Class 9: annual=38400, monthly=3200
UPDATE class_fee_plans SET
  name = 'Monthly Plan',
  description = 'Pay monthly. First month due at enrollment, remaining 11 months billed monthly.',
  tuition_fee = 38400, discount_label = NULL, total_amount = 38899,
  metadata = '{"plan_code":"M","installments":12,"annual_fee":38400,"monthly_fee":3200}'::jsonb
WHERE class_id = (SELECT id FROM academic_classes WHERE name = 'Class 9 (Lalganj)' AND course_type_id = (SELECT id FROM course_types WHERE slug = 'home_tuition') LIMIT 1)
  AND metadata->>'plan_code' = 'M';

-- Class 10: annual=42000, monthly=3500
UPDATE class_fee_plans SET
  name = 'Monthly Plan',
  description = 'Pay monthly. First month due at enrollment, remaining 11 months billed monthly.',
  tuition_fee = 42000, discount_label = NULL, total_amount = 42499,
  metadata = '{"plan_code":"M","installments":12,"annual_fee":42000,"monthly_fee":3500}'::jsonb
WHERE class_id = (SELECT id FROM academic_classes WHERE name = 'Class 10 (Lalganj)' AND course_type_id = (SELECT id FROM course_types WHERE slug = 'home_tuition') LIMIT 1)
  AND metadata->>'plan_code' = 'M';

-- Class 11: annual=72000, monthly=6000
UPDATE class_fee_plans SET
  name = 'Monthly Plan',
  description = 'Pay monthly. First month due at enrollment, remaining 11 months billed monthly.',
  tuition_fee = 72000, discount_label = NULL, total_amount = 72499,
  metadata = '{"plan_code":"M","installments":12,"annual_fee":72000,"monthly_fee":6000}'::jsonb
WHERE class_id = (SELECT id FROM academic_classes WHERE name = 'Class 11 (Lalganj)' AND course_type_id = (SELECT id FROM course_types WHERE slug = 'home_tuition') LIMIT 1)
  AND metadata->>'plan_code' = 'M';

-- Class 12: annual=78000, monthly=6500
UPDATE class_fee_plans SET
  name = 'Monthly Plan',
  description = 'Pay monthly. First month due at enrollment, remaining 11 months billed monthly.',
  tuition_fee = 78000, discount_label = NULL, total_amount = 78499,
  metadata = '{"plan_code":"M","installments":12,"annual_fee":78000,"monthly_fee":6500}'::jsonb
WHERE class_id = (SELECT id FROM academic_classes WHERE name = 'Class 12 (Lalganj)' AND course_type_id = (SELECT id FROM course_types WHERE slug = 'home_tuition') LIMIT 1)
  AND metadata->>'plan_code' = 'M';

-- =============================================
-- PRATAPGARH
-- =============================================
-- Nursery: annual=30000, monthly=2500
UPDATE class_fee_plans SET
  name = 'Monthly Plan',
  description = 'Pay monthly. First month due at enrollment, remaining 11 months billed monthly.',
  tuition_fee = 30000, discount_label = NULL, total_amount = 30499,
  metadata = '{"plan_code":"M","installments":12,"annual_fee":30000,"monthly_fee":2500}'::jsonb
WHERE class_id = (SELECT id FROM academic_classes WHERE name = 'Nursery (Pratapgarh)' AND course_type_id = (SELECT id FROM course_types WHERE slug = 'home_tuition') LIMIT 1)
  AND metadata->>'plan_code' = 'M';

-- LKG: annual=30600, monthly=2550
UPDATE class_fee_plans SET
  name = 'Monthly Plan',
  description = 'Pay monthly. First month due at enrollment, remaining 11 months billed monthly.',
  tuition_fee = 30600, discount_label = NULL, total_amount = 31099,
  metadata = '{"plan_code":"M","installments":12,"annual_fee":30600,"monthly_fee":2550}'::jsonb
WHERE class_id = (SELECT id FROM academic_classes WHERE name = 'LKG (Pratapgarh)' AND course_type_id = (SELECT id FROM course_types WHERE slug = 'home_tuition') LIMIT 1)
  AND metadata->>'plan_code' = 'M';

-- UKG: annual=31200, monthly=2600
UPDATE class_fee_plans SET
  name = 'Monthly Plan',
  description = 'Pay monthly. First month due at enrollment, remaining 11 months billed monthly.',
  tuition_fee = 31200, discount_label = NULL, total_amount = 31699,
  metadata = '{"plan_code":"M","installments":12,"annual_fee":31200,"monthly_fee":2600}'::jsonb
WHERE class_id = (SELECT id FROM academic_classes WHERE name = 'UKG (Pratapgarh)' AND course_type_id = (SELECT id FROM course_types WHERE slug = 'home_tuition') LIMIT 1)
  AND metadata->>'plan_code' = 'M';

-- Class 1: annual=32400, monthly=2700
UPDATE class_fee_plans SET
  name = 'Monthly Plan',
  description = 'Pay monthly. First month due at enrollment, remaining 11 months billed monthly.',
  tuition_fee = 32400, discount_label = NULL, total_amount = 32899,
  metadata = '{"plan_code":"M","installments":12,"annual_fee":32400,"monthly_fee":2700}'::jsonb
WHERE class_id = (SELECT id FROM academic_classes WHERE name = 'Class 1 (Pratapgarh)' AND course_type_id = (SELECT id FROM course_types WHERE slug = 'home_tuition') LIMIT 1)
  AND metadata->>'plan_code' = 'M';

-- Class 2: annual=33600, monthly=2800
UPDATE class_fee_plans SET
  name = 'Monthly Plan',
  description = 'Pay monthly. First month due at enrollment, remaining 11 months billed monthly.',
  tuition_fee = 33600, discount_label = NULL, total_amount = 34099,
  metadata = '{"plan_code":"M","installments":12,"annual_fee":33600,"monthly_fee":2800}'::jsonb
WHERE class_id = (SELECT id FROM academic_classes WHERE name = 'Class 2 (Pratapgarh)' AND course_type_id = (SELECT id FROM course_types WHERE slug = 'home_tuition') LIMIT 1)
  AND metadata->>'plan_code' = 'M';

-- Class 3: annual=34800, monthly=2900
UPDATE class_fee_plans SET
  name = 'Monthly Plan',
  description = 'Pay monthly. First month due at enrollment, remaining 11 months billed monthly.',
  tuition_fee = 34800, discount_label = NULL, total_amount = 35299,
  metadata = '{"plan_code":"M","installments":12,"annual_fee":34800,"monthly_fee":2900}'::jsonb
WHERE class_id = (SELECT id FROM academic_classes WHERE name = 'Class 3 (Pratapgarh)' AND course_type_id = (SELECT id FROM course_types WHERE slug = 'home_tuition') LIMIT 1)
  AND metadata->>'plan_code' = 'M';

-- Class 4: annual=36000, monthly=3000
UPDATE class_fee_plans SET
  name = 'Monthly Plan',
  description = 'Pay monthly. First month due at enrollment, remaining 11 months billed monthly.',
  tuition_fee = 36000, discount_label = NULL, total_amount = 36499,
  metadata = '{"plan_code":"M","installments":12,"annual_fee":36000,"monthly_fee":3000}'::jsonb
WHERE class_id = (SELECT id FROM academic_classes WHERE name = 'Class 4 (Pratapgarh)' AND course_type_id = (SELECT id FROM course_types WHERE slug = 'home_tuition') LIMIT 1)
  AND metadata->>'plan_code' = 'M';

-- Class 5: annual=37200, monthly=3100
UPDATE class_fee_plans SET
  name = 'Monthly Plan',
  description = 'Pay monthly. First month due at enrollment, remaining 11 months billed monthly.',
  tuition_fee = 37200, discount_label = NULL, total_amount = 37699,
  metadata = '{"plan_code":"M","installments":12,"annual_fee":37200,"monthly_fee":3100}'::jsonb
WHERE class_id = (SELECT id FROM academic_classes WHERE name = 'Class 5 (Pratapgarh)' AND course_type_id = (SELECT id FROM course_types WHERE slug = 'home_tuition') LIMIT 1)
  AND metadata->>'plan_code' = 'M';

-- Class 6: annual=38400, monthly=3200
UPDATE class_fee_plans SET
  name = 'Monthly Plan',
  description = 'Pay monthly. First month due at enrollment, remaining 11 months billed monthly.',
  tuition_fee = 38400, discount_label = NULL, total_amount = 38899,
  metadata = '{"plan_code":"M","installments":12,"annual_fee":38400,"monthly_fee":3200}'::jsonb
WHERE class_id = (SELECT id FROM academic_classes WHERE name = 'Class 6 (Pratapgarh)' AND course_type_id = (SELECT id FROM course_types WHERE slug = 'home_tuition') LIMIT 1)
  AND metadata->>'plan_code' = 'M';

-- Class 7: annual=39600, monthly=3300
UPDATE class_fee_plans SET
  name = 'Monthly Plan',
  description = 'Pay monthly. First month due at enrollment, remaining 11 months billed monthly.',
  tuition_fee = 39600, discount_label = NULL, total_amount = 40099,
  metadata = '{"plan_code":"M","installments":12,"annual_fee":39600,"monthly_fee":3300}'::jsonb
WHERE class_id = (SELECT id FROM academic_classes WHERE name = 'Class 7 (Pratapgarh)' AND course_type_id = (SELECT id FROM course_types WHERE slug = 'home_tuition') LIMIT 1)
  AND metadata->>'plan_code' = 'M';

-- Class 8: annual=40800, monthly=3400
UPDATE class_fee_plans SET
  name = 'Monthly Plan',
  description = 'Pay monthly. First month due at enrollment, remaining 11 months billed monthly.',
  tuition_fee = 40800, discount_label = NULL, total_amount = 41299,
  metadata = '{"plan_code":"M","installments":12,"annual_fee":40800,"monthly_fee":3400}'::jsonb
WHERE class_id = (SELECT id FROM academic_classes WHERE name = 'Class 8 (Pratapgarh)' AND course_type_id = (SELECT id FROM course_types WHERE slug = 'home_tuition') LIMIT 1)
  AND metadata->>'plan_code' = 'M';

-- Class 9: annual=45600, monthly=3800
UPDATE class_fee_plans SET
  name = 'Monthly Plan',
  description = 'Pay monthly. First month due at enrollment, remaining 11 months billed monthly.',
  tuition_fee = 45600, discount_label = NULL, total_amount = 46099,
  metadata = '{"plan_code":"M","installments":12,"annual_fee":45600,"monthly_fee":3800}'::jsonb
WHERE class_id = (SELECT id FROM academic_classes WHERE name = 'Class 9 (Pratapgarh)' AND course_type_id = (SELECT id FROM course_types WHERE slug = 'home_tuition') LIMIT 1)
  AND metadata->>'plan_code' = 'M';

-- Class 10: annual=49200, monthly=4100
UPDATE class_fee_plans SET
  name = 'Monthly Plan',
  description = 'Pay monthly. First month due at enrollment, remaining 11 months billed monthly.',
  tuition_fee = 49200, discount_label = NULL, total_amount = 49699,
  metadata = '{"plan_code":"M","installments":12,"annual_fee":49200,"monthly_fee":4100}'::jsonb
WHERE class_id = (SELECT id FROM academic_classes WHERE name = 'Class 10 (Pratapgarh)' AND course_type_id = (SELECT id FROM course_types WHERE slug = 'home_tuition') LIMIT 1)
  AND metadata->>'plan_code' = 'M';

-- Class 11: annual=79200, monthly=6600
UPDATE class_fee_plans SET
  name = 'Monthly Plan',
  description = 'Pay monthly. First month due at enrollment, remaining 11 months billed monthly.',
  tuition_fee = 79200, discount_label = NULL, total_amount = 79699,
  metadata = '{"plan_code":"M","installments":12,"annual_fee":79200,"monthly_fee":6600}'::jsonb
WHERE class_id = (SELECT id FROM academic_classes WHERE name = 'Class 11 (Pratapgarh)' AND course_type_id = (SELECT id FROM course_types WHERE slug = 'home_tuition') LIMIT 1)
  AND metadata->>'plan_code' = 'M';

-- Class 12: annual=85200, monthly=7100
UPDATE class_fee_plans SET
  name = 'Monthly Plan',
  description = 'Pay monthly. First month due at enrollment, remaining 11 months billed monthly.',
  tuition_fee = 85200, discount_label = NULL, total_amount = 85699,
  metadata = '{"plan_code":"M","installments":12,"annual_fee":85200,"monthly_fee":7100}'::jsonb
WHERE class_id = (SELECT id FROM academic_classes WHERE name = 'Class 12 (Pratapgarh)' AND course_type_id = (SELECT id FROM course_types WHERE slug = 'home_tuition') LIMIT 1)
  AND metadata->>'plan_code' = 'M';

-- =============================================
-- PRAYAGRAJ
-- =============================================
-- Nursery: annual=36000, monthly=3000
UPDATE class_fee_plans SET
  name = 'Monthly Plan',
  description = 'Pay monthly. First month due at enrollment, remaining 11 months billed monthly.',
  tuition_fee = 36000, discount_label = NULL, total_amount = 36499,
  metadata = '{"plan_code":"M","installments":12,"annual_fee":36000,"monthly_fee":3000}'::jsonb
WHERE class_id = (SELECT id FROM academic_classes WHERE name = 'Nursery (Prayagraj)' AND course_type_id = (SELECT id FROM course_types WHERE slug = 'home_tuition') LIMIT 1)
  AND metadata->>'plan_code' = 'M';

-- LKG: annual=36600, monthly=3050
UPDATE class_fee_plans SET
  name = 'Monthly Plan',
  description = 'Pay monthly. First month due at enrollment, remaining 11 months billed monthly.',
  tuition_fee = 36600, discount_label = NULL, total_amount = 37099,
  metadata = '{"plan_code":"M","installments":12,"annual_fee":36600,"monthly_fee":3050}'::jsonb
WHERE class_id = (SELECT id FROM academic_classes WHERE name = 'LKG (Prayagraj)' AND course_type_id = (SELECT id FROM course_types WHERE slug = 'home_tuition') LIMIT 1)
  AND metadata->>'plan_code' = 'M';

-- UKG: annual=37200, monthly=3100
UPDATE class_fee_plans SET
  name = 'Monthly Plan',
  description = 'Pay monthly. First month due at enrollment, remaining 11 months billed monthly.',
  tuition_fee = 37200, discount_label = NULL, total_amount = 37699,
  metadata = '{"plan_code":"M","installments":12,"annual_fee":37200,"monthly_fee":3100}'::jsonb
WHERE class_id = (SELECT id FROM academic_classes WHERE name = 'UKG (Prayagraj)' AND course_type_id = (SELECT id FROM course_types WHERE slug = 'home_tuition') LIMIT 1)
  AND metadata->>'plan_code' = 'M';

-- Class 1: annual=38400, monthly=3200
UPDATE class_fee_plans SET
  name = 'Monthly Plan',
  description = 'Pay monthly. First month due at enrollment, remaining 11 months billed monthly.',
  tuition_fee = 38400, discount_label = NULL, total_amount = 38899,
  metadata = '{"plan_code":"M","installments":12,"annual_fee":38400,"monthly_fee":3200}'::jsonb
WHERE class_id = (SELECT id FROM academic_classes WHERE name = 'Class 1 (Prayagraj)' AND course_type_id = (SELECT id FROM course_types WHERE slug = 'home_tuition') LIMIT 1)
  AND metadata->>'plan_code' = 'M';

-- Class 2: annual=39600, monthly=3300
UPDATE class_fee_plans SET
  name = 'Monthly Plan',
  description = 'Pay monthly. First month due at enrollment, remaining 11 months billed monthly.',
  tuition_fee = 39600, discount_label = NULL, total_amount = 40099,
  metadata = '{"plan_code":"M","installments":12,"annual_fee":39600,"monthly_fee":3300}'::jsonb
WHERE class_id = (SELECT id FROM academic_classes WHERE name = 'Class 2 (Prayagraj)' AND course_type_id = (SELECT id FROM course_types WHERE slug = 'home_tuition') LIMIT 1)
  AND metadata->>'plan_code' = 'M';

-- Class 3: annual=40800, monthly=3400
UPDATE class_fee_plans SET
  name = 'Monthly Plan',
  description = 'Pay monthly. First month due at enrollment, remaining 11 months billed monthly.',
  tuition_fee = 40800, discount_label = NULL, total_amount = 41299,
  metadata = '{"plan_code":"M","installments":12,"annual_fee":40800,"monthly_fee":3400}'::jsonb
WHERE class_id = (SELECT id FROM academic_classes WHERE name = 'Class 3 (Prayagraj)' AND course_type_id = (SELECT id FROM course_types WHERE slug = 'home_tuition') LIMIT 1)
  AND metadata->>'plan_code' = 'M';

-- Class 4: annual=42000, monthly=3500
UPDATE class_fee_plans SET
  name = 'Monthly Plan',
  description = 'Pay monthly. First month due at enrollment, remaining 11 months billed monthly.',
  tuition_fee = 42000, discount_label = NULL, total_amount = 42499,
  metadata = '{"plan_code":"M","installments":12,"annual_fee":42000,"monthly_fee":3500}'::jsonb
WHERE class_id = (SELECT id FROM academic_classes WHERE name = 'Class 4 (Prayagraj)' AND course_type_id = (SELECT id FROM course_types WHERE slug = 'home_tuition') LIMIT 1)
  AND metadata->>'plan_code' = 'M';

-- Class 5: annual=43200, monthly=3600
UPDATE class_fee_plans SET
  name = 'Monthly Plan',
  description = 'Pay monthly. First month due at enrollment, remaining 11 months billed monthly.',
  tuition_fee = 43200, discount_label = NULL, total_amount = 43699,
  metadata = '{"plan_code":"M","installments":12,"annual_fee":43200,"monthly_fee":3600}'::jsonb
WHERE class_id = (SELECT id FROM academic_classes WHERE name = 'Class 5 (Prayagraj)' AND course_type_id = (SELECT id FROM course_types WHERE slug = 'home_tuition') LIMIT 1)
  AND metadata->>'plan_code' = 'M';

-- Class 6: annual=44400, monthly=3700
UPDATE class_fee_plans SET
  name = 'Monthly Plan',
  description = 'Pay monthly. First month due at enrollment, remaining 11 months billed monthly.',
  tuition_fee = 44400, discount_label = NULL, total_amount = 44899,
  metadata = '{"plan_code":"M","installments":12,"annual_fee":44400,"monthly_fee":3700}'::jsonb
WHERE class_id = (SELECT id FROM academic_classes WHERE name = 'Class 6 (Prayagraj)' AND course_type_id = (SELECT id FROM course_types WHERE slug = 'home_tuition') LIMIT 1)
  AND metadata->>'plan_code' = 'M';

-- Class 7: annual=45600, monthly=3800
UPDATE class_fee_plans SET
  name = 'Monthly Plan',
  description = 'Pay monthly. First month due at enrollment, remaining 11 months billed monthly.',
  tuition_fee = 45600, discount_label = NULL, total_amount = 46099,
  metadata = '{"plan_code":"M","installments":12,"annual_fee":45600,"monthly_fee":3800}'::jsonb
WHERE class_id = (SELECT id FROM academic_classes WHERE name = 'Class 7 (Prayagraj)' AND course_type_id = (SELECT id FROM course_types WHERE slug = 'home_tuition') LIMIT 1)
  AND metadata->>'plan_code' = 'M';

-- Class 8: annual=46800, monthly=3900
UPDATE class_fee_plans SET
  name = 'Monthly Plan',
  description = 'Pay monthly. First month due at enrollment, remaining 11 months billed monthly.',
  tuition_fee = 46800, discount_label = NULL, total_amount = 47299,
  metadata = '{"plan_code":"M","installments":12,"annual_fee":46800,"monthly_fee":3900}'::jsonb
WHERE class_id = (SELECT id FROM academic_classes WHERE name = 'Class 8 (Prayagraj)' AND course_type_id = (SELECT id FROM course_types WHERE slug = 'home_tuition') LIMIT 1)
  AND metadata->>'plan_code' = 'M';

-- Class 9: annual=51600, monthly=4300
UPDATE class_fee_plans SET
  name = 'Monthly Plan',
  description = 'Pay monthly. First month due at enrollment, remaining 11 months billed monthly.',
  tuition_fee = 51600, discount_label = NULL, total_amount = 52099,
  metadata = '{"plan_code":"M","installments":12,"annual_fee":51600,"monthly_fee":4300}'::jsonb
WHERE class_id = (SELECT id FROM academic_classes WHERE name = 'Class 9 (Prayagraj)' AND course_type_id = (SELECT id FROM course_types WHERE slug = 'home_tuition') LIMIT 1)
  AND metadata->>'plan_code' = 'M';

-- Class 10: annual=56400, monthly=4700
UPDATE class_fee_plans SET
  name = 'Monthly Plan',
  description = 'Pay monthly. First month due at enrollment, remaining 11 months billed monthly.',
  tuition_fee = 56400, discount_label = NULL, total_amount = 56899,
  metadata = '{"plan_code":"M","installments":12,"annual_fee":56400,"monthly_fee":4700}'::jsonb
WHERE class_id = (SELECT id FROM academic_classes WHERE name = 'Class 10 (Prayagraj)' AND course_type_id = (SELECT id FROM course_types WHERE slug = 'home_tuition') LIMIT 1)
  AND metadata->>'plan_code' = 'M';

-- Class 11: annual=86400, monthly=7200
UPDATE class_fee_plans SET
  name = 'Monthly Plan',
  description = 'Pay monthly. First month due at enrollment, remaining 11 months billed monthly.',
  tuition_fee = 86400, discount_label = NULL, total_amount = 86899,
  metadata = '{"plan_code":"M","installments":12,"annual_fee":86400,"monthly_fee":7200}'::jsonb
WHERE class_id = (SELECT id FROM academic_classes WHERE name = 'Class 11 (Prayagraj)' AND course_type_id = (SELECT id FROM course_types WHERE slug = 'home_tuition') LIMIT 1)
  AND metadata->>'plan_code' = 'M';

-- Class 12: annual=92400, monthly=7700
UPDATE class_fee_plans SET
  name = 'Monthly Plan',
  description = 'Pay monthly. First month due at enrollment, remaining 11 months billed monthly.',
  tuition_fee = 92400, discount_label = NULL, total_amount = 92899,
  metadata = '{"plan_code":"M","installments":12,"annual_fee":92400,"monthly_fee":7700}'::jsonb
WHERE class_id = (SELECT id FROM academic_classes WHERE name = 'Class 12 (Prayagraj)' AND course_type_id = (SELECT id FROM course_types WHERE slug = 'home_tuition') LIMIT 1)
  AND metadata->>'plan_code' = 'M';
