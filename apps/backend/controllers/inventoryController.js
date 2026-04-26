// apps/backend/controllers/inventoryController.js
const prisma = require("../services/database/prismaClient");
const inventoryService = require("../models/inventoryService");
const transactionService = require("../models/transactionService");
const userService = require("../models/userService");

function getGroups(req) {
  const raw = req.user?.["cognito:groups"];
  if (!raw) return [];
  return Array.isArray(raw) ? raw : [String(raw)];
}

function isTccAdmin(req) {
  const groups = getGroups(req);
  return groups.includes("TCCAdministrators") || groups.includes("TCCAdminstrators");
}

async function getRequestingUserSchoolId(req) {
  const cognitoSub = req.user?.sub;
  if (!cognitoSub) return null;
  const dbUser = await userService.findUserByCognitoSub(cognitoSub);
  return dbUser?.schoolId ?? null;
}

const getAllInventoryItems = async (req, res) => {
  try {
    if (!isTccAdmin(req)) {
      const schoolId = await getRequestingUserSchoolId(req);
      if (!schoolId) {
        return res.status(403).json({
          success: false,
          message: "User has no school",
        });
      }

      const inventory = await prisma.inventoryBalance.findMany({
        where: {
          quantity: { gt: 0 },
          itemStatus: { in: ["ForSale", "ForRepurpose"] },
          itemType: { schoolId },
        },
        include: {
          itemType: {
            include: {
              category: true,
              primaryColour: true,
              school: true,
            },
          },
          sizeOption: true,
        },
      });

      return res.status(200).json({
        success: true,
        data: inventory,
      });
    }

    const inventory = await inventoryService.getAllInventoryItems();

    return res.status(200).json({
      success: true,
      data: inventory,
    });
  } catch (error) {
    console.error("Error fetching inventory items:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching inventory items",
      error: error.message,
    });
  }
};

const getInventoryBalances = async (req, res) => {
  try {
    const storedAt = req.query.storedAt;
    const itemStatus = req.query.itemStatus;

    const itemTypeId = req.query.itemTypeId ? Number(req.query.itemTypeId) : null;

    const gender = req.query.gender
      ? req.query.gender.charAt(0).toUpperCase() + req.query.gender.slice(1).toLowerCase()
      : null;

    let schoolId = req.query.schoolId ? Number(req.query.schoolId) : null;

    if (!isTccAdmin(req)) {
      const enforcedSchoolId = await getRequestingUserSchoolId(req);
      if (!enforcedSchoolId) {
        return res.status(403).json({
          success: false,
          message: "User has no school",
        });
      }
      schoolId = enforcedSchoolId;
    }

    const categoryId = req.query.categoryId ? Number(req.query.categoryId) : null;
    const primaryColourId = req.query.primaryColourId ? Number(req.query.primaryColourId) : null;
    const secondaryColourId = req.query.secondaryColourId ? Number(req.query.secondaryColourId) : null;
    const patternId = req.query.patternId ? Number(req.query.patternId) : null;
    const materialId = req.query.materialId ? Number(req.query.materialId) : null;
    const sizeCategoryId = req.query.sizeCategoryId ? Number(req.query.sizeCategoryId) : null;

    const itemTypeFilter = {};
    if (gender) itemTypeFilter.gender = gender;
    if (schoolId) itemTypeFilter.schoolId = schoolId;
    if (categoryId) itemTypeFilter.categoryId = categoryId;
    if (primaryColourId) itemTypeFilter.primaryColourId = primaryColourId;
    if (secondaryColourId) itemTypeFilter.secondaryColourId = secondaryColourId;
    if (patternId) itemTypeFilter.patternId = patternId;
    if (materialId) itemTypeFilter.materialId = materialId;
    if (sizeCategoryId) itemTypeFilter.sizeCategoryId = sizeCategoryId;

    const whereClause = {
      quantity: { gt: 0 },
      ...(storedAt ? { storedAt } : {}),
      ...(itemStatus ? { itemStatus } : {}),
      ...(itemTypeId ? { itemTypeId } : {}),
      ...(Object.keys(itemTypeFilter).length > 0 ? { itemType: itemTypeFilter } : {}),
    };

    const balances = await prisma.inventoryBalance.findMany({
      where: whereClause,
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
      orderBy: [{ itemTypeId: "asc" }, { sizeOption: { sortOrder: "asc" } }],
    });
    

    return res.json({
      count: balances.length,
      filters: {
        storedAt: storedAt || "all",
        itemStatus: itemStatus || "all",
        itemType: Object.keys(itemTypeFilter).length > 0 ? itemTypeFilter : "all",
      },
      data: balances,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to load inventory balances" });
  }
};

const listSchoolInventory = async (req, res) => {
  try {
    const requestedSchoolId = Number(req.params.schoolId);

    let schoolId = requestedSchoolId;
    if (!isTccAdmin(req)) {
      const enforcedSchoolId = await getRequestingUserSchoolId(req);
      if (!enforcedSchoolId) {
        return res.status(403).json({
          success: false,
          message: "User has no school",
        });
      }
      if (requestedSchoolId !== enforcedSchoolId) {
        return res.status(403).json({
          success: false,
          message: "Forbidden: cannot access another school's inventory",
        });
      }
      schoolId = enforcedSchoolId;
    }

    const storedAt = req.query.storedAt;
    const itemStatus = req.query.itemStatus;

    const categoryNames = req.query.categoryNames
      ? String(req.query.categoryNames).split(",").map((s) => s.trim()).filter(Boolean)
      : null;

    const rows = await prisma.inventoryBalance.findMany({
      where: {
        quantity: { gt: 0 },
        ...(storedAt ? { storedAt } : {}),
        ...(itemStatus ? { itemStatus } : {}),
        itemType: {
          schoolId,
          ...(categoryNames ? { category: { categoryName: { in: categoryNames } } } : {}),
        },
      },
      include: {
        itemType: {
          include: {
            category: true,
            primaryColour: true,
            secondaryColour: true,
            pattern: true,
            material: true,
            sizeCategory: true,
          },
        },
        sizeOption: true,
      },
      orderBy: [{ itemTypeId: "asc" }, { sizeOption: { sortOrder: "asc" } }],
    });

    const grouped = new Map();
    for (const r of rows) {
      if (!grouped.has(r.itemTypeId)) {
        grouped.set(r.itemTypeId, {
          itemTypeId: r.itemTypeId,
          itemType: r.itemType,
          totalQty: 0,
          balances: [],
        });
      }
      const entry = grouped.get(r.itemTypeId);
      entry.totalQty += r.quantity;
      entry.balances.push({
        inventoryBalanceId: r.id,
        itemStatus: r.itemStatus,
        storedAt: r.storedAt,
        sizeOption: r.sizeOption,
        quantity: r.quantity,
        lastUpdated: r.lastUpdated,
      });
    }

    const itemCategories = Array.from(
      new Set(Array.from(grouped.values()).map((x) => x.itemType.category.categoryName))
    );

    return res.status(200).json({
      success: true,
      message: "School inventory loaded successfully",
      schoolId,
      itemCategories,
      countItemTypes: grouped.size,
      items: Array.from(grouped.values()),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Failed to load school inventory",
      error: err.message,
    });
  }
};

/**
 * PATCH /api/inventory/update-item-condition
 *
 * Accepts an array of items to update. For each item, calls createTransaction
 * which handles validation, auto-splitting, and inventory effects atomically.
 *
 * The service infers the correct transaction type(s) from the status transition,
 * so this controller only needs to pass from/to status and location.
 */
const updateInventoryItemCondition = async (req, res) => {
  try {
    const { itemsToUpdate } = req.body;

    if (!Array.isArray(itemsToUpdate) || itemsToUpdate.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No items to update",
      });
    }

    // Derive user_id from access token
    const cognitoSub = req.user?.sub;
    if (!cognitoSub) {
      return res.status(401).json({ success: false, message: "Missing token subject" });
    }

    const user_id = await userService.getUserIdByCognitoSub(cognitoSub);
    if (!user_id) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // ── Validate all items before processing any ──
    for (const item of itemsToUpdate) {
      const {
        item_type_id,
        from_status,
        to_status,
        from_quantity,
        remove_quantity,
        size_option_id,
      } = item;

      if (
        item_type_id == null ||
        from_status == null ||
        to_status == null ||
        from_quantity == null ||
        remove_quantity == null ||
        size_option_id == null
      ) {
        return res.status(400).json({
          success: false,
          message: "Missing required field(s).",
        });
      }

      if (
        typeof from_status !== 'string' || from_status.trim() === '' ||
        typeof to_status !== 'string' || to_status.trim() === ''
      ) {
        return res.status(400).json({
          success: false,
          message: "Status must be non-empty strings.",
        });
      }

      const fromQty = parseInt(from_quantity, 10);
      const removeQty = parseInt(remove_quantity, 10);

      if (Number.isNaN(fromQty) || Number.isNaN(removeQty) || fromQty < 0 || removeQty < 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid quantity values provided for inventory update",
        });
      }

      if (fromQty - removeQty < 0) {
        return res.status(400).json({
          success: false,
          message: "Cannot remove more items than available in inventory",
        });
      }
    }

    // ── Process each item by creating a transaction ──
    // The service infers transaction type and handles auto-splitting
    const results = [];

    for (const item of itemsToUpdate) {
      const {
        item_type_id,
        from_status,
        to_status,
        remove_quantity,
        remarks,
        size_option_id,
        from_stored_at,
        stored_at,
      } = item;

      const removeQty = parseInt(remove_quantity, 10);

      // Let the service infer transaction_type from the status transition.
      // Pass transaction_type as null — resolveTransactionSteps handles inference.
      const transactions = await transactionService.createTransaction({
        from_stored_at: from_stored_at || null,
        to_stored_at: stored_at || from_stored_at || null,
        from_status,
        to_status,
        quantity: removeQty,
        transaction_type: null,
        remarks,
        item_type_id,
        size_option_id,
        user_id,
      });

      results.push({ transactions });
    }

    return res.status(200).json({
      success: true,
      message: 'Items updated successfully',
      data: results,
    });
  } catch (error) {
    console.error('Error updating inventory items:', error);

    const isValidationError =
      error.message.includes('Insufficient inventory') ||
      error.message.includes('No inventory balance found') ||
      error.message.includes('Invalid status transition') ||
      error.message.includes('Cannot transition from terminal status') ||
      error.message.includes('No status or location change');

    return res.status(isValidationError ? 400 : 500).json({
      success: false,
      message: isValidationError ? error.message : 'Error updating inventory items',
      error: error.message,
    });
  }
};

module.exports = {
  getAllInventoryItems,
  listSchoolInventory,
  getInventoryBalances,
  updateInventoryItemCondition,
};