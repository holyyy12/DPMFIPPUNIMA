function retiredMfaEndpoint() {
  return Response.json(
    {
      ok: false,
      message:
        'Verifikasi dua langkah tidak lagi digunakan. Masuk dengan email dan kata sandi.',
    },
    { status: 410, headers: { 'Cache-Control': 'no-store' } },
  );
}

export async function POST() {
  return retiredMfaEndpoint();
}

export async function PUT() {
  return retiredMfaEndpoint();
}
