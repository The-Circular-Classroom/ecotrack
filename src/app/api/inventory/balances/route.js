import { getRequestContext } from '@/lib/request-context';
import { getInventoryBalances } from '@/lib/data/inventory';
import { parsePositiveInteger } from '@/lib/data/shared';

export async function GET(request) {
  const context = await getRequestContext(request);
  const searchParams = request.nextUrl.searchParams;

  const itemTypeId = parsePositiveInteger(searchParams.get('itemTypeId'));
  const schoolId = parsePositiveInteger(searchParams.get('schoolId')) ?? context.schoolId;
  const categoryId = parsePositiveInteger(searchParams.get('categoryId'));
  const primaryColourId = parsePositiveInteger(searchParams.get('primaryColourId'));
  const secondaryColourId = parsePositiveInteger(searchParams.get('secondaryColourId'));
  const patternId = parsePositiveInteger(searchParams.get('patternId'));
  const materialId = parsePositiveInteger(searchParams.get('materialId'));
  const sizeCategoryId = parsePositiveInteger(searchParams.get('sizeCategoryId'));
  const gender = searchParams.get('gender')
    ? searchParams.get('gender').charAt(0).toUpperCase() + searchParams.get('gender').slice(1).toLowerCase()
    : null;

  const data = await getInventoryBalances({
    storedAt: searchParams.get('storedAt') || null,
    itemStatus: searchParams.get('itemStatus') || null,
    itemTypeId,
    schoolId,
    categoryId,
    primaryColourId,
    secondaryColourId,
    patternId,
    materialId,
    sizeCategoryId,
    gender,
    positiveOnly: true,
  });

  return Response.json({
    count: data.length,
    filters: {
      storedAt: searchParams.get('storedAt') || 'all',
      itemStatus: searchParams.get('itemStatus') || 'all',
      itemType: itemTypeId ? { itemTypeId } : 'all',
    },
    data,
  });
}