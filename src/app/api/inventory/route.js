import { getAllInventoryItems } from '@/lib/data/inventory';

export async function GET() {
  const data = await getAllInventoryItems();
  return Response.json({ success: true, data });
}