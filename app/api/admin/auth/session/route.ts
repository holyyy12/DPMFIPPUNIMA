import { verifyAdminSession } from '@/lib/supabase/auth';
export async function GET(){try{const session=await verifyAdminSession();if(!session)return Response.json({ok:false},{status:401});return Response.json({ok:true,user:{id:session.user.id,email:session.user.email,displayName:session.user.user_metadata?.display_name},aal:session.aal,factors:session.user.factors??[]},{headers:{'Cache-Control':'private, no-store'}})}catch{return Response.json({ok:false},{status:503})}}

