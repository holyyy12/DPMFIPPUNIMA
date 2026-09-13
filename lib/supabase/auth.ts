import { cookies } from 'next/headers';
import { supabaseConfig, supabaseRpc } from './rest';

export const ACCESS_COOKIE = 'dpm_admin_access';
export const REFRESH_COOKIE = 'dpm_admin_refresh';

type AuthUser = {
  id: string;
  email?: string;
  user_metadata?: { display_name?: string };
};

function decodePayload(token: string) {
  try {
    return JSON.parse(
      atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')),
    ) as { aal?: string; exp?: number };
  } catch {
    return {};
  }
}

export async function verifyAdminSession() {
  const jar = await cookies();
  let token = jar.get(ACCESS_COOKIE)?.value;
  const refreshToken = jar.get(REFRESH_COOKIE)?.value;
  if (!token && !refreshToken) return null;
  const { url, anon } = supabaseConfig();
  let response = token
    ? await fetch(`${url}/auth/v1/user`, {
        headers: { apikey: anon, Authorization: `Bearer ${token}` },
        cache: 'no-store',
      })
    : null;
  if ((!response || !response.ok) && refreshToken) {
    const refreshed = await fetch(
      `${url}/auth/v1/token?grant_type=refresh_token`,
      {
        method: 'POST',
        headers: { apikey: anon, 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
        cache: 'no-store',
      },
    );
    if (!refreshed.ok) return null;
    const next = (await refreshed.json()) as {
      access_token: string;
      refresh_token?: string;
    };
    token = next.access_token;
    jar.set(ACCESS_COOKIE, token, authCookieOptions);
    if (next.refresh_token)
      jar.set(REFRESH_COOKIE, next.refresh_token, refreshCookieOptions);
    response = await fetch(`${url}/auth/v1/user`, {
      headers: { apikey: anon, Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
  }
  if (!token || !response?.ok) return null;
  const user = (await response.json()) as AuthUser;
  if (!(await isActiveAdminSession(token))) return null;
  const payload = decodePayload(token);
  return {
    token,
    user,
    aal: payload.aal ?? 'aal1',
    expiresAt: payload.exp ?? 0,
  };
}

// Supabase verifies authentication. Database roles, not user metadata,
// decide portal admission; each action retains its own RPC/RLS permission check.
export async function isActiveAdminSession(token: string) {
  return supabaseRpc<boolean>(
    'is_active_admin_session',
    {},
    { accessToken: token, noStore: true },
  );
}

export const authCookieOptions = {
  httpOnly: true,
  secure:
    process.env.NODE_ENV === 'production' ||
    process.env.APP_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60,
};
export const refreshCookieOptions = {
  ...authCookieOptions,
  maxAge: 60 * 60 * 24 * 30,
};
