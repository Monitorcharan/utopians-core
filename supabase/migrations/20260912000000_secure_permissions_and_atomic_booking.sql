BEGIN;

-- Existing sessions remain valid; only new bookings receive a slot reference.
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS availability_slot_id UUID;
ALTER TABLE public.sessions ADD CONSTRAINT sessions_availability_slot_fkey
  FOREIGN KEY (availability_slot_id) REFERENCES public.availability_slots(id) ON DELETE RESTRICT;
CREATE UNIQUE INDEX sessions_one_booking_per_slot ON public.sessions(availability_slot_id)
  WHERE availability_slot_id IS NOT NULL;

-- Replace the complete policy set so an older permissive policy cannot OR away
-- these restrictions. No user records are modified or deleted.
DO $$
DECLARE policy RECORD;
BEGIN
  FOR policy IN SELECT tablename, policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename IN ('profiles', 'sessions', 'reviews', 'availability_slots')
  LOOP
    EXECUTE format('DROP POLICY %I ON public.%I', policy.policyname, policy.tablename);
  END LOOP;
END $$;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_slots ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.profiles, public.sessions, public.reviews, public.availability_slots FROM anon, authenticated;
GRANT SELECT ON public.profiles, public.reviews, public.availability_slots TO anon, authenticated;
GRANT SELECT ON public.sessions TO authenticated;
GRANT ALL ON public.profiles, public.sessions, public.reviews, public.availability_slots TO service_role;

-- Signup's existing SECURITY DEFINER trigger creates profiles. Browser clients
-- can edit presentation fields, never identity, role, or creation timestamps.
GRANT UPDATE (username, full_name, avatar_url, bio, is_online, skills) ON public.profiles TO authenticated;
CREATE POLICY profiles_read ON public.profiles FOR SELECT USING (true);
CREATE POLICY profiles_update_self ON public.profiles FOR UPDATE TO authenticated
  USING (id = (SELECT auth.uid())) WITH CHECK (id = (SELECT auth.uid()));

-- Direct inserts are only instant requests. Scheduled sessions must use the RPC.
-- status/started_at can be supplied with their original defaults for compatibility
-- with the currently deployed create-room endpoint.
GRANT INSERT (id, student_id, teacher_id, room_url, status, started_at) ON public.sessions TO authenticated;
GRANT UPDATE (status, ended_at) ON public.sessions TO authenticated;
CREATE POLICY sessions_read_participant ON public.sessions FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) IN (student_id, teacher_id));
CREATE POLICY sessions_insert_request ON public.sessions FOR INSERT TO authenticated
  WITH CHECK (
    student_id = (SELECT auth.uid()) AND student_id <> teacher_id
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = student_id AND p.role = 'student')
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = teacher_id AND p.role = 'teacher')
    AND status = 'pending' AND availability_slot_id IS NULL
    AND scheduled_start_time IS NULL AND scheduled_end_time IS NULL AND amount IS NULL
  );
CREATE POLICY sessions_update_participant ON public.sessions FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) IN (student_id, teacher_id))
  WITH CHECK ((SELECT auth.uid()) IN (student_id, teacher_id));

GRANT INSERT (teacher_id, start_time, end_time) ON public.availability_slots TO authenticated;
GRANT UPDATE (start_time, end_time) ON public.availability_slots TO authenticated;
GRANT DELETE ON public.availability_slots TO authenticated;
CREATE POLICY slots_read ON public.availability_slots FOR SELECT
  USING (teacher_id = (SELECT auth.uid()) OR (NOT is_booked AND start_time > now()));
CREATE POLICY slots_insert_teacher ON public.availability_slots FOR INSERT TO authenticated
  WITH CHECK (teacher_id = (SELECT auth.uid()) AND NOT is_booked AND start_time > now()
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = teacher_id AND p.role = 'teacher'));
CREATE POLICY slots_update_teacher ON public.availability_slots FOR UPDATE TO authenticated
  USING (teacher_id = (SELECT auth.uid()) AND NOT is_booked
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = teacher_id AND p.role = 'teacher'))
  WITH CHECK (teacher_id = (SELECT auth.uid()) AND NOT is_booked AND start_time > now());
CREATE POLICY slots_delete_teacher ON public.availability_slots FOR DELETE TO authenticated
  USING (teacher_id = (SELECT auth.uid()) AND NOT is_booked
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = teacher_id AND p.role = 'teacher'));

GRANT INSERT (session_id, student_id, teacher_id, student_rating, teacher_rating, student_comment, teacher_comment)
  ON public.reviews TO authenticated;
GRANT UPDATE (student_rating, teacher_rating, student_comment, teacher_comment) ON public.reviews TO authenticated;
CREATE POLICY reviews_read ON public.reviews FOR SELECT USING (true);
CREATE POLICY reviews_insert_participant ON public.reviews FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) IN (student_id, teacher_id));
CREATE POLICY reviews_update_participant ON public.reviews FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) IN (student_id, teacher_id))
  WITH CHECK ((SELECT auth.uid()) IN (student_id, teacher_id));

CREATE OR REPLACE FUNCTION public.enforce_review_author()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = '' AS $$
DECLARE linked_session public.sessions%ROWTYPE;
BEGIN
  SELECT * INTO linked_session FROM public.sessions WHERE id = NEW.session_id;
  IF NOT FOUND OR linked_session.status <> 'completed'
    OR NEW.student_id <> linked_session.student_id OR NEW.teacher_id <> linked_session.teacher_id THEN
    RAISE EXCEPTION 'Reviews must match the participants of a completed session' USING ERRCODE = '42501';
  END IF;
  -- Backend administration is trusted; the end-session API authenticates its caller.
  IF auth.role() = 'service_role' OR current_user = 'postgres' THEN RETURN NEW; END IF;
  IF auth.uid() = NEW.student_id THEN
    IF (TG_OP = 'INSERT' AND (NEW.teacher_rating IS NOT NULL OR NEW.teacher_comment IS NOT NULL))
      OR (TG_OP = 'UPDATE' AND (NEW.teacher_rating IS DISTINCT FROM OLD.teacher_rating
        OR NEW.teacher_comment IS DISTINCT FROM OLD.teacher_comment)) THEN
      RAISE EXCEPTION 'Only the teacher can change teacher feedback' USING ERRCODE = '42501';
    END IF;
  ELSIF auth.uid() = NEW.teacher_id THEN
    IF (TG_OP = 'INSERT' AND (NEW.student_rating IS NOT NULL OR NEW.student_comment IS NOT NULL))
      OR (TG_OP = 'UPDATE' AND (NEW.student_rating IS DISTINCT FROM OLD.student_rating
        OR NEW.student_comment IS DISTINCT FROM OLD.student_comment)) THEN
      RAISE EXCEPTION 'Only the student can change student feedback' USING ERRCODE = '42501';
    END IF;
  ELSE
    RAISE EXCEPTION 'Only session participants can leave feedback' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER reviews_enforce_author BEFORE INSERT OR UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.enforce_review_author();

CREATE OR REPLACE FUNCTION public.book_available_slot(p_slot_id UUID, p_teacher_id UUID)
RETURNS TABLE (session_id UUID, scheduled_start_time TIMESTAMPTZ, scheduled_end_time TIMESTAMPTZ)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  caller UUID := auth.uid();
  selected_slot public.availability_slots%ROWTYPE;
  new_session_id UUID := gen_random_uuid();
BEGIN
  IF caller IS NULL OR NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = caller AND role = 'student') THEN
    RAISE EXCEPTION 'A student account is required' USING ERRCODE = '42501';
  END IF;
  IF caller = p_teacher_id OR NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_teacher_id AND role = 'teacher') THEN
    RAISE EXCEPTION 'Choose a valid teacher' USING ERRCODE = '22023';
  END IF;

  -- Concurrent callers wait here, then read the committed is_booked value.
  SELECT * INTO selected_slot FROM public.availability_slots
    WHERE id = p_slot_id AND teacher_id = p_teacher_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'This time slot was not found' USING ERRCODE = 'P0002'; END IF;
  IF selected_slot.is_booked THEN RAISE EXCEPTION 'This time slot is already booked' USING ERRCODE = '23505'; END IF;
  IF selected_slot.start_time <= clock_timestamp() THEN
    RAISE EXCEPTION 'This time slot has already passed' USING ERRCODE = '22023';
  END IF;

  UPDATE public.availability_slots SET is_booked = true WHERE id = p_slot_id;
  INSERT INTO public.sessions (id, student_id, teacher_id, room_url, status,
    scheduled_start_time, scheduled_end_time, availability_slot_id)
  VALUES (new_session_id, caller, p_teacher_id, '/session/' || new_session_id::TEXT, 'scheduled',
    selected_slot.start_time, selected_slot.end_time, p_slot_id);
  -- If insert fails, PostgreSQL rolls back the slot update as part of this call.
  RETURN QUERY SELECT new_session_id, selected_slot.start_time, selected_slot.end_time;
END $$;

REVOKE ALL ON FUNCTION public.book_available_slot(UUID, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.book_available_slot(UUID, UUID) TO authenticated;
REVOKE ALL ON FUNCTION public.enforce_review_author() FROM PUBLIC, anon, authenticated;

NOTIFY pgrst, 'reload schema';
COMMIT;
