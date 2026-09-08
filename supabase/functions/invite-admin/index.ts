// Supabase provides these server-only keys in the Edge Function environment.
declare const Deno: { env: { get(key: string): string | undefined }; serve(handler: (request: Request) => Promise<Response>): void };
const messages: Record<string,string> = {
  invalid_input:'Nama dan alamat email wajib valid.', invalid_role:'Role tidak tersedia.',
  invalid_unit:'Pilih unit aktif untuk role Unit DPM.', email_exists:'Email ini sudah memiliki akun. Gunakan akun yang ada.',
  rate_limit:'Tunggu satu menit sebelum mengirim ulang undangan.',
  over_email_send_rate_limit:'Batas pengiriman email tercapai. Coba kembali nanti atau periksa pengaturan SMTP.',
  email_address_not_authorized:'Layanan email bawaan Supabase hanya mengizinkan alamat anggota tim. Konfigurasikan SMTP untuk mengundang pengguna lain.',
  email_exists_auth:'Alamat email sudah terdaftar.',
};
const reply=(status:number,message:string,ok=false)=>Response.json({ok,message},{status});
Deno.serve(async request=>{
  if(request.method!=='POST')return reply(405,'Metode tidak didukung.');
  const url=Deno.env.get('SUPABASE_URL')!;
  const anon=Deno.env.get('SUPABASE_ANON_KEY')!;
  const secret=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const authorization=request.headers.get('Authorization')??'';
  try {
    const check=await fetch(`${url}/auth/v1/user`,{headers:{apikey:anon,Authorization:authorization}});
    if(!check.ok)return reply(401,'Sesi admin telah berakhir. Silakan login kembali.');
    const input=await request.json() as Record<string,unknown>;
    if(typeof input.email!=='string'||typeof input.displayName!=='string'||typeof input.roleKey!=='string')return reply(400,messages.invalid_input);
    const email=input.email.trim().toLowerCase();
    const prepared=await fetch(`${url}/rest/v1/rpc/prepare_admin_email_invite`,{method:'POST',headers:{apikey:anon,Authorization:authorization,'Content-Type':'application/json'},body:JSON.stringify({p_email:email,p_name:input.displayName,p_role:input.roleKey,p_unit:input.unitId||null})});
    if(!prepared.ok)return reply(403,'Izin mengelola pengguna dan verifikasi MFA diperlukan.');
    const reservation=await prepared.json() as {ok:boolean;id:string;code:string};
    if(!reservation.ok)return reply(400,messages[reservation.code]??'Undangan tidak dapat diproses.');
    // The public Vercel domain is reachable by invited users without a Sites owner session.
    const redirect='https://dpmfippunima.vercel.app/aktivasi';
    const sent=await fetch(`${url}/auth/v1/invite?redirect_to=${encodeURIComponent(redirect)}`,{method:'POST',headers:{apikey:secret,Authorization:`Bearer ${secret}`,'Content-Type':'application/json'},body:JSON.stringify({email,data:{display_name:input.displayName}})});
    const result=await sent.json() as {id?:string;error_code:string};
    const finished=await fetch(`${url}/rest/v1/rpc/finish_admin_email_invite`,{method:'POST',headers:{apikey:secret,Authorization:`Bearer ${secret}`,'Content-Type':'application/json'},body:JSON.stringify({p_id:reservation.id,p_user:sent.ok?result.id:null})});
    if(!sent.ok)return reply(sent.status===429?429:400,messages[result.error_code]??'Layanan email gagal mengirim undangan. Periksa konfigurasi SMTP Supabase, lalu coba kembali.');
    if(!finished.ok)return reply(503,'Email telah dikirim, tetapi penetapan akses belum selesai. Hubungi Super Admin sebelum mencoba lagi.');
    return reply(200,'Undangan telah diterima layanan email. Periksa kotak masuk dan folder spam penerima.',true);
  }catch{return reply(503,'Layanan undangan tidak dapat dihubungi. Coba kembali setelah koneksi pulih.');}
});
