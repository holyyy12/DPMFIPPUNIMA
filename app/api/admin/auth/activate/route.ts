import { cookies } from 'next/headers';
import { z } from 'zod';
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  authCookieOptions,
  refreshCookieOptions,
} from '@/lib/supabase/auth';
import { supabaseConfig } from '@/lib/supabase/rest';
const schema = z.object({
  accessToken: z.string().min(20).max(8192),
  refreshToken: z.string().min(10).max(4096),
  password: z.string().min(12).max(256),
});
export async function POST(request: Request) {
  const input = schema.safeParse(await request.json().catch(() => null));
  if (!input.success)
    return Response.json(
      {
        ok: false,
        message: 'Tautan harus valid dan kata sandi sedikitnya 12 karakter.',
      },
      { status: 400 },
    );
  try {
    const { url, anon } = supabaseConfig();
    const headers = {
      apikey: anon,
      Authorization: `Bearer ${input.data.accessToken}`,
      'Content-Type': 'application/json',
    };
    const verified = await fetch(`${url}/auth/v1/user`, {
      headers,
      cache: 'no-store',
    });
    if (!verified.ok)
      return Response.json(
        {
          ok: false,
          message:
            'Undangan kedaluwarsa. Minta Super Admin mengirim ulang undangan.',
        },
        { status: 401 },
      );
    const response = await fetch(`${url}/auth/v1/user`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ password: input.data.password }),
      cache: 'no-store',
    });
    if (!response.ok)
      return Response.json(
        {
          ok: false,
          message:
            'Kata sandi ditolak. Gunakan kombinasi karakter yang lebih kuat dan berbeda dari sebelumnya.',
        },
        { status: 400 },
      );
    const jar = await cookies();
    jar.set(ACCESS_COOKIE, input.data.accessToken, authCookieOptions);
    jar.set(REFRESH_COOKIE, input.data.refreshToken, refreshCookieOptions);
    return Response.json(
      { ok: true },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch {
    return Response.json(
      { ok: false, message: 'Layanan aktivasi belum tersedia. Coba kembali.' },
      { status: 503 },
    );
  }
}
