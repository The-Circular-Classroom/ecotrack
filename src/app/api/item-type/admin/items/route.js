import { lookupCrud } from '@/lib/data/catalog-maintenance';

export async function GET() {
  const data = await lookupCrud.itemType.listAdminItems();
  return Response.json({ success: true, data });
}