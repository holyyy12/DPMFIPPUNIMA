// Keep framework and production proxy headers identical. Browsers enforce
// every CSP header, so an older second policy can still block a preview.
export const contentSecurityPolicy =
  "default-src 'self'; img-src 'self' data: blob: https:; media-src 'self' blob: https:; frame-src 'self' https://*.supabase.co https://view.officeapps.live.com; font-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self' https://*.supabase.co; frame-ancestors 'none'; base-uri 'self'; form-action 'self'";
