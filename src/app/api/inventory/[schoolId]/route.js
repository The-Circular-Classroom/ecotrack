import { getRequestContext } from '@/lib/request-context';
import { aggregateSchoolInventory, getInventoryByItemTypeForSchool } from '@/lib/data/inventory';
import { parsePositiveInteger } from '@/lib/data/shared';

export async function GET(request, { params }) {
  const context = await getRequestContext(request);
  const schoolId = parsePositiveInteger(params.schoolId);

  if (!schoolId) {
    return Response.json({ success: false, message: 'Invalid schoolId' }, { status: 400 });
  }

  if (context.schoolId && context.schoolId !== schoolId && context.role !== 'Admin') {
    return Response.json({ success: false, message: 'Forbidden' }, { status: 403 });
  }

  const rows = await getInventoryByItemTypeForSchool(schoolId);
  const grouped = aggregateSchoolInventory(rows, { isAdmin: context.role === 'Admin' });
  const itemCategories = Array.from(new Set(grouped.map((item) => item.categoryName)));

  return Response.json({
    success: true,
    message: 'School inventory loaded successfully',
    schoolId,
    itemCategories,
    countItemTypes: grouped.length,
    items: grouped,
  });
}