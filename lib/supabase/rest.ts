type RequestOptions = { noStore?: boolean; accessToken?: string };

export function supabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const expected = process.env.EXPECTED_SUPABASE_PROJECT_REF;
  const actual = /^https:\/\/([a-z0-9-]+)\.supabase\.co$/i.exec(url ?? '')?.[1];
  if (!url || !anon || !expected || actual !== expected || /YOUR_NEW_PROJECT|SET_IN_SECRET/.test(`${url}${anon}${expected}`)) throw new Error('BACKEND_NOT_CONFIGURED');
  return { url, anon };
}

export async function supabaseRequest<T>(path: string, init: RequestInit = {}, options: RequestOptions = {}) {
  const { url, anon } = supabaseConfig();
  const requestHeaders = new Headers(init.headers);
  requestHeaders.set('apikey', anon);
  requestHeaders.set('Authorization', `Bearer ${options.accessToken ?? anon}`);
  requestHeaders.set('Accept', 'application/json');
  const response = await fetch(`${url}${path}`, {
    ...init,
    headers: requestHeaders,
    cache: options.noStore ? 'no-store' : init.cache,
  });
  if (!response.ok) throw new Error(`SUPABASE_REST_${response.status}`);
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export async function supabaseRpc<T>(name: string, payload: Record<string, unknown>, options: RequestOptions = {}) {
  const { url, anon } = supabaseConfig();
  const response = await fetch(`${url}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: { apikey: anon, Authorization: `Bearer ${options.accessToken ?? anon}`, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
    cache: options.noStore ? 'no-store' : 'default',
  });
  if (!response.ok) throw new Error(`SUPABASE_RPC_${response.status}`);
  return response.json() as Promise<T>;
}
