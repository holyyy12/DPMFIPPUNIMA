'use client';
import { useState } from 'react';
import { KeyRound, ShieldCheck } from 'lucide-react';

export function AdminLoginForm(){const[pending,setPending]=useState(false);const[error,setError]=useState('');return <form className="admin-auth-card" onSubmit={async(event)=>{event.preventDefault();setPending(true);setError('');const data=new FormData(event.currentTarget);try{const response=await fetch('/api/admin/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:data.get('email'),password:data.get('password')})});const result=await response.json() as {ok:boolean;message?:string};if(!response.ok||!result.ok)throw new Error(result.message??'Login gagal.');window.location.assign('/admin/mfa')}catch(reason){setError(reason instanceof Error?reason.message:'Login gagal.')}finally{setPending(false)}}}>
  <span className="admin-auth-icon"><ShieldCheck/></span><p className="form-eyebrow">AKSES TERBATAS</p><h1>Masuk ke portal admin</h1><p>Gunakan akun pada proyek Supabase greenfield. Semua akses administratif wajib dilanjutkan dengan MFA.</p>{error&&<div role="alert" className="form-error-summary">{error}</div>}
  <label htmlFor="admin-email">Email</label><input id="admin-email" name="email" type="email" autoComplete="username" required/>
  <label htmlFor="admin-password">Kata sandi</label><input id="admin-password" name="password" type="password" autoComplete="current-password" minLength={8} required/>
  <button className="native-button" type="submit" disabled={pending}><KeyRound/>{pending?'Memeriksa…':'Lanjutkan dengan aman'}</button><small>Portal ini tidak pernah menggunakan akun atau kredensial sistem lama.</small>
 </form>}

