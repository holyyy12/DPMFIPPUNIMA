import { verifyAdminSession } from '@/lib/supabase/auth';
import { supabaseConfig, supabaseRpc } from '@/lib/supabase/rest';

const MAX_BYTES = 20 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const session = await verifyAdminSession();
    if (!session || session.aal !== 'aal2') return Response.json({ ok:false, message:'Sesi admin dan MFA diperlukan.' }, { status:403 });
    const form = await request.formData();
    const file = form.get('file');
    if (!(file instanceof File) || file.size < 1 || file.size > MAX_BYTES) return Response.json({ ok:false, message:'File wajib diisi dan maksimal 20 MB.' }, { status:400 });
    const bucket = form.get('bucket') === 'private-media' ? 'private-media' : 'public-media';
    const formText = (key:string) => { const value=form.get(key); return typeof value === 'string' ? value : ''; };
    const cleanName = file.name.normalize('NFKD').replace(/[^a-zA-Z0-9._-]+/g,'-').replace(/^-+|-+$/g,'') || 'file';
    const objectPath = `admin/${new Date().toISOString().slice(0,10)}/${crypto.randomUUID()}-${cleanName}`;
    const bytes = await file.arrayBuffer();
    const sha = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))).map((value) => value.toString(16).padStart(2,'0')).join('');
    const { url, anon } = supabaseConfig();
    const upload = await fetch(`${url}/storage/v1/object/${bucket}/${objectPath}`, { method:'POST', headers:{ apikey:anon, Authorization:`Bearer ${session.token}`, 'Content-Type':file.type || 'application/octet-stream', 'x-upsert':'false' }, body:bytes });
    if (!upload.ok) return Response.json({ ok:false, message:'Upload ditolak. Pastikan akun memiliki izin media dan file sesuai batas.' }, { status:upload.status });
    const record = await supabaseRpc<{ id:string }>('register_admin_media', {
      p_bucket:bucket, p_object_path:objectPath, p_original_filename:file.name,
      p_mime_type:file.type || 'application/octet-stream', p_byte_size:file.size,
      p_sha256:sha, p_alt:formText('alt'), p_caption:formText('caption'),
      p_unit_id:formText('unitId') || null,
    }, { accessToken:session.token, noStore:true });
    const publicUrl = bucket === 'public-media' ? `${url}/storage/v1/object/public/${bucket}/${objectPath}` : '';
    return Response.json({ ok:true, data:{ assetId:record.id, bucket, objectPath, publicUrl, name:file.name, mimeType:file.type, size:file.size } });
  } catch (error) {
    console.error('admin media upload', error);
    return Response.json({ ok:false, message:'File gagal diunggah dan dicatat.' }, { status:400 });
  }
}
