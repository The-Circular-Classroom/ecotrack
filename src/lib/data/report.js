import { getActiveDrivePerformance, getCollectionFunnel, getDonationBreakdown, getMonthlyCollectionTrends, getOverallInventoryByCategory, getOverallSummarisedInventory, getSchoolRankings, getStockByStorageLocation, getSustainabilityMetrics } from './collection';
import { getDriveParticipationSummary } from './overview';

function toSummaryBuffer(title, payload) {
  return Buffer.from(JSON.stringify({ title, payload }, null, 2), 'utf-8');
}

export async function downloadAdminReport() {
  const [kpiTotals, inventoryByCategory, driveParticipation, activeDrives, sustainability, funnel, monthlyTrends] = await Promise.all([
    getOverallSummarisedInventory(),
    getOverallInventoryByCategory(),
    getDriveParticipationSummary(),
    getActiveDrivePerformance(),
    getSustainabilityMetrics(),
    getCollectionFunnel(),
    getMonthlyCollectionTrends(),
  ]);

  return toSummaryBuffer('Admin report', {
    kpiTotals,
    inventoryByCategory,
    driveParticipation,
    activeDrives,
    sustainability,
    funnel,
    monthlyTrends,
  });
}

export async function downloadSchoolReport(schoolId) {
  const [inventoryBySchool, schoolRankings, donationBreakdown, stockByLocation, sustainability] = await Promise.all([
    getOverallSummarisedInventory(),
    getSchoolRankings(),
    getDonationBreakdown({ schoolId }),
    getStockByStorageLocation({ schoolId }),
    getSustainabilityMetrics({ schoolId }),
  ]);

  return toSummaryBuffer('School report', {
    schoolId,
    inventoryBySchool,
    schoolRankings,
    donationBreakdown,
    stockByLocation,
    sustainability,
  });
}
