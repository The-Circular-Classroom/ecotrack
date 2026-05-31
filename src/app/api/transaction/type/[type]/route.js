import { getRequestContext } from '@/lib/request-context';
import { getTransactionsByType } from '@/lib/data/transactions';

export async function GET(request, { params }) {
  const context = await getRequestContext(request);

  if (!context.role) {
    return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const data = await getTransactionsByType(params.type);
  return Response.json({ success: true, data });
}