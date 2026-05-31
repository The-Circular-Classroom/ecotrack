import { getSchoolProfile } from '@/lib/data/school';

export async function GET(request, { params }) {
  const data = await getSchoolProfile(params.schoolId);
  if (!data) {
    return Response.json({ success: false, message: 'School not found' }, { status: 404 });
  }

  return Response.json({ success: true, data });
}