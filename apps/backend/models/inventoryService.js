// apps/backend/models/inventoryService.js
const prisma = require("../services/database/prismaClient");

const {
  STATUS_LABELS,
  LOCATION_LABELS,
  formatEnum,
} = require('../utils/formatters');

function addLabels(item) {
  if (!item) return null;
  return {
    ...item,
    itemStatusLabel: formatEnum(item.itemStatus, STATUS_LABELS),
    storedAtLabel: formatEnum(item.storedAt, LOCATION_LABELS),
  };
}

// ─── READ ──────────────────────────────────────────────────────────

// GET -- Get all inventory items with quantity > 0 (including ForSale, ForRepurpose, and GeneralOffice statuses)
async function getAllInventoryItems() {
  const items = await prisma.inventoryBalance.findMany({
    where: {
      quantity: { gt: 0 },
      itemStatus: { in: ['ForSale', 'ForRepurpose', 'GeneralOffice'] }
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
  return items.map(addLabels);
}

// GET -- Get inventory balance(s) by item type ID and optionally by size option
async function getInventoryBalance(item_type_id, size_option_id = null) {
  const where = {
    itemTypeId: item_type_id
  };

  if (size_option_id !== null && size_option_id !== undefined) {
    where.sizeOptionId = size_option_id;
  }

  const items = await prisma.inventoryBalance.findMany({
    where,
    include: {
      itemType: {
        include: {
          category: true,
          primaryColour: true,
        },
      },
      sizeOption: true,
    },
  });
  return items.map(addLabels);
}

// ─── WRITE (used inside prisma.$transaction) ───────────────────────

/**
 * Upsert-increment an inventory balance row.
 * Creates the row if first occurrence of that combo, otherwise increments.
 * @param {object} params
 * @param {object} [tx=prisma] - Prisma client or transaction client
 */
async function incrementBalance(
  { item_type_id, size_option_id, quantity, status, stored_at },
  tx = prisma
) {
  return tx.inventoryBalance.upsert({
    where: {
      itemTypeId_sizeOptionId_itemStatus_storedAt: {
        itemTypeId: item_type_id,
        sizeOptionId: size_option_id,
        itemStatus: status,
        storedAt: stored_at,
      },
    },
    update: {
      quantity: { increment: quantity },
    },
    create: {
      itemTypeId: item_type_id,
      sizeOptionId: size_option_id,
      itemStatus: status,
      storedAt: stored_at,
      quantity,
    },
  });
}

/**
 * Decrement an inventory balance row.
 * Throws if the row doesn't exist or quantity would go below 0.
 * @param {object} params
 * @param {object} [tx=prisma] - Prisma client or transaction client
 */
async function decrementBalance(
  { item_type_id, size_option_id, quantity, status, stored_at },
  tx = prisma
) {
  // Find the existing balance
  const existing = await tx.inventoryBalance.findUnique({
    where: {
      itemTypeId_sizeOptionId_itemStatus_storedAt: {
        itemTypeId: item_type_id,
        sizeOptionId: size_option_id,
        itemStatus: status,
        storedAt: stored_at,
      },
    },
  });

  if (!existing) {
    throw new Error(
      `No inventory balance found for itemType=${item_type_id}, size=${size_option_id}, status=${status}, location=${stored_at}`
    );
  }

  if (existing.quantity < quantity) {
    throw new Error(
      `Insufficient inventory: have ${existing.quantity}, tried to remove ${quantity} ` +
      `(itemType=${item_type_id}, size=${size_option_id}, status=${status}, location=${stored_at})`
    );
  }

  return tx.inventoryBalance.update({
    where: { id: existing.id },
    data: {
      quantity: { decrement: quantity },
    },
  });
}

// DELETE -- Delete inventory balances by preset item type (used when item type is deleted to clean up related inventory balances)
async function deleteInventoryBalancesByPreset(item_type_id) {
  return prisma.inventoryBalance.deleteMany({
    where: {
      itemTypeId: item_type_id
    }
  });
}

module.exports = {
  getAllInventoryItems,
  getInventoryBalance,
  incrementBalance,
  decrementBalance,
  deleteInventoryBalancesByPreset,
};