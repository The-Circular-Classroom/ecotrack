// apps/backend/models/transactionService.js
const prisma = require('../services/database/prismaClient');
const { incrementBalance, decrementBalance } = require('./inventoryService');
const {
  STATUS_LABELS,
  LOCATION_LABELS,
  TRANSACTION_TYPE_LABELS,
  USER_ROLE_LABELS,
  formatEnum,
} = require('../utils/formatters');

// ─── HELPERS ───────────────────────────────────────────────────────

function addLabels(txn) {
  if (!txn) return null;
  return {
    ...txn,
    fromStoredAtLabel: formatEnum(txn.fromStoredAt, LOCATION_LABELS),
    toStoredAtLabel: formatEnum(txn.toStoredAt, LOCATION_LABELS),
    fromStatusLabel: formatEnum(txn.fromStatus, STATUS_LABELS),
    toStatusLabel: formatEnum(txn.toStatus, STATUS_LABELS),
    transactionTypeLabel: formatEnum(txn.transactionType, TRANSACTION_TYPE_LABELS),
    userRoleLabel: formatEnum(txn.user?.role, USER_ROLE_LABELS),
  };
}

const listInclude = {
  itemType: {
    include: {
      category: true,
      primaryColour: true,
      school: true,
    },
  },
  sizeOption: true,
  donationDrive: true,
  user: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      role: true,
    },
  },
};

// ─── VALID STATUSES & TERMINAL STATES ──────────────────────────────

const VALID_STATUSES = ['GeneralOffice', 'ForSale', 'Sold', 'ForRepurpose', 'Repurposed', 'Disposed'];
const TERMINAL_STATUSES = ['Sold', 'Repurposed', 'Disposed'];

// ─── TRANSACTION STEP RESOLUTION ───────────────────────────────────

/**
 * Resolves a single user-facing action into one or more atomic transaction
 * steps. Handles:
 *   - Status + location change → StatusChange then Transfer
 *   - Indirect transitions    → e.g. ForRepurpose→Sold = StatusChange + Sale
 *
 * Returns an array of step objects, each with its own transaction_type,
 * from/to status, and from/to location.
 */
/**
 * Maps a from_status → to_status pair to the expected transaction type.
 * Returns { type, indirect } where indirect means it requires 2 steps.
 */
function getExpectedTransactionType(from_status, to_status) {
  // Direct transitions
  if (from_status === 'ForSale' && to_status === 'Sold') return { type: 'Sale', indirect: false };
  if (from_status === 'ForRepurpose' && to_status === 'Repurposed') return { type: 'Repurposing', indirect: false };
  if (to_status === 'Disposed') return { type: 'Disposal', indirect: false };
  if (from_status === 'ForSale' && to_status === 'ForRepurpose') return { type: 'StatusChange', indirect: false };
  if (from_status === 'ForRepurpose' && to_status === 'ForSale') return { type: 'StatusChange', indirect: false };
  if (from_status === 'ForSale' && to_status === 'GeneralOffice') return { type: 'StatusChange', indirect: false };
  if (from_status === 'GeneralOffice' && to_status === 'ForSale') return { type: 'StatusChange', indirect: false };
  if (from_status === 'ForRepurpose' && to_status === 'GeneralOffice') return { type: 'StatusChange', indirect: false };
  if (from_status === 'GeneralOffice' && to_status === 'ForRepurpose') return { type: 'StatusChange', indirect: false };

  // Indirect transitions
  if (from_status === 'ForRepurpose' && to_status === 'Sold') return { type: 'Sale', indirect: true, via: 'ForSale' };
  if (from_status === 'ForSale' && to_status === 'Repurposed') return { type: 'Repurposing', indirect: true, via: 'ForRepurpose' };
  if (from_status === 'GeneralOffice' && to_status === 'Sold') return { type: 'Sale', indirect: true, via: 'ForSale' };

  return null;
}

function resolveTransactionSteps(data) {
  const { from_status, to_status, from_stored_at, to_stored_at, transaction_type } = data;

  // DonationIn — no splitting, pass through directly
  if (transaction_type === 'DonationIn') {
    if (!to_status) throw new Error('DonationIn requires to_status');
    if (!to_stored_at) throw new Error('DonationIn requires to_stored_at');
    if (TERMINAL_STATUSES.includes(to_status)) {
      throw new Error(`Cannot donate directly into terminal status: ${to_status}`);
    }
    // DonationIn to GeneralOffice → split into DonationIn(ForSale) + StatusChange(GO)
    if (to_status === 'GeneralOffice') {
      return [
        { ...data, transaction_type: 'DonationIn', to_status: 'ForSale' },
        {
          ...data,
          transaction_type: 'StatusChange',
          from_status: 'ForSale',
          to_status: 'GeneralOffice',
          from_stored_at: data.to_stored_at,
        },
      ];
    }
    return [{ ...data, transaction_type: 'DonationIn' }];
  }

  // Validate from_status is not terminal
  if (TERMINAL_STATUSES.includes(from_status)) {
    throw new Error(`Cannot transition from terminal status: ${from_status}`);
  }

  // Validate statuses exist
  if (!VALID_STATUSES.includes(from_status)) {
    throw new Error(`Invalid from_status: ${from_status}`);
  }
  if (!VALID_STATUSES.includes(to_status)) {
    throw new Error(`Invalid to_status: ${to_status}`);
  }

  const statusChanged = from_status !== to_status;
  const locationChanged = from_stored_at && to_stored_at && from_stored_at !== to_stored_at;

  // Nothing changed
  if (!statusChanged && !locationChanged) {
    throw new Error('No status or location change detected');
  }

  // ── Validate transaction_type if provided (then auto-split regardless) ──
  if (transaction_type) {
    if (!statusChanged && locationChanged) {
      if (transaction_type !== 'Transfer') {
        throw new Error(
          `Invalid transaction type '${transaction_type}' for location-only change (${from_stored_at} → ${to_stored_at}). Expected: Transfer`
        );
      }
    }

    if (statusChanged) {
      const expected = getExpectedTransactionType(from_status, to_status);
      if (!expected) {
        throw new Error(`Invalid status transition: ${from_status} → ${to_status}`);
      }
      if (transaction_type !== expected.type) {
        throw new Error(
          `Invalid transaction type '${transaction_type}' for ${from_status} → ${to_status}. Expected: ${expected.type}`
        );
      }
    }
  }

  // ── Resolve steps ──

  // Location change only → Transfer
  if (!statusChanged && locationChanged) {
    return [{
      ...data,
      transaction_type: 'Transfer',
      to_status: from_status,
    }];
  }

  // Status change (with or without location change)
  const statusSteps = resolveStatusTransition(data);

  if (!locationChanged) {
    return statusSteps;
  }

  // Both status AND location changed → status steps at original location, then Transfer
  // But NOT if transitioning to a terminal status (no transfer needed after Sale/Disposal/Repurposing)
  if (TERMINAL_STATUSES.includes(to_status)) {
    // Terminal status — ignore user-provided to_stored_at, use the resolved steps as-is
    return statusSteps;
  }

  const statusStepsAtOrigin = resolveStatusTransition({
    ...data,
    to_stored_at: from_stored_at,
  });

  const transferStep = {
    ...data,
    transaction_type: 'Transfer',
    from_status: to_status,
    to_status: to_status,
    from_stored_at: from_stored_at,
    to_stored_at: to_stored_at,
  };

  return [...statusStepsAtOrigin, transferStep];
}

/**
 * Resolves a status-only transition into one or more steps.
 * Direct transitions produce 1 step; indirect transitions produce 2.
 *
 * Terminal status locations:
 *   - Sold:       to_stored_at = 'Exited' (item leaves system)
 *   - Disposed:   to_stored_at = 'Exited' (item leaves system)
 *   - Repurposed: to_stored_at = 'TCC' (always processed there)
 */
function resolveStatusTransition(data) {
  const { from_status, to_status } = data;

  // ── Direct transitions ──

  // ForSale → Sold
  if (from_status === 'ForSale' && to_status === 'Sold') {
    return [{
      ...data,
      transaction_type: 'Sale',
      to_stored_at: 'Exited',
    }];
  }

  // ForRepurpose → Repurposed
  if (from_status === 'ForRepurpose' && to_status === 'Repurposed') {
    return [{
      ...data,
      transaction_type: 'Repurposing',
      to_stored_at: 'TCC',
    }];
  }

  // Any → Disposed
  if (to_status === 'Disposed') {
    return [{
      ...data,
      transaction_type: 'Disposal',
      to_stored_at: 'Exited',
    }];
  }

  // ForSale ↔ ForRepurpose
  if (from_status === 'ForSale' && to_status === 'ForRepurpose') {
    return [{
      ...data,
      transaction_type: 'StatusChange',
      to_stored_at: data.to_stored_at || data.from_stored_at,
    }];
  }
  if (from_status === 'ForRepurpose' && to_status === 'ForSale') {
    return [{
      ...data,
      transaction_type: 'StatusChange',
      to_stored_at: data.to_stored_at || data.from_stored_at,
    }];
  }
  // ForSale ↔ GeneralOffice
  if (from_status === 'ForSale' && to_status === 'GeneralOffice') {
    return [{
      ...data,
      transaction_type: 'StatusChange',
      to_stored_at: data.to_stored_at || data.from_stored_at,
    }];
  }
  if (from_status === 'GeneralOffice' && to_status === 'ForSale') {
    return [{
      ...data,
      transaction_type: 'StatusChange',
      to_stored_at: data.to_stored_at || data.from_stored_at,
    }];
  }

  // ForRepurpose ↔ GeneralOffice
  if (from_status === 'ForRepurpose' && to_status === 'GeneralOffice') {
    return [{
      ...data,
      transaction_type: 'StatusChange',
      to_stored_at: data.to_stored_at || data.from_stored_at,
    }];
  }
  if (from_status === 'GeneralOffice' && to_status === 'ForRepurpose') {
    return [{
      ...data,
      transaction_type: 'StatusChange',
      to_stored_at: data.to_stored_at || data.from_stored_at,
    }];
  }

  // ── Indirect transitions ──

  // ForRepurpose → Sold = StatusChange(ForRepurpose→ForSale) + Sale(ForSale→Sold)
  if (from_status === 'ForRepurpose' && to_status === 'Sold') {
    return [
      {
        ...data,
        transaction_type: 'StatusChange',
        from_status: 'ForRepurpose',
        to_status: 'ForSale',
        to_stored_at: data.from_stored_at,
      },
      {
        ...data,
        transaction_type: 'Sale',
        from_status: 'ForSale',
        to_status: 'Sold',
        from_stored_at: data.from_stored_at,
        to_stored_at: 'Exited',
      },
    ];
  }

  // ForSale → Repurposed = StatusChange(ForSale→ForRepurpose) + Repurposing(ForRepurpose→Repurposed)
  if (from_status === 'ForSale' && to_status === 'Repurposed') {
    return [
      {
        ...data,
        transaction_type: 'StatusChange',
        from_status: 'ForSale',
        to_status: 'ForRepurpose',
        to_stored_at: data.from_stored_at,
      },
      {
        ...data,
        transaction_type: 'Repurposing',
        from_status: 'ForRepurpose',
        to_status: 'Repurposed',
        from_stored_at: data.from_stored_at,
        to_stored_at: 'TCC',
      },
    ];
  }
    // GeneralOffice → Sold = StatusChange(GO→ForSale) + Sale(ForSale→Sold)
  if (from_status === 'GeneralOffice' && to_status === 'Sold') {
    return [
      {
        ...data,
        transaction_type: 'StatusChange',
        from_status: 'GeneralOffice',
        to_status: 'ForSale',
        to_stored_at: data.from_stored_at,
      },
      {
        ...data,
        transaction_type: 'Sale',
        from_status: 'ForSale',
        to_status: 'Sold',
        from_stored_at: data.from_stored_at,
        to_stored_at: 'Exited',
      },
    ];
  }

  throw new Error(`Invalid status transition: ${from_status} → ${to_status}`);
}

// ─── INVENTORY EFFECT LOGIC ────────────────────────────────────────

/**
 * Applies inventory balance changes based on transaction type.
 * Must be called inside a prisma.$transaction block.
 *
 * At this point, each step has a clean, validated transaction_type
 * with matching from/to status and location — no ambiguity.
 *
 * Terminal status locations:
 *   - Sold:       stored_at = 'Exited'
 *   - Disposed:   stored_at = 'Exited'
 *   - Repurposed: stored_at = 'TCC'
 */
async function applyInventoryEffect(tx, data) {
  const { item_type_id, size_option_id, quantity } = data;
  const base = { item_type_id, size_option_id, quantity };

  switch (data.transaction_type) {
    case 'DonationIn': {
      await incrementBalance(
        { ...base, status: data.to_status, stored_at: data.to_stored_at },
        tx
      );
      break;
    }

    case 'Transfer': {
      await decrementBalance(
        { ...base, status: data.from_status, stored_at: data.from_stored_at },
        tx
      );
      await incrementBalance(
        { ...base, status: data.from_status, stored_at: data.to_stored_at },
        tx
      );
      break;
    }

    case 'StatusChange': {
      await decrementBalance(
        { ...base, status: data.from_status, stored_at: data.from_stored_at },
        tx
      );
      await incrementBalance(
        { ...base, status: data.to_status, stored_at: data.to_stored_at },
        tx
      );
      break;
    }

    case 'Sale': {
      await decrementBalance(
        { ...base, status: data.from_status, stored_at: data.from_stored_at },
        tx
      );
      await incrementBalance(
        { ...base, status: 'Sold', stored_at: 'Exited' },
        tx
      );
      break;
    }

    case 'Repurposing': {
      await decrementBalance(
        { ...base, status: data.from_status, stored_at: data.from_stored_at },
        tx
      );
      await incrementBalance(
        { ...base, status: 'Repurposed', stored_at: 'TCC' },
        tx
      );
      break;
    }

    case 'Disposal': {
      await decrementBalance(
        { ...base, status: data.from_status, stored_at: data.from_stored_at },
        tx
      );
      await incrementBalance(
        { ...base, status: 'Disposed', stored_at: 'Exited' },
        tx
      );
      break;
    }

    default:
      throw new Error(`Unknown transaction type: ${data.transaction_type}`);
  }
}

// ─── CREATE (atomic: transaction + inventory) ──────────────────────

/**
 * Creates one or more transactions atomically.
 *
 * The service resolves the caller's intent into concrete transaction steps
 * (splitting status+location changes, handling indirect transitions), then
 * creates all records and applies all inventory effects inside a single
 * prisma.$transaction block.
 *
 * Always returns an array of labelled transaction objects.
 */
async function createTransaction({
  from_stored_at,
  to_stored_at,
  from_status,
  to_status,
  quantity,
  transaction_type,
  remarks,
  item_type_id,
  size_option_id,
  donation_drive_id,
  user_id,
}) {
  // Resolve into one or more steps (validates transitions)
  const steps = resolveTransactionSteps({
    from_stored_at,
    to_stored_at,
    from_status,
    to_status,
    quantity,
    transaction_type,
    remarks,
    item_type_id,
    size_option_id,
    donation_drive_id,
    user_id,
  });

  const results = await prisma.$transaction(async (tx) => {
    const created = [];

    for (const step of steps) {
      // 1. Create the transaction record
      const txn = await tx.transaction.create({
        data: {
          fromStoredAt: step.from_stored_at,
          toStoredAt: step.to_stored_at,
          fromStatus: step.from_status,
          toStatus: step.to_status,
          quantity: step.quantity,
          transactionType: step.transaction_type,
          remarks: step.remarks,
          itemTypeId: step.item_type_id,
          sizeOptionId: step.size_option_id,
          donationDriveId: step.donation_drive_id,
          userId: step.user_id,
        },
        include: listInclude,
      });

      // 2. Apply inventory balance changes
      await applyInventoryEffect(tx, step);

      created.push(txn);
    }

    return created;
  });

  return results.map(addLabels);
}

// ─── READ ──────────────────────────────────────────────────────────


const transactionSelect = {
  id: true,
  fromStoredAt: true,
  toStoredAt: true,
  fromStatus: true,
  toStatus: true,
  quantity: true,
  transactionType: true,
  transactionDate: true,
  remarks: true,
  itemType: {
    select: {
      id: true,
      gender: true,
      imageUrl: true,
      category: { select: { id: true, categoryName: true } },
      primaryColour: { select: { id: true, colourName: true, hexcode: true } },
      school: { select: { id: true, schoolName: true } },
    },
  },
  sizeOption: {
    select: { id: true, sizeName: true, sortOrder: true },
  },
  donationDrive: {
    select: { id: true, driveName: true },
  },
  user: {
    select: { id: true, firstName: true, lastName: true, role: true},
  },
};

async function getAllTransactions(page = 1, limit = 100) {
  const skip = (page - 1) * limit;

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      select: transactionSelect,
      orderBy: { transactionDate: 'desc' },
      skip,
      take: limit,
    }),
    prisma.transaction.count(),
  ]);

  return {
    data: transactions.map(addLabels),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

async function getTransactionById(id) {
  const txn = await prisma.transaction.findUnique({
    where: { id: parseInt(id) },
    include: listInclude,
  });
  return addLabels(txn);
}

async function getTransactionsByDonationDrive(donationDriveId) {
  const transactions = await prisma.transaction.findMany({
    where: { donationDriveId: parseInt(donationDriveId) },
    include: listInclude,
  });
  return transactions.map(addLabels);
}

async function getTransactionsByType(transactionType) {
  const transactions = await prisma.transaction.findMany({
    where: { transactionType },
    include: listInclude,
  });
  return transactions.map(addLabels);
}

async function getTransactionsByDateRange(startDate, endDate) {
  const transactions = await prisma.transaction.findMany({
    where: {
      transactionDate: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
    },
    include: listInclude,
  });
  return transactions.map(addLabels);
}

module.exports = {
  createTransaction,
  getAllTransactions,
  getTransactionById,
  getTransactionsByDonationDrive,
  getTransactionsByType,
  getTransactionsByDateRange,
};