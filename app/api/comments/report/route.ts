import { commentReportSchema } from '@/lib/contracts/comments';
import { hmac } from '@/lib/security/crypto';
import { supabaseRpc } from '@/lib/supabase/rest';

export async function POST(request: Request) {
  const requestId=crypto.randomUUID();
  try {
    const input=commentReportSchema.parse(await request.json());
    const pepper=process.env.COMMENT_DELETE_PEPPER;
    if(!pepper||pepper.includes('SET_IN_')) throw new Error('BACKEND_NOT_CONFIGURED');
    const fingerprint=await hmac(`${request.headers.get('user-agent') ?? 'unknown'}:${input.commentId}`,pepper);
    await supabaseRpc('report_public_comment',{p_comment_id:input.commentId,p_category:input.category,p_detail:input.detail||null,p_fingerprint_hash:fingerprint,p_request_id:requestId},{noStore:true});
    return Response.json({ok:true,message:'Laporan diterima.',requestId},{status:201,headers:{'Cache-Control':'no-store'}});
  } catch(error) {
    const unavailable=error instanceof Error&&error.message.includes('BACKEND_NOT_CONFIGURED');
    return Response.json({ok:false,message:unavailable?'Pelaporan belum diaktifkan.':'Laporan tidak dapat diproses.',requestId},{status:unavailable?503:400,headers:{'Cache-Control':'no-store'}});
  }
}

