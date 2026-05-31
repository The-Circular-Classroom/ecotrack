import { getRequestContext } from '@/lib/request-context';
import { getNetworkKPITotals } from '@/lib/data/analytics';

export async function GET(request) {
  const context = await getRequestContext(request);

  if (context.role !== 'Admin') {
    return Response.json({ success: false, message: 'Forbidden' }, { status: 403 });
  }

  const data = await getNetworkKPITotals();
  return Response.json({ success: true, message: 'Network KPI totals retrieved successfully', data });
}