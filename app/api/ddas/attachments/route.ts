import {z} from 'zod';
import {ddasTrackingSchema} from '@/lib/contracts/ddas';
import {hmac} from '@/lib/security/crypto';
import {supabaseConfig,supabaseRpc} from '@/lib/supabase/rest';
export async function POST(request:Request){try{
 const input=ddasTrackingSchema.extend({name:z.string().min(1).max(180),type:z.string().max(120),size:z.number().int().min(1).max(25_000_000)}).parse(await request.json());
 const pepper=process.env.DDAS_SECRET_PEPPER;if(!pepper||pepper.includes('SET_IN_'))throw Error('NOT_CONFIGURED');
 const path=await supabaseRpc<string>('prepare_ddas_upload',{p_ticket:input.ticket,p_hash:await hmac(input.secret,pepper),p_name:input.name,p_type:input.type,p_size:input.size},{noStore:true});
 const {url,anon}=supabaseConfig();
 return Response.json({ok:true,url:`${url}/storage/v1/object/ddas-evidence/${path}`,key:anon},{headers:{'Cache-Control':'private, no-store'}});
 }catch{return Response.json({ok:false,message:'Lampiran belum dapat disiapkan. Periksa ukuran file dan bukti pengiriman.'},{status:400});}}
