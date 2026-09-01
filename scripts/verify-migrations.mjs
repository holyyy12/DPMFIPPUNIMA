import { readdir, readFile } from 'node:fs/promises';

const root = new URL('../supabase/migrations/', import.meta.url);
const files = (await readdir(root)).filter((file) => file.endsWith('.sql')).sort();
const required = ['enable row level security', 'audit_events', 'content_revisions', 'ddas_private_contacts', 'comment_deletion_credentials'];
const source = (await Promise.all(files.map((file) => readFile(new URL(file, root), 'utf8')))).join('\n').toLowerCase();
const missing = required.filter((token) => !source.includes(token));
if (files.length < 5 || missing.length) {
  console.error(`Migration gate failed. Files=${files.length}; missing=${missing.join(', ') || 'none'}`);
  process.exit(1);
}
console.log(`Migration manifest gate passed (${files.length} files).`);
