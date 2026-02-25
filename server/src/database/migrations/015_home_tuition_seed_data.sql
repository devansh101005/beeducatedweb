-- =============================================
-- MIGRATION 015: HOME TUITION SEED DATA
-- =============================================
-- Activates the home_tuition course type and seeds
-- 15 academic classes (Nursery–12th) with 2 fee plans each:
--   Plan C: 2-Installment (10% OFF annual fee)
--   Plan D: One-Time Payment (15% OFF annual fee)
-- =============================================

-- =============================================
-- STEP 1: Activate home_tuition course type
-- =============================================
UPDATE course_types
SET
  is_active = true,
  coming_soon_message = NULL,
  description = 'Personalized one-on-one tutoring at your home. Customized learning pace with qualified teachers for classes Nursery to 12th.',
  features = ARRAY[
    'One-on-one attention',
    'Flexible scheduling',
    'Customized curriculum',
    'Progress tracking',
    'Home visits by qualified teachers',
    'Monthly & annual payment options'
  ],
  updated_at = NOW()
WHERE slug = 'home_tuition';

-- =============================================
-- STEP 2: Insert 15 academic classes for home_tuition
-- =============================================

-- Nursery
INSERT INTO academic_classes (course_type_id, name, slug, description, duration, features, display_order)
SELECT ct.id, 'Nursery', 'nursery',
  'Personalized home tutoring for Nursery students. Play-based learning with phonics, numbers, and basic concepts.',
  '1 Year',
  ARRAY['Phonics & alphabet recognition', 'Number concepts (1-50)', 'Basic shapes & colors', 'Motor skill activities'],
  1
FROM course_types ct WHERE ct.slug = 'home_tuition';

-- LKG
INSERT INTO academic_classes (course_type_id, name, slug, description, duration, features, display_order)
SELECT ct.id, 'LKG', 'lkg',
  'Home tutoring for LKG students. Structured learning with reading readiness, writing practice, and simple math.',
  '1 Year',
  ARRAY['Reading readiness', 'Writing practice', 'Numbers & counting', 'EVS introduction'],
  2
FROM course_types ct WHERE ct.slug = 'home_tuition';

-- UKG
INSERT INTO academic_classes (course_type_id, name, slug, description, duration, features, display_order)
SELECT ct.id, 'UKG', 'ukg',
  'Home tutoring for UKG students. Comprehensive pre-school curriculum with school readiness preparation.',
  '1 Year',
  ARRAY['Sentence formation', 'Basic addition & subtraction', 'Hindi varnamala', 'School readiness prep'],
  3
FROM course_types ct WHERE ct.slug = 'home_tuition';

-- Class 1
INSERT INTO academic_classes (course_type_id, name, slug, description, duration, features, display_order)
SELECT ct.id, 'Class 1', 'class-1',
  'Personalized home tutoring for Class 1. Building strong fundamentals in reading, writing, and arithmetic.',
  '1 Year',
  ARRAY['English reading & comprehension', 'Hindi & EVS coverage', 'Math fundamentals', 'Handwriting improvement'],
  4
FROM course_types ct WHERE ct.slug = 'home_tuition';

-- Class 2
INSERT INTO academic_classes (course_type_id, name, slug, description, duration, features, display_order)
SELECT ct.id, 'Class 2', 'class-2',
  'Home tutoring for Class 2. Strengthening core subjects with interactive teaching methods.',
  '1 Year',
  ARRAY['Complete NCERT coverage', 'Grammar & composition', 'Mental math skills', 'Science exploration'],
  5
FROM course_types ct WHERE ct.slug = 'home_tuition';

-- Class 3
INSERT INTO academic_classes (course_type_id, name, slug, description, duration, features, display_order)
SELECT ct.id, 'Class 3', 'class-3',
  'Home tutoring for Class 3. Focused on building analytical thinking and strong subject fundamentals.',
  '1 Year',
  ARRAY['NCERT-aligned curriculum', 'Problem-solving skills', 'Creative writing', 'Environmental studies'],
  6
FROM course_types ct WHERE ct.slug = 'home_tuition';

-- Class 4
INSERT INTO academic_classes (course_type_id, name, slug, description, duration, features, display_order)
SELECT ct.id, 'Class 4', 'class-4',
  'Home tutoring for Class 4. Comprehensive subject coverage with focus on conceptual clarity.',
  '1 Year',
  ARRAY['All subjects covered', 'Conceptual understanding', 'Regular assessments', 'Homework assistance'],
  7
FROM course_types ct WHERE ct.slug = 'home_tuition';

-- Class 5
INSERT INTO academic_classes (course_type_id, name, slug, description, duration, features, display_order)
SELECT ct.id, 'Class 5', 'class-5',
  'Home tutoring for Class 5. Preparing students for the transition to middle school with strong academics.',
  '1 Year',
  ARRAY['Middle school preparation', 'Advanced math concepts', 'Science experiments', 'English fluency'],
  8
FROM course_types ct WHERE ct.slug = 'home_tuition';

-- Class 6
INSERT INTO academic_classes (course_type_id, name, slug, description, duration, features, display_order)
SELECT ct.id, 'Class 6', 'class-6',
  'Home tutoring for Class 6. Subject-wise focused teaching with NCERT and beyond.',
  '1 Year',
  ARRAY['Complete NCERT coverage', 'Science & Math focus', 'English grammar & literature', 'Social studies'],
  9
FROM course_types ct WHERE ct.slug = 'home_tuition';

-- Class 7
INSERT INTO academic_classes (course_type_id, name, slug, description, duration, features, display_order)
SELECT ct.id, 'Class 7', 'class-7',
  'Home tutoring for Class 7. Building strong concepts in all core subjects.',
  '1 Year',
  ARRAY['All core subjects', 'Chapter-wise practice', 'Monthly progress reports', 'Exam preparation'],
  10
FROM course_types ct WHERE ct.slug = 'home_tuition';

-- Class 8
INSERT INTO academic_classes (course_type_id, name, slug, description, duration, features, display_order)
SELECT ct.id, 'Class 8', 'class-8',
  'Home tutoring for Class 8. Strengthening fundamentals for high school preparation.',
  '1 Year',
  ARRAY['High school preparation', 'Advanced problem solving', 'All subjects covered', 'Regular testing'],
  11
FROM course_types ct WHERE ct.slug = 'home_tuition';

-- Class 9
INSERT INTO academic_classes (course_type_id, name, slug, description, duration, features, display_order)
SELECT ct.id, 'Class 9', 'class-9',
  'Home tutoring for Class 9. Board pattern preparation with strong conceptual foundation.',
  '1 Year',
  ARRAY['Board pattern preparation', 'NCERT + reference books', 'Regular chapter tests', 'Doubt clearing sessions'],
  12
FROM course_types ct WHERE ct.slug = 'home_tuition';

-- Class 10
INSERT INTO academic_classes (course_type_id, name, slug, description, duration, features, display_order)
SELECT ct.id, 'Class 10', 'class-10',
  'Home tutoring for Class 10. Focused board exam preparation with intensive practice and revision.',
  '1 Year',
  ARRAY['Board exam focused', 'Previous year papers', 'Sample paper practice', 'Intensive revision'],
  13
FROM course_types ct WHERE ct.slug = 'home_tuition';

-- Class 11
INSERT INTO academic_classes (course_type_id, name, slug, description, duration, features, display_order)
SELECT ct.id, 'Class 11', 'class-11',
  'Home tutoring for Class 11. Strong conceptual base for boards and competitive exam preparation.',
  '1 Year',
  ARRAY['Board + competitive prep', 'JEE/NEET foundation', 'Subject-wise deep learning', 'Weekly assessments'],
  14
FROM course_types ct WHERE ct.slug = 'home_tuition';

-- Class 12
INSERT INTO academic_classes (course_type_id, name, slug, description, duration, features, display_order)
SELECT ct.id, 'Class 12', 'class-12',
  'Home tutoring for Class 12. Board exam excellence with competitive exam preparation support.',
  '1 Year',
  ARRAY['Board + entrance exam focus', 'Complete syllabus coverage', 'Mock tests & revision', 'Performance tracking'],
  15
FROM course_types ct WHERE ct.slug = 'home_tuition';

-- =============================================
-- STEP 3: Insert fee plans (2 per class)
-- Plan C: 2-Installment (10% OFF annual fee)
-- Plan D: One-Time Payment (15% OFF annual fee)
-- =============================================
-- Annual fees by class:
--   Nursery: 24000, LKG: 24600, UKG: 25200
--   1st: 25800, 2nd: 26400, 3rd: 27000, 4th: 27600
--   5th: 30000, 6th: 31200, 7th: 32400, 8th: 33600
--   9th: 38400, 10th: 42000, 11th: 72000, 12th: 78000
--
-- Registration fee: ₹499 for all classes
-- Plan C total = 499 + (annual * 0.90)
-- Plan D total = 499 + (annual * 0.85)
-- =============================================

-- ---- Nursery (annual: 24000) ----
-- Plan C: 499 + 21600 = 22099
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id,
  '2-Installment Plan',
  'Pay in 2 easy installments with 10% discount on annual fee. 1st installment at admission, 2nd after 6 months.',
  499, 24000, 2400, '10% OFF', 22099, true, 12, 'standard', 1, NULL,
  '{"plan_code":"C","installments":2,"discount_percent":10,"annual_fee":24000,"discounted_fee":21600,"installment_1":11299,"installment_2":10800}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'nursery';

-- Plan D: 499 + 20400 = 20899
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id,
  'One-Time Payment',
  'Pay the full amount at once and get 15% discount on annual fee.',
  499, 24000, 3600, '15% OFF', 20899, false, 12, 'standard', 2, 'Best Value',
  '{"plan_code":"D","installments":1,"discount_percent":15,"annual_fee":24000,"discounted_fee":20400}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'nursery';

-- ---- LKG (annual: 24600) ----
-- Plan C: 499 + 22140 = 22639
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id,
  '2-Installment Plan',
  'Pay in 2 easy installments with 10% discount on annual fee. 1st installment at admission, 2nd after 6 months.',
  499, 24600, 2460, '10% OFF', 22639, true, 12, 'standard', 1, NULL,
  '{"plan_code":"C","installments":2,"discount_percent":10,"annual_fee":24600,"discounted_fee":22140,"installment_1":11569,"installment_2":11070}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'lkg';

-- Plan D: 499 + 20910 = 21409
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id,
  'One-Time Payment',
  'Pay the full amount at once and get 15% discount on annual fee.',
  499, 24600, 3690, '15% OFF', 21409, false, 12, 'standard', 2, 'Best Value',
  '{"plan_code":"D","installments":1,"discount_percent":15,"annual_fee":24600,"discounted_fee":20910}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'lkg';

-- ---- UKG (annual: 25200) ----
-- Plan C: 499 + 22680 = 23179
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id,
  '2-Installment Plan',
  'Pay in 2 easy installments with 10% discount on annual fee. 1st installment at admission, 2nd after 6 months.',
  499, 25200, 2520, '10% OFF', 23179, true, 12, 'standard', 1, NULL,
  '{"plan_code":"C","installments":2,"discount_percent":10,"annual_fee":25200,"discounted_fee":22680,"installment_1":11839,"installment_2":11340}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'ukg';

-- Plan D: 499 + 21420 = 21919
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id,
  'One-Time Payment',
  'Pay the full amount at once and get 15% discount on annual fee.',
  499, 25200, 3780, '15% OFF', 21919, false, 12, 'standard', 2, 'Best Value',
  '{"plan_code":"D","installments":1,"discount_percent":15,"annual_fee":25200,"discounted_fee":21420}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'ukg';

-- ---- Class 1 (annual: 25800) ----
-- Plan C: 499 + 23220 = 23719
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id,
  '2-Installment Plan',
  'Pay in 2 easy installments with 10% discount on annual fee. 1st installment at admission, 2nd after 6 months.',
  499, 25800, 2580, '10% OFF', 23719, true, 12, 'standard', 1, NULL,
  '{"plan_code":"C","installments":2,"discount_percent":10,"annual_fee":25800,"discounted_fee":23220,"installment_1":12109,"installment_2":11610}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-1';

-- Plan D: 499 + 21930 = 22429
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id,
  'One-Time Payment',
  'Pay the full amount at once and get 15% discount on annual fee.',
  499, 25800, 3870, '15% OFF', 22429, false, 12, 'standard', 2, 'Best Value',
  '{"plan_code":"D","installments":1,"discount_percent":15,"annual_fee":25800,"discounted_fee":21930}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-1';

-- ---- Class 2 (annual: 26400) ----
-- Plan C: 499 + 23760 = 24259
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id,
  '2-Installment Plan',
  'Pay in 2 easy installments with 10% discount on annual fee. 1st installment at admission, 2nd after 6 months.',
  499, 26400, 2640, '10% OFF', 24259, true, 12, 'standard', 1, NULL,
  '{"plan_code":"C","installments":2,"discount_percent":10,"annual_fee":26400,"discounted_fee":23760,"installment_1":12379,"installment_2":11880}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-2';

-- Plan D: 499 + 22440 = 22939
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id,
  'One-Time Payment',
  'Pay the full amount at once and get 15% discount on annual fee.',
  499, 26400, 3960, '15% OFF', 22939, false, 12, 'standard', 2, 'Best Value',
  '{"plan_code":"D","installments":1,"discount_percent":15,"annual_fee":26400,"discounted_fee":22440}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-2';

-- ---- Class 3 (annual: 27000) ----
-- Plan C: 499 + 24300 = 24799
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id,
  '2-Installment Plan',
  'Pay in 2 easy installments with 10% discount on annual fee. 1st installment at admission, 2nd after 6 months.',
  499, 27000, 2700, '10% OFF', 24799, true, 12, 'standard', 1, NULL,
  '{"plan_code":"C","installments":2,"discount_percent":10,"annual_fee":27000,"discounted_fee":24300,"installment_1":12649,"installment_2":12150}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-3';

-- Plan D: 499 + 22950 = 23449
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id,
  'One-Time Payment',
  'Pay the full amount at once and get 15% discount on annual fee.',
  499, 27000, 4050, '15% OFF', 23449, false, 12, 'standard', 2, 'Best Value',
  '{"plan_code":"D","installments":1,"discount_percent":15,"annual_fee":27000,"discounted_fee":22950}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-3';

-- ---- Class 4 (annual: 27600) ----
-- Plan C: 499 + 24840 = 25339
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id,
  '2-Installment Plan',
  'Pay in 2 easy installments with 10% discount on annual fee. 1st installment at admission, 2nd after 6 months.',
  499, 27600, 2760, '10% OFF', 25339, true, 12, 'standard', 1, NULL,
  '{"plan_code":"C","installments":2,"discount_percent":10,"annual_fee":27600,"discounted_fee":24840,"installment_1":12919,"installment_2":12420}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-4';

-- Plan D: 499 + 23460 = 23959
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id,
  'One-Time Payment',
  'Pay the full amount at once and get 15% discount on annual fee.',
  499, 27600, 4140, '15% OFF', 23959, false, 12, 'standard', 2, 'Best Value',
  '{"plan_code":"D","installments":1,"discount_percent":15,"annual_fee":27600,"discounted_fee":23460}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-4';

-- ---- Class 5 (annual: 30000) ----
-- Plan C: 499 + 27000 = 27499
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id,
  '2-Installment Plan',
  'Pay in 2 easy installments with 10% discount on annual fee. 1st installment at admission, 2nd after 6 months.',
  499, 30000, 3000, '10% OFF', 27499, true, 12, 'standard', 1, NULL,
  '{"plan_code":"C","installments":2,"discount_percent":10,"annual_fee":30000,"discounted_fee":27000,"installment_1":13999,"installment_2":13500}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-5';

-- Plan D: 499 + 25500 = 25999
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id,
  'One-Time Payment',
  'Pay the full amount at once and get 15% discount on annual fee.',
  499, 30000, 4500, '15% OFF', 25999, false, 12, 'standard', 2, 'Best Value',
  '{"plan_code":"D","installments":1,"discount_percent":15,"annual_fee":30000,"discounted_fee":25500}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-5';

-- ---- Class 6 (annual: 31200) ----
-- Plan C: 499 + 28080 = 28579
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id,
  '2-Installment Plan',
  'Pay in 2 easy installments with 10% discount on annual fee. 1st installment at admission, 2nd after 6 months.',
  499, 31200, 3120, '10% OFF', 28579, true, 12, 'standard', 1, NULL,
  '{"plan_code":"C","installments":2,"discount_percent":10,"annual_fee":31200,"discounted_fee":28080,"installment_1":14539,"installment_2":14040}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-6';

-- Plan D: 499 + 26520 = 27019
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id,
  'One-Time Payment',
  'Pay the full amount at once and get 15% discount on annual fee.',
  499, 31200, 4680, '15% OFF', 27019, false, 12, 'standard', 2, 'Best Value',
  '{"plan_code":"D","installments":1,"discount_percent":15,"annual_fee":31200,"discounted_fee":26520}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-6';

-- ---- Class 7 (annual: 32400) ----
-- Plan C: 499 + 29160 = 29659
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id,
  '2-Installment Plan',
  'Pay in 2 easy installments with 10% discount on annual fee. 1st installment at admission, 2nd after 6 months.',
  499, 32400, 3240, '10% OFF', 29659, true, 12, 'standard', 1, NULL,
  '{"plan_code":"C","installments":2,"discount_percent":10,"annual_fee":32400,"discounted_fee":29160,"installment_1":15079,"installment_2":14580}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-7';

-- Plan D: 499 + 27540 = 28039
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id,
  'One-Time Payment',
  'Pay the full amount at once and get 15% discount on annual fee.',
  499, 32400, 4860, '15% OFF', 28039, false, 12, 'standard', 2, 'Best Value',
  '{"plan_code":"D","installments":1,"discount_percent":15,"annual_fee":32400,"discounted_fee":27540}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-7';

-- ---- Class 8 (annual: 33600) ----
-- Plan C: 499 + 30240 = 30739
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id,
  '2-Installment Plan',
  'Pay in 2 easy installments with 10% discount on annual fee. 1st installment at admission, 2nd after 6 months.',
  499, 33600, 3360, '10% OFF', 30739, true, 12, 'standard', 1, NULL,
  '{"plan_code":"C","installments":2,"discount_percent":10,"annual_fee":33600,"discounted_fee":30240,"installment_1":15619,"installment_2":15120}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-8';

-- Plan D: 499 + 28560 = 29059
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id,
  'One-Time Payment',
  'Pay the full amount at once and get 15% discount on annual fee.',
  499, 33600, 5040, '15% OFF', 29059, false, 12, 'standard', 2, 'Best Value',
  '{"plan_code":"D","installments":1,"discount_percent":15,"annual_fee":33600,"discounted_fee":28560}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-8';

-- ---- Class 9 (annual: 38400) ----
-- Plan C: 499 + 34560 = 35059
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id,
  '2-Installment Plan',
  'Pay in 2 easy installments with 10% discount on annual fee. 1st installment at admission, 2nd after 6 months.',
  499, 38400, 3840, '10% OFF', 35059, true, 12, 'standard', 1, NULL,
  '{"plan_code":"C","installments":2,"discount_percent":10,"annual_fee":38400,"discounted_fee":34560,"installment_1":17779,"installment_2":17280}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-9';

-- Plan D: 499 + 32640 = 33139
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id,
  'One-Time Payment',
  'Pay the full amount at once and get 15% discount on annual fee.',
  499, 38400, 5760, '15% OFF', 33139, false, 12, 'standard', 2, 'Best Value',
  '{"plan_code":"D","installments":1,"discount_percent":15,"annual_fee":38400,"discounted_fee":32640}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-9';

-- ---- Class 10 (annual: 42000) ----
-- Plan C: 499 + 37800 = 38299
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id,
  '2-Installment Plan',
  'Pay in 2 easy installments with 10% discount on annual fee. 1st installment at admission, 2nd after 6 months.',
  499, 42000, 4200, '10% OFF', 38299, true, 12, 'standard', 1, NULL,
  '{"plan_code":"C","installments":2,"discount_percent":10,"annual_fee":42000,"discounted_fee":37800,"installment_1":19399,"installment_2":18900}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-10';

-- Plan D: 499 + 35700 = 36199
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id,
  'One-Time Payment',
  'Pay the full amount at once and get 15% discount on annual fee.',
  499, 42000, 6300, '15% OFF', 36199, false, 12, 'standard', 2, 'Best Value',
  '{"plan_code":"D","installments":1,"discount_percent":15,"annual_fee":42000,"discounted_fee":35700}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-10';

-- ---- Class 11 (annual: 72000) ----
-- Plan C: 499 + 64800 = 65299
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id,
  '2-Installment Plan',
  'Pay in 2 easy installments with 10% discount on annual fee. 1st installment at admission, 2nd after 6 months.',
  499, 72000, 7200, '10% OFF', 65299, true, 12, 'standard', 1, NULL,
  '{"plan_code":"C","installments":2,"discount_percent":10,"annual_fee":72000,"discounted_fee":64800,"installment_1":32899,"installment_2":32400}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-11';

-- Plan D: 499 + 61200 = 61699
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id,
  'One-Time Payment',
  'Pay the full amount at once and get 15% discount on annual fee.',
  499, 72000, 10800, '15% OFF', 61699, false, 12, 'standard', 2, 'Best Value',
  '{"plan_code":"D","installments":1,"discount_percent":15,"annual_fee":72000,"discounted_fee":61200}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-11';

-- ---- Class 12 (annual: 78000) ----
-- Plan C: 499 + 70200 = 70699
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id,
  '2-Installment Plan',
  'Pay in 2 easy installments with 10% discount on annual fee. 1st installment at admission, 2nd after 6 months.',
  499, 78000, 7800, '10% OFF', 70699, true, 12, 'standard', 1, NULL,
  '{"plan_code":"C","installments":2,"discount_percent":10,"annual_fee":78000,"discounted_fee":70200,"installment_1":35599,"installment_2":35100}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-12';

-- Plan D: 499 + 66300 = 66799
INSERT INTO class_fee_plans (class_id, name, description, registration_fee, tuition_fee, discount_amount, discount_label, total_amount, is_default, validity_months, plan_type, display_order, highlight_label, metadata)
SELECT ac.id,
  'One-Time Payment',
  'Pay the full amount at once and get 15% discount on annual fee.',
  499, 78000, 11700, '15% OFF', 66799, false, 12, 'standard', 2, 'Best Value',
  '{"plan_code":"D","installments":1,"discount_percent":15,"annual_fee":78000,"discounted_fee":66300}'::jsonb
FROM academic_classes ac JOIN course_types ct ON ac.course_type_id = ct.id
WHERE ct.slug = 'home_tuition' AND ac.slug = 'class-12';

-- =============================================
-- VERIFICATION QUERIES (run after migration)
-- =============================================
-- SELECT ct.name, COUNT(ac.id) as classes FROM course_types ct LEFT JOIN academic_classes ac ON ac.course_type_id = ct.id WHERE ct.slug = 'home_tuition' GROUP BY ct.name;
-- SELECT ac.name, ac.slug, cfp.name as plan, cfp.total_amount, cfp.discount_label FROM academic_classes ac JOIN class_fee_plans cfp ON cfp.class_id = ac.id JOIN course_types ct ON ac.course_type_id = ct.id WHERE ct.slug = 'home_tuition' ORDER BY ac.display_order, cfp.display_order;
