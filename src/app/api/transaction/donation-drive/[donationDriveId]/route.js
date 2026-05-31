import { getRequestContext } from '@/lib/request-context';
import { getTransactionsByDonationDrive } from '@/lib/data/transactions';

export async function GET(request, { params }) {
  const context = await getRequestContext(request);

  if (!context.role) {
    return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const data = await getTransactionsByDonationDrive(params.donationDriveId);
  return Response.json({ success: true, data });
}