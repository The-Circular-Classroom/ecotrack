import { prisma } from '@/lib/prisma';

function addLabels(txn) {
  if (!txn) {
    return null;
  }

  return {
    ...txn,
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

const VALID_STATUSES = ['GeneralOffice', 'ForSale', 'Sold', 'ForRepurpose', 'Repurposed', 'Disposed'];
const TERMINAL_STATUSES = ['Sold', 'Repurposed', 'Disposed'];

function getExpectedTransactionType(fromStatus, toStatus) {
  if (fromStatus === 'ForSale' && toStatus === 'Sold') return { type: 'Sale', indirect: false };
  if (fromStatus === 'ForRepurpose' && toStatus === 'Repurposed') return { type: 'Repurposing', indirect: false };
  if (toStatus === 'Disposed') return { type: 'Disposal', indirect: false };
  if (fromStatus === 'ForSale' && toStatus === 'ForRepurpose') return { type: 'StatusChange', indirect: false };
  if (fromStatus === 'ForRepurpose' && toStatus === 'ForSale') return { type: 'StatusChange', indirect: false };
  if (fromStatus === 'ForSale' && toStatus === 'GeneralOffice') return { type: 'StatusChange', indirect: false };
  if (fromStatus === 'GeneralOffice' && toStatus === 'ForSale') return { type: 'StatusChange', indirect: false };
  if (fromStatus === 'ForRepurpose' && toStatus === 'GeneralOffice') return { type: 'StatusChange', indirect: false };
  if (fromStatus === 'GeneralOffice' && toStatus === 'ForRepurpose') return { type: 'StatusChange', indirect: false };
  if (fromStatus === 'ForRepurpose' && toStatus === 'Sold') return { type: 'Sale', indirect: true, via: 'ForSale' };
  if (fromStatus === 'ForSale' && toStatus === 'Repurposed') return { type: 'Repurposing', indirect: true, via: 'ForRepurpose' };
  if (fromStatus === 'GeneralOffice' && toStatus === 'Sold') return { type: 'Sale', indirect: true, via: 'ForSale' };
  return null;
}

function resolveStatusTransition(data) {
  const { from_status, to_status } = data;

  if (from_status === 'ForSale' && to_status === 'Sold') {
    return [{ ...data, transaction_type: 'Sale', to_stored_at: 'Exited' }];
  }

  if (from_status === 'ForRepurpose' && to_status === 'Repurposed') {
    return [{ ...data, transaction_type: 'Repurposing', to_stored_at: 'TCC' }];
  }

  if (to_status === 'Disposed') {
    return [{ ...data, transaction_type: 'Disposal', to_stored_at: 'Exited' }];
  }

  if (from_status === 'ForSale' && to_status === 'ForRepurpose') {
    return [{ ...data, transaction_type: 'StatusChange', to_stored_at: data.to_stored_at || data.from_stored_at }];
  }

  if (from_status === 'ForRepurpose' && to_status === 'ForSale') {
    return [{ ...data, transaction_type: 'StatusChange', to_stored_at: data.to_stored_at || data.from_stored_at }];
  }

  if (from_status === 'ForSale' && to_status === 'GeneralOffice') {
    return [{ ...data, transaction_type: 'StatusChange', to_stored_at: data.to_stored_at || data.from_stored_at }];
  }

  if (from_status === 'GeneralOffice' && to_status === 'ForSale') {
    return [{ ...data, transaction_type: 'StatusChange', to_stored_at: data.to_stored_at || data.from_stored_at }];
  }

  if (from_status === 'ForRepurpose' && to_status === 'GeneralOffice') {
    return [{ ...data, transaction_type: 'StatusChange', to_stored_at: data.to_stored_at || data.from_stored_at }];
  }

  if (from_status === 'GeneralOffice' && to_status === 'ForRepurpose') {
    return [{ ...data, transaction_type: 'StatusChange', to_stored_at: data.to_stored_at || data.from_stored_at }];
  }

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

function resolveTransactionSteps(data) {
  const { from_status, to_status, from_stored_at, to_stored_at, transaction_type } = data;

  if (transaction_type === 'DonationIn') {
    if (!to_status) throw new Error('DonationIn requires to_status');
    if (!to_stored_at) throw new Error('DonationIn requires to_stored_at');
    if (TERMINAL_STATUSES.includes(to_status)) {
      throw new Error(`Cannot donate directly into terminal status: ${to_status}`);
    }
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

  if (TERMINAL_STATUSES.includes(from_status)) {
    throw new Error(`Cannot transition from terminal status: ${from_status}`);
  }

  if (!VALID_STATUSES.includes(from_status)) {
    throw new Error(`Invalid from_status: ${from_status}`);
  }
  if (!VALID_STATUSES.includes(to_status)) {
    throw new Error(`Invalid to_status: ${to_status}`);
  }

  const statusChanged = from_status !== to_status;
  const locationChanged = from_stored_at && to_stored_at && from_stored_at !== to_stored_at;

  if (!statusChanged && !locationChanged) {
    throw new Error('No status or location change detected');
  }

  if (transaction_type) {
    if (!statusChanged && locationChanged && transaction_type !== 'Transfer') {
      throw new Error(
        `Invalid transaction type '${transaction_type}' for location-only change (${from_stored_at} → ${to_stored_at}). Expected: Transfer`
      );
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

  if (!statusChanged && locationChanged) {
    return [{ ...data, transaction_type: 'Transfer', to_status: from_status }];
  }

  const statusSteps = resolveStatusTransition(data);

  if (!locationChanged) {
    return statusSteps;
  }

  if (TERMINAL_STATUSES.includes(to_status)) {
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

async function applyInventoryEffect(tx, data) {
  const { item_type_id, size_option_id, quantity } = data;
  const base = { item_type_id, size_option_id, quantity };

  switch (data.transaction_type) {
    case 'DonationIn':
      await tx.inventoryBalance.upsert({
        where: {
          itemTypeId_sizeOptionId_itemStatus_storedAt: {
            itemTypeId: item_type_id,
            sizeOptionId: size_option_id,
            itemStatus: data.to_status,
            storedAt: data.to_stored_at,
          },
        },
        update: { quantity: { increment: quantity } },
        create: {
          itemTypeId: item_type_id,
          sizeOptionId: size_option_id,
          itemStatus: data.to_status,
          storedAt: data.to_stored_at,
          quantity,
        },
      });
      break;
    case 'Transfer':
      await tx.inventoryBalance.upsert({
        where: {
          itemTypeId_sizeOptionId_itemStatus_storedAt: {
            itemTypeId: item_type_id,
            sizeOptionId: size_option_id,
            itemStatus: data.from_status,
            storedAt: data.from_stored_at,
          },
        },
        update: { quantity: { decrement: quantity } },
        create: {
          itemTypeId: item_type_id,
          sizeOptionId: size_option_id,
          itemStatus: data.from_status,
          storedAt: data.from_stored_at,
          quantity: 0,
        },
      });
      await tx.inventoryBalance.upsert({
        where: {
          itemTypeId_sizeOptionId_itemStatus_storedAt: {
            itemTypeId: item_type_id,
            sizeOptionId: size_option_id,
            itemStatus: data.from_status,
            storedAt: data.to_stored_at,
          },
        },
        update: { quantity: { increment: quantity } },
        create: {
          itemTypeId: item_type_id,
          sizeOptionId: size_option_id,
          itemStatus: data.from_status,
          storedAt: data.to_stored_at,
          quantity,
        },
      });
      break;
    case 'StatusChange':
      await tx.inventoryBalance.update({
        where: {
          itemTypeId_sizeOptionId_itemStatus_storedAt: {
            itemTypeId: item_type_id,
            sizeOptionId: size_option_id,
            itemStatus: data.from_status,
            storedAt: data.from_stored_at,
          },
        },
        data: { quantity: { decrement: quantity } },
      });
      await tx.inventoryBalance.upsert({
        where: {
          itemTypeId_sizeOptionId_itemStatus_storedAt: {
            itemTypeId: item_type_id,
            sizeOptionId: size_option_id,
            itemStatus: data.to_status,
            storedAt: data.to_stored_at,
          },
        },
        update: { quantity: { increment: quantity } },
        create: {
          itemTypeId: item_type_id,
          sizeOptionId: size_option_id,
          itemStatus: data.to_status,
          storedAt: data.to_stored_at,
          quantity,
        },
      });
      break;
    case 'Sale':
      await tx.inventoryBalance.update({
        where: {
          itemTypeId_sizeOptionId_itemStatus_storedAt: {
            itemTypeId: item_type_id,
            sizeOptionId: size_option_id,
            itemStatus: data.from_status,
            storedAt: data.from_stored_at,
          },
        },
        data: { quantity: { decrement: quantity } },
      });
      await tx.inventoryBalance.upsert({
        where: {
          itemTypeId_sizeOptionId_itemStatus_storedAt: {
            itemTypeId: item_type_id,
            sizeOptionId: size_option_id,
            itemStatus: 'Sold',
            storedAt: 'Exited',
          },
        },
        update: { quantity: { increment: quantity } },
        create: {
          itemTypeId: item_type_id,
          sizeOptionId: size_option_id,
          itemStatus: 'Sold',
          storedAt: 'Exited',
          quantity,
        },
      });
      break;
    case 'Repurposing':
      await tx.inventoryBalance.update({
        where: {
          itemTypeId_sizeOptionId_itemStatus_storedAt: {
            itemTypeId: item_type_id,
            sizeOptionId: size_option_id,
            itemStatus: data.from_status,
            storedAt: data.from_stored_at,
          },
        },
        data: { quantity: { decrement: quantity } },
      });
      await tx.inventoryBalance.upsert({
        where: {
          itemTypeId_sizeOptionId_itemStatus_storedAt: {
            itemTypeId: item_type_id,
            sizeOptionId: size_option_id,
            itemStatus: 'Repurposed',
            storedAt: 'TCC',
          },
        },
        update: { quantity: { increment: quantity } },
        create: {
          itemTypeId: item_type_id,
          sizeOptionId: size_option_id,
          itemStatus: 'Repurposed',
          storedAt: 'TCC',
          quantity,
        },
      });
      break;
    case 'Disposal':
      await tx.inventoryBalance.update({
        where: {
          itemTypeId_sizeOptionId_itemStatus_storedAt: {
            itemTypeId: item_type_id,
            sizeOptionId: size_option_id,
            itemStatus: data.from_status,
            storedAt: data.from_stored_at,
          },
        },
        data: { quantity: { decrement: quantity } },
      });
      await tx.inventoryBalance.upsert({
        where: {
          itemTypeId_sizeOptionId_itemStatus_storedAt: {
            itemTypeId: item_type_id,
            sizeOptionId: size_option_id,
            itemStatus: 'Disposed',
            storedAt: 'Exited',
          },
        },
        update: { quantity: { increment: quantity } },
        create: {
          itemTypeId: item_type_id,
          sizeOptionId: size_option_id,
          itemStatus: 'Disposed',
          storedAt: 'Exited',
          quantity,
        },
      });
      break;
    default:
      throw new Error(`Unknown transaction type: ${data.transaction_type}`);
  }
}

export async function createTransaction(input) {
  const steps = resolveTransactionSteps(input);

  const results = await prisma.$transaction(async (tx) => {
    const created = [];

    for (const step of steps) {
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

      await applyInventoryEffect(tx, step);
      created.push(txn);
    }

    return created;
  });

  return results.map(addLabels);
}

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
      school: { select: { id: true, schoolName: true } },
      category: { select: { id: true, categoryName: true } },
      primaryColour: { select: { id: true, colourName: true, hexcode: true } },
    },
  },
  sizeOption: {
    select: { id: true, sizeName: true, sortOrder: true },
  },
  donationDrive: {
    select: { id: true, driveName: true },
  },
  user: {
    select: { id: true, firstName: true, lastName: true, role: true },
  },
};

export async function getAllTransactions(page = 1, limit = 100) {
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

export async function getTransactionById(id) {
  const txn = await prisma.transaction.findUnique({
    where: { id: parseInt(id, 10) },
    include: listInclude,
  });
  return addLabels(txn);
}

export async function getTransactionsByDonationDrive(donationDriveId) {
  const transactions = await prisma.transaction.findMany({
    where: { donationDriveId: parseInt(donationDriveId, 10) },
    include: listInclude,
  });
  return transactions.map(addLabels);
}

export async function getTransactionsByType(transactionType) {
  const transactions = await prisma.transaction.findMany({
    where: { transactionType },
    include: listInclude,
  });
  return transactions.map(addLabels);
}

export async function getTransactionsByDateRange(startDate, endDate) {
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