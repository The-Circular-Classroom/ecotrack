import { getRequestContext } from '@/lib/request-context';
import { getSchoolItemTypeDetail } from '@/lib/data/analytics';
import { parsePositiveInteger } from '@/lib/data/shared';

export async function GET(request, { params }) {
  const context = await getRequestContext(request);
  const schoolId = parsePositiveInteger(params.schoolId);
  const itemTypeId = parsePositiveInteger(params.itemTypeId);
  const isAdmin = request.nextUrl.searchParams.get('isAdmin') === 'true' || context.role === 'Admin';

  if (!schoolId || !itemTypeId) {
    return Response.json({ success: false, message: 'Invalid schoolId or itemTypeId' }, { status: 400 });
  }

  if (context.schoolId && context.schoolId !== schoolId && context.role !== 'Admin') {
    return Response.json({ success: false, message: 'Forbidden' }, { status: 403 });
  }

  const data = await getSchoolItemTypeDetail(schoolId, itemTypeId, { isAdmin });
  if (!data) {
    return Response.json({ success: false, message: 'Item type not found for this school' }, { status: 404 });
  }

  return Response.json({ success: true, message: 'Item type detail retrieved successfully', data });
}