import { getRequestContext } from '@/lib/request-context';
import { lookupCrud, parseLookupInput } from '@/lib/data/catalog-maintenance';

const FIELDS = ['categoryName', 'weightKg'];

export async function GET(request, { params }) {
  const context = await getRequestContext(request);
  if (context.role !== 'Admin') {
    return Response.json({ success: false, message: 'Forbidden' }, { status: 403 });
  }

  const data = await lookupCrud.category.get(Number(params.id));
  if (!data) {
    return Response.json({ success: false, message: 'Category not found' }, { status: 404 });
  }

  return Response.json({ success: true, data });
}

export async function PATCH(request, { params }) {
  const context = await getRequestContext(request);
  if (context.role !== 'Admin') {
    return Response.json({ success: false, message: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const data = await lookupCrud.category.update(Number(params.id), parseLookupInput(body, FIELDS));
  return Response.json({ success: true, data });
}

export async function DELETE(request, { params }) {
  const context = await getRequestContext(request);
  if (context.role !== 'Admin') {
    return Response.json({ success: false, message: 'Forbidden' }, { status: 403 });
  }

  const data = await lookupCrud.category.delete(Number(params.id));
  return Response.json({ success: true, data });
}