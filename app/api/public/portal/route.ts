import {supabaseRpc} from '@/lib/supabase/rest';
import {PublicPortalSnapshot} from '@/lib/public-portal';

export async function GET(){
  try{
    const data=await supabaseRpc<PublicPortalSnapshot>('get_public_portal_snapshot',{}, {noStore:true});
    return Response.json({ok:true,data},{headers:{'Cache-Control':'private, no-store, max-age=0'}});
  }catch(error){console.error('public portal snapshot',error);return Response.json({ok:false,message:'Data publik belum dapat dimuat.'},{status:503,headers:{'Cache-Control':'no-store'}})}
}
