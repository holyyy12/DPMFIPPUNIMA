export async function GET() {
  const backendConfigured = Boolean(process.env.EXPECTED_SUPABASE_PROJECT_REF && process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.EXPECTED_SUPABASE_PROJECT_REF.includes('YOUR_NEW_PROJECT'));
  return Response.json({ status:'ok', service:'dpm-fipp-portal', backend:backendConfigured?'configured':'awaiting-greenfield-provisioning', timestamp:new Date().toISOString() }, { headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'} });
}
