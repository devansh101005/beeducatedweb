-- BeEducated Exam Engine Schema
-- Phase 5: Exam creation, question bank, attempts, and results
-- Run this in Supabase SQL Editor AFTER migrations 001-004

-- =============================================
-- ENUMS
-- =============================================

-- Question types
CREATE TYPE question_type AS ENUM (
  'single_choice',      -- Single correct answer MCQ
  'multiple_choice',    -- Multiple correct answers
  'true_false',         -- True/False
  'numerical',          -- Numerical answer (with tolerance)
  'subjective'          -- Text answer (manual grading)
);

-- Difficulty levels
CREATE TYPE difficulty_level AS ENUM (
  'easy',
  'medium',
  'hard'
);

-- Exam status
CREATE TYPE exam_status AS ENUM (
  'draft',
  'scheduled',
  'live',
  'completed',
  'cancelled'
);

-- Attempt status
CREATE TYPE attempt_status AS ENUM (
  'in_progress',
  'submitted',
  'auto_submitted',     -- Time expired
  'graded',
  'abandoned'
);

-- =============================================
-- QUESTION BANK
-- =============================================

CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Categorization
  subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
  topic_id UUID REFERENCES topics(id) ON DELETE SET NULL,

  -- Question content
  question_text TEXT NOT NULL,
  question_html TEXT,                    -- Rich text version
  question_image_url TEXT,               -- Optional image

  -- Question type and difficulty
  question_type question_type NOT NULL DEFAULT 'single_choice',
  difficulty difficulty_level NOT NULL DEFAULT 'medium',

  -- For numerical questions
  numerical_answer DECIMAL(20, 10),
  numerical_tolerance DECIMAL(10, 5) DEFAULT 0,  -- Acceptable error margin

  -- For subjective questions
  model_answer TEXT,
  max_words INTEGER,

  -- Scoring
  positive_marks DECIMAL(5, 2) NOT NULL DEFAULT 4,
  negative_marks DECIMAL(5, 2) DEFAULT 1,        -- For wrong answers
  partial_marks_allowed BOOLEAN DEFAULT false,   -- For multiple choice

  -- Metadata
  explanation TEXT,                      -- Solution explanation
  explanation_image_url TEXT,
  tags TEXT[],
  source VARCHAR(255),                   -- "JEE Main 2023", "Custom", etc.
  year INTEGER,

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,     -- Reviewed by admin

  -- Audit
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_questions_subject ON questions(subject_id);
CREATE INDEX idx_questions_topic ON questions(topic_id);
CREATE INDEX idx_questions_type ON questions(question_type);
CREATE INDEX idx_questions_difficulty ON questions(difficulty);
CREATE INDEX idx_questions_active ON questions(is_active);
CREATE INDEX idx_questions_tags ON questions USING GIN(tags);

-- =============================================
-- QUESTION OPTIONS (For MCQ)
-- =============================================

CREATE TABLE question_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,

  option_text TEXT NOT NULL,
  option_html TEXT,                      -- Rich text version
  option_image_url TEXT,

  is_correct BOOLEAN NOT NULL DEFAULT false,
  sequence_order INTEGER DEFAULT 0,      -- A, B, C, D order

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_question_options_question ON question_options(question_id);

-- =============================================
-- EXAMS
-- =============================================

CREATE TABLE exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic info
  title VARCHAR(255) NOT NULL,
  description TEXT,
  instructions TEXT,                     -- Exam instructions shown before start

  -- Categorization
  exam_type VARCHAR(100),                -- "JEE Mock", "NEET Practice", "Chapter Test"
  subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  batch_id UUID REFERENCES batches(id) ON DELETE SET NULL,

  -- Timing
  duration_minutes INTEGER NOT NULL,     -- Total exam duration
  start_time TIMESTAMPTZ,                -- When exam becomes available
  end_time TIMESTAMPTZ,                  -- Last time to start exam

  -- Scoring
  total_marks DECIMAL(7, 2),
  passing_marks DECIMAL(7, 2),

  -- Attempt rules
  max_attempts INTEGER DEFAULT 1,
  shuffle_questions BOOLEAN DEFAULT false,
  shuffle_options BOOLEAN DEFAULT false,
  show_result_immediately BOOLEAN DEFAULT true,
  show_answers_after_submit BOOLEAN DEFAULT true,
  allow_review BOOLEAN DEFAULT true,     -- Review after submission

  -- Proctoring (basic)
  enable_tab_switch_detection BOOLEAN DEFAULT false,
  max_tab_switches INTEGER DEFAULT 3,
  enable_fullscreen BOOLEAN DEFAULT false,

  -- Access control
  is_free BOOLEAN DEFAULT false,         -- Free for all enrolled students
  access_code VARCHAR(50),               -- Optional password

  -- Status
  status exam_status DEFAULT 'draft',

  -- Audit
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_exams_status ON exams(status);
CREATE INDEX idx_exams_course ON exams(course_id);
CREATE INDEX idx_exams_batch ON exams(batch_id);
CREATE INDEX idx_exams_subject ON exams(subject_id);
CREATE INDEX idx_exams_start_time ON exams(start_time);
CREATE INDEX idx_exams_end_time ON exams(end_time);

-- =============================================
-- EXAM SECTIONS
-- =============================================

CREATE TABLE exam_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,

  title VARCHAR(255) NOT NULL,           -- "Physics", "Section A", etc.
  description TEXT,
  instructions TEXT,

  -- Section rules
  duration_minutes INTEGER,              -- Optional section-wise time limit
  questions_to_attempt INTEGER,          -- If less than total (choice)

  -- Scoring overrides (optional)
  positive_marks_override DECIMAL(5, 2),
  negative_marks_override DECIMAL(5, 2),

  sequence_order INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_exam_sections_exam ON exam_sections(exam_id);

-- =============================================
-- EXAM QUESTIONS (Questions in an exam)
-- =============================================

CREATE TABLE exam_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
  section_id UUID REFERENCES exam_sections(id) ON DELETE SET NULL,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,

  -- Override marks for this exam
  positive_marks DECIMAL(5, 2),
  negative_marks DECIMAL(5, 2),

  -- Ordering
  sequence_order INTEGER DEFAULT 0,
  is_mandatory BOOLEAN DEFAULT true,     -- Must attempt

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(exam_id, question_id)
);

CREATE INDEX idx_exam_questions_exam ON exam_questions(exam_id);
CREATE INDEX idx_exam_questions_section ON exam_questions(section_id);
CREATE INDEX idx_exam_questions_question ON exam_questions(question_id);

-- =============================================
-- EXAM ATTEMPTS
-- =============================================

CREATE TABLE exam_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,

  -- Timing
  started_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  time_taken_seconds INTEGER,            -- Actual time spent

  -- Status
  status attempt_status DEFAULT 'in_progress',
  attempt_number INTEGER DEFAULT 1,

  -- Proctoring data
  tab_switch_count INTEGER DEFAULT 0,
  ip_address VARCHAR(45),
  user_agent TEXT,

  -- Shuffled order (stored for consistency)
  question_order JSONB,                  -- [questionId1, questionId2, ...]

  -- Results (calculated after submission)
  total_questions INTEGER,
  attempted_questions INTEGER DEFAULT 0,
  correct_answers INTEGER,
  wrong_answers INTEGER,
  skipped_questions INTEGER,

  marks_obtained DECIMAL(7, 2),
  percentage DECIMAL(5, 2),
  rank INTEGER,                          -- Rank among all attempts

  -- Grading
  graded_at TIMESTAMPTZ,
  graded_by UUID REFERENCES users(id),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_exam_attempts_exam ON exam_attempts(exam_id);
CREATE INDEX idx_exam_attempts_student ON exam_attempts(student_id);
CREATE INDEX idx_exam_attempts_status ON exam_attempts(status);
CREATE INDEX idx_exam_attempts_started ON exam_attempts(started_at);

-- =============================================
-- EXAM RESPONSES (Individual answers)
-- =============================================

CREATE TABLE exam_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID REFERENCES exam_attempts(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  exam_question_id UUID REFERENCES exam_questions(id) ON DELETE SET NULL,

  -- Response data
  selected_option_ids UUID[],            -- For MCQ (can be multiple)
  numerical_answer DECIMAL(20, 10),      -- For numerical
  text_answer TEXT,                      -- For subjective

  -- Status
  is_marked_for_review BOOLEAN DEFAULT false,
  is_attempted BOOLEAN DEFAULT false,
  time_spent_seconds INTEGER DEFAULT 0,  -- Time on this question

  -- Grading
  is_correct BOOLEAN,
  marks_awarded DECIMAL(5, 2),
  grader_feedback TEXT,                  -- For subjective

  -- Timestamps
  answered_at TIMESTAMPTZ,
  last_modified_at TIMESTAMPTZ DEFAULT NOW(),

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(attempt_id, question_id)
);

CREATE INDEX idx_exam_responses_attempt ON exam_responses(attempt_id);
CREATE INDEX idx_exam_responses_question ON exam_responses(question_id);
CREATE INDEX idx_exam_responses_marked ON exam_responses(is_marked_for_review);

-- =============================================
-- EXAM RESULTS (Summary view)
-- =============================================

CREATE TABLE exam_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  attempt_id UUID REFERENCES exam_attempts(id) ON DELETE CASCADE,

  -- Best attempt data
  best_marks DECIMAL(7, 2),
  best_percentage DECIMAL(5, 2),
  best_attempt_number INTEGER,

  -- All attempts summary
  total_attempts INTEGER DEFAULT 1,
  average_marks DECIMAL(7, 2),
  average_percentage DECIMAL(5, 2),

  -- Ranking
  rank INTEGER,
  percentile DECIMAL(5, 2),

  -- Status
  is_passed BOOLEAN,
  certificate_issued BOOLEAN DEFAULT false,
  certificate_url TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(exam_id, student_id)
);

CREATE INDEX idx_exam_results_exam ON exam_results(exam_id);
CREATE INDEX idx_exam_results_student ON exam_results(student_id);
CREATE INDEX idx_exam_results_rank ON exam_results(exam_id, rank);

-- =============================================
-- UPDATE TRIGGERS
-- =============================================

CREATE TRIGGER update_questions_updated_at
  BEFORE UPDATE ON questions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exams_updated_at
  BEFORE UPDATE ON exams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exam_sections_updated_at
  BEFORE UPDATE ON exam_sections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exam_attempts_updated_at
  BEFORE UPDATE ON exam_attempts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exam_results_updated_at
  BEFORE UPDATE ON exam_results
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- RLS POLICIES
-- =============================================

ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_results ENABLE ROW LEVEL SECURITY;

-- Questions Policies

-- Admins and teachers can manage questions
CREATE POLICY "Admins can manage all questions" ON questions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.clerk_id = auth.uid()::text
      AND users.role IN ('admin', 'teacher')
    )
  );

-- Exam Policies

-- Anyone can view published/live exams
CREATE POLICY "Users can view available exams" ON exams
  FOR SELECT USING (
    status IN ('scheduled', 'live', 'completed')
  );

-- Admins and teachers can manage exams
CREATE POLICY "Admins can manage exams" ON exams
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.clerk_id = auth.uid()::text
      AND users.role IN ('admin', 'teacher')
    )
  );

-- Exam Sections Policies
CREATE POLICY "Users can view exam sections" ON exam_sections
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM exams
      WHERE exams.id = exam_sections.exam_id
      AND exams.status IN ('scheduled', 'live', 'completed')
    )
  );

CREATE POLICY "Admins can manage exam sections" ON exam_sections
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.clerk_id = auth.uid()::text
      AND users.role IN ('admin', 'teacher')
    )
  );

-- Exam Questions Policies
CREATE POLICY "Admins can manage exam questions" ON exam_questions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.clerk_id = auth.uid()::text
      AND users.role IN ('admin', 'teacher')
    )
  );

-- Question Options Policies
CREATE POLICY "Admins can manage options" ON question_options
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.clerk_id = auth.uid()::text
      AND users.role IN ('admin', 'teacher')
    )
  );

-- Exam Attempts Policies

-- Students can manage their own attempts
CREATE POLICY "Students can manage own attempts" ON exam_attempts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN students s ON s.user_id = u.id
      WHERE u.clerk_id = auth.uid()::text
      AND s.id = exam_attempts.student_id
    )
  );

-- Admins can view all attempts
CREATE POLICY "Admins can view all attempts" ON exam_attempts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.clerk_id = auth.uid()::text
      AND users.role IN ('admin', 'teacher')
    )
  );

-- Exam Responses Policies

-- Students can manage their own responses
CREATE POLICY "Students can manage own responses" ON exam_responses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM exam_attempts ea
      JOIN students s ON s.id = ea.student_id
      JOIN users u ON u.id = s.user_id
      WHERE u.clerk_id = auth.uid()::text
      AND ea.id = exam_responses.attempt_id
    )
  );

-- Admins can view all responses
CREATE POLICY "Admins can view all responses" ON exam_responses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.clerk_id = auth.uid()::text
      AND users.role IN ('admin', 'teacher')
    )
  );

-- Exam Results Policies

-- Students can view their own results
CREATE POLICY "Students can view own results" ON exam_results
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN students s ON s.user_id = u.id
      WHERE u.clerk_id = auth.uid()::text
      AND s.id = exam_results.student_id
    )
  );

-- Admins can manage all results
CREATE POLICY "Admins can manage results" ON exam_results
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.clerk_id = auth.uid()::text
      AND users.role IN ('admin', 'teacher')
    )
  );

-- Service role bypass
CREATE POLICY "Service role full access questions" ON questions FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access options" ON question_options FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access exams" ON exams FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access sections" ON exam_sections FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access exam_questions" ON exam_questions FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access attempts" ON exam_attempts FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access responses" ON exam_responses FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access results" ON exam_results FOR ALL USING (auth.role() = 'service_role');

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Calculate exam statistics
CREATE OR REPLACE FUNCTION calculate_exam_stats(p_exam_id UUID)
RETURNS TABLE (
  total_attempts BIGINT,
  avg_marks DECIMAL,
  avg_percentage DECIMAL,
  highest_marks DECIMAL,
  lowest_marks DECIMAL,
  pass_count BIGINT,
  fail_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_attempts,
    ROUND(AVG(marks_obtained), 2) as avg_marks,
    ROUND(AVG(percentage), 2) as avg_percentage,
    MAX(marks_obtained) as highest_marks,
    MIN(marks_obtained) as lowest_marks,
    COUNT(*) FILTER (WHERE er.is_passed = true)::BIGINT as pass_count,
    COUNT(*) FILTER (WHERE er.is_passed = false)::BIGINT as fail_count
  FROM exam_results er
  WHERE er.exam_id = p_exam_id;
END;
$$ LANGUAGE plpgsql;

-- Auto-grade MCQ responses
CREATE OR REPLACE FUNCTION grade_mcq_response(
  p_response_id UUID
) RETURNS DECIMAL AS $$
DECLARE
  v_question questions%ROWTYPE;
  v_response exam_responses%ROWTYPE;
  v_exam_question exam_questions%ROWTYPE;
  v_correct_options UUID[];
  v_selected_options UUID[];
  v_marks DECIMAL;
  v_positive DECIMAL;
  v_negative DECIMAL;
BEGIN
  -- Get response
  SELECT * INTO v_response FROM exam_responses WHERE id = p_response_id;

  -- Get question
  SELECT * INTO v_question FROM questions WHERE id = v_response.question_id;

  -- Get exam question for marks override
  SELECT * INTO v_exam_question FROM exam_questions WHERE id = v_response.exam_question_id;

  -- Determine marks
  v_positive := COALESCE(v_exam_question.positive_marks, v_question.positive_marks);
  v_negative := COALESCE(v_exam_question.negative_marks, v_question.negative_marks);

  -- Get correct options
  SELECT ARRAY_AGG(id) INTO v_correct_options
  FROM question_options
  WHERE question_id = v_question.id AND is_correct = true;

  v_selected_options := v_response.selected_option_ids;

  -- Calculate marks
  IF v_question.question_type = 'single_choice' THEN
    IF v_selected_options IS NULL OR array_length(v_selected_options, 1) = 0 THEN
      v_marks := 0; -- Not attempted
    ELSIF v_selected_options[1] = ANY(v_correct_options) THEN
      v_marks := v_positive;
    ELSE
      v_marks := -v_negative;
    END IF;

  ELSIF v_question.question_type = 'multiple_choice' THEN
    IF v_selected_options IS NULL OR array_length(v_selected_options, 1) = 0 THEN
      v_marks := 0;
    ELSIF v_selected_options <@ v_correct_options AND v_correct_options <@ v_selected_options THEN
      -- All correct selected
      v_marks := v_positive;
    ELSIF v_question.partial_marks_allowed AND v_selected_options <@ v_correct_options THEN
      -- Partial marks: correct selections but not all
      v_marks := v_positive * (array_length(v_selected_options, 1)::DECIMAL / array_length(v_correct_options, 1));
    ELSE
      v_marks := -v_negative;
    END IF;

  ELSIF v_question.question_type = 'true_false' THEN
    IF v_selected_options IS NULL OR array_length(v_selected_options, 1) = 0 THEN
      v_marks := 0;
    ELSIF v_selected_options[1] = ANY(v_correct_options) THEN
      v_marks := v_positive;
    ELSE
      v_marks := -v_negative;
    END IF;

  ELSIF v_question.question_type = 'numerical' THEN
    IF v_response.numerical_answer IS NULL THEN
      v_marks := 0;
    ELSIF ABS(v_response.numerical_answer - v_question.numerical_answer) <= v_question.numerical_tolerance THEN
      v_marks := v_positive;
    ELSE
      v_marks := -v_negative;
    END IF;

  ELSE
    -- Subjective - manual grading required
    v_marks := NULL;
  END IF;

  -- Update response
  UPDATE exam_responses
  SET
    is_correct = (v_marks IS NOT NULL AND v_marks > 0),
    marks_awarded = v_marks
  WHERE id = p_response_id;

  RETURN v_marks;
END;
$$ LANGUAGE plpgsql;

-- Calculate attempt results
CREATE OR REPLACE FUNCTION calculate_attempt_results(p_attempt_id UUID)
RETURNS VOID AS $$
DECLARE
  v_attempt exam_attempts%ROWTYPE;
  v_exam exams%ROWTYPE;
  v_total_marks DECIMAL := 0;
  v_correct INTEGER := 0;
  v_wrong INTEGER := 0;
  v_skipped INTEGER := 0;
  v_total INTEGER := 0;
BEGIN
  SELECT * INTO v_attempt FROM exam_attempts WHERE id = p_attempt_id;
  SELECT * INTO v_exam FROM exams WHERE id = v_attempt.exam_id;

  -- Count questions
  SELECT COUNT(*) INTO v_total
  FROM exam_questions WHERE exam_id = v_exam.id;

  -- Calculate marks
  SELECT
    COALESCE(SUM(CASE WHEN marks_awarded > 0 THEN marks_awarded ELSE 0 END), 0),
    COUNT(*) FILTER (WHERE is_correct = true),
    COUNT(*) FILTER (WHERE is_correct = false AND is_attempted = true),
    COUNT(*) FILTER (WHERE is_attempted = false)
  INTO v_total_marks, v_correct, v_wrong, v_skipped
  FROM exam_responses
  WHERE attempt_id = p_attempt_id;

  -- Update attempt
  UPDATE exam_attempts
  SET
    total_questions = v_total,
    attempted_questions = v_correct + v_wrong,
    correct_answers = v_correct,
    wrong_answers = v_wrong,
    skipped_questions = v_skipped,
    marks_obtained = v_total_marks,
    percentage = CASE WHEN v_exam.total_marks > 0
      THEN ROUND((v_total_marks / v_exam.total_marks) * 100, 2)
      ELSE 0 END
  WHERE id = p_attempt_id;

  -- Update or create result record
  INSERT INTO exam_results (
    exam_id, student_id, attempt_id,
    best_marks, best_percentage, best_attempt_number,
    total_attempts, average_marks, average_percentage,
    is_passed
  )
  VALUES (
    v_attempt.exam_id, v_attempt.student_id, p_attempt_id,
    v_total_marks,
    CASE WHEN v_exam.total_marks > 0 THEN ROUND((v_total_marks / v_exam.total_marks) * 100, 2) ELSE 0 END,
    v_attempt.attempt_number,
    1, v_total_marks,
    CASE WHEN v_exam.total_marks > 0 THEN ROUND((v_total_marks / v_exam.total_marks) * 100, 2) ELSE 0 END,
    v_total_marks >= COALESCE(v_exam.passing_marks, 0)
  )
  ON CONFLICT (exam_id, student_id) DO UPDATE SET
    best_marks = GREATEST(exam_results.best_marks, EXCLUDED.best_marks),
    best_percentage = GREATEST(exam_results.best_percentage, EXCLUDED.best_percentage),
    best_attempt_number = CASE
      WHEN EXCLUDED.best_marks > exam_results.best_marks THEN EXCLUDED.best_attempt_number
      ELSE exam_results.best_attempt_number END,
    total_attempts = exam_results.total_attempts + 1,
    average_marks = (exam_results.average_marks * exam_results.total_attempts + EXCLUDED.best_marks) / (exam_results.total_attempts + 1),
    average_percentage = (exam_results.average_percentage * exam_results.total_attempts + EXCLUDED.best_percentage) / (exam_results.total_attempts + 1),
    is_passed = exam_results.is_passed OR EXCLUDED.is_passed,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- COMMENTS
-- =============================================

COMMENT ON TABLE questions IS 'Question bank for all exams';
COMMENT ON TABLE question_options IS 'MCQ options for questions';
COMMENT ON TABLE exams IS 'Exam definitions with rules and timing';
COMMENT ON TABLE exam_sections IS 'Sections within an exam (Physics, Chemistry, etc.)';
COMMENT ON TABLE exam_questions IS 'Questions assigned to exams';
COMMENT ON TABLE exam_attempts IS 'Student exam attempts with status';
COMMENT ON TABLE exam_responses IS 'Individual question responses';
COMMENT ON TABLE exam_results IS 'Final results and rankings';
COMMENT ON FUNCTION grade_mcq_response IS 'Auto-grade MCQ, True/False, and Numerical questions';
COMMENT ON FUNCTION calculate_attempt_results IS 'Calculate total marks and update results after submission';
