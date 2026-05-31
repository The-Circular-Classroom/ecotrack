import { getRequestContext } from '@/lib/request-context';
import { downloadSchoolReport } from '@/lib/data/report';

export async function GET(request, { params }) {
  const context = await getRequestContext(request);
  if (!context.isAuthenticated) {
    return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const data = await downloadSchoolReport(params.school_id);
  return new Response(data, {
    headers: {
      'content-type': 'application/json',
      'content-disposition': `attachment; filename="school-${params.school_id}-report.json"`,
    },
  });
}