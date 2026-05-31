import { getRequestContext } from '@/lib/request-context';
import { getTransactionsByDateRange } from '@/lib/data/transactions';

export async function GET(request) {
  const context = await getRequestContext(request);

  if (!context.role) {
    return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const data = await getTransactionsByDateRange(startDate, endDate);

  return Response.json({ success: true, data });
}