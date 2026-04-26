// apps/backend/models/itemTypeService.js
const prisma = require("../services/database/prismaClient");

async function createItemType(data) {
  // required: schoolId, categoryId, primaryColourId, sizeCategoryId
  return prisma.itemType.create({
    data: {
      gender: data.gender ?? null,
      imageUrl: data.imageUrl ?? null,

      school: { connect: { id: data.schoolId } },
      category: { connect: { id: data.categoryId } },
      primaryColour: { connect: { id: data.primaryColourId } },
      sizeCategory: { connect: { id: data.sizeCategoryId } },

      ...(data.secondaryColourId
        ? { secondaryColour: { connect: { id: data.secondaryColourId } } }
        : { secondaryColour: undefined }),

      ...(data.patternId
        ? { pattern: { connect: { id: data.patternId } } }
        : { pattern: undefined }),

      ...(data.materialId
        ? { material: { connect: { id: data.materialId } } }
        : { material: undefined }),
    },
    include: {
      school: true,
      category: true,
      primaryColour: true,
      secondaryColour: true,
      pattern: true,
      material: true,
      sizeCategory: { include: { sizeOptions: true } },
      itemTypeTags: { include: { tag: true } },
    },
  });
}

// GET -- basic item type info with related entities
async function getAllItemTypes() {
  return prisma.itemType.findMany({
    include: {
      school: { select: { schoolName: true } },
      category: { select: { categoryName: true } },
      material: { select: { materialName: true } },
      primaryColour: { select: { colourName: true, hexcode: true } },
      sizeCategory: { include: { brandSupplier: { select: { brandSupplier: true } } } },
      inventoryBalance: {
        take: 1, // only need one to get brand
        include: {
          sizeOption: {
            include: {
              sizeCategory: {
                include: { brandSupplier: { select: { brandSupplier: true } } }
              }
            }
          }
        }
      }
    },
    orderBy: { school: { schoolName: 'asc' } },
  });
}

// GET -- count for pagination
async function getAllItemTypesCount() {
  return prisma.itemType.count();
}

async function getItemTypeById(id) {
  return prisma.itemType.findUnique({
    where: { id },
    include: {
      school: true,
      category: true,
      primaryColour: true,
      secondaryColour: true,
      pattern: true,
      material: true,
      sizeCategory: { include: { sizeOptions: true } },
      itemTypeTags: { include: { tag: true } },
    },
  });
}

/**
 * Get item types by school ID with category, colour, pattern, material, and inventory balances (with size).
 * Optional filters and pagination to limit payload and improve performance.
 * @param {number} schoolId
 * @param {Object} [options]
 * @param {number} [options.page=1]
 * @param {number} [options.pageSize=50]
 * @param {number} [options.categoryId] - filter item types by category
 * @param {string} [options.itemStatus] - filter inventory balances (e.g. ForSale, Sold)
 * @param {string} [options.storedAt] - filter inventory balances (e.g. School, TCC)
 */
async function getItemTypeBySchoolId(schoolId, options = {}) {
  const { page = 1, pageSize = 50, categoryId, itemStatus, storedAt } = options;
  const skip = (Math.max(1, page) - 1) * Math.min(100, Math.max(1, pageSize));
  const take = Math.min(100, Math.max(1, pageSize));

  const where = { schoolId, ...(categoryId != null ? { categoryId } : {}) };
  const inventoryBalanceWhere =
    itemStatus != null || storedAt != null
      ? { ...(itemStatus != null ? { itemStatus } : {}), ...(storedAt != null ? { storedAt } : {}) }
      : undefined;

  return prisma.itemType.findMany({
    where,
    skip,
    take,
    include: {
      school: { select: { schoolName: true } },
      category: { select: { categoryName: true } },
      primaryColour: { select: { colourName: true, hexcode: true } },
      secondaryColour: { select: { colourName: true, hexcode: true } },
      pattern: { select: { patternName: true } },
      material: { select: { materialName: true } },
      inventoryBalance: {
        ...(inventoryBalanceWhere ? { where: inventoryBalanceWhere } : {}),
        include: { sizeOption: { select: { sizeName: true, sortOrder: true, sizeCategory: { select: { brandSupplier: { select: { brandSupplier: true } } } } } } },
      },
    },
  });
}

/** Get total count of item types for a school (for pagination). Optional categoryId filter. */
async function getItemTypeCountBySchoolId(schoolId, categoryId = null) {
  return prisma.itemType.count({
    where: { schoolId, ...(categoryId != null ? { categoryId } : {}) },
  });
}

async function listItemTypes({ schoolId, categoryId, gender, q, page = 1, pageSize = 20 }) {
  const where = {
    ...(schoolId ? { schoolId } : {}),
    ...(categoryId ? { categoryId } : {}),
    ...(gender ? { gender } : {}),
    // optional search across related names (keep lightweight)
    ...(q
      ? {
        OR: [
          { category: { is: { categoryName: { equals: q } } } },
          { school: { is: { schoolName: { contains: q, mode: "insensitive" } } } },
        ],
      }
      : {}),
  };

  const skip = (page - 1) * pageSize;

  const [items, total] = await Promise.all([
    prisma.itemType.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { id: "desc" },
      include: {
        gender: true,
        imageUrl: true,
        category: true,
        primaryColour: true,
        secondaryColour: true,
        pattern: true,
        material: true,
        sizeCategory: true,
      },
    }),
    prisma.itemType.count({ where }),
  ]);

  return { items, total, page, pageSize };
}

async function updateItemType(id, data) {
  // Connect/disconnect patterns:
  // - if field omitted => no change
  // - if field set to null => disconnect (only for optional relations)
  const patch = {
    ...(data.gender !== undefined ? { gender: data.gender } : {}),
    ...(data.imageUrl !== undefined ? { imageUrl: data.imageUrl } : {}),

    ...(data.schoolId ? { school: { connect: { id: data.schoolId } } } : {}),
    ...(data.categoryId ? { category: { connect: { id: data.categoryId } } } : {}),
    ...(data.primaryColourId ? { primaryColour: { connect: { id: data.primaryColourId } } } : {}),
    ...(data.sizeCategoryId ? { sizeCategory: { connect: { id: data.sizeCategoryId } } } : {}),

    ...(data.secondaryColourId === null
      ? { secondaryColour: { disconnect: true } }
      : data.secondaryColourId
        ? { secondaryColour: { connect: { id: data.secondaryColourId } } }
        : {}),

    ...(data.patternId === null
      ? { pattern: { disconnect: true } }
      : data.patternId
        ? { pattern: { connect: { id: data.patternId } } }
        : {}),

    ...(data.materialId === null
      ? { material: { disconnect: true } }
      : data.materialId
        ? { material: { connect: { id: data.materialId } } }
        : {}),
  };

  return prisma.itemType.update({
    where: { id },
    data: patch,
    include: {
      school: true,
      category: true,
      primaryColour: true,
      secondaryColour: true,
      pattern: true,
      material: true,
      sizeCategory: true,
    },
  });
}

async function deleteItemType(id) {
  // NOTE: itemType is referenced by Transaction and InventoryBalance with onDelete: Restrict
  // so delete will fail if there are dependent records.
  return prisma.itemType.delete({ where: { id } });
}

/**
 * Fetch all item types for a school (no pagination) with the minimal includes
 * needed to generate a donation CSV template.
 * @param {number} schoolId
 * @returns {Promise<Array>}
 */
async function getAllItemTypesBySchoolIdForCSV(schoolId) {
  return prisma.itemType.findMany({
    where: { schoolId },
    orderBy: [{ id: 'asc' }],
    include: {
      category: { select: { categoryName: true } },
      primaryColour: { select: { colourName: true } },
      sizeCategory: {
        include: {
          sizeOptions: {
            orderBy: { sortOrder: 'asc' },
          },
        },
      },
    },
  });
}

module.exports = {
  createItemType,
  getAllItemTypes,
  getAllItemTypesCount,
  getItemTypeById,
  getItemTypeBySchoolId,
  getItemTypeCountBySchoolId,
  listItemTypes,
  updateItemType,
  deleteItemType,
  getAllItemTypesBySchoolIdForCSV,
};
