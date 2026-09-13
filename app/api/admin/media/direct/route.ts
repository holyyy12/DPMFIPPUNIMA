import { z } from 'zod';
import { verifyAdminSession } from '@/lib/supabase/auth';
import { supabaseConfig, supabaseRpc } from '@/lib/supabase/rest';
const schema = z.object({
  name: z.string().min(1).max(255),
  type: z.string().max(120),
  size: z
    .number()
    .int()
    .min(1)
    .max(20 * 1024 * 1024),
  bucket: z.enum(['public-media', 'private-media']),
  alt: z.string().max(1000).default(''),
  caption: z.string().max(2000).default(''),
  unitId: z.union([z.string().uuid(), z.literal('')]).default(''),
});
const headers = { 'Cache-Control': 'private, no-store' };
export async function POST(request: Request) {
  try {
    const s = await verifyAdminSession();
    if (!s)
      return Response.json(
        { ok: false, message: 'Sesi admin diperlukan.' },
        { status: 403, headers },
      );
    const input = schema.parse(await request.json());
    const { url, anon } = supabaseConfig();
    const name = input.name.replace(/[^a-zA-Z0-9._-]/g, '-');
    const path = `admin/${s.user.id}/${crypto.randomUUID()}-${name}`;
    const r = await fetch(
      `${url}/storage/v1/object/upload/sign/${input.bucket}/${path}`,
      {
        method: 'POST',
        headers: {
          apikey: anon,
          Authorization: `Bearer ${s.token}`,
          'Content-Type': 'application/json',
        },
        body: '{}',
        cache: 'no-store',
      },
    );
    const data = (await r.json()) as { url?: string };
    if (!r.ok || !data.url)
      return Response.json(
        { ok: false, message: 'Izin unggah ditolak oleh penyimpanan.' },
        { status: 403, headers },
      );
    return Response.json(
      { ok: true, path, url: `${url}/storage/v1${data.url}` },
      { headers },
    );
  } catch {
    return Response.json(
      { ok: false, message: 'Periksa file. Maksimal 20 MB per file.' },
      { status: 400, headers },
    );
  }
}
export async function PUT(request: Request) {
  try {
    const s = await verifyAdminSession();
    if (!s) return Response.json({ ok: false }, { status: 403, headers });
    const input = schema
      .extend({
        path: z.string().max(1000),
        sha: z.string().regex(/^[a-f0-9]{64}$/),
      })
      .parse(await request.json());
    const exists = await supabaseRpc<boolean>(
      'verify_admin_media_object',
      { p_bucket: input.bucket, p_path: input.path, p_size: input.size },
      { accessToken: s.token, noStore: true },
    );
    if (!exists) throw Error('OBJECT_MISSING');
    const record = await supabaseRpc<{ id: string }>(
      'register_admin_media',
      {
        p_bucket: input.bucket,
        p_object_path: input.path,
        p_original_filename: input.name,
        p_mime_type: input.type,
        p_byte_size: input.size,
        p_sha256: input.sha,
        p_alt: input.alt,
        p_caption: input.caption,
        p_unit_id: input.unitId || null,
      },
      { accessToken: s.token, noStore: true },
    );
    const { url } = supabaseConfig();
    return Response.json(
      {
        ok: true,
        data: {
          assetId: record.id,
          bucket: input.bucket,
          objectPath: input.path,
          publicUrl:
            input.bucket === 'public-media'
              ? `${url}/storage/v1/object/public/${input.bucket}/${input.path}`
              : '',
          name: input.name,
          mimeType: input.type,
          size: input.size,
        },
      },
      { headers },
    );
  } catch {
    return Response.json(
      {
        ok: false,
        message: 'Berkas belum berhasil dicatat. Coba unggah kembali.',
      },
      { status: 400, headers },
    );
  }
}
