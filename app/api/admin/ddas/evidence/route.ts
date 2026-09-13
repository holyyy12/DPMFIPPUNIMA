import { z } from 'zod';
import { verifyAdminSession } from '@/lib/supabase/auth';
import { supabaseConfig, supabaseRpc } from '@/lib/supabase/rest';
import { decrypt } from '@/lib/security/crypto';
export async function GET(request: Request) {
  try {
    const session = await verifyAdminSession();
    if (!session) return Response.json({ ok: false }, { status: 403 });
    const caseId = z
      .string()
      .uuid()
      .parse(new URL(request.url).searchParams.get('caseId'));
    const data = await supabaseRpc<{
      bodyCiphertext: string;
      files: {
        id: string;
        path: string;
        name: string;
        type: string;
        size: number;
      }[];
    }>(
      'admin_ddas_evidence',
      { p_case: caseId },
      { accessToken: session.token, noStore: true },
    );
    const { url, anon } = supabaseConfig();
    const files = await Promise.all(
      data.files.map(async (f) => {
        const r = await fetch(
          `${url}/storage/v1/object/sign/ddas-evidence/${f.path}`,
          {
            method: 'POST',
            headers: {
              apikey: anon,
              Authorization: `Bearer ${session.token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ expiresIn: 120 }),
            cache: 'no-store',
          },
        );
        const p = (await r.json()) as { signedURL?: string };
        return {
          id: f.id,
          name: f.name,
          type: f.type,
          size: f.size,
          url:
            r.ok && p.signedURL
              ? `${url}/storage/v1${p.signedURL}&download=${encodeURIComponent(f.name)}`
              : '',
        };
      }),
    );
    let legacyCount = 0;
    let body = '';
    try {
      const payload = JSON.parse(
        await decrypt(
          data.bodyCiphertext,
          process.env.ENCRYPTION_KEY_CURRENT ?? '',
        ),
      );
      legacyCount = payload.attachments?.length ?? 0;
      body = payload.body ?? '';
    } catch {
      /* Old encryption key may not be configured on this host. */
    }
    return Response.json(
      {
        ok: true,
        files,
        body,
        legacyMissing: Math.max(0, legacyCount - files.length),
      },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch {
    return Response.json(
      {
        ok: false,
        message:
          'Lampiran tidak tersedia atau akun tidak memiliki akses kasus ini.',
      },
      { status: 403 },
    );
  }
}
