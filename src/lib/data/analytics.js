import { prisma } from '@/lib/prisma';
import { decimalToNumber, emptyCoreGroups, mapToCoreCategoryGroup, parsePositiveInteger } from './shared';
import {
  getBalancesForCategoryBreakdown,
  getBalancesForKPI,
  getBalancesForSchoolBreakdown,
  getInventoryByItemTypeForSchool,
  getItemTypeBalances,
  getItemTypeById,
  getItemTypeIdsForSchool,
  getSchoolInventoryBalances,
} from './inventory';

export async function getNetworkKPITotals() {
  const balances = await getBalancesForKPI();

  const totals = {
    totalPieces: 0,
    ...emptyCoreGroups(),
    totalWeightKg: 0,
  };

  for (const balance of balances) {
    const qty = balance.quantity ?? 0;
    const weightKg = decimalToNumber(balance.itemType?.category?.weightKg) * qty;
    const group = mapToCoreCategoryGroup(balance.itemStatus);

    totals.totalPieces += qty;
    totals.totalWeightKg += weightKg;
    if (group) {
      totals[group] += qty;
    }
  }

  totals.totalWeightKg = Number(totals.totalWeightKg.toFixed(3));

  return totals;
}

export async function getInventoryBySchoolWithCategoryBreakdown() {
  const balances = await getBalancesForSchoolBreakdown();
  const schoolMap = {};

  for (const balance of balances) {
    const school = balance.itemType?.school;
    if (!school) {
      continue;
    }

    const qty = balance.quantity ?? 0;
    const weightKg = decimalToNumber(balance.itemType?.category?.weightKg) * qty;
    const group = mapToCoreCategoryGroup(balance.itemStatus);

    if (!schoolMap[school.id]) {
      schoolMap[school.id] = {
        schoolId: school.id,
        schoolName: school.schoolName,
        totalPieces: 0,
        totalWeightKg: 0,
        ...emptyCoreGroups(),
      };
    }

    schoolMap[school.id].totalPieces += qty;
    schoolMap[school.id].totalWeightKg += weightKg;
    if (group) {
      schoolMap[school.id][group] += qty;
    }
  }

  return Object.values(schoolMap)
    .map((school) => ({
      ...school,
      totalWeightKg: Number(school.totalWeightKg.toFixed(3)),
    }))
    .sort((a, b) => b.totalPieces - a.totalPieces);
}

export async function getInventoryByCategoryWithGroupBreakdown() {
  const balances = await getBalancesForCategoryBreakdown();
  const categoryMap = {};

  for (const balance of balances) {
    const category = balance.itemType?.category;
    if (!category) {
      continue;
    }

    const qty = balance.quantity ?? 0;
    const weightKg = decimalToNumber(category.weightKg) * qty;
    const group = mapToCoreCategoryGroup(balance.itemStatus);

    if (!categoryMap[category.id]) {
      categoryMap[category.id] = {
        categoryId: category.id,
        categoryName: category.categoryName,
        totalPieces: 0,
        totalWeightKg: 0,
        ...emptyCoreGroups(),
      };
    }

    categoryMap[category.id].totalPieces += qty;
    categoryMap[category.id].totalWeightKg += weightKg;
    if (group) {
      categoryMap[category.id][group] += qty;
    }
  }

  return Object.values(categoryMap)
    .map((category) => ({
      ...category,
      totalWeightKg: Number(category.totalWeightKg.toFixed(3)),
    }))
    .sort((a, b) => b.totalPieces - a.totalPieces);
}

export async function getYearlyTrend({ startYear, endYear } = {}) {
  const currentYear = new Date().getFullYear();
  const resolvedStartYear = parsePositiveInteger(startYear) ?? currentYear - 5;
  const resolvedEndYear = parsePositiveInteger(endYear) ?? currentYear;

  if (resolvedStartYear > resolvedEndYear) {
    throw new Error('startYear must be less than or equal to endYear');
  }

  const transactions = await prisma.transaction.findMany({
    where: {
      transactionDate: {
        gte: new Date(Date.UTC(resolvedStartYear, 0, 1)),
        lte: new Date(Date.UTC(resolvedEndYear, 11, 31, 23, 59, 59, 999)),
      },
    },
    select: {
      transactionDate: true,
      transactionType: true,
      quantity: true,
      itemType: {
        select: {
          category: {
            select: { weightKg: true },
          },
        },
      },
    },
  });

  const yearMap = {};
  for (let year = resolvedStartYear; year <= resolvedEndYear; year += 1) {
    yearMap[year] = {
      year,
      donated: 0,
      sold: 0,
      repurposed: 0,
      disposed: 0,
      totalWeightKg: 0,
    };
  }

  for (const transaction of transactions) {
    const year = new Date(transaction.transactionDate).getUTCFullYear();
    if (!yearMap[year]) {
      continue;
    }

    const qty = transaction.quantity ?? 0;
    const weightKg = decimalToNumber(transaction.itemType?.category?.weightKg) * qty;
    yearMap[year].totalWeightKg += weightKg;

    switch (transaction.transactionType) {
      case 'DonationIn':
        yearMap[year].donated += qty;
        break;
      case 'Sale':
        yearMap[year].sold += qty;
        break;
      case 'Repurposing':
        yearMap[year].repurposed += qty;
        break;
      case 'Disposal':
        yearMap[year].disposed += qty;
        break;
      default:
        break;
    }
  }

  return {
    filters: { startYear: resolvedStartYear, endYear: resolvedEndYear },
    years: Object.values(yearMap).map((entry) => ({
      ...entry,
      totalWeightKg: Number(entry.totalWeightKg.toFixed(3)),
    })),
  };
}

export async function getSchoolCollectionOverview(schoolId) {
  const balances = await getSchoolInventoryBalances(schoolId);

  const totals = {
    totalPieces: 0,
    ...emptyCoreGroups(),
    totalWeightKg: 0,
  };

  for (const balance of balances) {
    const qty = balance.quantity ?? 0;
    const weightKg = decimalToNumber(balance.itemType?.category?.weightKg) * qty;
    const group = mapToCoreCategoryGroup(balance.itemStatus);

    totals.totalPieces += qty;
    totals.totalWeightKg += weightKg;
    if (group) {
      totals[group] += qty;
    }
  }

  totals.totalWeightKg = Number(totals.totalWeightKg.toFixed(3));

  const percentages = {};
  ['schoolStock', 'psg', 'repurposing', 'waste'].forEach((key) => {
    percentages[key] = totals.totalPieces > 0 ? Number(((totals[key] / totals.totalPieces) * 100).toFixed(1)) : 0;
  });

  return {
    schoolId,
    ...totals,
    percentages,
  };
}

export async function getSchoolInventoryByItem(schoolId, { isAdmin = false } = {}) {
  const balances = await getInventoryByItemTypeForSchool(schoolId);
  return {
    schoolId,
    isAdmin,
    items: getSchoolInventoryByItemTypeResult(balances, { isAdmin }),
  };
}

function getSchoolInventoryByItemTypeResult(balances, { isAdmin = false } = {}) {
  const itemMap = {};

  for (const balance of balances) {
    const itemType = balance.itemType;
    if (!itemType) {
      continue;
    }

    const qty = balance.quantity ?? 0;
    const group = mapToCoreCategoryGroup(balance.itemStatus);

    if (!isAdmin && (group === 'repurposing' || group === 'waste')) {
      continue;
    }

    if (!itemMap[itemType.id]) {
      itemMap[itemType.id] = {
        itemTypeId: itemType.id,
        categoryId: itemType.category?.id ?? null,
        categoryName: itemType.category?.categoryName ?? 'Unknown',
        gender: itemType.gender,
        imageUrl: itemType.imageUrl,
        primaryColour: itemType.primaryColour ?? null,
        secondaryColour: itemType.secondaryColour ?? null,
        weightKg: decimalToNumber(itemType.category?.weightKg),
        totalPieces: 0,
        ...emptyCoreGroups(),
        sizes: {},
      };
    }

    const entry = itemMap[itemType.id];
    entry.totalPieces += qty;
    if (group) {
      entry[group] += qty;
    }

    if (balance.sizeOption && (isAdmin || group === 'schoolStock' || group === 'psg')) {
      const sizeKey = balance.sizeOption.id;
      if (!entry.sizes[sizeKey]) {
        entry.sizes[sizeKey] = {
          sizeOptionId: balance.sizeOption.id,
          sizeName: balance.sizeOption.sizeName,
          sizeClass: balance.sizeOption.sizeClass,
          sortOrder: balance.sizeOption.sortOrder,
          schoolStock: 0,
          psg: 0,
          ...(isAdmin ? { repurposing: 0, waste: 0 } : {}),
          total: 0,
        };
      }

      entry.sizes[sizeKey].total += qty;
      if (group && entry.sizes[sizeKey][group] !== undefined) {
        entry.sizes[sizeKey][group] += qty;
      }
    }
  }

  return Object.values(itemMap).map((item) => ({
    ...item,
    sizes: Object.values(item.sizes).sort((a, b) => a.sortOrder - b.sortOrder),
    estimatedWeightKg: Number((item.totalPieces * item.weightKg).toFixed(3)),
  }));
}

export async function getSchoolItemTypeDetail(schoolId, itemTypeId, { isAdmin = false } = {}) {
  const [itemType, balances] = await Promise.all([
    getItemTypeById(itemTypeId),
    getItemTypeBalances(itemTypeId),
  ]);

  if (!itemType || itemType.school?.id !== schoolId) {
    return null;
  }

  const totals = {
    totalPieces: 0,
    ...emptyCoreGroups(),
    totalWeightKg: 0,
  };

  const sizeMap = {};

  for (const balance of balances) {
    const qty = balance.quantity ?? 0;
    const group = mapToCoreCategoryGroup(balance.itemStatus);
    const weightKg = decimalToNumber(itemType.category?.weightKg) * qty;

    totals.totalPieces += qty;
    totals.totalWeightKg += weightKg;
    if (group) {
      totals[group] += qty;
    }

    if (!balance.sizeOption) {
      continue;
    }

    const sizeKey = balance.sizeOption.id;
    if (!sizeMap[sizeKey]) {
      sizeMap[sizeKey] = {
        sizeOptionId: balance.sizeOption.id,
        sizeName: balance.sizeOption.sizeName,
        sizeClass: balance.sizeOption.sizeClass,
        sortOrder: balance.sizeOption.sortOrder,
        lastUpdated: balance.lastUpdated,
        schoolStock: 0,
        psg: 0,
        ...(isAdmin ? { repurposing: 0, waste: 0 } : {}),
        total: 0,
      };
    }

    const includeInSizeBreakdown = isAdmin || group === 'schoolStock' || group === 'psg';
    if (includeInSizeBreakdown) {
      sizeMap[sizeKey].total += qty;
      if (group && sizeMap[sizeKey][group] !== undefined) {
        sizeMap[sizeKey][group] += qty;
      }
      if (!sizeMap[sizeKey].lastUpdated || balance.lastUpdated > sizeMap[sizeKey].lastUpdated) {
        sizeMap[sizeKey].lastUpdated = balance.lastUpdated;
      }
    }
  }

  totals.totalWeightKg = Number(totals.totalWeightKg.toFixed(3));

  return {
    schoolId,
    itemType: {
      ...itemType,
      weightKg: decimalToNumber(itemType.category?.weightKg),
    },
    totals,
    sizes: Object.values(sizeMap).sort((a, b) => a.sortOrder - b.sortOrder),
  };
}

export async function getInventorySnapshot({ schoolId = null, positiveOnly = false } = {}) {
  const itemTypeIds = schoolId ? await getItemTypeIdsForSchool(schoolId) : null;

  return prisma.inventoryBalance.findMany({
    where: {
      ...(positiveOnly ? { quantity: { gt: 0 } } : {}),
      ...(itemTypeIds ? { itemTypeId: { in: itemTypeIds } } : {}),
    },
    select: {
      quantity: true,
      itemStatus: true,
      storedAt: true,
      lastUpdated: true,
      itemType: {
        select: {
          school: {
            select: {
              id: true,
              schoolName: true,
              isCooperating: true,
            },
          },
          category: {
            select: {
              id: true,
              categoryName: true,
              weightKg: true,
            },
          },
        },
      },
      sizeOption: {
        select: {
          id: true,
          sizeName: true,
          sizeClass: true,
        },
      },
    },
  });
}