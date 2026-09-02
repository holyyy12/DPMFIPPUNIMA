import { z } from 'zod';
import { verifyAdminSession } from '@/lib/supabase/auth';
import { supabaseRpc } from '@/lib/supabase/rest';

const actionSchema = z.object({
  action: z.enum([
    'notification.mark_read',
    'notification.mark_all_read',
    'setting.save',
    'permission.set',
    'ddas.status',
    'ddas.public_update',
    'ddas.internal_note',
    'content.save',
    'content.delete',
  ]),
  payload: z.record(z.string(), z.unknown()).default({}),
});

async function adminSession() {
  const session = await verifyAdminSession();
  if (!session || session.aal !== 'aal2') return null;
  return session;
}

export async function GET() {
  try {
    const session = await adminSession();
    if (!session) return Response.json({ ok: false, message: 'Sesi admin dan MFA diperlukan.' }, { status: 403 });
    const data = await supabaseRpc<Record<string, unknown>>('get_admin_portal_snapshot', {}, { accessToken: session.token, noStore: true });
    return Response.json({ ok: true, data }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    console.error('admin portal snapshot', error);
    return Response.json({ ok: false, message: 'Data Portal Admin tidak dapat dimuat dari Supabase.' }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await adminSession();
    if (!session) return Response.json({ ok: false, message: 'Sesi admin dan MFA diperlukan.' }, { status: 403 });
    const input = actionSchema.parse(await request.json());
    const data = await supabaseRpc<{ ok: boolean; id?: string }>('admin_portal_action', {
      p_action: input.action,
      p_payload: input.payload,
    }, { accessToken: session.token, noStore: true });
    return Response.json({ ok: true, data });
  } catch (error) {
    console.error('admin portal action', error);
    return Response.json({ ok: false, message: 'Aksi gagal. Periksa izin dan data yang diisi.' }, { status: 400 });
  }
}
