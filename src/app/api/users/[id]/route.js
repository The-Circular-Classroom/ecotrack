import { getRequestContext } from '@/lib/request-context';
import { getUserById } from '@/lib/data/users';

export async function GET(request, { params }) {
  const context = await getRequestContext(request);

  if (context.role !== 'Admin' && context.role !== 'SchoolStaff') {
    return Response.json({ success: false, message: 'Forbidden' }, { status: 403 });
  }

  const user = await getUserById(params.id);
  if (!user) {
    return Response.json({ error: 'User not found' }, { status: 404 });
  }

  return Response.json(user);
}