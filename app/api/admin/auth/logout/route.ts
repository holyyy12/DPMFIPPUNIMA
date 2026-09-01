import { cookies } from 'next/headers';
import { ACCESS_COOKIE, REFRESH_COOKIE } from '@/lib/supabase/auth';
export async function POST(){const jar=await cookies();jar.delete(ACCESS_COOKIE);jar.delete(REFRESH_COOKIE);return Response.json({ok:true})}

