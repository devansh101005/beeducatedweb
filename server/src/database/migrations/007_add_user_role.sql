-- Add 'user' role to user_role enum
-- This is the default role for new signups before they apply for student/teacher roles

-- Add new value to existing enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'user';

-- Note: The 'user' role should be used for:
-- - New signups who haven't applied for a specific role yet
-- - Users who want to browse but not enroll
-- - Pending applications that haven't been approved yet
