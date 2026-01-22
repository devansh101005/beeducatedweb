-- BeEducated Content & Announcements Schema
-- Phase 3: Content management, file uploads, and announcements
-- Run this in Supabase SQL Editor AFTER migrations 001, 002, and 003

-- =============================================
-- ENUMS
-- =============================================

-- Content types
CREATE TYPE content_type AS ENUM (
  'video',
  'pdf',
  'document',
  'image',
  'audio',
  'link'
);

-- Announcement priority
CREATE TYPE announcement_priority AS ENUM (
  'low',
  'normal',
  'high',
  'urgent'
);

-- Announcement target type
CREATE TYPE announcement_target AS ENUM (
  'all',
  'batch',
  'course',
  'role'
);

-- =============================================
-- CONTENT TABLE (Course Materials)
-- =============================================

CREATE TABLE content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships (at least one must be set)
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
  batch_id UUID REFERENCES batches(id) ON DELETE SET NULL, -- Optional: batch-specific content

  -- Basic info
  title VARCHAR(255) NOT NULL,
  description TEXT,
  content_type content_type NOT NULL,

  -- File info
  file_path TEXT NOT NULL,          -- Supabase storage path
  file_name VARCHAR(255),           -- Original file name
  file_size BIGINT,                 -- Size in bytes
  mime_type VARCHAR(100),

  -- Media-specific
  duration_seconds INTEGER,         -- For video/audio
  thumbnail_path TEXT,              -- Thumbnail image path

  -- Organization
  sequence_order INTEGER DEFAULT 0, -- Order within topic/course

  -- Access control
  is_free BOOLEAN DEFAULT false,    -- Preview content (no enrollment needed)
  is_downloadable BOOLEAN DEFAULT false,

  -- Status
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,

  -- Metadata
  tags TEXT[],
  metadata JSONB DEFAULT '{}',

  -- Audit
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_content_course ON content(course_id);
CREATE INDEX idx_content_topic ON content(topic_id);
CREATE INDEX idx_content_batch ON content(batch_id);
CREATE INDEX idx_content_type ON content(content_type);
CREATE INDEX idx_content_published ON content(is_published);
CREATE INDEX idx_content_sequence ON content(course_id, sequence_order);

-- =============================================
-- CONTENT PROGRESS (Track student progress)
-- =============================================

CREATE TABLE content_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID REFERENCES content(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,

  -- Progress tracking
  progress_seconds INTEGER DEFAULT 0,    -- For video/audio: watched duration
  progress_percent DECIMAL(5,2) DEFAULT 0,

  -- Completion
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,

  -- Engagement
  view_count INTEGER DEFAULT 1,
  last_position_seconds INTEGER DEFAULT 0, -- Resume position
  last_accessed_at TIMESTAMPTZ DEFAULT NOW(),

  -- Notes/bookmarks (optional)
  notes JSONB DEFAULT '[]',          -- [{ time: 120, note: "Important formula" }]

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(content_id, student_id)
);

CREATE INDEX idx_content_progress_content ON content_progress(content_id);
CREATE INDEX idx_content_progress_student ON content_progress(student_id);
CREATE INDEX idx_content_progress_completed ON content_progress(completed);

-- =============================================
-- ANNOUNCEMENTS TABLE
-- =============================================

CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Content
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,

  -- Targeting
  target_type announcement_target NOT NULL DEFAULT 'all',
  target_batch_id UUID REFERENCES batches(id) ON DELETE CASCADE,
  target_course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  target_roles user_role[],         -- For role-based targeting

  -- Priority & Display
  priority announcement_priority DEFAULT 'normal',
  is_pinned BOOLEAN DEFAULT false,

  -- Attachments (stored in Supabase Storage)
  attachments JSONB DEFAULT '[]',   -- [{ name: "file.pdf", path: "...", size: 1234 }]

  -- Scheduling
  publish_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,

  -- Status
  is_published BOOLEAN DEFAULT true,

  -- Audit
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_announcements_target_type ON announcements(target_type);
CREATE INDEX idx_announcements_batch ON announcements(target_batch_id);
CREATE INDEX idx_announcements_course ON announcements(target_course_id);
CREATE INDEX idx_announcements_priority ON announcements(priority);
CREATE INDEX idx_announcements_published ON announcements(is_published, publish_at);
CREATE INDEX idx_announcements_expires ON announcements(expires_at);

-- =============================================
-- ANNOUNCEMENT READS (Track who read what)
-- =============================================

CREATE TABLE announcement_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID REFERENCES announcements(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(announcement_id, user_id)
);

CREATE INDEX idx_announcement_reads_announcement ON announcement_reads(announcement_id);
CREATE INDEX idx_announcement_reads_user ON announcement_reads(user_id);

-- =============================================
-- STORAGE BUCKETS (Reference for Supabase Storage)
-- =============================================

-- Note: Create these buckets in Supabase Dashboard -> Storage
--
-- Buckets to create:
-- 1. course-content (private) - Course videos, PDFs, documents
-- 2. thumbnails (public) - Content thumbnails
-- 3. announcements (private) - Announcement attachments
-- 4. avatars (public) - User profile pictures

-- =============================================
-- UPDATE TRIGGERS
-- =============================================

CREATE TRIGGER update_content_updated_at
  BEFORE UPDATE ON content
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_progress_updated_at
  BEFORE UPDATE ON content_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_announcements_updated_at
  BEFORE UPDATE ON announcements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- RLS POLICIES
-- =============================================

ALTER TABLE content ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_reads ENABLE ROW LEVEL SECURITY;

-- Content Policies

-- Anyone can view free/published content
CREATE POLICY "Anyone can view free published content" ON content
  FOR SELECT USING (
    is_published = true AND is_free = true
  );

-- Enrolled students can view course content
CREATE POLICY "Enrolled students can view course content" ON content
  FOR SELECT USING (
    is_published = true AND (
      -- Check course enrollment
      EXISTS (
        SELECT 1 FROM student_courses sc
        JOIN students s ON s.id = sc.student_id
        JOIN users u ON u.id = s.user_id
        WHERE u.clerk_id = auth.uid()::text
        AND sc.course_id = content.course_id
        AND sc.status = 'active'
      )
      OR
      -- Check batch enrollment (batch has the course)
      EXISTS (
        SELECT 1 FROM batch_students bs
        JOIN students s ON s.id = bs.student_id
        JOIN users u ON u.id = s.user_id
        JOIN batch_courses bc ON bc.batch_id = bs.batch_id
        WHERE u.clerk_id = auth.uid()::text
        AND bc.course_id = content.course_id
        AND bs.status = 'active'
      )
    )
  );

-- Teachers can view content of their courses
CREATE POLICY "Teachers can view their course content" ON content
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN teachers t ON t.user_id = u.id
      JOIN courses c ON c.primary_teacher_id = t.id
      WHERE u.clerk_id = auth.uid()::text
      AND c.id = content.course_id
    )
  );

-- Admins can manage all content
CREATE POLICY "Admins can manage all content" ON content
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.clerk_id = auth.uid()::text
      AND users.role = 'admin'
    )
  );

-- Teachers can manage content of their courses
CREATE POLICY "Teachers can manage their course content" ON content
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN teachers t ON t.user_id = u.id
      JOIN courses c ON c.primary_teacher_id = t.id
      WHERE u.clerk_id = auth.uid()::text
      AND c.id = content.course_id
    )
  );

-- Content Progress Policies

-- Students can manage their own progress
CREATE POLICY "Students can manage own progress" ON content_progress
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN students s ON s.user_id = u.id
      WHERE u.clerk_id = auth.uid()::text
      AND s.id = content_progress.student_id
    )
  );

-- Admins can view all progress
CREATE POLICY "Admins can view all progress" ON content_progress
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.clerk_id = auth.uid()::text
      AND users.role = 'admin'
    )
  );

-- Teachers can view progress in their courses
CREATE POLICY "Teachers can view progress in their courses" ON content_progress
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN teachers t ON t.user_id = u.id
      JOIN content c ON c.id = content_progress.content_id
      JOIN courses co ON co.id = c.course_id
      WHERE u.clerk_id = auth.uid()::text
      AND co.primary_teacher_id = t.id
    )
  );

-- Announcement Policies

-- Users see announcements targeted to them
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
      -- Batch-based
      (target_type = 'batch' AND EXISTS (
        SELECT 1 FROM users u
        JOIN students s ON s.user_id = u.id
        JOIN batch_students bs ON bs.student_id = s.id
        WHERE u.clerk_id = auth.uid()::text
        AND bs.batch_id = target_batch_id
        AND bs.status = 'active'
      ))
      OR
      -- Course-based
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

-- Admins can manage all announcements
CREATE POLICY "Admins can manage announcements" ON announcements
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.clerk_id = auth.uid()::text
      AND users.role = 'admin'
    )
  );

-- Teachers can create announcements for their batches/courses
CREATE POLICY "Teachers can create announcements" ON announcements
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.clerk_id = auth.uid()::text
      AND users.role IN ('admin', 'teacher')
    )
  );

-- Announcement Reads Policies

-- Users can manage their own read status
CREATE POLICY "Users can manage own reads" ON announcement_reads
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.clerk_id = auth.uid()::text
      AND users.id = announcement_reads.user_id
    )
  );

-- Admins can view all reads
CREATE POLICY "Admins can view all reads" ON announcement_reads
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.clerk_id = auth.uid()::text
      AND users.role = 'admin'
    )
  );

-- Service role bypass
CREATE POLICY "Service role full access content" ON content FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access content_progress" ON content_progress FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access announcements" ON announcements FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access announcement_reads" ON announcement_reads FOR ALL USING (auth.role() = 'service_role');

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Function to get unread announcement count for a user
CREATE OR REPLACE FUNCTION get_unread_announcement_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  unread_count INTEGER;
  user_role user_role;
BEGIN
  -- Get user's role
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

-- Function to calculate content completion for a course
CREATE OR REPLACE FUNCTION get_course_completion_percent(
  p_student_id UUID,
  p_course_id UUID
)
RETURNS DECIMAL AS $$
DECLARE
  total_content INTEGER;
  completed_content INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_content
  FROM content
  WHERE course_id = p_course_id AND is_published = true;

  IF total_content = 0 THEN
    RETURN 0;
  END IF;

  SELECT COUNT(*) INTO completed_content
  FROM content_progress cp
  JOIN content c ON c.id = cp.content_id
  WHERE cp.student_id = p_student_id
    AND c.course_id = p_course_id
    AND cp.completed = true;

  RETURN ROUND((completed_content::DECIMAL / total_content) * 100, 2);
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- COMMENTS
-- =============================================

COMMENT ON TABLE content IS 'Course materials including videos, PDFs, documents';
COMMENT ON TABLE content_progress IS 'Track student progress through content';
COMMENT ON TABLE announcements IS 'System announcements with targeting capabilities';
COMMENT ON TABLE announcement_reads IS 'Track which users have read announcements';
COMMENT ON FUNCTION get_unread_announcement_count IS 'Returns count of unread announcements for a user';
COMMENT ON FUNCTION get_course_completion_percent IS 'Calculates course completion percentage for a student';
