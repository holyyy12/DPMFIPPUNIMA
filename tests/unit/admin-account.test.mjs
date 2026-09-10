import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import ts from 'typescript';

const source = await readFile(
  new URL('../../supabase/functions/create-admin/index.ts', import.meta.url),
  'utf8',
);
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
async function execute(responses) {
  const calls = [];
  let handler;
  const sandbox = {
    exports: {},
    Response,
    fetch: async (url, options) => {
      calls.push({ url, body: JSON.parse(options.body) });
      const response = responses.shift();
      return new Response(JSON.stringify(response.body), {
        status: response.status ?? 200,
      });
    },
    Deno: {
      env: {
        get: (key) =>
          key === 'SUPABASE_URL' ? 'https://test.supabase.co' : 'test-key',
      },
      serve: (fn) => {
        handler = fn;
      },
    },
  };
  vm.runInNewContext(compiled, sandbox);
  const response = await handler(
    new Request('https://test.example/create', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer test-session',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'user@example.com',
        displayName: 'Pengguna uji',
        roleKey: 'ormawa',
        unitId: '',
        password: 'Aa1!random-test-password',
      }),
    }),
  );
  return { calls, response };
}
test('direct account creation checks authorization before Auth and never calls SMTP', async () => {
  const { calls, response } = await execute([
    { body: { ok: true, id: 'reservation' } },
    { body: { id: 'new-user' } },
    { body: null },
  ]);
  assert.equal(response.status, 200);
  assert.match(calls[0].url, /prepare_admin_account$/);
  assert.match(calls[1].url, /auth\/v1\/admin\/users$/);
  assert.equal(calls[1].body.email_confirm, true);
  assert.equal(calls[1].body.password, 'Aa1!random-test-password');
  assert.ok(calls.every((call) => !call.url.includes('/invite?')));
  assert.ok(!JSON.stringify(calls[0].body).includes('password'));
  assert.ok(!JSON.stringify(calls[2].body).includes('password'));
  assert.ok(!(await response.text()).includes('random-test-password'));
});
test('unauthorized caller cannot create an Auth account', async () => {
  const { calls, response } = await execute([{ status: 403, body: {} }]);
  assert.equal(response.status, 403);
  assert.equal(calls.length, 1);
});
test('duplicate account reservation does not overwrite an existing account', async () => {
  const { calls, response } = await execute([
    { body: { ok: false, code: 'email_exists' } },
  ]);
  assert.equal(response.status, 400);
  assert.equal(calls.length, 1);
});
