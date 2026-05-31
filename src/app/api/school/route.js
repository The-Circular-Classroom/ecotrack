import { getRequestContext } from '@/lib/request-context';
import { addSchool, getAllSchools } from '@/lib/data/school';

export async function GET() {
  const data = await getAllSchools();
  return Response.json({ success: true, data });
}

export async function POST(request) {
  const context = await getRequestContext(request);
  if (!context.isAuthenticated || context.role !== 'Admin') {
    return Response.json({ success: false, message: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const data = await addSchool(body);
  return Response.json({ success: true, data }, { status: 201 });
}