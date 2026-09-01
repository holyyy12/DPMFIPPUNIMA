import { validateEnvironment } from './env-guard.mjs';

const requestedRef = process.argv[2]?.trim();
const result = validateEnvironment({ ...process.env, APP_ENV: process.env.APP_ENV ?? 'staging' });
if (!requestedRef || !result.ok || requestedRef !== result.expectedProjectRef || requestedRef !== result.actualProjectRef) {
  console.error('ABORT: remote Supabase project is missing, invalid, or not the explicitly allowlisted greenfield project.');
  process.exit(1);
}
console.log('Greenfield Supabase project ref verified.');
