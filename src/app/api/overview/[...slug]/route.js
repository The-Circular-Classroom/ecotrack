import { getDriveParticipationSummary, getProductProjections, getRepurposingMaterialsByColour } from '@/lib/data/overview';
import { getInventoryByCategoryWithGroupBreakdown, getInventoryBySchoolWithCategoryBreakdown, getNetworkKPITotals, getYearlyTrend } from '@/lib/data/analytics';

function readSearchParams(request) {
  const url = new URL(request.url);
  return {
    startYear: url.searchParams.get('startYear') || undefined,
    endYear: url.searchParams.get('endYear') || undefined,
  };
}

export async function GET(request, { params }) {
  const slug = params.slug || [];
  const head = slug[0];
  const filters = readSearchParams(request);

  const handlers = {
    'kpi-totals': () => getNetworkKPITotals(),
    'inventory-by-school': () => getInventoryBySchoolWithCategoryBreakdown(),
    'inventory-by-category': () => getInventoryByCategoryWithGroupBreakdown(),
    'yearly-trend': () => getYearlyTrend(filters),
    'drive-participation': () => getDriveParticipationSummary(),
    'repurposing-by-colour': () => getRepurposingMaterialsByColour(),
    'product-projections': () => getProductProjections(),
  };

  if (!head || !handlers[head]) {
    return Response.json({ success: false, message: 'Not found' }, { status: 404 });
  }

  const data = await handlers[head]();
  return Response.json({ success: true, data });
}