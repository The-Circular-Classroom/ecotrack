import { getRequestContext } from '@/lib/request-context';
import {
  calculateAssembly,
  createProduct,
  createProductType,
  createRecipe,
  createStyle,
  deleteProduct,
  deleteProductType,
  deleteRecipe,
  deleteStyle,
  getItemTypes,
  getProductOptions,
  getProducts,
  updateProduct,
  updateProductType,
  updateRecipe,
  updateStyle,
} from '@/lib/data/assembly';
import { prisma } from '@/lib/prisma';

function parseJsonBody(request) {
  return request.json();
}

export async function GET(request, { params }) {
  const slug = params.slug || [];
  const head = slug[0];
  const url = new URL(request.url);
  const schoolId = url.searchParams.get('schoolId') || undefined;

  if (head === 'products') {
    return Response.json({ success: true, data: await getProducts({ schoolId }) });
  }

  if (head === 'item-types') {
    return Response.json({ success: true, data: await getItemTypes({ schoolId }) });
  }

  if (head === 'product-options') {
    return Response.json({ success: true, data: await getProductOptions() });
  }

  if (head === 'product-types') {
    return Response.json({ success: true, data: await prisma.productType.findMany({ orderBy: { typeName: 'asc' } }) });
  }

  if (head === 'styles') {
    return Response.json({ success: true, data: await prisma.style.findMany({ orderBy: { styleName: 'asc' } }) });
  }

  if (head === 'recipes') {
    return Response.json({ success: true, data: await prisma.productRecipe.findMany({ orderBy: { id: 'asc' } }) });
  }

  return Response.json({ success: false, message: 'Not found' }, { status: 404 });
}

export async function POST(request, { params }) {
  const context = await getRequestContext(request);
  if (!context.isAuthenticated || context.role !== 'Admin') {
    return Response.json({ success: false, message: 'Forbidden' }, { status: 403 });
  }

  const slug = params.slug || [];
  const head = slug[0];
  const body = await parseJsonBody(request);

  const handlers = {
    products: () => createProduct(body),
    calculate: () => calculateAssembly(body.requests || []),
    'product-types': () => createProductType(body),
    styles: () => createStyle(body),
    recipes: () => createRecipe(body),
  };

  if (!head || !handlers[head]) {
    return Response.json({ success: false, message: 'Not found' }, { status: 404 });
  }

  const data = await handlers[head]();
  return Response.json({ success: true, data }, { status: 201 });
}

export async function PUT(request, { params }) {
  const context = await getRequestContext(request);
  if (!context.isAuthenticated || context.role !== 'Admin') {
    return Response.json({ success: false, message: 'Forbidden' }, { status: 403 });
  }

  const slug = params.slug || [];
  const body = await parseJsonBody(request);

  if (slug[0] === 'products' && slug[1]) {
    const data = await updateProduct(slug[1], body);
    return Response.json({ success: true, data });
  }

  if (slug[0] === 'product-types' && slug[1]) {
    const data = await updateProductType(slug[1], body);
    return Response.json({ success: true, data });
  }

  if (slug[0] === 'styles' && slug[1]) {
    const data = await updateStyle(slug[1], body);
    return Response.json({ success: true, data });
  }

  if (slug[0] === 'recipes' && slug[1]) {
    const data = await updateRecipe(slug[1], body);
    return Response.json({ success: true, data });
  }

  return Response.json({ success: false, message: 'Not found' }, { status: 404 });
}

export async function DELETE(request, { params }) {
  const context = await getRequestContext(request);
  if (!context.isAuthenticated || context.role !== 'Admin') {
    return Response.json({ success: false, message: 'Forbidden' }, { status: 403 });
  }

  const slug = params.slug || [];

  if (slug[0] === 'products' && slug[1]) {
    const data = await deleteProduct(slug[1]);
    return Response.json({ success: true, data });
  }

  if (slug[0] === 'product-types' && slug[1]) {
    const data = await deleteProductType(slug[1]);
    return Response.json({ success: true, data });
  }

  if (slug[0] === 'styles' && slug[1]) {
    const data = await deleteStyle(slug[1]);
    return Response.json({ success: true, data });
  }

  if (slug[0] === 'recipes' && slug[1]) {
    const data = await deleteRecipe(slug[1]);
    return Response.json({ success: true, data });
  }

  return Response.json({ success: false, message: 'Not found' }, { status: 404 });
}