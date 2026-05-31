import { getRequestContext } from '@/lib/request-context';
import { getSchoolCollectionOverview } from '@/lib/data/analytics';
import { parsePositiveInteger } from '@/lib/data/shared';

export async function GET(request, { params }) {
  const context = await getRequestContext(request);
  const schoolId = parsePositiveInteger(params.schoolId);

  if (!schoolId) {
    return Response.json({ success: false, message: 'Invalid schoolId' }, { status: 400 });
  }

  if (context.schoolId && context.schoolId !== schoolId && context.role !== 'Admin') {
    return Response.json({ success: false, message: 'Forbidden' }, { status: 403 });
  }

  const data = await getSchoolCollectionOverview(schoolId);
  return Response.json({ success: true, message: 'School collection overview retrieved successfully', data });
}