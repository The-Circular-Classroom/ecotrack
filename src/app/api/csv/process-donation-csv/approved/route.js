import { getRequestContext } from '@/lib/request-context';
import { approveDonationCsvRows } from '@/lib/data/csv';

export const runtime = 'nodejs';

export async function POST(request) {
  const context = await getRequestContext(request);

  if (!context.isAuthenticated || context.role !== 'Admin') {
    return Response.json({ success: false, message: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const rows = Array.isArray(body.enrichedData) ? body.enrichedData : [];

  if (rows.length === 0) {
    return Response.json({ success: false, message: 'No validated rows provided' }, { status: 400 });
  }

  const result = await approveDonationCsvRows(rows, { approverUserId: context.userId });
  return Response.json(result, { status: 201 });
}