import { validateEnvironment } from './env-guard.mjs';

const result = validateEnvironment(process.env);
if (!result.ok) {
  console.error(result.errors.join('\n'));
  process.exit(1);
}
console.log(`Environment gate passed for ${result.appEnv}.`);
