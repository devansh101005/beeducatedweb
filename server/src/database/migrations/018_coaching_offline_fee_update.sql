-- =============================================
-- MIGRATION 018: COACHING OFFLINE FEE UPDATE
-- =============================================
-- Updates coaching_offline fee plans with new fee structure:
--   Old: Single "Standard Plan" per class
--   New: 3 plans per class:
--     Plan A: 2-Installment 70/30 (No Discount)
--     Plan B: 2-Installment 50/50 (10% OFF)
--     Plan C: One-Time Payment (15% OFF)
--
-- New annual fees:
--   Class 6: 9,799   Class 7: 10,799   Class 8: 11,999
--   Class 9: 17,000  Class 10: 21,000  Class 11: 26,000
--   Class 12: 33,000
--
-- Registration fee: ₹499 for all classes
-- =============================================

-- =============================================
-- STEP 1: Deactivate old fee plans for coaching_offline
-- (Cannot delete because existing enrollments reference them via foreign key)
-- =============================================
UPDATE class_fee_plans
SET is_active = false, is_default = false, updated_at = NOW()
WHERE class_id IN (
  SELECT ac.id FROM academic_classes ac
  JOIN course_types ct ON ac.course_type_id = ct.id
  WHERE ct.slug = 'coaching_offline'
);

-- =============================================
-- STEP 2: Insert new fee plans (3 per class)
-- =============================================

-- ---- Class 6 (annual: 9799) ----
-- Plan A: No discount, 70/30 installment. Total = 499 + 9799 = 10298
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id,
  '2-Installment Plan (70/30)',
  'Pay in 2 installments — 70% at admission, 30% within 75 days. No discount on course fee.',
  499, 9799, 0, NULL, 10298, true, 12, 'standard', 1, NULL,
  '{"plan_code":"A","installments":2,"discount_percent":0,"annual_fee":9799,"discounted_fee":9799,"installment_1":7358,"installment_2":2441}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'coaching_offline' AND ac.slug = 'class-6';

-- Plan B: 10% OFF, 50/50. Discounted = 8819. Total = 499 + 8819 = 9318
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id,
  '2-Installment Plan (10% OFF)',
  'Pay in 2 equal installments with 10% discount on course fee.',
  499, 9799, 980, '10% OFF', 9318, false, 12, 'standard', 2, NULL,
  '{"plan_code":"B","installments":2,"discount_percent":10,"annual_fee":9799,"discounted_fee":8819,"installment_1":4410,"installment_2":4409}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'coaching_offline' AND ac.slug = 'class-6';

-- Plan C: 15% OFF, one-time. Discounted = 8329. Total = 499 + 8329 = 8828
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id,
  'One-Time Payment (15% OFF)',
  'Pay the full amount at once and get 15% discount on course fee.',
  499, 9799, 1470, '15% OFF', 8828, false, 12, 'standard', 3, 'Best Value',
  '{"plan_code":"C","installments":1,"discount_percent":15,"annual_fee":9799,"discounted_fee":8329}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'coaching_offline' AND ac.slug = 'class-6';

-- ---- Class 7 (annual: 10799) ----
-- Plan A: Total = 499 + 10799 = 11298
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id,
  '2-Installment Plan (70/30)',
  'Pay in 2 installments — 70% at admission, 30% within 75 days. No discount on course fee.',
  499, 10799, 0, NULL, 11298, true, 12, 'standard', 1, NULL,
  '{"plan_code":"A","installments":2,"discount_percent":0,"annual_fee":10799,"discounted_fee":10799,"installment_1":7559,"installment_2":3240}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'coaching_offline' AND ac.slug = 'class-7';

-- Plan B: 10% OFF. Discounted = 9719. Total = 499 + 9719 = 10218
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id,
  '2-Installment Plan (10% OFF)',
  'Pay in 2 equal installments with 10% discount on course fee.',
  499, 10799, 1080, '10% OFF', 10218, false, 12, 'standard', 2, NULL,
  '{"plan_code":"B","installments":2,"discount_percent":10,"annual_fee":10799,"discounted_fee":9719,"installment_1":4860,"installment_2":4859}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'coaching_offline' AND ac.slug = 'class-7';

-- Plan C: 15% OFF. Discounted = 9179. Total = 499 + 9179 = 9678
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id,
  'One-Time Payment (15% OFF)',
  'Pay the full amount at once and get 15% discount on course fee.',
  499, 10799, 1620, '15% OFF', 9678, false, 12, 'standard', 3, 'Best Value',
  '{"plan_code":"C","installments":1,"discount_percent":15,"annual_fee":10799,"discounted_fee":9179}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'coaching_offline' AND ac.slug = 'class-7';

-- ---- Class 8 (annual: 11999) ----
-- Plan A: Total = 499 + 11999 = 12498
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id,
  '2-Installment Plan (70/30)',
  'Pay in 2 installments — 70% at admission, 30% within 75 days. No discount on course fee.',
  499, 11999, 0, NULL, 12498, true, 12, 'standard', 1, NULL,
  '{"plan_code":"A","installments":2,"discount_percent":0,"annual_fee":11999,"discounted_fee":11999,"installment_1":8399,"installment_2":3600}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'coaching_offline' AND ac.slug = 'class-8';

-- Plan B: 10% OFF. Discounted = 10799. Total = 499 + 10799 = 11298
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id,
  '2-Installment Plan (10% OFF)',
  'Pay in 2 equal installments with 10% discount on course fee.',
  499, 11999, 1200, '10% OFF', 11298, false, 12, 'standard', 2, NULL,
  '{"plan_code":"B","installments":2,"discount_percent":10,"annual_fee":11999,"discounted_fee":10799,"installment_1":5400,"installment_2":5399}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'coaching_offline' AND ac.slug = 'class-8';

-- Plan C: 15% OFF. Discounted = 10199. Total = 499 + 10199 = 10698
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id,
  'One-Time Payment (15% OFF)',
  'Pay the full amount at once and get 15% discount on course fee.',
  499, 11999, 1800, '15% OFF', 10698, false, 12, 'standard', 3, 'Best Value',
  '{"plan_code":"C","installments":1,"discount_percent":15,"annual_fee":11999,"discounted_fee":10199}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'coaching_offline' AND ac.slug = 'class-8';

-- ---- Class 9 (annual: 17000) ----
-- Plan A: Total = 499 + 17000 = 17499
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id,
  '2-Installment Plan (70/30)',
  'Pay in 2 installments — 70% at admission, 30% within 75 days. No discount on course fee.',
  499, 17000, 0, NULL, 17499, true, 12, 'standard', 1, NULL,
  '{"plan_code":"A","installments":2,"discount_percent":0,"annual_fee":17000,"discounted_fee":17000,"installment_1":11900,"installment_2":5100}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'coaching_offline' AND ac.slug = 'class-9';

-- Plan B: 10% OFF. Discounted = 15300. Total = 499 + 15300 = 15799
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id,
  '2-Installment Plan (10% OFF)',
  'Pay in 2 equal installments with 10% discount on course fee.',
  499, 17000, 1700, '10% OFF', 15799, false, 12, 'standard', 2, NULL,
  '{"plan_code":"B","installments":2,"discount_percent":10,"annual_fee":17000,"discounted_fee":15300,"installment_1":7650,"installment_2":7650}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'coaching_offline' AND ac.slug = 'class-9';

-- Plan C: 15% OFF. Discounted = 14450. Total = 499 + 14450 = 14949
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id,
  'One-Time Payment (15% OFF)',
  'Pay the full amount at once and get 15% discount on course fee.',
  499, 17000, 2550, '15% OFF', 14949, false, 12, 'standard', 3, 'Best Value',
  '{"plan_code":"C","installments":1,"discount_percent":15,"annual_fee":17000,"discounted_fee":14450}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'coaching_offline' AND ac.slug = 'class-9';

-- ---- Class 10 (annual: 21000) ----
-- Plan A: Total = 499 + 21000 = 21499
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id,
  '2-Installment Plan (70/30)',
  'Pay in 2 installments — 70% at admission, 30% within 75 days. No discount on course fee.',
  499, 21000, 0, NULL, 21499, true, 12, 'standard', 1, NULL,
  '{"plan_code":"A","installments":2,"discount_percent":0,"annual_fee":21000,"discounted_fee":21000,"installment_1":14700,"installment_2":6300}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'coaching_offline' AND ac.slug = 'class-10';

-- Plan B: 10% OFF. Discounted = 18900. Total = 499 + 18900 = 19399
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id,
  '2-Installment Plan (10% OFF)',
  'Pay in 2 equal installments with 10% discount on course fee.',
  499, 21000, 2100, '10% OFF', 19399, false, 12, 'standard', 2, NULL,
  '{"plan_code":"B","installments":2,"discount_percent":10,"annual_fee":21000,"discounted_fee":18900,"installment_1":9450,"installment_2":9450}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'coaching_offline' AND ac.slug = 'class-10';

-- Plan C: 15% OFF. Discounted = 17850. Total = 499 + 17850 = 18349
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id,
  'One-Time Payment (15% OFF)',
  'Pay the full amount at once and get 15% discount on course fee.',
  499, 21000, 3150, '15% OFF', 18349, false, 12, 'standard', 3, 'Best Value',
  '{"plan_code":"C","installments":1,"discount_percent":15,"annual_fee":21000,"discounted_fee":17850}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'coaching_offline' AND ac.slug = 'class-10';

-- ---- Class 11 (annual: 26000) ----
-- Plan A: Total = 499 + 26000 = 26499
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id,
  '2-Installment Plan (70/30)',
  'Pay in 2 installments — 70% at admission, 30% within 75 days. No discount on course fee.',
  499, 26000, 0, NULL, 26499, true, 12, 'standard', 1, NULL,
  '{"plan_code":"A","installments":2,"discount_percent":0,"annual_fee":26000,"discounted_fee":26000,"installment_1":18200,"installment_2":7800}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'coaching_offline' AND ac.slug = 'class-11';

-- Plan B: 10% OFF. Discounted = 23400. Total = 499 + 23400 = 23899
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id,
  '2-Installment Plan (10% OFF)',
  'Pay in 2 equal installments with 10% discount on course fee.',
  499, 26000, 2600, '10% OFF', 23899, false, 12, 'standard', 2, NULL,
  '{"plan_code":"B","installments":2,"discount_percent":10,"annual_fee":26000,"discounted_fee":23400,"installment_1":11700,"installment_2":11700}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'coaching_offline' AND ac.slug = 'class-11';

-- Plan C: 15% OFF. Discounted = 22100. Total = 499 + 22100 = 22599
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id,
  'One-Time Payment (15% OFF)',
  'Pay the full amount at once and get 15% discount on course fee.',
  499, 26000, 3900, '15% OFF', 22599, false, 12, 'standard', 3, 'Best Value',
  '{"plan_code":"C","installments":1,"discount_percent":15,"annual_fee":26000,"discounted_fee":22100}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'coaching_offline' AND ac.slug = 'class-11';

-- ---- Class 12 (annual: 33000) ----
-- Plan A: Total = 499 + 33000 = 33499
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id,
  '2-Installment Plan (70/30)',
  'Pay in 2 installments — 70% at admission, 30% within 75 days. No discount on course fee.',
  499, 33000, 0, NULL, 33499, true, 12, 'standard', 1, NULL,
  '{"plan_code":"A","installments":2,"discount_percent":0,"annual_fee":33000,"discounted_fee":33000,"installment_1":23100,"installment_2":9900}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'coaching_offline' AND ac.slug = 'class-12';

-- Plan B: 10% OFF. Discounted = 29700. Total = 499 + 29700 = 30199
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id,
  '2-Installment Plan (10% OFF)',
  'Pay in 2 equal installments with 10% discount on course fee.',
  499, 33000, 3300, '10% OFF', 30199, false, 12, 'standard', 2, NULL,
  '{"plan_code":"B","installments":2,"discount_percent":10,"annual_fee":33000,"discounted_fee":29700,"installment_1":14850,"installment_2":14850}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'coaching_offline' AND ac.slug = 'class-12';

-- Plan C: 15% OFF. Discounted = 28050. Total = 499 + 28050 = 28549
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id,
  'One-Time Payment (15% OFF)',
  'Pay the full amount at once and get 15% discount on course fee.',
  499, 33000, 4950, '15% OFF', 28549, false, 12, 'standard', 3, 'Best Value',
  '{"plan_code":"C","installments":1,"discount_percent":15,"annual_fee":33000,"discounted_fee":28050}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'coaching_offline' AND ac.slug = 'class-12';

-- =============================================
-- VERIFICATION QUERIES (run after migration)
-- =============================================
-- SELECT ac.name, cfp.name as plan, cfp.tuition_fee, cfp.discount_label, cfp.total_amount
-- FROM academic_classes ac
-- JOIN class_fee_plans cfp ON cfp.class_id = ac.id
-- JOIN course_types ct ON ac.course_type_id = ct.id
-- WHERE ct.slug = 'coaching_offline'
-- ORDER BY ac.display_order, cfp.display_order;
