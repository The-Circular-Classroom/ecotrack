import { parse } from 'csv-parse/sync';
import * as XLSX from 'xlsx';
import { prisma } from '@/lib/prisma';
import { getSupabaseStorageClient } from '@/lib/storage/supabase';

function toText(value) {
  return value === null || value === undefined ? '' : String(value).trim();
}

function parseToStatus(value) {
  const normalized = toText(value).toLowerCase().replace(/[\s\/-]+/g, '_');

  switch (normalized) {
    case 'for_psg':
      return 'ForSale';
    case 'for_school_stock':
      return 'GeneralOffice';
    case 'for_repurposing':
      return 'ForRepurpose';
    case 'for_recycling_disposal':
      return 'Disposed';
    default:
      return null;
  }
}

function parseStoredAt(value) {
  const normalized = toText(value).toLowerCase();
  if (normalized === 'school') {
    return 'School';
  }
  if (normalized === 'tcc') {
    return 'TCC';
  }
  return null;
}

function parseSpreadsheet(buffer, originalFilename) {
  const extension = originalFilename.split('.').pop().toLowerCase();
  const isExcel = extension === 'xlsx' || extension === 'xls';

  let headers = [];
  let dataRows = [];

  if (isExcel) {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames.includes('Donations') ? 'Donations' : workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    headers = (jsonData[0] || []).map((header) => toText(header).toLowerCase());
    dataRows = jsonData.slice(1).filter((row) => row && row.some((cell) => toText(cell) !== ''));
  } else {
    const fileContent = buffer.toString('utf-8');
    const records = parse(fileContent, {
      trim: true,
      skip_empty_lines: true,
      relax_column_count: true,
    });
    headers = (records[0] || []).map((header) => toText(header).toLowerCase());
    dataRows = records.slice(1).filter((row) => row && row.some((cell) => toText(cell) !== ''));
  }

  return dataRows.map((row) => {
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = toText(row[index]);
    });
    return obj;
  });
}

async function uploadFileToStorage({ bucketName, path, buffer, contentType }) {
  const client = getSupabaseStorageClient();
  if (!client || !bucketName || !path) {
    return null;
  }

  const { error } = await client.storage.from(bucketName).upload(path, buffer, {
    contentType,
    upsert: true,
  });

  if (error) {
    throw new Error(`Failed to upload CSV artifact: ${error.message}`);
  }

  return path;
}

async function getStorageClientAndBucket(bucketName) {
  const client = getSupabaseStorageClient();
  const safeBucketName = bucketName || process.env.SUPABASE_STORAGE_BUCKET_NAME || 'donations';

  if (!client) {
    return { client: null, bucketName: safeBucketName };
  }

  return { client, bucketName: safeBucketName };
}

export async function storeCsvArtifact({ bucketName, folder, fileName, buffer, contentType }) {
  const safeBucketName = bucketName || process.env.SUPABASE_STORAGE_BUCKET_NAME || 'donations';
  const path = `donations/${folder}/${Date.now()}-${fileName}`;
  const uploadedPath = await uploadFileToStorage({
    bucketName: safeBucketName,
    path,
    buffer,
    contentType,
  });

  return {
    bucketName: safeBucketName,
    path: uploadedPath,
  };
}

export async function listCsvArtifacts({ bucketName, folder = 'validated' } = {}) {
  const { client, bucketName: safeBucketName } = await getStorageClientAndBucket(bucketName);
  if (!client) {
    return [];
  }

  const { data, error } = await client.storage.from(safeBucketName).list(`donations/${folder}`, {
    limit: 1000,
    sortBy: { column: 'name', order: 'desc' },
  });

  if (error) {
    throw new Error(`Failed to list CSV artifacts: ${error.message}`);
  }

  return data ?? [];
}

export async function readCsvArtifact({ bucketName, key }) {
  const { client, bucketName: safeBucketName } = await getStorageClientAndBucket(bucketName);
  if (!client || !key) {
    return null;
  }

  const { data, error } = await client.storage.from(safeBucketName).download(key);
  if (error) {
    throw new Error(`Failed to download CSV artifact: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  const contentType = data.type || 'application/octet-stream';
  const text = await data.text();

  return {
    key,
    contentType,
    text,
  };
}

export async function moveCsvArtifact({ bucketName, from, to }) {
  const { client, bucketName: safeBucketName } = await getStorageClientAndBucket(bucketName);
  if (!client || !from || !to) {
    return null;
  }

  const { error } = await client.storage.from(safeBucketName).move(from, to);
  if (error) {
    throw new Error(`Failed to move CSV artifact: ${error.message}`);
  }

  return { from, to };
}

export function buildDonationCsvTemplate() {
  return [
    'item_type_id,size_name,user_id,school_id,donation_drive_id,to_stored_at,quantity,to_status,remarks',
    '1,XS,00000000-0000-0000-0000-000000000000,1,1,School,1,for_psg,Optional remarks',
  ].join('\n');
}

export async function validateDonationCsvBuffer(buffer, originalFilename, { requestingUser } = {}) {
  if (!buffer || !originalFilename) {
    return { success: false, statusCode: 400, message: 'No file uploaded' };
  }

  const rows = parseSpreadsheet(buffer, originalFilename);

  const validationErrors = [];
  const enrichedData = [];
  const stats = {
    totalRows: rows.length,
    validRows: 0,
    invalidRows: 0,
    processedAt: new Date().toISOString(),
  };

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    const rowNumber = index + 2;
    const rowErrors = [];

    const rowData = {
      ...row,
      to_stored_at: parseStoredAt(row.to_stored_at),
      to_status: parseToStatus(row.to_status),
      quantity: toText(row.quantity),
    };

    if (rowData.to_stored_at === 'School' && rowData.to_status === 'ForRepurpose') {
      rowErrors.push('Status "For Repurposing" is not allowed for items stored at School');
    }

    const requiredFields = ['item_type_id', 'size_name', 'user_id', 'school_id', 'donation_drive_id', 'to_stored_at', 'quantity', 'to_status'];
    for (const field of requiredFields) {
      if (!rowData[field]) {
        rowErrors.push(`Missing required field: ${field}`);
      }
    }

    let user = null;
    if (rowData.user_id) {
      user = await prisma.user.findUnique({
        where: { id: rowData.user_id },
        include: { school: true },
      });

      if (!user) {
        rowErrors.push(`User ID ${rowData.user_id} not found`);
      }

      if (user && !user.isActive) {
        rowErrors.push(`User ID ${rowData.user_id} is not active`);
      }
    }

    let school = null;
    if (rowData.school_id) {
      school = await prisma.school.findUnique({ where: { id: Number(rowData.school_id) } });
      if (!school) {
        rowErrors.push(`School ID ${rowData.school_id} not found`);
      } else if (!school.isCooperating) {
        rowErrors.push(`School ID ${rowData.school_id} is not cooperating`);
      }
    }

    let donationDrive = null;
    if (rowData.donation_drive_id) {
      donationDrive = await prisma.donationDrive.findUnique({
        where: { id: Number(rowData.donation_drive_id) },
      });

      if (!donationDrive) {
        rowErrors.push(`Donation Drive ID ${rowData.donation_drive_id} not found`);
      } else {
        const now = new Date();
        const startDate = new Date(donationDrive.startDate);
        const endDate = new Date(donationDrive.endDate);
        if (now <= startDate || now > endDate) {
          rowErrors.push(`Donation Drive ID ${rowData.donation_drive_id} is not currently active (${startDate.toDateString()} - ${endDate.toDateString()})`);
        }

        if (rowData.school_id && donationDrive.schoolId !== Number(rowData.school_id)) {
          rowErrors.push(`Donation Drive ID ${rowData.donation_drive_id} does not belong to School ID ${rowData.school_id}`);
        }
      }
    }

    let itemTypeId = rowData.item_type_id ? Number(rowData.item_type_id) : null;
    let itemType = null;

    if (!itemTypeId) {
      rowErrors.push('Missing item_type_id');
      if (rowData.category_name && rowData.school_id) {
        const category = await prisma.category.findFirst({
          where: { categoryName: { equals: rowData.category_name, mode: 'insensitive' } },
        });

        if (category) {
          itemType = await prisma.itemType.findFirst({
            where: { categoryId: category.id, schoolId: Number(rowData.school_id) },
            include: {
              category: true,
              primaryColour: true,
              sizeCategory: { include: { sizeOptions: true } },
            },
          });

          if (itemType) {
            itemTypeId = itemType.id;
            rowData.item_type_id = String(itemTypeId);
            rowData.resolved_category_id = String(category.id);
          } else {
            rowErrors.push(`No item type found for category "${rowData.category_name}" at school ${rowData.school_id}`);
          }
        } else {
          rowErrors.push(`Category "${rowData.category_name}" not found`);
        }
      }
    }

    if (itemTypeId && !itemType) {
      itemType = await prisma.itemType.findUnique({
        where: { id: itemTypeId },
        include: {
          category: true,
          primaryColour: true,
          sizeCategory: { include: { sizeOptions: true } },
        },
      });

      if (!itemType) {
        rowErrors.push(`Item Type ID ${itemTypeId} not found`);
      }
    }

    let sizeOptionId = null;
    if (itemType) {
      rowData.category_name = itemType.category?.categoryName ?? rowData.category_name;
      rowData.primary_colour = itemType.primaryColour?.colourName ?? rowData.primary_colour;

      if (rowData.size_name && itemType.sizeCategory) {
        const availableSizes = itemType.sizeCategory.sizeOptions.map((size) => size.sizeName);
        const sizeOption = itemType.sizeCategory.sizeOptions.find(
          (option) => option.sizeName.toLowerCase() === rowData.size_name.toLowerCase()
        );

        if (sizeOption) {
          sizeOptionId = sizeOption.id;
          rowData.size_option_id = String(sizeOptionId);
        } else {
          rowErrors.push(`Size "${rowData.size_name}" not found for this item type. Available sizes: ${availableSizes.join(', ')}`);
        }
      }
    }

    if (rowData.colour_name) {
      const colour = await prisma.colour.findFirst({
        where: { colourName: { equals: rowData.colour_name, mode: 'insensitive' } },
      });

      if (colour) {
        rowData.colour_id = String(colour.id);
        rowData.colour_hexcode = colour.hexcode;
      } else {
        rowErrors.push(`Colour "${rowData.colour_name}" not found in database`);
      }
    }

    if (user && rowData.school_id && user.schoolId !== Number(rowData.school_id)) {
      rowErrors.push(`User ${rowData.user_id} does not have permission for school ${rowData.school_id}`);
    }

    if (requestingUser && requestingUser.role !== 'Admin' && requestingUser.schoolId && requestingUser.schoolId !== Number(rowData.school_id)) {
      rowErrors.push(`Authenticated user does not have permission for school ${rowData.school_id}`);
    }

    if (rowErrors.length > 0) {
      validationErrors.push({ row: rowNumber, errors: rowErrors, data: rowData });
      stats.invalidRows += 1;
      continue;
    }

    enrichedData.push({
      ...rowData,
      row_number: rowNumber,
      user_email: user?.email ?? null,
      user_school_id: user?.schoolId ?? null,
      school_name: school?.schoolName ?? null,
      donation_drive_name: donationDrive?.driveName ?? null,
      size_option_id: sizeOptionId,
      colour_id: rowData.colour_id ? Number(rowData.colour_id) : null,
      resolved_category_id: rowData.resolved_category_id ? Number(rowData.resolved_category_id) : null,
    });
    stats.validRows += 1;
  }

  return {
    success: validationErrors.length === 0,
    message: validationErrors.length === 0 ? 'All rows validated successfully' : `${validationErrors.length} rows failed validation`,
    statusCode: 200,
    stats,
    validationErrors: validationErrors.slice(0, 50),
    totalErrors: validationErrors.length,
    enrichedData: enrichedData.slice(0, 10),
    totalEnrichedRows: enrichedData.length,
  };
}

export async function approveDonationCsvRows(enrichedRows, { approverUserId } = {}) {
  const applied = [];

  await prisma.$transaction(async (tx) => {
    for (const row of enrichedRows) {
      const donationTransaction = await tx.transaction.create({
        data: {
          fromStoredAt: null,
          toStoredAt: row.to_stored_at,
          fromStatus: null,
          toStatus: row.to_status,
          quantity: Number(row.quantity),
          transactionType: 'DonationIn',
          remarks: row.remarks ?? null,
          itemTypeId: Number(row.item_type_id),
          sizeOptionId: Number(row.size_option_id),
          donationDriveId: Number(row.donation_drive_id),
          userId: row.user_id,
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
          donationDrive: true,
          user: {
            select: { id: true, firstName: true, lastName: true, role: true },
          },
        },
      });

      await tx.inventoryBalance.upsert({
        where: {
          itemTypeId_sizeOptionId_itemStatus_storedAt: {
            itemTypeId: Number(row.item_type_id),
            sizeOptionId: Number(row.size_option_id),
            itemStatus: row.to_status,
            storedAt: row.to_stored_at,
          },
        },
        update: {
          quantity: { increment: Number(row.quantity) },
        },
        create: {
          itemTypeId: Number(row.item_type_id),
          sizeOptionId: Number(row.size_option_id),
          itemStatus: row.to_status,
          storedAt: row.to_stored_at,
          quantity: Number(row.quantity),
        },
      });

      applied.push(donationTransaction);
    }
  });

  return {
    success: true,
    message: 'Donation CSV approved and applied successfully',
    createdTransactions: applied.length,
    transactions: applied.map((transaction) => ({
      ...transaction,
    })),
    approverUserId: approverUserId ?? null,
  };
}