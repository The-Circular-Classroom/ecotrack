import { lookupCrud } from '@/lib/data/catalog-maintenance';

export async function GET() {
  const data = await lookupCrud.itemType.listPsgItems();
  return Response.json({ success: true, data });
}