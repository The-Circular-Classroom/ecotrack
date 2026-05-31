import { lookupCrud } from '@/lib/data/catalog-maintenance';

export async function GET() {
  const data = {
    categories: await lookupCrud.sizeCategory.list(),
    options: await lookupCrud.sizeOption.list(),
  };
  return Response.json({ success: true, data });
}