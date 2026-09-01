import { ddasTrackingSchema } from '@/lib/contracts/ddas';
import { hmac } from '@/lib/security/crypto';
import { supabaseRpc } from '@/lib/supabase/rest';

const headers = { 'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer','X-Robots-Tag':'noindex, nofollow' };
export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  try {
    const input = ddasTrackingSchema.parse(await request.json());
    const pepper = process.env.DDAS_SECRET_PEPPER;
    if (!pepper || pepper.includes('SET_IN_')) throw new Error('BACKEND_NOT_CONFIGURED');
    const secretHash = await hmac(input.secret, pepper);
    const rows = await supabaseRpc<Array<{status:string;submitted_at:string;state:string;safe_message:string;occurred_at:string}>>('track_ddas',{p_ticket:input.ticket,p_secret_hash:secretHash},{noStore:true});
    if (!rows.length) return Response.json({ok:false,code:'NOT_VERIFIED',message:'Kode tidak dapat diverifikasi. Periksa kembali nomor tiket dan kode pelacakan.',requestId},{status:404,headers});
    return Response.json({ok:true,data:{ticket:input.ticket,status:rows[0].status,submittedAt:rows[0].submitted_at,timeline:rows.filter((row)=>row.state).map((row)=>({state:row.state,message:row.safe_message,occurredAt:row.occurred_at}))},requestId},{headers});
  } catch (error) {
    const unavailable=error instanceof Error&&error.message.includes('BACKEND_NOT_CONFIGURED');
    return Response.json({ok:false,code:unavailable?'SERVICE_UNAVAILABLE':'NOT_VERIFIED',message:unavailable?'Pelacakan belum diaktifkan pada backend greenfield baru.':'Kode tidak dapat diverifikasi. Periksa kembali nomor tiket dan kode pelacakan.',requestId},{status:unavailable?503:404,headers});
  }
}
