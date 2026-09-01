import { cookies } from 'next/headers';
import { supabaseConfig } from './rest';

export const ACCESS_COOKIE = 'dpm_admin_access';
export const REFRESH_COOKIE = 'dpm_admin_refresh';

type AuthUser = { id:string; email?:string; user_metadata?:{ display_name?:string }; factors?:Array<{id:string;factor_type:string;status:string;friendly_name?:string}> };

function decodePayload(token: string) {
  try { return JSON.parse(atob(token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'))) as { aal?:string; exp?:number }; }
  catch { return {}; }
}

export async function verifyAdminSession() {
  const jar = await cookies();
  const token = jar.get(ACCESS_COOKIE)?.value;
  if (!token) return null;
  const { url, anon } = supabaseConfig();
  const response = await fetch(`${url}/auth/v1/user`, { headers:{ apikey:anon, Authorization:`Bearer ${token}` }, cache:'no-store' });
  if (!response.ok) return null;
  const user = await response.json() as AuthUser;
  const payload = decodePayload(token);
  return { token, user, aal:payload.aal ?? 'aal1', expiresAt:payload.exp ?? 0 };
}

export const authCookieOptions = { httpOnly:true, secure:process.env.APP_ENV === 'production', sameSite:'lax' as const, path:'/', maxAge:60*60 };
export const refreshCookieOptions = { ...authCookieOptions, maxAge:60*60*24*30 };

