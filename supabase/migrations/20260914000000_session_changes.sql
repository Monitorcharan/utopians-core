BEGIN;

CREATE TABLE public.session_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('cancelled', 'rescheduled')),
  previous_start_time TIMESTAMPTZ NOT NULL,
  new_start_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX session_changes_session ON public.session_changes(session_id, created_at DESC);
ALTER TABLE public.session_changes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.session_changes FROM anon, authenticated;
GRANT SELECT ON public.session_changes TO authenticated;
GRANT ALL ON public.session_changes TO service_role;
CREATE POLICY session_changes_participants ON public.session_changes FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.sessions s WHERE s.id = session_id
    AND (SELECT auth.uid()) IN (s.student_id, s.teacher_id)));
ALTER PUBLICATION supabase_realtime ADD TABLE public.session_changes;

-- Browser status updates cannot bypass cancellation's slot release or resurrect
-- a cancelled booking. SECURITY DEFINER RPCs execute as the function owner.
CREATE FUNCTION public.guard_scheduled_session_changes() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF current_user IN ('authenticated', 'anon') AND OLD.scheduled_start_time IS NOT NULL THEN
    IF OLD.status = 'cancelled' OR (OLD.status = 'scheduled' AND NEW.status = 'cancelled') THEN
      RAISE EXCEPTION 'Use the booking actions to change a scheduled session' USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER sessions_guard_schedule BEFORE UPDATE ON public.sessions
  FOR EACH ROW EXECUTE FUNCTION public.guard_scheduled_session_changes();

CREATE FUNCTION public.change_scheduled_session(
  p_session_id UUID, p_action TEXT, p_expected_start_time TIMESTAMPTZ, p_slot_id UUID DEFAULT NULL
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  caller UUID := auth.uid();
  booking public.sessions%ROWTYPE;
  destination public.availability_slots%ROWTYPE;
BEGIN
  IF caller IS NULL THEN RAISE EXCEPTION 'Sign in to manage a booking' USING ERRCODE = '42501'; END IF;
  IF p_action IS NULL OR p_action NOT IN ('cancel', 'reschedule') THEN
    RAISE EXCEPTION 'Choose cancel or reschedule' USING ERRCODE = '22023';
  END IF;
  -- Serialize changes to the same booking, including cancellation/reschedule races.
  SELECT * INTO booking FROM public.sessions WHERE id = p_session_id
    AND caller IN (student_id, teacher_id) FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Booking not found' USING ERRCODE = 'P0002'; END IF;
  IF p_action = 'reschedule' AND caller <> booking.student_id THEN
    RAISE EXCEPTION 'Only the student can choose a new time' USING ERRCODE = '42501';
  END IF;
  -- Retrying a successful cancellation must not release a subsequently rebooked slot.
  IF p_action = 'cancel' AND booking.status = 'cancelled' AND booking.scheduled_start_time IS NOT NULL THEN
    RETURN booking.id;
  END IF;
  IF booking.status <> 'scheduled' OR booking.scheduled_start_time IS NULL THEN
    RAISE EXCEPTION 'Only upcoming scheduled sessions can be changed' USING ERRCODE = '23505';
  END IF;
  IF booking.scheduled_start_time IS DISTINCT FROM p_expected_start_time THEN
    RAISE EXCEPTION 'This booking has changed. Refresh and try again' USING ERRCODE = '23505';
  END IF;
  IF booking.scheduled_start_time <= clock_timestamp() + interval '5 minutes' THEN
    RAISE EXCEPTION 'Changes close 5 minutes before the session starts' USING ERRCODE = '23505';
  END IF;
  IF coalesce(booking.amount, 0) <> 0 THEN
    RAISE EXCEPTION 'Paid bookings need support to arrange a change' USING ERRCODE = '22023';
  END IF;
  IF p_action = 'reschedule' AND (p_slot_id IS NULL OR p_slot_id = booking.availability_slot_id) THEN
    RAISE EXCEPTION 'Choose a different time slot' USING ERRCODE = '22023';
  END IF;
  -- Stable ordering avoids deadlocks when two bookings target one another's slots.
  PERFORM id FROM public.availability_slots
    WHERE id = booking.availability_slot_id OR (p_action = 'reschedule' AND id = p_slot_id)
    ORDER BY id FOR UPDATE;
  IF booking.scheduled_start_time <= clock_timestamp() + interval '5 minutes' THEN
    RAISE EXCEPTION 'Changes close 5 minutes before the session starts' USING ERRCODE = '23505';
  END IF;
  IF p_action = 'reschedule' THEN
    SELECT * INTO destination FROM public.availability_slots WHERE id = p_slot_id;
    IF NOT FOUND OR destination.teacher_id <> booking.teacher_id THEN
      RAISE EXCEPTION 'Choose a slot with the same teacher' USING ERRCODE = '22023';
    END IF;
    IF destination.is_booked THEN RAISE EXCEPTION 'That time was just booked. Choose another slot' USING ERRCODE = '23505'; END IF;
    IF destination.start_time <= clock_timestamp() + interval '5 minutes' THEN
      RAISE EXCEPTION 'Choose a time more than 5 minutes from now' USING ERRCODE = '22023';
    END IF;
    -- Reserve first; any later failure rolls back both slots and the session.
    UPDATE public.availability_slots SET is_booked = true WHERE id = destination.id;
    UPDATE public.sessions SET availability_slot_id = destination.id,
      scheduled_start_time = destination.start_time, scheduled_end_time = destination.end_time
      WHERE id = booking.id;
  ELSE
    -- Clear only the live reservation reference; retain the session and its dates in history.
    UPDATE public.sessions SET status = 'cancelled', availability_slot_id = NULL WHERE id = booking.id;
  END IF;
  UPDATE public.availability_slots SET is_booked = false WHERE id = booking.availability_slot_id;
  INSERT INTO public.session_changes (session_id, actor_id, kind, previous_start_time, new_start_time)
    VALUES (booking.id, caller, CASE p_action WHEN 'cancel' THEN 'cancelled' ELSE 'rescheduled' END,
      booking.scheduled_start_time, CASE WHEN p_action = 'reschedule' THEN destination.start_time END);
  RETURN booking.id;
END $$;

REVOKE ALL ON FUNCTION public.change_scheduled_session(UUID, TEXT, TIMESTAMPTZ, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.change_scheduled_session(UUID, TEXT, TIMESTAMPTZ, UUID) TO authenticated;
REVOKE ALL ON FUNCTION public.guard_scheduled_session_changes() FROM PUBLIC, anon, authenticated;
NOTIFY pgrst, 'reload schema';
COMMIT;
