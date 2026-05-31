import { getRequestContext } from '@/lib/request-context';
import { lookupCrud, parseLookupInput } from '@/lib/data/catalog-maintenance';

const FIELDS = ['materialName'];

export async function GET() {
  const data = await lookupCrud.material.list();
  return Response.json({ success: true, data });
}

export async function POST(request) {
  const context = await getRequestContext(request);
  if (context.role !== 'Admin') {
    return Response.json({ success: false, message: 'Forbidden' }, { status: 403 });
  }
  const body = await request.json();
  const data = await lookupCrud.material.create(parseLookupInput(body, FIELDS));
  return Response.json({ success: true, data }, { status: 201 });
}