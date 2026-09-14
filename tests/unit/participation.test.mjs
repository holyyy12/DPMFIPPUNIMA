import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
const require = createRequire(import.meta.url);
async function load(path) {
  let source = await readFile(new URL(path, import.meta.url), 'utf8');
  source = source.replace(
    "from 'zod'",
    `from '${pathToFileURL(require.resolve('zod')).href}'`,
  );
  const code = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  return import(
    'data:text/javascript;base64,' + Buffer.from(code).toString('base64')
  );
}
const { ddasSubmissionSchema, ddasTrackingSchema } = await load(
  '../../lib/contracts/ddas.ts',
);
const { deriveReceipt, encrypt, decrypt } = await load(
  '../../lib/security/crypto.ts',
);
const { contentMedia } = await load('../../lib/content-media.ts');
const { mediaDownloadUrl, mediaKind } = await load('../../lib/media-access.ts');
test('production proxy and framework use the same media preview policy', async () => {
  const { contentSecurityPolicy } = await load(
    '../../lib/content-security-policy.ts',
  );
  assert.match(
    contentSecurityPolicy,
    /frame-src 'self' https:\/\/\*\.supabase\.co https:\/\/view\.officeapps\.live\.com/,
  );
  assert.match(contentSecurityPolicy, /media-src 'self' blob: https:/);
  for (const path of ['../../proxy.ts', '../../next.config.ts']) {
    const source = await readFile(new URL(path, import.meta.url), 'utf8');
    assert.match(source, /import \{ contentSecurityPolicy \}/);
    assert.doesNotMatch(source, /default-src/);
  }
});
test('legacy D-DAR and registered storage files expose preview and download', () => {
  const old = contentMedia({
    body: {
      attachment: {
        publicUrl:
          'https://test.supabase.co/storage/v1/object/public/public-media/file.pdf',
        name: 'Arsip.pdf',
      },
    },
  });
  assert.equal(old.length, 1);
  assert.equal(mediaKind(old[0]), 'pdf');
  assert.equal(
    new URL(mediaDownloadUrl(old[0])).searchParams.get('download'),
    'Arsip.pdf',
  );
  assert.equal(
    mediaDownloadUrl({ url: 'javascript:alert(1)', name: 'Unsafe' }),
    '',
  );
  assert.equal(
    mediaKind({ url: 'https://example.com/video.mp4?x=1' }),
    'video',
  );
  const previous = process.env.NEXT_PUBLIC_SUPABASE_URL;
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
  try {
    const stored = contentMedia({
      body: {
        attachments: [
          { bucket: 'public-media', objectPath: 'admin/a b.pdf', name: 'A' },
          null,
        ],
      },
    });
    assert.equal(stored.length, 1);
    assert.ok(stored[0].url.endsWith('/admin/a%20b.pdf'));
  } finally {
    if (previous === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    else process.env.NEXT_PUBLIC_SUPABASE_URL = previous;
  }
});
const input = {
  category: 'Akademik',
  subject: 'Contoh aspirasi',
  body: 'Contoh isi aspirasi untuk pengujian.',
  consent: true,
  idempotencyKey: crypto.randomUUID(),
};
test('optional contacts accept blank, email, and formatted WhatsApp', () => {
  assert.ok(
    ddasSubmissionSchema.safeParse({ ...input, email: '', whatsapp: '' })
      .success,
  );
  const parsed = ddasSubmissionSchema.parse({
    ...input,
    email: 'mahasiswa@example.com',
    whatsapp: '+62 812-3456-7890',
  });
  assert.equal(parsed.whatsapp, '+6281234567890');
  assert.equal(
    ddasSubmissionSchema.safeParse({ ...input, email: 'bukan-email' }).success,
    false,
  );
});
test('every generated ticket satisfies tracking format and is deterministic', async () => {
  for (let i = 0; i < 100; i++) {
    const id = crypto.randomUUID();
    const r = await deriveReceipt(id, 'test-only-pepper');
    assert.ok(ddasTrackingSchema.safeParse(r).success);
    assert.deepEqual(r, await deriveReceipt(id, 'test-only-pepper'));
  }
});
test('contact encryption round trips without exposing plain text', async () => {
  const key = Buffer.alloc(32, 1).toString('base64');
  const value = '{"email":"private@example.com"}';
  const c = await encrypt(value, key);
  assert.ok(!c.includes('private'));
  assert.equal(await decrypt(c, key), value);
});
test('gallery uses all media belonging to its content only', () => {
  const media = [
    { url: 'https://example.com/a.jpg', name: 'Foto' },
    { url: 'https://example.com/b.mp4', name: 'Video', mimeType: 'video/mp4' },
  ];
  assert.equal(
    contentMedia({ seo: { program: { documentation: media } } }).length,
    2,
  );
  assert.equal(
    contentMedia({
      body: { attachments: media.map((m) => ({ ...m, publicUrl: m.url })) },
    }).length,
    2,
  );
  assert.equal(
    contentMedia({ body: { attachments: [{ url: 'javascript:alert(1)' }] } })
      .length,
    0,
  );
});
