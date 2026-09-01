import { cookies } from 'next/headers';
import { ACCESS_COOKIE, REFRESH_COOKIE, authCookieOptions, refreshCookieOptions } from '@/lib/supabase/auth';
import { supabaseConfig } from '@/lib/supabase/rest';
import { z } from 'zod';

const schema=z.object({email:z.string().email().max(254),password:z.string().min(8).max(256)});
export async function POST(request:Request){
  try{
    const input=schema.parse(await request.json()); const {url,anon}=supabaseConfig();
    const response=await fetch(`${url}/auth/v1/token?grant_type=password`,{method:'POST',headers:{apikey:anon,'Content-Type':'application/json'},body:JSON.stringify(input),cache:'no-store'});
    if(!response.ok)return Response.json({ok:false,message:'Email atau kata sandi tidak valid.'},{status:401});
    const result=await response.json() as {access_token:string;refresh_token:string;user:{factors?:Array<{id:string;factor_type:string;status:string}>}};
    const jar=await cookies(); jar.set(ACCESS_COOKIE,result.access_token,authCookieOptions); jar.set(REFRESH_COOKIE,result.refresh_token,refreshCookieOptions);
    return Response.json({ok:true,hasVerifiedFactor:result.user.factors?.some((factor)=>factor.status==='verified')??false});
  }catch(error){const unavailable=error instanceof Error&&error.message.includes('BACKEND_NOT_CONFIGURED');return Response.json({ok:false,message:unavailable?'Login admin belum diaktifkan pada backend baru.':'Permintaan login tidak valid.'},{status:unavailable?503:400});}
}

