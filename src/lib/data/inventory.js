import { prisma } from '@/lib/prisma';
import { CORE_GROUP_STATUSES, decimalToNumber, emptyCoreGroups, mapToCoreCategoryGroup } from './shared';

async function resolveItemTypeIds(filters = {}) {
  const where = {};

  if (filters.schoolId) {
    where.schoolId = filters.schoolId;
  }
  if (filters.gender) {
    where.gender = filters.gender;
  }
  if (filters.categoryId) {
    where.categoryId = filters.categoryId;
  }
  if (filters.primaryColourId) {
    where.primaryColourId = filters.primaryColourId;
  }
  if (filters.secondaryColourId) {
    where.secondaryColourId = filters.secondaryColourId;
  }
  if (filters.patternId) {
    where.patternId = filters.patternId;
  }
  if (filters.materialId) {
    where.materialId = filters.materialId;
  }
  if (filters.sizeCategoryId) {
    where.sizeCategoryId = filters.sizeCategoryId;
  }

  const itemTypes = await prisma.itemType.findMany({
    where,
    select: { id: true },
  });

  return itemTypes.map((itemType) => itemType.id);
}

async function resolveItemTypeIdsBySchool(schoolId) {
  const itemTypes = await prisma.itemType.findMany({
    where: { schoolId },
    select: { id: true },
  });

  return itemTypes.map((itemType) => itemType.id);
}

export async function getItemTypeIdsForSchool(schoolId) {
  return resolveItemTypeIdsBySchool(schoolId);
}

async function buildInventoryWhere(filters = {}) {
  const where = {};

  if (filters.positiveOnly) {
    where.quantity = { gt: 0 };
  }

  if (filters.storedAt) {
    where.storedAt = filters.storedAt;
  }
  if (filters.itemStatus) {
    where.itemStatus = filters.itemStatus;
  }
  if (filters.itemTypeId) {
    where.itemTypeId = filters.itemTypeId;
  }

  const itemTypeFilters = {
    schoolId: filters.schoolId,
    gender: filters.gender,
    categoryId: filters.categoryId,
    primaryColourId: filters.primaryColourId,
    secondaryColourId: filters.secondaryColourId,
    patternId: filters.patternId,
    materialId: filters.materialId,
    sizeCategoryId: filters.sizeCategoryId,
  };

  if (Object.values(itemTypeFilters).some((value) => value !== undefined && value !== null)) {
    const itemTypeIds = await resolveItemTypeIds(itemTypeFilters);
    if (itemTypeIds.length === 0) {
      where.itemTypeId = { in: [] };
    } else {
      where.itemTypeId = { in: itemTypeIds };
    }
  }

  return where;
}

export async function getAllInventoryItems() {
  return prisma.inventoryBalance.findMany({
    where: {
      quantity: { gt: 0 },
      itemStatus: { in: ['ForSale', 'ForRepurpose'] },
    },
    include: {
      itemType: {
        include: {
          school: true,
          category: true,
          primaryColour: true,
        },
      },
      sizeOption: true,
    },
  });
}

export async function getInventoryBalances(filters = {}) {
  const where = await buildInventoryWhere(filters);

  return prisma.inventoryBalance.findMany({
    where,
    select: {
      id: true,
      itemTypeId: true,
      itemStatus: true,
      storedAt: true,
      quantity: true,
      lastUpdated: true,
      sizeOption: {
        select: { id: true, sizeName: true, sizeClass: true, sortOrder: true },
      },
      itemType: {
        select: {
          id: true,
          gender: true,
          imageUrl: true,
          category: { select: { id: true, categoryName: true } },
          primaryColour: { select: { id: true, colourName: true, hexcode: true } },
          secondaryColour: { select: { id: true, colourName: true, hexcode: true } },
          pattern: { select: { id: true, patternName: true } },
          material: { select: { id: true, materialName: true } },
          sizeCategory: { select: { id: true, sizeType: true } },
          school: { select: { id: true, schoolName: true, logoUrl: true } },
        },
      },
    },
    orderBy: [{ itemTypeId: 'asc' }, { sizeOption: { sortOrder: 'asc' } }],
  });
}

export async function getSchoolInventoryBalances(schoolId, filters = {}) {
  return getInventoryBalances({
    ...filters,
    schoolId,
    positiveOnly: true,
  });
}

export async function getInventoryByItemTypeForSchool(schoolId) {
  return prisma.inventoryBalance.findMany({
    where: {
      quantity: { gt: 0 },
      itemTypeId: { in: await resolveItemTypeIdsBySchool(schoolId) },
    },
    include: {
      itemType: {
        include: {
          category: true,
          primaryColour: true,
          secondaryColour: true,
          pattern: true,
          material: true,
          school: true,
          sizeCategory: true,
        },
      },
      sizeOption: true,
    },
    orderBy: [{ itemTypeId: 'asc' }, { sizeOption: { sortOrder: 'asc' } }],
  });
}

export async function getItemTypeById(itemTypeId) {
  return prisma.itemType.findUnique({
    where: { id: itemTypeId },
    include: {
      category: true,
      school: true,
      primaryColour: true,
      secondaryColour: true,
      pattern: true,
      material: true,
      sizeCategory: true,
    },
  });
}

export async function getItemTypeBalances(itemTypeId) {
  return prisma.inventoryBalance.findMany({
    where: { itemTypeId },
    include: {
      sizeOption: true,
      itemType: {
        include: {
          category: true,
          school: true,
          primaryColour: true,
          secondaryColour: true,
          pattern: true,
          material: true,
          sizeCategory: true,
        },
      },
    },
    orderBy: { sizeOption: { sortOrder: 'asc' } },
  });
}

export async function getBalancesForKPI({ schoolId } = {}) {
  return prisma.inventoryBalance.findMany({
    where: {
      quantity: { gt: 0 },
      ...(schoolId ? { itemTypeId: { in: await resolveItemTypeIdsBySchool(schoolId) } } : {}),
    },
    select: {
      quantity: true,
      itemStatus: true,
      storedAt: true,
      itemType: {
        select: {
          category: {
            select: { weightKg: true },
          },
        },
      },
    },
  });
}

export async function getBalancesForSchoolBreakdown() {
  return prisma.inventoryBalance.findMany({
    where: {
      quantity: { gt: 0 },
      itemStatus: { in: CORE_GROUP_STATUSES },
    },
    select: {
      quantity: true,
      itemStatus: true,
      storedAt: true,
      itemType: {
        select: {
          school: { select: { id: true, schoolName: true } },
          category: { select: { weightKg: true } },
        },
      },
    },
  });
}

export async function getBalancesForCategoryBreakdown() {
  return prisma.inventoryBalance.findMany({
    where: {
      quantity: { gt: 0 },
      itemStatus: { in: CORE_GROUP_STATUSES },
    },
    select: {
      quantity: true,
      itemStatus: true,
      storedAt: true,
      itemType: {
        select: {
          category: {
            select: { id: true, categoryName: true, weightKg: true },
          },
        },
      },
    },
  });
}

export function aggregateSchoolInventory(items, { isAdmin = false } = {}) {
  const itemMap = {};

  for (const balance of items) {
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

  return Object.values(itemMap)
    .map((item) => ({
      ...item,
      sizes: Object.values(item.sizes).sort((a, b) => a.sortOrder - b.sortOrder),
      estimatedWeightKg: Number((item.totalPieces * item.weightKg).toFixed(3)),
    }))
    .sort((a, b) => a.categoryName.localeCompare(b.categoryName));
}