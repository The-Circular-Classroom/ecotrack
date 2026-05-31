export async function GET() {
  return Response.json({
    application: 'ecotrack-unified',
    status: 'ok',
    platform: 'vercel',
    backend: 'supabase',
    timestamp: new Date().toISOString(),
  });
}
