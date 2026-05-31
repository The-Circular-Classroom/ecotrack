import { getRequestContext } from '@/lib/request-context';
import { createDonationDrive, listDonationDrives } from '@/lib/data/donation-drives';

export async function GET(request) {
  const url = new URL(request.url);
  const schoolId = url.searchParams.get('schoolId') || undefined;
  const data = await listDonationDrives({ schoolId });
  return Response.json({ success: true, data });
}

export async function POST(request) {
  const context = await getRequestContext(request);
  if (!context.isAuthenticated || !context.userId) {
    return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const data = await createDonationDrive(body, context.userId);
  return Response.json({ success: true, data }, { status: 201 });
}