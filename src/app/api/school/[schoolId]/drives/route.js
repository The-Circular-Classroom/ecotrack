import { getSchoolDriveList } from '@/lib/data/school';

export async function GET(request, { params }) {
  const data = await getSchoolDriveList(params.schoolId);
  return Response.json({ success: true, data });
}