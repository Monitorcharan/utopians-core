-- ==============================================================================
-- Migration: Create sessions table for Jitsi Meet room URL video tutoring rooms
-- Description: Tracks live session lifecycle between students and teachers
-- ==============================================================================

-- 1. Create sessions table
CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  room_url TEXT NOT NULL,
  started_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  ended_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'cancelled')) NOT NULL,
  amount NUMERIC
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
-- Users can view sessions they are part of
CREATE POLICY "Users can view their own sessions"
  ON public.sessions
  FOR SELECT
  USING (auth.uid() = student_id OR auth.uid() = teacher_id);

-- Students can insert sessions requesting a teacher
CREATE POLICY "Students can create sessions"
  ON public.sessions
  FOR INSERT
  WITH CHECK (auth.uid() = student_id);

-- Participants can update their sessions (e.g. status, ended_at)
CREATE POLICY "Participants can update their sessions"
  ON public.sessions
  FOR UPDATE
  USING (auth.uid() = student_id OR auth.uid() = teacher_id)
  WITH CHECK (auth.uid() = student_id OR auth.uid() = teacher_id);

-- 4. Indexes for fast retrieval
CREATE INDEX IF NOT EXISTS idx_sessions_student_id ON public.sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_sessions_teacher_id ON public.sessions(teacher_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON public.sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_started_at ON public.sessions(started_at);

-- 5. Add to Realtime publication so teachers and students get live session events
ALTER PUBLICATION supabase_realtime ADD TABLE public.sessions;
