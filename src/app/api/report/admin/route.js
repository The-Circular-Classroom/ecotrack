import { getRequestContext } from '@/lib/request-context';
import { downloadAdminReport } from '@/lib/data/report';

export async function GET(request) {
  const context = await getRequestContext(request);
  if (!context.isAuthenticated || context.role !== 'Admin') {
    return Response.json({ success: false, message: 'Forbidden' }, { status: 403 });
  }

  const data = await downloadAdminReport();
  return new Response(data, {
    headers: {
      'content-type': 'application/json',
      'content-disposition': 'attachment; filename="admin-report.json"',
    },
  });
}