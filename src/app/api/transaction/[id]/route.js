import { getRequestContext } from '@/lib/request-context';
import { getTransactionById } from '@/lib/data/transactions';

export async function GET(request, { params }) {
  const context = await getRequestContext(request);

  if (!context.role) {
    return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const data = await getTransactionById(params.id);

  if (!data) {
    return Response.json({ success: false, message: 'Transaction not found' }, { status: 404 });
  }

  return Response.json({ success: true, data });
}