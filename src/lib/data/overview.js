import { prisma } from '@/lib/prisma';
import { decimalToNumber } from './shared';
import { getOverallInventoryByCategory, getOverallSummarisedInventory } from './collection';

export async function getDriveParticipationSummary() {
  const drives = await prisma.donationDrive.findMany({
    include: {
      school: { select: { id: true, schoolName: true } },
      _count: { select: { transactions: true } },
    },
  });

  return drives.map((drive) => ({
    donationDriveId: drive.id,
    driveName: drive.driveName,
    schoolId: drive.school?.id ?? null,
    schoolName: drive.school?.schoolName ?? null,
    totalTransactions: drive._count.transactions,
  }));
}

export async function getRepurposingMaterialsByColour() {
  const transactions = await prisma.transaction.findMany({
    where: { transactionType: 'Repurposing' },
    select: {
      quantity: true,
      itemType: {
        select: {
          primaryColour: { select: { id: true, colourName: true, hexcode: true } },
          category: { select: { weightKg: true } },
        },
      },
    },
  });

  const map = new Map();
  for (const transaction of transactions) {
    const colour = transaction.itemType?.primaryColour;
    const key = colour?.id ?? 'unknown';
    const current = map.get(key) || {
      colourId: colour?.id ?? null,
      colourName: colour?.colourName ?? 'Unknown',
      hexcode: colour?.hexcode ?? null,
      totalPieces: 0,
      totalWeightKg: 0,
    };

    current.totalPieces += transaction.quantity ?? 0;
    current.totalWeightKg += decimalToNumber(transaction.itemType?.category?.weightKg) * (transaction.quantity ?? 0);
    map.set(key, current);
  }

  return Array.from(map.values()).map((entry) => ({
    ...entry,
    totalWeightKg: Number(entry.totalWeightKg.toFixed(3)),
  }));
}

export async function getProductProjections() {
  const [inventory, categories] = await Promise.all([
    getOverallSummarisedInventory(),
    getOverallInventoryByCategory(),
  ]);

  return {
    inventory,
    categories,
    projectionBasis: 'Canonical Prisma inventory and category totals',
  };
}