import { z } from 'zod';
import { verifyAdminSession } from '@/lib/supabase/auth';
import { supabaseRpc } from '@/lib/supabase/rest';

const schema=z.object({commentId:z.string().uuid(),status:z.enum(['published','hidden','rejected']),reasonCode:z.enum(['approved','spam','harassment','privacy','misinformation','off_topic','other']),reasonDetail:z.string().trim().max(500).optional().or(z.literal(''))});
async function aal2(){const session=await verifyAdminSession();if(!session)return null;if(session.aal!=='aal2')return null;return session}
export async function GET(){try{const session=await aal2();if(!session)return Response.json({ok:false,message:'MFA diperlukan.'},{status:403});const data=await supabaseRpc<Array<{comment_id:string;body:string;display_name:string;status:string;created_at:string;report_count:number;report_categories:string[]}>>('get_moderation_queue',{}, {accessToken:session.token,noStore:true});return Response.json({ok:true,data},{headers:{'Cache-Control':'private, no-store'}})}catch{return Response.json({ok:false,message:'Antrean moderasi belum tersedia.'},{status:503})}}
export async function PUT(request:Request){try{const session=await aal2();if(!session)return Response.json({ok:false,message:'MFA diperlukan.'},{status:403});const input=schema.parse(await request.json());const ok=await supabaseRpc<boolean>('moderate_comment',{p_comment_id:input.commentId,p_to_status:input.status,p_reason_code:input.reasonCode,p_reason_detail:input.reasonDetail||null,p_request_id:crypto.randomUUID()},{accessToken:session.token,noStore:true});return Response.json({ok})}catch{return Response.json({ok:false,message:'Keputusan moderasi gagal disimpan.'},{status:400})}}

