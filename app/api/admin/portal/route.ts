import { z } from 'zod';
import { verifyAdminSession } from '@/lib/supabase/auth';
import { supabaseConfig, supabaseRpc } from '@/lib/supabase/rest';

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
    'survey.save',
    'unit.save',
    'permission.create',
    'user.invite_request',
    'ddas.assign',
    'ddas.attach',
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
    if (input.action === 'user.invite_request') {
      const parsed = z.object({ displayName: z.string().trim().min(1).max(120), email: z.string().trim().email().max(254), roleKey: z.string().min(1), unitId: z.union([z.string().uuid(), z.literal('')]).default('') }).safeParse(input.payload);
      if (!parsed.success) return Response.json({ok:false,message:'Nama, email, role, dan unit harus diisi dengan benar.'},{status:400});
      const {url,anon}=supabaseConfig();
      const response=await fetch(`${url}/functions/v1/invite-admin`,{method:'POST',headers:{apikey:anon,Authorization:`Bearer ${session.token}`,'Content-Type':'application/json'},body:JSON.stringify(parsed.data),cache:'no-store'});
      const result=await response.json() as {ok?:boolean;message?:string};
      return Response.json({ok:response.ok&&result.ok===true,message:result.message??'Layanan undangan belum tersedia.'},{status:response.ok?200:response.status});
    }
    if (input.action === 'unit.save') {
      const payload = input.payload;
      const data = await supabaseRpc<{ ok: boolean; id?: string; error?: string }>('create_admin_unit', {
        p_name: payload.name,
        p_slug: payload.slug,
        p_code: payload.code,
        p_description: payload.description ?? '',
        p_unit_type: payload.unitType ?? 'commission',
      }, { accessToken: session.token, noStore: true });
      if (!data.ok) {
        const messages: Record<string, string> = {
          INVALID_UNIT: 'Nama dan kode unit wajib diisi.',
          NO_ACTIVE_PERIOD: 'Belum ada periode aktif. Aktifkan periode kepengurusan sebelum menambah unit.',
          DUPLICATE_UNIT: 'Kode atau nama unit sudah digunakan pada periode aktif.',
        };
        return Response.json({ ok: false, message: messages[data.error ?? ''] ?? 'Unit tidak dapat ditambahkan.' }, { status: 400 });
      }
      return Response.json({ ok: true, data });
    }
    const extended = ['survey.save','permission.create','user.invite_request','ddas.assign','ddas.attach'].includes(input.action);
    const data = await supabaseRpc<{ ok: boolean; id?: string }>(extended ? 'admin_portal_extended_action' : 'admin_portal_action', {
      p_action: input.action,
      p_payload: input.payload,
    }, { accessToken: session.token, noStore: true });
    return Response.json({ ok: true, data });
  } catch (error) {
    console.error('admin portal action', error);
    return Response.json({ ok: false, message: 'Aksi gagal. Periksa izin dan data yang diisi.' }, { status: 400 });
  }
}
