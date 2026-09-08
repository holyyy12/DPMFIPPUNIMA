import { cookies } from 'next/headers';
import { z } from 'zod';
import { supabaseRpc } from '@/lib/supabase/rest';
const headers={'Cache-Control':'no-store'};
export async function GET(){try{return Response.json({ok:true,data:await supabaseRpc('public_surveys',{}, {noStore:true})},{headers});}catch{return Response.json({ok:false,message:'Survei belum dapat dimuat.'},{status:503,headers});}}
export async function POST(request:Request){try{
 const input=z.object({id:z.string().uuid(),option:z.string().trim().min(1).max(500),consent:z.literal(true)}).parse(await request.json());
 const jar=await cookies();const identity=jar.get('dpm_survey_visitor')?.value??crypto.randomUUID();
 const accepted=await supabaseRpc<boolean>('submit_public_survey',{p_id:input.id,p_option:input.option,p_dedupe:identity},{noStore:true});
 jar.set('dpm_survey_visitor',identity,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:60*60*24*365});
 return Response.json({ok:true,message:accepted?'Pilihan Anda berhasil disimpan.':'Anda sudah mengisi survei ini melalui browser ini.'},{headers});
}catch{return Response.json({ok:false,message:'Pilih satu isu, setujui penggunaan jawaban, dan pastikan survei masih terbuka.'},{status:400,headers});}}
