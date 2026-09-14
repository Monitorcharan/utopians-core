import { before, after, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";

const db = new PGlite();
const student = "11111111-1111-4111-8111-111111111111";
const otherStudent = "22222222-2222-4222-8222-222222222222";
const teacher = "33333333-3333-4333-8333-333333333333";
const otherTeacher = "44444444-4444-4444-8444-444444444444";

before(async () => {
  // Supabase-owned infrastructure is stubbed; all application migrations run unchanged.
  await db.exec(`
    CREATE ROLE anon;
    CREATE ROLE authenticated;
    CREATE ROLE service_role BYPASSRLS;
    CREATE SCHEMA auth;
    CREATE SCHEMA storage;
    CREATE TABLE auth.users (id UUID PRIMARY KEY, email TEXT, raw_user_meta_data JSONB);
    CREATE TABLE storage.buckets (id TEXT PRIMARY KEY, name TEXT, public BOOLEAN, file_size_limit BIGINT, allowed_mime_types TEXT[]);
    CREATE TABLE storage.objects (id UUID PRIMARY KEY, bucket_id TEXT, name TEXT);
    CREATE FUNCTION storage.foldername(name TEXT) RETURNS TEXT[] LANGUAGE sql AS $$ SELECT string_to_array(name, '/') $$;
    CREATE FUNCTION auth.uid() RETURNS UUID LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::UUID $$;
    CREATE FUNCTION auth.role() RETURNS TEXT LANGUAGE sql STABLE AS $$ SELECT coalesce(nullif(current_setting('request.jwt.claim.role', true), ''), current_user::TEXT) $$;
    GRANT USAGE ON SCHEMA public, auth TO anon, authenticated, service_role;
    CREATE PUBLICATION supabase_realtime;
  `);
  for (const file of readdirSync("supabase/migrations").filter(file => file.endsWith(".sql")).sort()) {
    await db.exec(readFileSync(`supabase/migrations/${file}`, "utf8"));
  }
  for (const [id, role, username] of [[student, "student", "learner"], [otherStudent, "student", "other_learner"], [teacher, "teacher", "mentor"], [otherTeacher, "teacher", "other_mentor"]]) {
    await db.query("INSERT INTO auth.users VALUES ($1, $2, $3)", [id, `${username}@example.com`, JSON.stringify({ role, username })]);
  }
});
after(async () => { await db.close(); });

async function asUser(id, sql, params = [], role = "authenticated") {
  await db.exec(`SET ROLE ${role}`);
  try {
    await db.query("SELECT set_config('request.jwt.claim.sub', $1, false), set_config('request.jwt.claim.role', $2, false)", [id || "", role]);
    return await db.query(sql, params);
  } finally {
    await db.exec("RESET ROLE; SELECT set_config('request.jwt.claim.sub', '', false), set_config('request.jwt.claim.role', '', false)");
  }
}

async function slot() {
  const id = randomUUID();
  await db.query("INSERT INTO public.availability_slots (id, teacher_id, start_time, end_time) VALUES ($1, $2, now() + interval '1 day', now() + interval '1 day 1 hour')", [id, teacher]);
  return id;
}
async function completedSession() {
  const id = randomUUID();
  await db.query("INSERT INTO public.sessions (id, student_id, teacher_id, room_url, status) VALUES ($1, $2, $3, '/session/test', 'completed')", [id, student, teacher]);
  return id;
}

test("signup trigger creates the requested role, but browser profile edits cannot change it", async () => {
  assert.equal((await db.query("SELECT role FROM public.profiles WHERE id = $1", [teacher])).rows[0].role, "teacher");
  await assert.rejects(asUser(student, "UPDATE public.profiles SET role = 'teacher' WHERE id = $1", [student]), { code: "42501" });
  await assert.rejects(asUser(student, "UPDATE public.profiles SET id = $1 WHERE id = $2", [randomUUID(), student]), { code: "42501" });
  await asUser(student, "UPDATE public.profiles SET bio = 'My interests' WHERE id = $1", [student]);
  assert.equal((await db.query("SELECT bio FROM public.profiles WHERE id = $1", [student])).rows[0].bio, "My interests");
});

test("only the owning teacher can create, edit and delete unbooked availability", async () => {
  const id = await slot();
  await assert.rejects(asUser(student, "INSERT INTO public.availability_slots (teacher_id, start_time, end_time) VALUES ($1, now()+interval '1 day', now()+interval '2 days')", [student]), { code: "42501" });
  assert.equal((await asUser(otherTeacher, "UPDATE public.availability_slots SET end_time = end_time + interval '1 hour' WHERE id = $1 RETURNING id", [id])).rows.length, 0);
  assert.equal((await asUser(teacher, "UPDATE public.availability_slots SET end_time = end_time + interval '1 hour' WHERE id = $1 RETURNING id", [id])).rows.length, 1);
  assert.equal((await asUser(otherTeacher, "DELETE FROM public.availability_slots WHERE id = $1 RETURNING id", [id])).rows.length, 0);
  assert.equal((await asUser(teacher, "DELETE FROM public.availability_slots WHERE id = $1 RETURNING id", [id])).rows.length, 1);
});

test("anonymous callers and teachers cannot book; clients cannot directly flip the booked flag", async () => {
  const id = await slot();
  for (const [user, role] of [[null, "anon"], [teacher, "authenticated"]]) {
    await assert.rejects(asUser(user, "SELECT * FROM public.book_available_slot($1, $2)", [id, teacher], role), { code: "42501" });
  }
  for (const user of [student, teacher]) await assert.rejects(asUser(user, "UPDATE public.availability_slots SET is_booked = true WHERE id = $1", [id]), { code: "42501" });
});

test("a booking creates exactly one linked session and blocks a second caller", async () => {
  const id = await slot();
  const { rows } = await asUser(student, "SELECT * FROM public.book_available_slot($1, $2)", [id, teacher]);
  assert.ok(rows[0].session_id);
  await assert.rejects(asUser(otherStudent, "SELECT * FROM public.book_available_slot($1, $2)", [id, teacher]), { code: "23505" });
  const result = await db.query("SELECT s.student_id, a.is_booked FROM public.sessions s JOIN public.availability_slots a ON a.id = s.availability_slot_id WHERE a.id = $1", [id]);
  assert.deepEqual(result.rows, [{ student_id: student, is_booked: true }]);
  assert.equal((await asUser(teacher, "DELETE FROM public.availability_slots WHERE id = $1 RETURNING id", [id])).rows.length, 0);
  assert.equal((await asUser(teacher, "UPDATE public.availability_slots SET start_time = start_time + interval '1 minute' WHERE id = $1 RETURNING id", [id])).rows.length, 0);
});

test("a failed session insert rolls back the reservation, leaving the slot bookable", async () => {
  const id = await slot();
  await db.exec(`CREATE FUNCTION public.reject_test_session() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'simulated insert failure'; END $$;
    CREATE TRIGGER reject_test_session BEFORE INSERT ON public.sessions FOR EACH ROW EXECUTE FUNCTION public.reject_test_session();`);
  try { await assert.rejects(asUser(student, "SELECT * FROM public.book_available_slot($1, $2)", [id, teacher]), /simulated insert failure/); }
  finally { await db.exec("DROP TRIGGER reject_test_session ON public.sessions; DROP FUNCTION public.reject_test_session()"); }
  assert.equal((await db.query("SELECT is_booked FROM public.availability_slots WHERE id = $1", [id])).rows[0].is_booked, false);
  assert.equal((await db.query("SELECT id FROM public.sessions WHERE availability_slot_id = $1", [id])).rows.length, 0);
  assert.equal((await asUser(student, "SELECT * FROM public.book_available_slot($1, $2)", [id, teacher])).rows.length, 1);
});

test("booking rejects a different teacher and past slots without changing data", async () => {
  const id = await slot();
  await assert.rejects(asUser(student, "SELECT * FROM public.book_available_slot($1, $2)", [id, otherTeacher]), { code: "P0002" });
  await db.query("UPDATE public.availability_slots SET start_time = now()-interval '2 hours', end_time = now()-interval '1 hour' WHERE id = $1", [id]);
  await assert.rejects(asUser(student, "SELECT * FROM public.book_available_slot($1, $2)", [id, teacher]), { code: "22023" });
  assert.equal((await db.query("SELECT is_booked FROM public.availability_slots WHERE id = $1", [id])).rows[0].is_booked, false);
});

test("session participants cannot replace identities, amounts, or insert scheduled sessions directly", async () => {
  const id = await completedSession();
  await assert.rejects(asUser(student, "UPDATE public.sessions SET teacher_id = $1 WHERE id = $2", [otherTeacher, id]), { code: "42501" });
  await assert.rejects(asUser(student, "UPDATE public.sessions SET amount = 0 WHERE id = $1", [id]), { code: "42501" });
  await assert.rejects(asUser(student, "INSERT INTO public.sessions (student_id, teacher_id, room_url, status) VALUES ($1,$2,'/session/fake','scheduled')", [student, teacher]), { code: "42501" });
});

test("each reviewer can change only their own fields on a matching completed session", async () => {
  const id = await completedSession();
  await assert.rejects(asUser(student, "INSERT INTO public.reviews (session_id, student_id, teacher_id, teacher_rating) VALUES ($1,$2,$3,5)", [id, student, teacher]), { code: "42501" });
  await assert.rejects(asUser(otherStudent, "INSERT INTO public.reviews (session_id, student_id, teacher_id, student_rating) VALUES ($1,$2,$3,5)", [id, otherStudent, teacher]), { code: "42501" });
  await asUser(student, "INSERT INTO public.reviews (session_id, student_id, teacher_id, student_rating) VALUES ($1,$2,$3,4)", [id, student, teacher]);
  await assert.rejects(asUser(teacher, "UPDATE public.reviews SET student_rating = 1 WHERE session_id = $1", [id]), { code: "42501" });
  await asUser(teacher, "UPDATE public.reviews SET teacher_rating = 5 WHERE session_id = $1", [id]);
  await assert.rejects(asUser(student, "UPDATE public.reviews SET teacher_comment = 'forged' WHERE session_id = $1", [id]), { code: "42501" });
  assert.deepEqual((await db.query("SELECT student_rating, teacher_rating FROM public.reviews WHERE session_id = $1", [id])).rows[0], { student_rating: 4, teacher_rating: 5 });
});


async function bookedSlot() {
  const slotId = await slot();
  const result = await asUser(student, "SELECT * FROM public.book_available_slot($1, $2)", [slotId, teacher]);
  return { slotId, id: result.rows[0].session_id, start: result.rows[0].scheduled_start_time };
}
const change = (actor, booking, action, target = null, start = booking.start) => asUser(actor,
  "SELECT public.change_scheduled_session($1, $2, $3, $4)", [booking.id, action, start, target]);
const reserved = async id => (await db.query("SELECT is_booked FROM public.availability_slots WHERE id = $1", [id])).rows[0].is_booked;

test("teacher cancellation releases the slot, preserves history, and is safe to retry after rebooking", async () => {
  const booking = await bookedSlot();
  await change(teacher, booking, "cancel");
  assert.equal(await reserved(booking.slotId), false);
  const saved = (await db.query("SELECT status, availability_slot_id, scheduled_start_time FROM public.sessions WHERE id=$1", [booking.id])).rows[0];
  assert.equal(saved.status, "cancelled");
  assert.equal(saved.availability_slot_id, null);
  assert.deepEqual(saved.scheduled_start_time, booking.start);
  await asUser(otherStudent, "SELECT * FROM public.book_available_slot($1, $2)", [booking.slotId, teacher]);
  await change(teacher, booking, "cancel");
  assert.equal(await reserved(booking.slotId), true);
  assert.equal((await db.query("SELECT * FROM public.session_changes WHERE session_id=$1", [booking.id])).rows.length, 1);
});

test("only participants can cancel and only the student can reschedule", async () => {
  const booking = await bookedSlot();
  const target = await slot();
  await assert.rejects(change(otherStudent, booking, "cancel"), { code: "P0002" });
  await assert.rejects(change(otherTeacher, booking, "cancel"), { code: "P0002" });
  await assert.rejects(change(teacher, booking, "reschedule", target), { code: "42501" });
  await assert.rejects(asUser(null, "SELECT public.change_scheduled_session($1,'cancel',$2,NULL)", [booking.id, booking.start], "anon"), { code: "42501" });
  assert.equal(await reserved(booking.slotId), true);
});

test("rescheduling keeps the session ID, swaps reservations, and writes private updates for both participants", async () => {
  const booking = await bookedSlot();
  const target = await slot();
  await db.query("UPDATE public.availability_slots SET start_time=start_time+interval '2 days',end_time=end_time+interval '2 days' WHERE id=$1", [target]);
  await change(student, booking, "reschedule", target);
  assert.equal(await reserved(booking.slotId), false);
  assert.equal(await reserved(target), true);
  const row = (await db.query("SELECT * FROM public.sessions WHERE id=$1", [booking.id])).rows[0];
  assert.equal(row.availability_slot_id, target);
  assert.equal(row.status, "scheduled");
  for (const participant of [student, teacher]) {
    const feed = await asUser(participant, "SELECT * FROM public.session_changes WHERE session_id=$1", [booking.id]);
    assert.equal(feed.rows.length, 1);
    assert.equal(feed.rows[0].kind, "rescheduled");
    assert.deepEqual(feed.rows[0].new_start_time, row.scheduled_start_time);
  }
  assert.equal((await asUser(otherStudent, "SELECT * FROM public.session_changes WHERE session_id=$1", [booking.id])).rows.length, 0);
  await assert.rejects(asUser(student, "UPDATE public.session_changes SET kind='cancelled' WHERE session_id=$1", [booking.id]), { code: "42501" });
  await assert.rejects(change(student, booking, "cancel"), { code: "23505" });
  assert.equal(await reserved(target), true);
});

test("unavailable or wrong-teacher targets leave the original booking intact", async () => {
  const booking = await bookedSlot();
  const occupied = await bookedSlot();
  await assert.rejects(change(student, booking, "reschedule", occupied.slotId), { code: "23505" });
  const target = await slot();
  await db.query("UPDATE public.availability_slots SET teacher_id=$1 WHERE id=$2", [otherTeacher, target]);
  await assert.rejects(change(student, booking, "reschedule", target), { code: "22023" });
  assert.equal(await reserved(booking.slotId), true);
  assert.equal((await db.query("SELECT * FROM public.session_changes WHERE session_id=$1", [booking.id])).rows.length, 0);
});

test("a notification insert failure rolls back both the reschedule and cancellation", async () => {
  const booking = await bookedSlot();
  const target = await slot();
  await db.exec("CREATE FUNCTION public.reject_change_test() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'simulated update failure'; END $$; CREATE TRIGGER reject_change_test BEFORE INSERT ON public.session_changes FOR EACH ROW EXECUTE FUNCTION public.reject_change_test();");
  try {
    await assert.rejects(change(student, booking, "reschedule", target), /simulated update failure/);
    await assert.rejects(change(student, booking, "cancel"), /simulated update failure/);
    assert.equal(await reserved(booking.slotId), true);
    assert.equal(await reserved(target), false);
    assert.equal((await db.query("SELECT status FROM public.sessions WHERE id=$1", [booking.id])).rows[0].status, "scheduled");
  } finally { await db.exec("DROP TRIGGER reject_change_test ON public.session_changes; DROP FUNCTION public.reject_change_test()"); }
});

test("joining-window, active and paid bookings cannot be changed; browser cancellation cannot bypass the RPC", async () => {
  const booking = await bookedSlot();
  await assert.rejects(asUser(student, "UPDATE public.sessions SET status='cancelled' WHERE id=$1", [booking.id]), { code: "42501" });
  await db.query("UPDATE public.sessions SET scheduled_start_time=now()+interval '4 minutes' WHERE id=$1", [booking.id]);
  const fresh = (await db.query("SELECT scheduled_start_time FROM public.sessions WHERE id=$1", [booking.id])).rows[0].scheduled_start_time;
  await assert.rejects(change(student, booking, "cancel", null, fresh), { code: "23505" });
  await db.query("UPDATE public.sessions SET scheduled_start_time=$2, amount=100 WHERE id=$1", [booking.id, booking.start]);
  await assert.rejects(change(student, booking, "cancel"), { code: "22023" });
  await db.query("UPDATE public.sessions SET amount=NULL,status='active' WHERE id=$1", [booking.id]);
  await assert.rejects(change(student, booking, "reschedule", await slot()), { code: "23505" });
  await db.query("UPDATE public.sessions SET status='scheduled' WHERE id=$1", [booking.id]);
  await change(student, booking, "cancel");
  await assert.rejects(asUser(student, "UPDATE public.sessions SET status='active' WHERE id=$1", [booking.id]), { code: "42501" });
});
