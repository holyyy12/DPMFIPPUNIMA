const PLACEHOLDERS = ['YOUR_NEW_PROJECT_REF', 'YOUR_NEW_PROJECT_ANON_KEY', 'SET_IN_SECRET_MANAGER_ONLY'];

export function projectRefFromUrl(value = '') {
  const match = /^https:\/\/([a-z0-9-]+)\.supabase\.co\/?$/i.exec(value.trim());
  return match?.[1] ?? null;
}

export function validateEnvironment(env) {
  const errors = [];
  const appEnv = env.APP_ENV ?? 'local';
  const expected = env.EXPECTED_SUPABASE_PROJECT_REF?.trim();
  const actual = projectRefFromUrl(env.NEXT_PUBLIC_SUPABASE_URL);
  const publicKeys = Object.keys(env).filter((key) => key.startsWith('NEXT_PUBLIC_'));

  if (publicKeys.some((key) => /SERVICE_ROLE|SECRET|PEPPER|ENCRYPTION_KEY|CRON/i.test(key))) errors.push('Secret-like key exposed through NEXT_PUBLIC_*');
  if (appEnv !== 'local') {
    for (const key of ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'EXPECTED_SUPABASE_PROJECT_REF', 'DDAS_SECRET_PEPPER', 'COMMENT_DELETE_PEPPER', 'ENCRYPTION_KEY_CURRENT']) {
      const value = env[key] ?? '';
      if (!value || PLACEHOLDERS.some((placeholder) => value.includes(placeholder))) errors.push(`${key} is missing or still a placeholder`);
    }
    if (!actual) errors.push('NEXT_PUBLIC_SUPABASE_URL is not a valid Supabase project URL');
    if (actual && expected && actual !== expected) errors.push('Supabase project ref does not match EXPECTED_SUPABASE_PROJECT_REF');
  }
  return { ok: errors.length === 0, errors, appEnv, actualProjectRef: actual, expectedProjectRef: expected ?? null };
}
