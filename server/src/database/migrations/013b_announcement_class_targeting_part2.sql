-- BeEducated: Add class targeting to announcements - PART 2
-- Run this AFTER Part 1 has been committed in Supabase SQL Editor
-- This uses the 'class' enum value which must already exist

-- =============================================
-- UPDATE RLS POLICY FOR CLASS-BASED TARGETING
-- =============================================

-- Drop the old user-facing select policy and recreate with class targeting
DROP POLICY IF EXISTS "Users can view targeted announcements" ON announcements;

CREATE POLICY "Users can view targeted announcements" ON announcements
  FOR SELECT USING (
    is_published = true
    AND (publish_at IS NULL OR publish_at <= NOW())
    AND (expires_at IS NULL OR expires_at > NOW())
    AND (
      -- All users
      target_type = 'all'
      OR
      -- Role-based
      (target_type = 'role' AND EXISTS (
        SELECT 1 FROM users
        WHERE users.clerk_id = auth.uid()::text
        AND users.role = ANY(target_roles)
      ))
      OR
      -- Class-based (students enrolled in the target class)
      (target_type = 'class' AND EXISTS (
        SELECT 1 FROM users u
        JOIN students s ON s.user_id = u.id
        JOIN class_enrollments ce ON ce.student_id = s.id
        WHERE u.clerk_id = auth.uid()::text
        AND ce.class_id = target_class_id
        AND ce.status = 'active'
      ))
      OR
      -- Legacy batch-based (kept for backward compatibility)
      (target_type = 'batch' AND EXISTS (
        SELECT 1 FROM users u
        JOIN students s ON s.user_id = u.id
        JOIN batch_students bs ON bs.student_id = s.id
        WHERE u.clerk_id = auth.uid()::text
        AND bs.batch_id = target_batch_id
        AND bs.status = 'active'
      ))
      OR
      -- Legacy course-based (kept for backward compatibility)
      (target_type = 'course' AND EXISTS (
        SELECT 1 FROM users u
        JOIN students s ON s.user_id = u.id
        JOIN student_courses sc ON sc.student_id = s.id
        WHERE u.clerk_id = auth.uid()::text
        AND sc.course_id = target_course_id
        AND sc.status = 'active'
      ))
    )
  );

-- =============================================
-- UPDATE UNREAD COUNT FUNCTION
-- =============================================

CREATE OR REPLACE FUNCTION get_unread_announcement_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  unread_count INTEGER;
  user_role user_role;
BEGIN
  SELECT role INTO user_role FROM users WHERE id = p_user_id;

  SELECT COUNT(*)
  INTO unread_count
  FROM announcements a
  WHERE a.is_published = true
    AND (a.publish_at IS NULL OR a.publish_at <= NOW())
    AND (a.expires_at IS NULL OR a.expires_at > NOW())
    AND NOT EXISTS (
      SELECT 1 FROM announcement_reads ar
      WHERE ar.announcement_id = a.id
      AND ar.user_id = p_user_id
    )
    AND (
      a.target_type = 'all'
      OR (a.target_type = 'role' AND user_role = ANY(a.target_roles))
      OR (a.target_type = 'class' AND EXISTS (
        SELECT 1 FROM students s
        JOIN class_enrollments ce ON ce.student_id = s.id
        WHERE s.user_id = p_user_id
        AND ce.class_id = a.target_class_id
        AND ce.status = 'active'
      ))
      OR (a.target_type = 'batch' AND EXISTS (
        SELECT 1 FROM students s
        JOIN batch_students bs ON bs.student_id = s.id
        WHERE s.user_id = p_user_id
        AND bs.batch_id = a.target_batch_id
        AND bs.status = 'active'
      ))
      OR (a.target_type = 'course' AND EXISTS (
        SELECT 1 FROM students s
        JOIN student_courses sc ON sc.student_id = s.id
        WHERE s.user_id = p_user_id
        AND sc.course_id = a.target_course_id
        AND sc.status = 'active'
      ))
    );

  RETURN unread_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
