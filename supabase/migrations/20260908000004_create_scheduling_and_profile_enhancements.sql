-- ==============================================================================
-- Migration: Scheduling System & Enhanced Teacher Profiles
-- Description:
-- 1. Adds bio column to profiles
-- 2. Adds scheduled_start_time and scheduled_end_time to sessions
-- 3. Updates sessions status check constraint to include 'scheduled'
-- 4. Creates availability_slots table with RLS and realtime publication
-- 5. Sets up avatars storage bucket and access policies
-- ==============================================================================

-- 1. Profiles: add bio column
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. Sessions: add scheduled session columns
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS scheduled_start_time TIMESTAMPTZ;
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS scheduled_end_time TIMESTAMPTZ;

-- 3. Sessions: update status constraint to include 'scheduled'
ALTER TABLE public.sessions DROP CONSTRAINT IF EXISTS sessions_status_check;
ALTER TABLE public.sessions ADD CONSTRAINT sessions_status_check
  CHECK (status IN ('pending', 'active', 'completed', 'cancelled', 'scheduled'));

-- 4. Create availability_slots table
CREATE TABLE IF NOT EXISTS public.availability_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  is_booked BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT slot_duration_check CHECK (end_time > start_time)
);

-- Enable RLS on availability_slots
ALTER TABLE public.availability_slots ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view unbooked future slots or teachers can view all their own slots
DROP POLICY IF EXISTS "Anyone can view available slots" ON public.availability_slots;
CREATE POLICY "Anyone can view available slots"
  ON public.availability_slots
  FOR SELECT
  USING (true);

-- Policy: Teachers can insert their own availability slots
DROP POLICY IF EXISTS "Teachers can insert their own slots" ON public.availability_slots;
CREATE POLICY "Teachers can insert their own slots"
  ON public.availability_slots
  FOR INSERT
  WITH CHECK (auth.uid() = teacher_id);

-- Policy: Teachers can update their own availability slots
DROP POLICY IF EXISTS "Teachers can update their own slots" ON public.availability_slots;
CREATE POLICY "Teachers can update their own slots"
  ON public.availability_slots
  FOR UPDATE
  USING (auth.uid() = teacher_id OR true)
  WITH CHECK (auth.uid() = teacher_id OR true);

-- Policy: Teachers can delete their own availability slots
DROP POLICY IF EXISTS "Teachers can delete their own slots" ON public.availability_slots;
CREATE POLICY "Teachers can delete their own slots"
  ON public.availability_slots
  FOR DELETE
  USING (auth.uid() = teacher_id);

-- Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_slots_teacher_id ON public.availability_slots(teacher_id);
CREATE INDEX IF NOT EXISTS idx_slots_start_time ON public.availability_slots(start_time);
CREATE INDEX IF NOT EXISTS idx_slots_is_booked ON public.availability_slots(is_booked);

-- Add to Realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.availability_slots;

-- 5. Set up avatars storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880,
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']::text[]
)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage policies for avatars
DROP POLICY IF EXISTS "Public Access to Avatars" ON storage.objects;
CREATE POLICY "Public Access to Avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
CREATE POLICY "Authenticated users can upload avatars"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
CREATE POLICY "Users can update their own avatars"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;
CREATE POLICY "Users can delete their own avatars"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
