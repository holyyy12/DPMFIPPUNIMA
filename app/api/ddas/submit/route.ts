import { ddasSubmissionSchema } from '@/lib/contracts/ddas';
import { deriveReceipt, encrypt, hmac } from '@/lib/security/crypto';
import { supabaseRpc } from '@/lib/supabase/rest';

const jsonHeaders = { 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer', 'X-Robots-Tag': 'noindex, nofollow' };

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  try {
    if (!request.headers.get('content-type')?.includes('application/json')) return Response.json({ ok:false, code:'INVALID_REQUEST', message:'Permintaan tidak dapat diproses.', requestId }, { status:415, headers:jsonHeaders });
    const input = ddasSubmissionSchema.parse(await request.json());
    if (input.website) return Response.json({ ok:true, data:null, requestId }, { status:202, headers:jsonHeaders });
    const pepper = process.env.DDAS_SECRET_PEPPER;
    const encryptionKey = process.env.ENCRYPTION_KEY_CURRENT;
    if (!pepper || !encryptionKey || pepper.includes('SET_IN_') || encryptionKey.includes('SET_IN_')) throw new Error('BACKEND_NOT_CONFIGURED');
    const receipt = await deriveReceipt(input.idempotencyKey, pepper);
    const secretHash = await hmac(receipt.secret, pepper);
    const bodyCiphertext = await encrypt(JSON.stringify({ category:input.category, body:input.body }), encryptionKey);
    const contactCiphertext = input.email ? await encrypt(input.email.toLowerCase(), encryptionKey) : null;
    const contactHash = input.email ? await hmac(input.email.toLowerCase(), pepper) : null;
    await supabaseRpc<Array<{ticket:string;created:boolean}>>('submit_ddas', {
      p_ticket:receipt.ticket, p_tracking_secret_hash:secretHash, p_subject:input.subject,
      p_body_ciphertext:bodyCiphertext, p_idempotency_key:input.idempotencyKey,
      p_contact_ciphertext:contactCiphertext, p_contact_hash:contactHash,
      p_consent_at:new Date().toISOString(), p_notification_opt_in:input.notificationOptIn, p_request_id:requestId,
    }, { noStore:true });
    return Response.json({ ok:true, data:receipt, requestId }, { status:201, headers:jsonHeaders });
  } catch (error) {
    const unavailable = error instanceof Error && error.message.includes('BACKEND_NOT_CONFIGURED');
    return Response.json({ ok:false, code:unavailable?'SERVICE_UNAVAILABLE':'INVALID_REQUEST', message:unavailable?'Layanan aspirasi belum diaktifkan pada backend greenfield baru. Coba kembali setelah konfigurasi selesai.':'Periksa kembali isian Anda tanpa memasukkan data rahasia yang tidak diperlukan.', requestId }, { status:unavailable?503:400, headers:jsonHeaders });
  }
}
