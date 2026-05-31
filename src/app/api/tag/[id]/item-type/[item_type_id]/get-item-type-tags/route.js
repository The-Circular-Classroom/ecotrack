import { getRequestContext } from '@/lib/request-context';
import { getItemTypeTagsByItemTypeId } from '@/lib/data/catalog-maintenance';

export async function GET(request, { params }) {
  const context = await getRequestContext(request);
  if (context.role !== 'Admin') {
    return Response.json({ success: false, message: 'Forbidden' }, { status: 403 });
  }

  const data = await getItemTypeTagsByItemTypeId(Number(params.item_type_id));
  return Response.json({ success: true, data });
}