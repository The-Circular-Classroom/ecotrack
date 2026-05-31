import { getRequestContext } from '@/lib/request-context';
import { createTransaction, getAllTransactions } from '@/lib/data/transactions';

export async function GET(request) {
  const context = await getRequestContext(request);

  if (!context.role) {
    return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const page = Number(request.nextUrl.searchParams.get('page') ?? 1);
  const limit = Number(request.nextUrl.searchParams.get('limit') ?? 100);
  const data = await getAllTransactions(page, limit);
  return Response.json(data);
}

export async function POST(request) {
  const context = await getRequestContext(request);

  if (!context.role) {
    return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const results = await createTransaction({
    ...body,
    user_id: body.user_id ?? context.userId,
  });

  return Response.json({ success: true, data: results }, { status: 201 });
}