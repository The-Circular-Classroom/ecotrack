import { getRequestContext } from '@/lib/request-context';
import { getYearlyTrend } from '@/lib/data/analytics';

export async function GET(request) {
  const context = await getRequestContext(request);

  if (context.role !== 'Admin') {
    return Response.json({ success: false, message: 'Forbidden' }, { status: 403 });
  }

  const searchParams = request.nextUrl.searchParams;
  const startYear = searchParams.get('startYear');
  const endYear = searchParams.get('endYear');
  const data = await getYearlyTrend({ startYear, endYear });

  return Response.json({ success: true, message: 'Yearly trend retrieved successfully', data });
}