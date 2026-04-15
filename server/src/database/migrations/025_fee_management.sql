-- =============================================
-- Migration 025: Fee Management Dashboard
-- =============================================
-- Adds:
--   1. reminder_log table — tracks every fee reminder sent (manual + automated)
--   2. Suspension columns on class_enrollments
--   3. 'suspended' value on enrollment_status enum
-- =============================================

-- =============================================
-- STEP 1: Add 'suspended' to enrollment_status enum
-- =============================================
-- Note: ALTER TYPE ADD VALUE cannot run inside a transaction in some clients.
-- If running this whole file in one transaction fails, run this statement separately.
ALTER TYPE enrollment_status ADD VALUE IF NOT EXISTS 'suspended';

-- =============================================
-- STEP 2: Suspension columns on class_enrollments
-- =============================================
ALTER TABLE class_enrollments
  ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS suspended_by UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS suspension_reason TEXT,
  ADD COLUMN IF NOT EXISTS suspension_email_sent BOOLEAN DEFAULT false;

COMMENT ON COLUMN class_enrollments.suspended_at IS 'Timestamp when admin suspended this enrollment';
COMMENT ON COLUMN class_enrollments.suspended_by IS 'Admin user who performed the suspension';
COMMENT ON COLUMN class_enrollments.suspension_reason IS 'Reason shown to student in suspension email';
COMMENT ON COLUMN class_enrollments.suspension_email_sent IS 'True if suspension notification email was delivered';

-- =============================================
-- STEP 3: reminder_log — audit trail for every reminder
-- =============================================
CREATE TABLE IF NOT EXISTS reminder_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relations
  student_id    UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  fee_id        UUID REFERENCES student_fees(id) ON DELETE CASCADE,
  enrollment_id UUID REFERENCES class_enrollments(id) ON DELETE CASCADE,

  -- What kind of reminder
  reminder_type TEXT NOT NULL CHECK (reminder_type IN (
    'due_in_7',
    'due_in_3',
    'due_tomorrow',
    'due_today',
    'overdue_week_1',
    'overdue_week_2',
    'overdue_week_3',
    'overdue_week_4_plus',
    'manual',
    'suspension'
  )),

  -- Delivery details
  channel       TEXT NOT NULL DEFAULT 'email' CHECK (channel IN ('email', 'sms', 'whatsapp')),
  sent_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_by       UUID REFERENCES users(id) ON DELETE SET NULL,  -- NULL = automated cron
  status        TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed')),
  error_message TEXT,

  -- Snapshot context (so we can audit even if related rows change later)
  metadata      JSONB DEFAULT '{}'::jsonb,

  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE reminder_log IS 'Audit log of fee reminders sent to students (manual and automated).';
COMMENT ON COLUMN reminder_log.sent_by IS 'NULL when sent by automated cron; admin user_id when sent manually';
COMMENT ON COLUMN reminder_log.metadata IS 'Snapshot: { className, amount, dueDate, tone, customMessage }';

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_reminder_log_student_fee_type
  ON reminder_log(student_id, fee_id, reminder_type);

CREATE INDEX IF NOT EXISTS idx_reminder_log_sent_at
  ON reminder_log(sent_at DESC);

CREATE INDEX IF NOT EXISTS idx_reminder_log_enrollment
  ON reminder_log(enrollment_id);

-- =============================================
-- STEP 4: RLS policies for reminder_log
-- =============================================
ALTER TABLE reminder_log ENABLE ROW LEVEL SECURITY;

-- Students can view their own reminder history
DROP POLICY IF EXISTS "Students view own reminders" ON reminder_log;
CREATE POLICY "Students view own reminders"
  ON reminder_log FOR SELECT
  USING (
    student_id IN (
      SELECT id FROM students WHERE user_id IN (
        SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'
      )
    )
  );

-- Service role full access (server uses service key)
DROP POLICY IF EXISTS "Service role full access reminder_log" ON reminder_log;
CREATE POLICY "Service role full access reminder_log"
  ON reminder_log FOR ALL
  USING (auth.role() = 'service_role');

-- =============================================
-- DONE
-- =============================================
