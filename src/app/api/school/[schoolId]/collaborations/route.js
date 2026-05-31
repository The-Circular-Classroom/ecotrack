import { getRequestContext } from '@/lib/request-context';
import { getSchoolCollaborations } from '@/lib/data/school';

export async function GET(request, { params }) {
  const context = await getRequestContext(request);
  if (!context.isAuthenticated) {
    return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const data = await getSchoolCollaborations(params.schoolId);
  return Response.json({ success: true, data });
}