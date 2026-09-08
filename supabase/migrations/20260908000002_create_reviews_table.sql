-- ==============================================================================
-- Migration: Create reviews table for live session ratings & feedback
-- Description: Enables students and teachers to rate completed sessions (1-5 stars)
-- ==============================================================================

-- 1. Create reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE UNIQUE NOT NULL,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  student_rating INTEGER CHECK (student_rating >= 1 AND student_rating <= 5),
  teacher_rating INTEGER CHECK (teacher_rating >= 1 AND teacher_rating <= 5),
  student_comment TEXT,
  teacher_comment TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
-- Public & Authenticated users can view reviews (required for teacher discovery rating aggregation)
CREATE POLICY "Anyone can view reviews"
  ON public.reviews
  FOR SELECT
  USING (true);

-- Participants of the session can insert a review
CREATE POLICY "Participants can insert reviews"
  ON public.reviews
  FOR INSERT
  WITH CHECK (auth.uid() = student_id OR auth.uid() = teacher_id);

-- Participants of the session can update their review fields
CREATE POLICY "Participants can update their reviews"
  ON public.reviews
  FOR UPDATE
  USING (auth.uid() = student_id OR auth.uid() = teacher_id)
  WITH CHECK (auth.uid() = student_id OR auth.uid() = teacher_id);

-- 4. Indexes for fast aggregation and lookup
CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_session_id ON public.reviews(session_id);
CREATE INDEX IF NOT EXISTS idx_reviews_teacher_id ON public.reviews(teacher_id);
CREATE INDEX IF NOT EXISTS idx_reviews_student_id ON public.reviews(student_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews(created_at);

-- 5. Add to Realtime publication for dynamic rating updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.reviews;
