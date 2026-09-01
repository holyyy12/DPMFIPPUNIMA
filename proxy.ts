import { NextResponse, type NextRequest } from 'next/server';

const csp = "default-src 'self'; img-src 'self' data: blob: https:; font-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self' https://*.supabase.co; frame-ancestors 'none'; base-uri 'self'; form-action 'self'";

export function proxy(request: NextRequest) {
  const path=request.nextUrl.pathname;
  const enforceAdminAuth=process.env.APP_ENV==='production';
  if(enforceAdminAuth&&path.startsWith('/admin/')&&!path.startsWith('/admin/login')&&!path.startsWith('/admin/mfa')&&!request.cookies.get('dpm_admin_access')){
    return NextResponse.redirect(new URL('/admin/login',request.url));
  }
  const response = NextResponse.next();
  response.headers.set('Content-Security-Policy', csp);
  response.headers.set('Referrer-Policy', request.nextUrl.pathname.startsWith('/ddas/') ? 'no-referrer' : 'strict-origin-when-cross-origin');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  response.headers.set('X-Request-ID', crypto.randomUUID());
  if (path.startsWith('/admin/') || path.startsWith('/ddas/tracking') || path.startsWith('/api/ddas/')) {
    response.headers.set('Cache-Control', 'private, no-store');
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }
  return response;
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.svg|og.png).*)'] };
