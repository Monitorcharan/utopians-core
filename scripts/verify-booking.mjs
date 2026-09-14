// Run only after applying the migration: node --env-file=.env.local scripts/verify-booking.mjs
// Uses disposable accounts and a disposable slot; never books an existing teacher.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const options = { auth: { persistSession: false, autoRefreshToken: false } };
const admin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY, options);
const accounts = [];
const slots = [];
const origin = process.env.BOOKING_TEST_ORIGIN;

try {
  for (const role of ["teacher", "student", "student"]) {
    const suffix = randomUUID().replaceAll("-", "");
    const email = `booking-test-${suffix}@example.com`;
    const password = randomUUID() + "aA1!";
    const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true,
      user_metadata: { role, username: `test_${suffix}`, full_name: "Disposable booking test", skills: [] } });
    if (error) throw error;
    const client = createClient(url, anonKey, options);
    accounts.push({ id: data.user.id, client, role, email, password });
    const signedIn = await client.auth.signInWithPassword({ email, password });
    if (signedIn.error) throw signedIn.error;
  }
  const [teacher, student, otherStudent] = accounts;
  const created = await teacher.client.from("availability_slots").insert({ teacher_id: teacher.id,
    start_time: new Date(Date.now() + 86400000).toISOString(), end_time: new Date(Date.now() + 90000000).toISOString() }).select().single();
  if (created.error) throw created.error;
  slots.push(created.data.id);
  const args = { p_slot_id: created.data.id, p_teacher_id: teacher.id };
  // Independent clients issue requests concurrently to the real PostgreSQL server.
  const attempts = await Promise.all([student.client.rpc("book_available_slot", args), otherStudent.client.rpc("book_available_slot", args)]);
  assert.equal(attempts.filter(result => !result.error).length, 1, "Exactly one booking should win");
  assert.equal(attempts.filter(result => result.error?.code === "23505").length, 1, "The other booking should report a conflict");
  const sessions = await admin.from("sessions").select("id").eq("availability_slot_id", created.data.id);
  assert.equal(sessions.data?.length, 1, "The slot must reference exactly one session");
  const roleChange = await student.client.from("profiles").update({ role: "teacher" }).eq("id", student.id);
  assert.equal(roleChange.error?.code, "42501");
  const flagChange = await student.client.from("availability_slots").update({ is_booked: false }).eq("id", created.data.id);
  assert.equal(flagChange.error?.code, "42501");
  const deleted = await teacher.client.from("availability_slots").delete().eq("id", created.data.id).select("id");
  assert.ok(!deleted.data?.length, "Booked slot must not be deletable");
  console.log("PASS live concurrent booking: one session, one conflict, protected role and booked slot");
  if (origin) {
    for (const account of accounts) {
      const login = await fetch(`${origin}/api/auth`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", role: account.role, email: account.email, password: account.password }),
      });
      assert.equal(login.status, 200, "The application must authenticate each disposable account");
      account.cookie = login.headers.getSetCookie().map(value => value.split(";")[0]).join("; ");
      assert.ok(account.cookie);
    }
    const request = (account, path, body, method = "POST") => fetch(`${origin}${path}`, {
      method, headers: { "Content-Type": "application/json", cookie: account.cookie }, body: JSON.stringify(body),
    });
    const times = { startTime: new Date(Date.now() + 172800000).toISOString(), endTime: new Date(Date.now() + 176400000).toISOString() };
    assert.equal((await request(student, "/api/availability", times)).status, 403);
    const slotResponse = await request(teacher, "/api/availability", times);
    assert.equal(slotResponse.status, 201, `Teacher availability failed: ${await slotResponse.clone().text()}`);
    const { slot: httpSlot } = await slotResponse.json();
    slots.push(httpSlot.id);
    const booking = { teacherId: teacher.id, slotId: httpSlot.id };
    assert.equal((await request(teacher, "/api/book-session", booking)).status, 403);
    const bookings = await Promise.all([request(student, "/api/book-session", booking), request(otherStudent, "/api/book-session", booking)]);
    assert.deepEqual(bookings.map(response => response.status).sort(), [201, 409]);
    const winnerIndex = bookings.findIndex(response => response.status === 201);
    const { sessionId } = await bookings[winnerIndex].json();
    assert.ok(sessionId);
    for (const [index, account] of [student, otherStudent].entries()) {
      const visible = await account.client.from("sessions").select("id").eq("id", sessionId);
      assert.ifError(visible.error);
      assert.equal(visible.data.length, index === winnerIndex ? 1 : 0, "Only the student who booked can read this session");
    }
    const teacherSession = await teacher.client.from("sessions").select("id").eq("id", sessionId);
    assert.ifError(teacherSession.error);
    assert.equal(teacherSession.data.length, 1);
    assert.equal((await request(teacher, "/api/availability", { slotId: httpSlot.id }, "DELETE")).status, 409);
    console.log("PASS application booking: cookie login, role checks, concurrent 201/409 responses, participant privacy, booked-slot deletion blocked");
  }
} finally {
  // Remove sessions first so the new slot foreign key does not obstruct cleanup.
  if (slots.length) {
    const sessions = await admin.from("sessions").delete().in("availability_slot_id", slots);
    if (sessions.error) throw new Error(`Test session cleanup failed: ${sessions.error.message}`);
    const removed = await admin.from("availability_slots").delete().in("id", slots);
    if (removed.error) throw new Error(`Test slot cleanup failed: ${removed.error.message}`);
  }
  for (const account of accounts) {
    const { error } = await admin.auth.admin.deleteUser(account.id);
    if (error) { console.error("Cleanup failed for disposable account", account.id, error.message); process.exitCode = 1; }
  }
  console.log("Removed disposable booking fixtures");
}
