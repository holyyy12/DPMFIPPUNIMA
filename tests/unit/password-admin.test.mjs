import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import ts from 'typescript';
import { z } from 'zod';

const source = await readFile(
  new URL('../../app/api/admin/auth/login/route.ts', import.meta.url),
  'utf8',
);
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;

async function login({ validPassword = true, active = true } = {}) {
  const calls = [];
  const cookies = new Map();
  const exports = {};
  const sandbox = {
    exports,
    Response,
    require: (name) => {
      if (name === 'zod') return { z };
      if (name === 'next/headers') return { cookies: async () => cookies };
      if (name.endsWith('/rest'))
        return {
          supabaseConfig: () => ({
            url: 'https://test.supabase.co',
            anon: 'test-public-key',
          }),
        };
      if (name.endsWith('/auth'))
        return {
          ACCESS_COOKIE: 'access',
          REFRESH_COOKIE: 'refresh',
          authCookieOptions: {},
          refreshCookieOptions: {},
          isActiveAdminSession: async (token) => {
            assert.equal(token, 'real-verified-aal1-token');
            calls.push('check-active-role');
            return active;
          },
        };
      throw new Error(`Unexpected dependency ${name}`);
    },
    fetch: async (url) => {
      calls.push(url);
      if (url.includes('/logout')) return new Response(null, { status: 204 });
      return Response.json(
        validPassword
          ? {
              access_token: 'real-verified-aal1-token',
              refresh_token: 'refresh-token',
              // Even existing enrolled accounts do not trigger a challenge.
              user: { factors: [{ status: 'verified', factor_type: 'totp' }] },
            }
          : {},
        { status: validPassword ? 200 : 400 },
      );
    },
  };
  vm.runInNewContext(compiled, sandbox);
  const response = await exports.POST(
    new Request('https://test.example/api/admin/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'Password-for-test-only',
      }),
    }),
  );
  return { response, calls, cookies };
}

test('password login admits active admins without enrolling or challenging MFA', async () => {
  const { response, calls, cookies } = await login();
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true });
  assert.equal(cookies.get('access'), 'real-verified-aal1-token');
  assert.equal(calls.length, 2);
  assert.equal(calls[1], 'check-active-role');
  assert.ok(calls.every((url) => !/factor|challenge|verify/.test(url)));
});

test('invalid password never issues a session or queries role admission', async () => {
  const { response, calls, cookies } = await login({ validPassword: false });
  assert.equal(response.status, 401);
  assert.equal(cookies.size, 0);
  assert.equal(calls.length, 1);
});

test('inactive or unassigned account cannot enter and its new session is revoked', async () => {
  const { response, calls, cookies } = await login({ active: false });
  assert.equal(response.status, 403);
  assert.equal(cookies.size, 0);
  assert.ok(calls.at(-1).endsWith('/logout?scope=local'));
});
