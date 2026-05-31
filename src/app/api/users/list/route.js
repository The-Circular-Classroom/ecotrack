import { getRequestContext } from '@/lib/request-context';
import { listUsers } from '@/lib/data/users';

export async function GET(request) {
  const context = await getRequestContext(request);
  const searchParams = request.nextUrl.searchParams;

  if (context.role !== 'Admin' && context.role !== 'SchoolStaff') {
    return Response.json({ success: false, message: 'Forbidden' }, { status: 403 });
  }

  const page = Number(searchParams.get('page') ?? 1);
  const limit = Number(searchParams.get('limit') ?? 10);
  const username = searchParams.get('username')?.trim() ?? '';

  const data = await listUsers({ page, limit, username });
  return Response.json(data);
}