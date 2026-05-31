import {
  getCollectionFunnel,
  getCooperationAnalytics,
  getCurrentInventoryCountSchool,
  getDonationBreakdown,
  getDonationDriveVolume,
  getDrivePerformance,
  getInventoryBreakdownBySchool,
  getMonthlyCollectionTrends,
  getOverallInventoryByCategory,
  getOverallSummarisedInventory,
  getSchoolRankings,
  getStockByStorageLocation,
  getSustainabilityMetrics,
  getActiveDrivePerformance,
} from '@/lib/data/collection';

function readSearchParams(request) {
  const url = new URL(request.url);
  return {
    year: url.searchParams.get('year') || undefined,
    schoolId: url.searchParams.get('schoolId') || undefined,
    activeOnly: url.searchParams.get('activeOnly') === 'true',
  };
}

export async function GET(request, { params }) {
  const slug = params.slug || [];
  const head = slug[0];
  const filters = readSearchParams(request);

  const handlers = {
    'donation-volume': () => getDonationDriveVolume(),
    'inventory-count': () => getCurrentInventoryCountSchool(),
    'school-rankings': () => getSchoolRankings(),
    'active-drives': () => getActiveDrivePerformance(),
    'drive-performance': () => getDrivePerformance(filters),
    'donation-breakdown': () => getDonationBreakdown(filters),
    'stock-by-location': () => getStockByStorageLocation(filters),
    'cooperation-analytics': () => getCooperationAnalytics(filters),
    sustainability: () => getSustainabilityMetrics(filters),
    funnel: () => getCollectionFunnel(filters),
    'monthly-trends': () => getMonthlyCollectionTrends(filters),
    school: () => getInventoryBreakdownBySchool(),
    'overall-donations': () => getOverallSummarisedInventory(),
    'overall-donations-by-category': () => getOverallInventoryByCategory(),
  };

  if (!head || !handlers[head]) {
    return Response.json({ success: false, message: 'Not found' }, { status: 404 });
  }

  const data = await handlers[head]();
  return Response.json({ success: true, data });
}