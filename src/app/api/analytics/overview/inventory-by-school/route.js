import { getRequestContext } from '@/lib/request-context';
import { getInventoryBySchoolWithCategoryBreakdown } from '@/lib/data/analytics';

export async function GET(request) {
  const context = await getRequestContext(request);

  if (context.role !== 'Admin') {
    return Response.json({ success: false, message: 'Forbidden' }, { status: 403 });
  }

  const data = await getInventoryBySchoolWithCategoryBreakdown();
  return Response.json({ success: true, message: 'Inventory by school with category breakdown retrieved successfully', data });
}