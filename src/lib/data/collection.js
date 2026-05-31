import { prisma } from '@/lib/prisma';
import {
  getInventoryByCategoryWithGroupBreakdown,
  getInventoryBySchoolWithCategoryBreakdown,
  getNetworkKPITotals,
  getYearlyTrend,
} from './analytics';
import { decimalToNumber } from './shared';

function monthKey(date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

export async function getDonationDriveVolume() {
  const [drives, transactions] = await Promise.all([
    prisma.donationDrive.findMany({ include: { school: { select: { id: true, schoolName: true } } } }),
    prisma.transaction.findMany({ where: { transactionType: 'DonationIn' }, select: { quantity: true, donationDriveId: true } }),
  ]);

  const driveMap = new Map();
  for (const drive of drives) {
    driveMap.set(drive.id, {
      donationDriveId: drive.id,
      driveName: drive.driveName,
      schoolId: drive.school?.id ?? null,
      schoolName: drive.school?.schoolName ?? null,
      totalPieces: 0,
    });
  }

  for (const transaction of transactions) {
    if (!driveMap.has(transaction.donationDriveId)) continue;
    driveMap.get(transaction.donationDriveId).totalPieces += transaction.quantity ?? 0;
  }

  return Array.from(driveMap.values()).sort((a, b) => b.totalPieces - a.totalPieces);
}

export async function getCurrentInventoryCountSchool() {
  return getInventoryBySchoolWithCategoryBreakdown();
}

export async function getSchoolRankings() {
  const schools = await getInventoryBySchoolWithCategoryBreakdown();
  return schools.map((school, index) => ({ ...school, rank: index + 1 }));
}

export async function getActiveDrivePerformance() {
  const now = new Date();
  const drives = await prisma.donationDrive.findMany({
    where: { startDate: { lte: now }, endDate: { gte: now } },
    include: { school: { select: { id: true, schoolName: true } } },
  });

  const transactions = await prisma.transaction.findMany({
    where: { donationDriveId: { in: drives.map((drive) => drive.id) } },
    select: { donationDriveId: true, quantity: true },
  });

  const totals = new Map();
  for (const transaction of transactions) {
    totals.set(transaction.donationDriveId, (totals.get(transaction.donationDriveId) || 0) + (transaction.quantity ?? 0));
  }

  return drives.map((drive) => ({
    donationDriveId: drive.id,
    driveName: drive.driveName,
    schoolId: drive.school?.id ?? null,
    schoolName: drive.school?.schoolName ?? null,
    totalPieces: totals.get(drive.id) || 0,
  }));
}

export async function getDrivePerformance({ year, schoolId, activeOnly } = {}) {
  const drives = await prisma.donationDrive.findMany({
    where: {
      ...(schoolId ? { schoolId: Number(schoolId) } : {}),
      ...(activeOnly ? (() => {
        const now = new Date();
        return { startDate: { lte: now }, endDate: { gte: now } };
      })() : {}),
      ...(year ? { startDate: { gte: new Date(Date.UTC(Number(year), 0, 1)), lt: new Date(Date.UTC(Number(year) + 1, 0, 1)) } } : {}),
    },
    include: { school: { select: { id: true, schoolName: true } } },
  });

  const transactions = await prisma.transaction.findMany({
    where: { donationDriveId: { in: drives.map((drive) => drive.id) } },
    select: { donationDriveId: true, quantity: true, transactionType: true },
  });

  const totals = new Map();
  for (const transaction of transactions) {
    const current = totals.get(transaction.donationDriveId) || { totalPieces: 0, donations: 0, sales: 0, repurposing: 0, disposal: 0 };
    const quantity = transaction.quantity ?? 0;
    current.totalPieces += quantity;
    if (transaction.transactionType === 'DonationIn') current.donations += quantity;
    if (transaction.transactionType === 'Sale') current.sales += quantity;
    if (transaction.transactionType === 'Repurposing') current.repurposing += quantity;
    if (transaction.transactionType === 'Disposal') current.disposal += quantity;
    totals.set(transaction.donationDriveId, current);
  }

  return drives.map((drive) => ({
    donationDriveId: drive.id,
    driveName: drive.driveName,
    schoolId: drive.school?.id ?? null,
    schoolName: drive.school?.schoolName ?? null,
    ...(totals.get(drive.id) || { totalPieces: 0, donations: 0, sales: 0, repurposing: 0, disposal: 0 }),
  }));
}

export async function getDonationBreakdown({ year, schoolId } = {}) {
  const where = {
    ...(year ? { transactionDate: { gte: new Date(Date.UTC(Number(year), 0, 1)), lt: new Date(Date.UTC(Number(year) + 1, 0, 1)) } } : {}),
    ...(schoolId ? { itemType: { schoolId: Number(schoolId) } } : {}),
  };

  const transactions = await prisma.transaction.findMany({ where, select: { transactionType: true, quantity: true } });
  const map = new Map();
  for (const transaction of transactions) {
    const key = transaction.transactionType;
    map.set(key, (map.get(key) || 0) + (transaction.quantity ?? 0));
  }
  return Array.from(map.entries()).map(([transactionType, totalPieces]) => ({ transactionType, totalPieces }));
}

export async function getStockByStorageLocation({ schoolId } = {}) {
  const balances = await prisma.inventoryBalance.findMany({
    where: schoolId ? { itemType: { schoolId: Number(schoolId) } } : undefined,
    select: { storedAt: true, quantity: true },
  });

  const map = new Map();
  for (const balance of balances) {
    map.set(balance.storedAt, (map.get(balance.storedAt) || 0) + (balance.quantity ?? 0));
  }
  return Array.from(map.entries()).map(([storedAt, totalPieces]) => ({ storedAt, totalPieces }));
}

export async function getCooperationAnalytics({ year } = {}) {
  const schools = await prisma.school.findMany({ select: { id: true, schoolName: true, isCooperating: true } });
  return {
    year: year ? Number(year) : new Date().getFullYear(),
    totalSchools: schools.length,
    cooperatingSchools: schools.filter((school) => school.isCooperating).length,
    nonCooperatingSchools: schools.filter((school) => !school.isCooperating).length,
  };
}

export async function getSustainabilityMetrics({ year, schoolId } = {}) {
  const trend = await getYearlyTrend({ startYear: year, endYear: year });
  const inventory = schoolId ? await getInventoryBySchoolWithCategoryBreakdown() : await getNetworkKPITotals();
  return { trend, inventory };
}

export async function getCollectionFunnel({ year, schoolId } = {}) {
  const transactions = await prisma.transaction.findMany({
    where: {
      ...(year ? { transactionDate: { gte: new Date(Date.UTC(Number(year), 0, 1)), lt: new Date(Date.UTC(Number(year) + 1, 0, 1)) } } : {}),
      ...(schoolId ? { itemType: { schoolId: Number(schoolId) } } : {}),
    },
    select: { transactionType: true, quantity: true },
  });

  const totals = { donation: 0, transfer: 0, statusChange: 0, sale: 0, repurposing: 0, disposal: 0 };
  for (const transaction of transactions) {
    const quantity = transaction.quantity ?? 0;
    if (transaction.transactionType === 'DonationIn') totals.donation += quantity;
    if (transaction.transactionType === 'Transfer') totals.transfer += quantity;
    if (transaction.transactionType === 'StatusChange') totals.statusChange += quantity;
    if (transaction.transactionType === 'Sale') totals.sale += quantity;
    if (transaction.transactionType === 'Repurposing') totals.repurposing += quantity;
    if (transaction.transactionType === 'Disposal') totals.disposal += quantity;
  }
  return totals;
}

export async function getMonthlyCollectionTrends({ year, schoolId } = {}) {
  const resolvedYear = Number(year || new Date().getFullYear());
  const transactions = await prisma.transaction.findMany({
    where: {
      transactionDate: { gte: new Date(Date.UTC(resolvedYear, 0, 1)), lt: new Date(Date.UTC(resolvedYear + 1, 0, 1)) },
      ...(schoolId ? { itemType: { schoolId: Number(schoolId) } } : {}),
    },
    select: { transactionDate: true, quantity: true },
  });

  const map = new Map();
  for (const transaction of transactions) {
    const key = monthKey(new Date(transaction.transactionDate));
    map.set(key, (map.get(key) || 0) + (transaction.quantity ?? 0));
  }

  return Array.from(map.entries()).map(([month, totalPieces]) => ({ month, totalPieces }));
}

export async function getInventoryBreakdownBySchool() {
  return getInventoryBySchoolWithCategoryBreakdown();
}

export async function getOverallSummarisedInventory() {
  return getNetworkKPITotals();
}

export async function getOverallInventoryByCategory() {
  return getInventoryByCategoryWithGroupBreakdown();
}