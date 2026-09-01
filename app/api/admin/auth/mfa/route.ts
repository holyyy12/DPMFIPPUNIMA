import { cookies } from 'next/headers';
import { z } from 'zod';
import { ACCESS_COOKIE, REFRESH_COOKIE, authCookieOptions, refreshCookieOptions, verifyAdminSession } from '@/lib/supabase/auth';
import { supabaseConfig } from '@/lib/supabase/rest';

const verifySchema=z.object({factorId:z.string().uuid(),challengeId:z.string().uuid(),code:z.string().regex(/^\d{6}$/)});

export async function POST(){
  try{
    const session=await verifyAdminSession(); if(!session)return Response.json({ok:false,message:'Sesi tidak valid.'},{status:401});
    const {url,anon}=supabaseConfig(); const response=await fetch(`${url}/auth/v1/factors`,{method:'POST',headers:{apikey:anon,Authorization:`Bearer ${session.token}`,'Content-Type':'application/json'},body:JSON.stringify({factor_type:'totp',friendly_name:'DPM Admin Authenticator'}),cache:'no-store'});
    const data=await response.json() as {id?:string;totp?:{qr_code?:string;secret?:string}}; if(!response.ok||!data.id||!data.totp?.qr_code||!data.totp.secret)return Response.json({ok:false,message:'Authenticator belum dapat didaftarkan.'},{status:response.status});
    return Response.json({ok:true,data:{id:data.id,qrCode:data.totp?.qr_code,secret:data.totp?.secret}},{headers:{'Cache-Control':'private, no-store'}});
  }catch{return Response.json({ok:false,message:'MFA belum tersedia.'},{status:503})}
}

export async function PUT(request:Request){
  try{
    const session=await verifyAdminSession(); if(!session)return Response.json({ok:false,message:'Sesi tidak valid.'},{status:401});
    const input=verifySchema.parse(await request.json()); const {url,anon}=supabaseConfig();
    let challengeId=input.challengeId;
    if(challengeId==='00000000-0000-0000-0000-000000000000'){
      const challenge=await fetch(`${url}/auth/v1/factors/${input.factorId}/challenge`,{method:'POST',headers:{apikey:anon,Authorization:`Bearer ${session.token}`,'Content-Type':'application/json'},body:'{}',cache:'no-store'});
      const challengeData=await challenge.json() as {id?:string}; if(!challenge.ok||!challengeData.id)return Response.json({ok:false,message:'Tantangan MFA gagal dibuat.'},{status:400}); challengeId=challengeData.id;
    }
    const response=await fetch(`${url}/auth/v1/factors/${input.factorId}/verify`,{method:'POST',headers:{apikey:anon,Authorization:`Bearer ${session.token}`,'Content-Type':'application/json'},body:JSON.stringify({challenge_id:challengeId,code:input.code}),cache:'no-store'});
    const data=await response.json() as {access_token?:string;refresh_token?:string}; if(!response.ok||!data.access_token)return Response.json({ok:false,message:'Kode authenticator tidak valid.'},{status:401});
    const jar=await cookies(); jar.set(ACCESS_COOKIE,data.access_token,authCookieOptions); if(data.refresh_token)jar.set(REFRESH_COOKIE,data.refresh_token,refreshCookieOptions);
    return Response.json({ok:true});
  }catch{return Response.json({ok:false,message:'Verifikasi MFA gagal.'},{status:400})}
}
