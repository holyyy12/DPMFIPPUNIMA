export {};
declare const Deno: {
  env: { get(key: string): string | undefined };
  serve(handler: (request: Request) => Promise<Response>): void;
};
const reply = (status: number, message: string, ok = false) =>
  Response.json(
    { ok, message },
    { status, headers: { 'Cache-Control': 'no-store' } },
  );

Deno.serve(async (request) => {
  if (request.method !== 'POST') return reply(405, 'Metode tidak didukung.');
  const url = Deno.env.get('SUPABASE_URL')!;
  const anon = Deno.env.get('SUPABASE_ANON_KEY')!;
  const secret = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const authorization = request.headers.get('Authorization') ?? '';
  try {
    const input = (await request.json()) as Record<string, unknown>;
    if (
      typeof input.password !== 'string' ||
      input.password.length < 16 ||
      input.password.length > 128 ||
      typeof input.email !== 'string' ||
      typeof input.displayName !== 'string' ||
      typeof input.roleKey !== 'string'
    )
      return reply(
        400,
        'Lengkapi data dan buat password acak minimal 16 karakter.',
      );
    const prepared = await fetch(`${url}/rest/v1/rpc/prepare_admin_account`, {
      method: 'POST',
      headers: {
        apikey: anon,
        Authorization: authorization,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        p_email: input.email,
        p_name: input.displayName,
        p_role: input.roleKey,
        p_unit: input.unitId || null,
      }),
    });
    if (!prepared.ok)
      return reply(403, 'Hanya Super Admin aktif yang dapat membuat akun.');
    const reservation = (await prepared.json()) as {
      ok: boolean;
      code?: string;
      id: string;
    };
    if (!reservation.ok)
      return reply(
        400,
        reservation.code === 'email_exists'
          ? 'Email sudah terdaftar. Akun lama tidak diubah.'
          : reservation.code === 'rate_limit'
            ? 'Tunggu satu menit sebelum mencoba kembali.'
            : 'Periksa nama, email, role, dan unit.',
      );
    const headers = {
      apikey: secret,
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/json',
    };
    // Admin API creates a confirmed account. No SMTP request and no password in metadata/logs.
    const created = await fetch(`${url}/auth/v1/admin/users`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        email: input.email.trim().toLowerCase(),
        password: input.password,
        email_confirm: true,
        user_metadata: { display_name: input.displayName },
      }),
    });
    const user = (await created.json()) as { id?: string };
    const finished = await fetch(
      `${url}/rest/v1/rpc/finish_admin_email_invite`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          p_id: reservation.id,
          p_user: created.ok ? user.id : null,
        }),
      },
    );
    if (!created.ok)
      return reply(
        400,
        'Akun tidak berhasil dibuat. Email mungkin sudah digunakan atau password tidak memenuhi kebijakan keamanan.',
      );
    if (!finished.ok)
      return reply(
        503,
        'Akun telah dibuat, tetapi penetapan role belum selesai. Jangan membuat ulang akun; hubungi pengelola.',
      );
    return reply(
      200,
      'Akun dan role berhasil dibuat. Sampaikan email dan password kepada pemilik akun melalui saluran pribadi.',
      true,
    );
  } catch {
    return reply(
      503,
      'Layanan akun belum berhasil merespons. Periksa daftar pengguna sebelum mencoba kembali.',
    );
  }
});
