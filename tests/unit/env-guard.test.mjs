import test from 'node:test';
import assert from 'node:assert/strict';
import { projectRefFromUrl, validateEnvironment } from '../../scripts/env-guard.mjs';

test('extracts an exact Supabase project ref', () => assert.equal(projectRefFromUrl('https://fresh-project.supabase.co'), 'fresh-project'));
test('local placeholders are allowed without enabling remote access', () => assert.equal(validateEnvironment({ APP_ENV: 'local' }).ok, true));
test('production rejects placeholders', () => assert.equal(validateEnvironment({ APP_ENV: 'production', EXPECTED_SUPABASE_PROJECT_REF: 'YOUR_NEW_PROJECT_REF' }).ok, false));
test('production rejects project mismatch', () => {
  const result = validateEnvironment({ APP_ENV:'production', NEXT_PUBLIC_SUPABASE_URL:'https://project-a.supabase.co', NEXT_PUBLIC_SUPABASE_ANON_KEY:'anon', EXPECTED_SUPABASE_PROJECT_REF:'project-b', DDAS_SECRET_PEPPER:'x', COMMENT_DELETE_PEPPER:'y', ENCRYPTION_KEY_CURRENT:'z' });
  assert.equal(result.ok, false);
  assert.match(result.errors.join(' '), /does not match/);
});
