// Explicit integration check: creates two disposable accounts, then removes only those accounts.
// Run against a local server with: node --env-file=.env.local scripts/verify-auth.mjs
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const origin = process.env.AUTH_TEST_ORIGIN || "http://localhost:3007";
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const accounts = [];

try {
  for (const role of ["student", "teacher"]) {
    const suffix = randomUUID().replaceAll("-", "");
    const email = `utopians-test-${suffix}@example.com`;
    const password = randomUUID() + "aA1!";
    const { data, error } = await admin.auth.admin.createUser({
      email, password, email_confirm: true,
      user_metadata: { role, username: `test_${suffix}`, full_name: "Disposable route test", skills: [] },
    });
    if (error) throw error;
    accounts.push(data.user.id);

    const login = await fetch(`${origin}/api/auth`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "login", role, email, password }),
    });
    assert.equal(login.status, 200, `Expected ${role} login to succeed: ${await login.clone().text()}`);
    assert.equal((await login.json()).destination, `/${role}/dashboard`);
    const cookie = login.headers.getSetCookie().map(value => value.split(";")[0]).join("; ");
    assert.ok(cookie, "Login must set browser session cookies");
    const dashboard = await fetch(`${origin}/${role}/dashboard`, { headers: { cookie }, redirect: "manual" });
    assert.equal(dashboard.status, 200, `${role} dashboard must accept the login cookie`);
    const ownLogin = await fetch(`${origin}/${role}/login`, { headers: { cookie }, redirect: "manual" });
    assert.equal(new URL(ownLogin.headers.get("location"), origin).pathname, `/${role}/dashboard`);
    const otherRole = role === "student" ? "teacher" : "student";
    const crossRole = await fetch(`${origin}/${otherRole}/dashboard`, { headers: { cookie }, redirect: "manual" });
    assert.equal(new URL(crossRole.headers.get("location"), origin).pathname, `/${role}/dashboard`);
    const wrongPortal = await fetch(`${origin}/api/auth`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "login", role: otherRole, email, password }),
    });
    assert.equal(wrongPortal.status, 403, "Wrong-portal login must fail");
    console.log(`PASS ${role}: real login, session cookies, dashboard, auth redirect, and cross-role rejection`);
  }
} finally {
  for (const id of accounts) {
    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) { console.error("Test account cleanup failed for", id, error.message); process.exitCode = 1; }
    else console.log("Removed disposable test account");
  }
}
