import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { createRequire } from "node:module";
import ts from "typescript";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

const loadDependency = createRequire(import.meta.url);
const { NextRequest } = loadDependency("next/server");


function loadModule(path, overrides) {
  const code = ts.transpileModule(readFileSync(path, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const exports = {};
  vm.runInNewContext(code, {
    exports, process,
    require: name => overrides[name] || loadDependency(name),
    URL,
  }, { filename: path });
  return exports;
}

for (const role of ["student", "teacher"]) {
  test(`${role} login has one submit button and no disabled provider or other-portal links`, () => {
    const { RoleAuth } = loadModule("src/components/features/role-auth.tsx", {
      "next/navigation": { useRouter: () => ({}) },
      "@/components/ui/brand-loader": loadModule("src/components/ui/brand-loader.tsx", {}),
      "@/lib/supabase/client": {},
      "@/context/auth-context": { useAuthContext: () => ({ isAuthenticated: false, isLoading: false }) },
    });
    const markup = renderToStaticMarkup(createElement(RoleAuth, { role }));
    assert.equal((markup.match(/type="submit"/g) || []).length, 1);
    assert.equal((markup.match(/>Create an account<\/a>/g) || []).length, 1);
    assert.ok(!markup.includes("Google"));
    assert.ok(!markup.includes(role === "student" ? "/teacher/" : "/student/"));
  });

  test(`${role} password login reaches its own dashboard`, async () => {
    const { POST } = loadModule("src/app/api/auth/route.ts", {
      "@/lib/supabase/server": { createClient: async () => ({
        auth: { signInWithPassword: async () => ({ data: { user: { id: "test-user" } } }) },
        from: () => ({ select: () => ({ eq: () => ({ single: async () => ({ data: { role } }) }) }) }),
      }) },
    });
    const response = await POST(new Request("http://localhost/api/auth", { method: "POST", body: JSON.stringify({ action: "login", role, email: "test@example.com", password: "test-password" }) }));
    assert.equal(response.status, 200);
    assert.equal((await response.json()).destination, `/${role}/dashboard`);
  });

  test(`${role} password login rejects a different account role and clears its session`, async () => {
    let signedOut = false;
    const { POST } = loadModule("src/app/api/auth/route.ts", {
      "@/lib/supabase/server": { createClient: async () => ({
        auth: {
          signInWithPassword: async () => ({ data: { user: { id: "test-user" } } }),
          signOut: async () => { signedOut = true; },
        },
        from: () => ({ select: () => ({ eq: () => ({ single: async () => ({ data: { role: role === "student" ? "teacher" : "student" } }) }) }) }),
      }) },
    });
    const response = await POST(new Request("http://localhost/api/auth", { method: "POST", body: JSON.stringify({ action: "login", role, email: "test@example.com", password: "test-password" }) }));
    assert.equal(response.status, 403);
    assert.equal(signedOut, true);
    assert.ok(!(await response.json()).destination);
  });
}

test("unconfirmed signup stays on confirmation instead of opening a dashboard", async () => {
  const { POST } = loadModule("src/app/api/auth/route.ts", {
    "@/lib/supabase/server": { createClient: async () => ({ auth: { signUp: async () => ({ data: { session: null } }) } }) },
  });
  const response = await POST(new Request("http://localhost/api/auth", { method: "POST", body: JSON.stringify({ action: "signup", role: "student", email: "test@example.com", password: "test-password", name: "Test", username: "test_user" }) }));
  assert.equal(response.status, 200);
  assert.equal((await response.json()).confirmationRequired, true);
});

for (const endpoint of ["create-room", "end-session", "book-session", "availability"]) {
  test(`guest cannot mutate /api/${endpoint}`, async () => {
    const { POST } = loadModule(`src/app/api/${endpoint}/route.ts`, {
      "@/lib/supabase/server": {
        createClient: async () => ({ auth: { getUser: async () => ({ data: { user: null } }) } }),
        createAdminClient: () => { throw new Error("Must authenticate before using admin access"); },
      },
    });
    const response = await POST(new Request(`http://localhost/api/${endpoint}`, { method: "POST", body: "{}" }));
    assert.equal(response.status, 401);
  });
}

test("legacy portal URLs redirect directly to canonical routes without duplicate pages", async () => {
  const { default: config } = loadModule("next.config.ts", {});
  const redirects = await config.redirects();
  assert.equal(redirects.find(item => item.source === "/students").destination, "/student/login");
  assert.equal(redirects.find(item => item.source === "/teachers").destination, "/teacher/login");
  assert.equal(redirects.find(item => item.source === "/teacher/edit-profile").destination, "/teacher/profile/settings");
});

test("booking uses the caller-scoped transaction and returns its committed session", async () => {
  const slotId = "11111111-1111-4111-8111-111111111111";
  const teacherId = "33333333-3333-4333-8333-333333333333";
  const { POST } = loadModule("src/app/api/book-session/route.ts", {
    "@/lib/supabase/server": { createClient: async () => ({
      auth: { getUser: async () => ({ data: { user: { id: "student" } } }) },
      rpc: async (name, args) => {
        assert.equal(name, "book_available_slot");
        assert.equal(args.p_slot_id, slotId);
        assert.equal(args.p_teacher_id, teacherId);
        return { data: [{ session_id: "committed-session", scheduled_start_time: "2030-01-01", scheduled_end_time: "2030-01-02" }] };
      },
    }) },
  });
  const response = await POST(new Request("http://localhost/api/book-session", { method: "POST", body: JSON.stringify({ slotId, teacherId }) }));
  assert.equal(response.status, 201);
  assert.equal((await response.json()).sessionId, "committed-session");
});

for (const [code, expectedStatus] of [["23505", 409], ["42501", 403], ["P0002", 404], ["22023", 400], ["PGRST202", 503]]) {
  test(`booking maps database ${code} to HTTP ${expectedStatus} without reporting success`, async () => {
    const { POST } = loadModule("src/app/api/book-session/route.ts", {
      "@/lib/supabase/server": { createClient: async () => ({
        auth: { getUser: async () => ({ data: { user: { id: "student" } } }) },
        rpc: async () => ({ error: { code, message: "Booking could not complete" } }),
      }) },
    });
    const response = await POST(new Request("http://localhost/api/book-session", { method: "POST", body: JSON.stringify({ slotId: "11111111-1111-4111-8111-111111111111", teacherId: "33333333-3333-4333-8333-333333333333" }) }));
    assert.equal(response.status, expectedStatus);
    assert.ok(!(await response.json()).success);
  });
}

for (const [path, role, destination] of [
  ["/student/dashboard", null, "/student/login"],
  ["/teacher/dashboard", null, "/teacher/login"],
  ["/student/mentors/123", null, "/student/login"],
  ["/student/login", "teacher", null],
  ["/teacher/signup", "student", null],
  ["/student/login", "student", "/student/dashboard"],
  ["/teacher/login", "teacher", "/teacher/dashboard"],
  ["/teacher/availability", "student", "/student/dashboard"],
  ["/student/history", "teacher", "/teacher/dashboard"],
  ["/student/mentors/123", "student", null],
  ["/teacher/dashboard", "teacher", null],
]) {
  test(`${role || "guest"} requesting ${path}`, async () => {
    const { proxy } = loadModule("src/proxy.ts", {
      "@supabase/ssr": {
        createServerClient: (_url, _key, options) => ({
          auth: {
            getUser: async () => {
              options.cookies.setAll([{ name: "refreshed", value: "session", options: { path: "/" } }]);
              return { data: { user: role ? { id: "user-id" } : null } };
            },
          },
          from: () => ({ select: () => ({ eq: () => ({ single: async () => ({ data: { role } }) }) }) }),
        }),
      },
    });
    const response = await proxy(new NextRequest(`http://localhost:3000${path}`));
    assert.equal(response.headers.get("location"), destination ? `http://localhost:3000${destination}` : null);
    assert.equal(response.cookies.get("refreshed")?.value, "session");
  });
}

for (const role of ["student", "teacher"]) {
  test(`${role} OAuth rejects an existing account from the other portal`, async () => {
    let signedOut = false;
    const { GET } = loadModule("src/app/auth/callback/route.ts", {
      "@/lib/supabase/server": {
        createClient: async () => ({
          auth: {
            exchangeCodeForSession: async () => ({ data: { user: { id: "existing-user" } } }),
            signOut: async () => { signedOut = true; },
          },
          from: () => ({ select: () => ({ eq: () => ({ single: async () => ({ data: { role: role === "student" ? "teacher" : "student" } }) }) }) }),
        }),
      },
    });
    const response = await GET(new Request(`http://localhost:3000/auth/callback?code=test&role=${role}`));
    assert.equal(signedOut, true);
    assert.equal(response.headers.get("location"), `http://localhost:3000/${role}/login?error=portal_mismatch`);
  });
}
