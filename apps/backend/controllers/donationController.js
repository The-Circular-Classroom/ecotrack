const donationService = require('../models/donationService');
const transactionService = require('../models/transactionService');
const inventoryService = require('../models/inventoryService');
const userService = require('../models/userService');
const itemTypeService = require('../models/itemTypeService');
const schoolService = require('../models/schoolService');
const { send_email, publish_to_sns } = require('../services/email/emailService');
const { uploadToS3, listObjects, downloadFile, moveObject } = require('../services/uploads/s3Service');
const XLSX = require('xlsx');
const ExcelJS = require('exceljs');
const { parse } = require('csv-parse/sync');

/**
 * Sanitise a proposed Excel worksheet name so it:
 * - Contains no invalid characters (: \ / ? * [ ])
 * - Is at most 31 characters long
 * - Is not empty
 * - Does not collide with existing worksheet names or reserved names
 *
 * @param {string} name - Proposed worksheet name.
 * @param {string[]} reservedNames - Names that must not be used (e.g. 'fixed values', 'Instructions').
 * @param {ExcelJS.Workbook} workbook - The workbook to check for existing sheet names.
 * @returns {string} A safe, unique worksheet name.
 */
function sanitizeSheetName(name, reservedNames, workbook) {
  const INVALID_CHARS_REGEX = /[:\\\/\?\*\[\]]/g;

  const reservedSet = new Set(
    (reservedNames || []).map(n => (typeof n === 'string' ? n.toLowerCase() : ''))
  );

  let sanitized = String(name || '').replace(INVALID_CHARS_REGEX, '-').trim();

  if (!sanitized) {
    sanitized = 'Sheet';
  }

  if (sanitized.length > 31) {
    sanitized = sanitized.slice(0, 31);
  }

  const existingNames = new Set(
    (workbook && Array.isArray(workbook.worksheets)
      ? workbook.worksheets.map(ws => (ws && typeof ws.name === 'string' ? ws.name.toLowerCase() : ''))
      : []
    )
  );

  const baseName = sanitized;
  let candidate = sanitized;
  let suffix = 1;

  const isTaken = () =>
    reservedSet.has(candidate.toLowerCase()) || existingNames.has(candidate.toLowerCase());

  while (isTaken()) {
    const suffixText = ` (${suffix})`;
    const maxBaseLength = 31 - suffixText.length;
    candidate = baseName.slice(0, Math.max(0, maxBaseLength)) + suffixText;
    suffix += 1;
  }

  return candidate;
}

// POST /api/donation-drives
const createDonationDrive = async (req, res) => {
  try {
    console.log('Create donation drive request received');
    console.log('Body:', req.body);

    const {
      drive_name,
      start_date,
      end_date,
      location,
      school_id,
      created_by_user_id
    } = req.body;

    // Validation
    if (!drive_name || !start_date || !end_date || !location || !created_by_user_id) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: drive_name, start_date, end_date, location, created_by_user_id'
      });
    }

    // Validate dates
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format'
      });
    }

    if (endDate < startDate) {
      return res.status(400).json({
        success: false,
        message: 'End date must be after start date'
      });
    }

    console.log('school id:', school_id)

    const schoolName = await schoolService.getSchoolNameById(parseInt(school_id));

    const donationDrive = await donationService.createDonationDrive({
      drive_name,
      start_date,
      end_date,
      location,
      school_id,
      created_by_user_id
    });

    await publish_to_sns(
      'New Donation Drive Added',
      [
          `A new donation drive (${drive_name}) has been created.`,
          '',
          `Created by user ID: ${created_by_user_id}`,
          `Start date: ${start_date}`,
          `End date: ${end_date}`,
          `Location: ${location}`,
          '',
          'Thank you!',
      ].join('\n')
  );

    return res.status(201).json({
      success: true,
      message: 'Donation drive created successfully',
      data: donationDrive
    });

  } catch (error) {
    console.error('Error creating donation drive:', error);

    if (error.code === 'P2003') {
      return res.status(400).json({
        success: false,
        message: 'Invalid school_id or created_by_user_id reference'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Error creating donation drive',
      error: error.message
    });
  }
};

// GET /api/donation-drives
const getAllDonationDrives = async (req, res) => {
  try {
    const { school_id, active_only, page, limit } = req.query;

    const result = await donationService.getAllDonationDrives({
      school_id: school_id ? parseInt(school_id) : undefined,
      active_only: active_only === 'true',
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : null
    });

    return res.status(200).json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Error fetching donation drives:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching donation drives',
      error: error.message
    });
  }
};

// GET /api/donation-drives/:id
const getDonationDriveById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid donation drive ID'
      });
    }

    const donationDrive = await donationService.getDonationDriveById(id);

    if (!donationDrive) {
      return res.status(404).json({
        success: false,
        message: 'Donation drive not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: donationDrive
    });

  } catch (error) {
    console.error('Error fetching donation drive:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching donation drive',
      error: error.message
    });
  }
};

// PATCH /api/donation-drives/:id
const updateDonationDrive = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      drive_name,
      start_date,
      end_date,
      location,
      school_id
    } = req.body;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid donation drive ID'
      });
    }

    // Check if at least one field is provided
    if (!drive_name && !start_date && !end_date && !location && school_id === undefined) {
      return res.status(400).json({
        success: false,
        message: 'At least one field must be provided for update'
      });
    }

    // Fetch existing drive
    const existingDrive = await donationService.getDonationDriveById(id);
    if (!existingDrive) {
      return res.status(404).json({
        success: false,
        message: 'Donation drive not found'
      });
    }

    // Only update fields that have actually changed
    const updatedFields = {};
    if (drive_name !== undefined && drive_name !== existingDrive.driveName) updatedFields.drive_name = drive_name;
    if (start_date !== undefined && start_date !== existingDrive.startDate.toISOString().split('T')[0]) updatedFields.start_date = start_date;
    if (end_date !== undefined && end_date !== existingDrive.endDate.toISOString().split('T')[0]) updatedFields.end_date = end_date;
    if (location !== undefined && location !== existingDrive.location) updatedFields.location = location;
    if (school_id !== undefined && school_id !== existingDrive.schoolId) updatedFields.school_id = school_id;

    if (Object.keys(updatedFields).length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No changes detected, nothing was updated',
        data: existingDrive
      });
    }

    // Use effective dates (new value if changed, otherwise existing) for validation
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const existingStartStr = existingDrive.startDate.toISOString().split('T')[0];
    const existingEndStr = existingDrive.endDate.toISOString().split('T')[0];

    const effectiveStartStr = updatedFields.start_date ?? existingStartStr;
    const effectiveEndStr = updatedFields.end_date ?? existingEndStr;

    // Drive is ongoing if today falls between the start and end date (inclusive)
    const isOngoing = existingStartStr <= todayStr && existingEndStr >= todayStr;

    if (isOngoing) {
      if (updatedFields.start_date) {
        const newStartDateStr = new Date(updatedFields.start_date).toISOString().split('T')[0];
        if (newStartDateStr <= todayStr) {
          return res.status(400).json({
            success: false,
            message: 'Cannot update start date of an ongoing drive to a past or current date. Start date must be in the future.'
          });
        }
      }

      if (updatedFields.end_date) {
        const newEndDateStr = new Date(updatedFields.end_date).toISOString().split('T')[0];
        if (newEndDateStr < todayStr) {
          return res.status(400).json({
            success: false,
            message: 'Cannot update end date of an ongoing drive to a past date. End date must be today or later.'
          });
        }
      }
    }

    // Validate effective start/end date range
    if (effectiveStartStr && effectiveEndStr) {
      if (new Date(effectiveEndStr) < new Date(effectiveStartStr)) {
        return res.status(400).json({
          success: false,
          message: 'End date must be after start date'
        });
      }
    }

    const donationDrive = await donationService.updateDonationDrive(id, updatedFields);

    return res.status(200).json({
      success: true,
      message: 'Donation drive updated successfully',
      data: donationDrive
    });

  } catch (error) {
    console.error('Error updating donation drive:', error);

    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Donation drive not found'
      });
    }

    if (error.code === 'P2003') {
      return res.status(400).json({
        success: false,
        message: 'Invalid school_id reference'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Error updating donation drive',
      error: error.message
    });
  }
};

// DELETE /api/donation-drives/:id
const deleteDonationDrive = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid donation drive ID'
      });
    }

    // Check if the drive exists
    const existing = await donationService.getDonationDriveById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Donation drive not found'
      });
    }

    // Block delete if any transactions are linked to this drive
    const linkedTransactions = await transactionService.getTransactionsByDonationDrive(parseInt(id));
    const linkedTransactionCount = linkedTransactions?.length ?? 0;

    if (linkedTransactionCount > 0) {
      return res.status(409).json({
        success: false,
        message: `Cannot delete donation drive: it has ${linkedTransactionCount} associated transaction${linkedTransactionCount !== 1 ? 's' : ''}.`
      });
    }

    await donationService.deleteDonationDrive(id);

    return res.status(200).json({
      success: true,
      message: 'Donation drive deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting donation drive:', error);

    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Donation drive not found'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Error deleting donation drive',
      error: error.message
    });
  }
};

// GET /api/donation-drives/school/:schoolId
const getDonationDrivesBySchool = async (req, res) => {
  try {
    const { schoolId } = req.params;

    if (!schoolId || isNaN(parseInt(schoolId))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid school ID'
      });
    }

    const donationDrives = await donationService.getDonationDrivesBySchool(schoolId);

    return res.status(200).json({
      success: true,
      data: donationDrives
    });

  } catch (error) {
    console.error('Error fetching donation drives by school:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching donation drives',
      error: error.message
    });
  }
};

// GET /api/donation-drives/active
const getActiveDonationDrives = async (req, res) => {
  try {
    const donationDrives = await donationService.getActiveDonationDrives();

    return res.status(200).json({
      success: true,
      data: donationDrives
    });

  } catch (error) {
    console.error('Error fetching active donation drives:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching active donation drives',
      error: error.message
    });
  }
};

/**
 * POST /api/donation-drive/donate
 * Token-based user resolution + auto-create/link user.
 */
const createDonationDetails = async (req, res) => {
  try {
    const {
      from_stored_at,
      to_stored_at,
      from_status,
      to_status,
      quantity,
      transaction_type,
      remarks,
      item_type_id,
      donation_drive_id,
      user_id, // legacy fallback
      size_name,
    } = req.body;

    // Resolve user from token (preferred) or legacy user_id
    let resolvedUserId = null;

    const cognitoSub = req.user?.sub;
    const rawGroups = req.user?.['cognito:groups'];
    const groups = Array.isArray(rawGroups) ? rawGroups : rawGroups ? [String(rawGroups)] : [];

    const tokenEmailCandidate =
      req.user?.email ||
      req.user?.username ||
      req.user?.['cognito:username'] ||
      req.user?.preferred_username ||
      null;

    const mappedRole =
      groups.includes('TCCAdministrators') || groups.includes('TCCAdminstrators')
        ? 'Admin'
        : groups.includes('SchoolStaff')
          ? 'SchoolStaff'
          : groups.includes('ParentSupportGroup')
            ? 'PsgVolunteer'
            : 'Admin';

    if (cognitoSub) {
      const dbUser = await userService.ensureUserFromToken({
        cognitoSub,
        email: tokenEmailCandidate && String(tokenEmailCandidate).includes('@') ? String(tokenEmailCandidate) : null,
        fullName: req.user?.name || null,
        firstName: req.user?.given_name || null,
        lastName: req.user?.family_name || null,
        role: mappedRole,
      });

      resolvedUserId = dbUser.id;
    } else if (user_id != null) {
      resolvedUserId = Number(user_id);
      if (!Number.isFinite(resolvedUserId)) {
        return res.status(400).json({ success: false, message: 'user_id must be a numeric value' });
      }
      const check = await userService.getSchoolIdByUserId(resolvedUserId);
      if (!check) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
    } else {
      return res.status(401).json({
        success: false,
        message: 'Missing user identity (Authorization header required)',
      });
    }

    // verify item type and size option exists
    const itemType = await itemTypeService.getItemTypeById(item_type_id);
    if (!itemType) {
      return res.status(404).json({
        success: false,
        message: 'Item type not found'
      });
    }

    // Find matching SizeOption by name within that item type's size category
    const sizeOption = itemType.sizeCategory?.sizeOptions?.find(
      (opt) => opt.sizeName === size_name
    );
    if (!sizeOption) {
      return res.status(404).json({
        success: false,
        message: `Size option '${size_name}' not found for this item type`,
      });
    }
    const size_option_id = sizeOption.id;

    // verify donation drive exists (if provided)
    if (donation_drive_id != null) {
      const donationDrive = await donationService.getDonationDriveById(donation_drive_id);
      if (!donationDrive) {
        return res.status(404).json({
          success: false,
          message: 'Donation drive not found'
        });
      }
    }

    // create transaction
    const donationDetails = await transactionService.createTransaction({
      from_stored_at,
      to_stored_at,
      from_status,
      to_status,
      quantity,
      transaction_type,
      remarks,
      item_type_id,
      size_option_id,
      donation_drive_id: donation_drive_id ?? null,
      user_id: resolvedUserId
    });

    return res.status(201).json({
      success: true,
      message: 'Donation added successfully',
      data: donationDetails
    });

  } catch (error) {
    console.error('Error creating donation details:', error);
    return res.status(500).json({
      success: false,
      message: 'Error creating donation details',
      error: error.message
    });
  }
};

const uploadDonationCSV = async (req, res) => {
  try {
    // (unchanged - kept as you provided)
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    if (req.file.size === 0) {
      return res.status(400).json({ success: false, message: 'File is empty (0 bytes)' });
    }

    const maliciousPatterns = [
      /\.\.[\/\\]/,
      /[<>:"|?*\x00-\x1f]/,
      /\.(exe|bat|cmd|sh|ps1|vbs|js|jar|dll|msi)$/i,
      /^(con|prn|aux|nul|com[0-9]|lpt[0-9])(\..*)?$/i
    ];

    if (maliciousPatterns.some(pattern => pattern.test(req.file.originalname))) {
      return res.status(400).json({ success: false, message: 'Invalid or potentially malicious filename detected' });
    }

    let headers = [];
    let dataRows = [];
    const fileExtension = req.file.originalname.split('.').pop().toLowerCase();
    const isExcel = fileExtension === 'xlsx' || fileExtension === 'xls';

    if (isExcel) {
      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames.includes('Donations')
        ? 'Donations'
        : workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      if (!jsonData || jsonData.length < 2) {
        return res.status(400).json({ success: false, message: 'File must contain headers and at least one data row' });
      }

      headers = jsonData[0].map(h => String(h).trim().toLowerCase());
      dataRows = jsonData.slice(1).filter(row =>
        row && row.some(cell => cell !== null && cell !== undefined && String(cell).trim() !== '')
      );
    } else {
      const fileContent = req.file.buffer.toString('utf-8');
      if (!fileContent || fileContent.trim().length === 0) {
        return res.status(400).json({ success: false, message: 'File is empty' });
      }

      const records = parse(fileContent, {
        trim: true,
        skip_empty_lines: true,
        relax_column_count: true
      });

      if (!records || records.length < 2) {
        return res.status(400).json({ success: false, message: 'File must contain headers and at least one data row' });
      }

      headers = records[0].map(h => String(h).trim().toLowerCase());
      dataRows = records.slice(1).filter(row =>
        row && row.some(cell => cell !== null && cell !== undefined && String(cell).trim() !== '')
      );
    }

    const expectedHeaders = [
      'item_type_id', 'item_name', 'colour_name', 'gender',
      'user_id', 'school_id', 'donation_drive_id',
      'to_stored_at', 'quantity', 'to_status', 'size_name', 'remarks'
    ];

    const missingHeaders = expectedHeaders.filter(h => !headers.includes(h));
    if (missingHeaders.length > 0) {
      return res.status(400).json({ success: false, message: 'Missing required headers', missingHeaders, expectedHeaders });
    }

    const uniqueHeaders = [...new Set(headers)];
    if (uniqueHeaders.length !== headers.length) {
      const duplicates = headers.filter((item, index) => headers.indexOf(item) !== index);
      return res.status(400).json({
        success: false,
        message: 'File contains duplicate headers',
        duplicateHeaders: [...new Set(duplicates)]
      });
    }

    const MAX_ROWS = 1000;
    if (dataRows.length > MAX_ROWS) {
      return res.status(400).json({
        success: false,
        message: `Too many rows. Maximum ${MAX_ROWS} rows allowed, found ${dataRows.length}`
      });
    }
    if (dataRows.length === 0) {
      return res.status(400).json({ success: false, message: 'No data rows found in file' });
    }

    const requiredHeaders = ['item_type_id', 'to_stored_at', 'quantity', 'to_status', 'size_name'];
    const validStatusValues = ['for_psg', 'for_school_stock', 'for_repurposing', 'for_recycling_disposal'];

    // 4. Update normalizeStatus
    const normalizeStatus = (val) => {
      if (!val) return val;
      const v = val.toLowerCase().replace(/[\s\/_-]+/g, '_');
      if (v === 'for_psg') return 'for_psg';
      if (v === 'for_school_stock') return 'for_school_stock';
      if (v === 'for_repurposing') return 'for_repurposing';
      if (v === 'for_recycling_disposal') return 'for_recycling_disposal';
      return val;
    };

    // 5. Update normalizeStoredAt
    const normalizeStoredAt = (val) => {
      if (!val) return val;
      const v = val.toLowerCase().trim();
      if (v === 'school') return 'school';
      if (v === 'tcc') return 'tcc';
      return val;
    };

    const validStoredAtValues = ['school', 'tcc'];
    const validationErrors = [];
    const parsedData = [];

    dataRows.forEach((rowArray, rowIndex) => {
      const actualRowNumber = rowIndex + 2;
      if (!rowArray || rowArray.every(v => v === null || v === undefined || String(v).trim() === '')) return;

      const rowData = {};
      headers.forEach((header, index) => {
        const cellValue = rowArray[index];
        rowData[header] = cellValue !== null && cellValue !== undefined ? String(cellValue).trim() : '';
      });

      Object.entries(rowData).forEach(([field, value]) => {
        if (value && typeof value === 'string' && value.length > 0) {
          const firstChar = value.charAt(0);
          if (firstChar === '=' || firstChar === '+' || firstChar === '@' || firstChar === '\t' || firstChar === '\r') {
            validationErrors.push(`Row ${actualRowNumber}: '${field}' starts with '${firstChar}' which could be a formula injection attempt`);
          } else if (firstChar === '-' && value.length > 1 && !/^-?\d/.test(value)) {
            validationErrors.push(`Row ${actualRowNumber}: '${field}' starts with '-' which could be a formula injection attempt`);
          }
        }
      });

      requiredHeaders.forEach(header => {
        if (!rowData[header]) validationErrors.push(`Row ${actualRowNumber}: Missing value for '${header}'`);
      });

      const qty = rowData['quantity'];
      if (qty) {
        const qtyNum = Number(qty);
        if (isNaN(qtyNum) || !Number.isInteger(qtyNum)) validationErrors.push(`Row ${actualRowNumber}: Quantity must be an integer`);
        else if (qtyNum <= 0) validationErrors.push(`Row ${actualRowNumber}: Quantity must be greater than 0`);
        else if (qtyNum > 10000) validationErrors.push(`Row ${actualRowNumber}: Quantity exceeds maximum limit of 10,000`);
      }

      if (rowData['to_stored_at']) {
        rowData['to_stored_at'] = normalizeStoredAt(rowData['to_stored_at']);
        if (!validStoredAtValues.includes(rowData['to_stored_at'])) {
          validationErrors.push(`Row ${actualRowNumber}: Invalid 'to_stored_at'. Must be School or TCC`);
        }
      }

      if (rowData['to_status']) {
        rowData['to_status'] = normalizeStatus(rowData['to_status']);
        if (!validStatusValues.includes(rowData['to_status'])) {
          validationErrors.push(`Row ${actualRowNumber}: Invalid 'to_status'. Must be one of: For School Stock, For Repurposing, For recycling/disposal`);
        }
      }

      if (rowData['to_stored_at'] === 'school' && rowData['to_status'] === 'for_repurposing') {
        validationErrors.push(
            `Row ${actualRowNumber}: "For Repurposing" is not allowed for items stored at School. Only TCC items can be repurposed.`
        );
      }  

      parsedData.push(rowData);
    });

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: `CSV validation failed with ${validationErrors.length} error(s)`,
        errors: validationErrors.slice(0, 50),
        totalErrors: validationErrors.length,
        ...(validationErrors.length > 50 && { note: 'Showing first 50 errors only' })
      });
    }

    const bucketName = process.env.S3_BUCKET_NAME;
    if (!bucketName) {
      return res.status(500).json({
        success: false,
        message: 'S3 bucket not configured. Please set S3_BUCKET_NAME environment variable.'
      });
    }

    const timestamp = Date.now();
    const sanitizedFileName = req.file.originalname
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/^\.+/, '')
      .replace(/\.{2,}/g, '.')
      .substring(0, 100);

    if (!sanitizedFileName || sanitizedFileName === '') {
      return res.status(400).json({ success: false, message: 'Invalid filename after sanitization' });
    }

    const s3Key = `donations/pre-processing/${timestamp}_${sanitizedFileName}`;
    const s3Result = await uploadToS3(req.file.buffer, s3Key, bucketName);

    return res.status(202).json({
      success: true,
      message: 'File validation passed. Uploaded to S3 and queued for processing.',
      data: {
        uploadId: timestamp.toString(),
        fileName: req.file.originalname,
        fileSize: req.file.size,
        totalRows: parsedData.length,
        s3Location: s3Result.location,
        s3Key: s3Result.key,
        uploadedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error uploading donation CSV:', error);
    return res.status(500).json({
      success: false,
      message: 'Error processing CSV upload',
      error: error.message
    });
  }
};

// S3 folders (prefixes) for donation files - match bucket structure: failed/, pre-processing/, validated/
const DONATION_S3_FOLDERS = [
  { prefix: 'donations/failed', folder: 'failed' },
  { prefix: 'donations/pre-processing', folder: 'pre-processing' },
  { prefix: 'donations/validated', folder: 'validated' },
];
const ALLOWED_CONTENT_PREFIXES = DONATION_S3_FOLDERS.map((f) => f.prefix);

function isKeyAllowed(key) {
  if (!key || key.includes('..')) return false;
  const normalized = key.replace(/^\/+/, '');
  return ALLOWED_CONTENT_PREFIXES.some((p) => normalized === p || normalized.startsWith(p + '/'));
}

// GET /api/donation-drive/validated-files/content?key=... - Download and parse CSV/Excel content
const getValidatedFileContent = async (req, res) => {
  try {
    const key = req.query.key;
    if (!key || typeof key !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Query parameter "key" is required',
      });
    }
    if (!isKeyAllowed(key)) {
      return res.status(400).json({
        success: false,
        message: 'Key must be under donations/failed, donations/pre-processing, or donations/validated',
      });
    }
    const normalizedKey = key.replace(/^\/+/, '');

    const bucketName = process.env.S3_BUCKET_NAME;
    if (!bucketName) {
      return res.status(500).json({
        success: false,
        message: 'S3 bucket not configured.',
      });
    }

    const buffer = await downloadFile(normalizedKey, bucketName);
    const ext = (normalizedKey.split('.').pop() || '').toLowerCase();
    let headers = [];
    let rows = [];

    if (ext === 'csv') {
      const fileContent = buffer.toString('utf-8');
      const records = parse(fileContent, {
        trim: true,
        skip_empty_lines: true,
        relax_column_count: true,
      });
      if (records && records.length >= 1) {
        headers = records[0].map((h) => String(h ?? '').trim());
        rows = records.slice(1).map((row) => {
          const obj = {};
          headers.forEach((h, i) => {
            obj[h] = row[i] !== null && row[i] !== undefined ? String(row[i]).trim() : '';
          });
          return obj;
        });
        rows = rows.filter((row) => !headers.every((h) => !String(row[h] || '').trim()));
      }
    } else if (ext === 'xlsx' || ext === 'xls') {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Excel file has no sheets',
        });
      }
      const sheetName = workbook.SheetNames.includes('Donations')
        ? 'Donations'
        : workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      if (!worksheet) {
        return res.status(400).json({
          success: false,
          message: 'Excel file does not contain a valid first worksheet',
        });
      }
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      if (jsonData && jsonData.length >= 1) {
        headers = jsonData[0].map((h) => String(h ?? '').trim());
        rows = jsonData.slice(1).map((row) => {
          const obj = {};
          headers.forEach((h, i) => {
            obj[h] = row[i] !== null && row[i] !== undefined ? String(row[i]).trim() : '';
          });
          return obj;
        });
        rows = rows.filter((row) => !headers.every((h) => !String(row[h] || '').trim()));
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Unsupported file type. Use .csv, .xlsx, or .xls',
      });
    }

    // Enrich with metadata from the first row
    let schoolName = null;
    let uploaderName = null;
    let donationDriveName = null;

    if (rows.length > 0) {
      const firstRow = rows[0];

      // Helper to read a field from the row in a case-insensitive way.
      const getCaseInsensitiveField = (row, logicalKey) => {
        if (!row || typeof row !== 'object') return undefined;
        if (Object.prototype.hasOwnProperty.call(row, logicalKey)) {
          return row[logicalKey];
        }
        const target = String(logicalKey).toLowerCase();
        const matchedKey = Object.keys(row).find(
          (k) => String(k).toLowerCase() === target
        );
        return matchedKey !== undefined ? row[matchedKey] : undefined;
      };

      const schoolIdValue = getCaseInsensitiveField(firstRow, 'school_id');
      if (schoolIdValue) {
        try {
          const school = await schoolService.getSchoolNameById(parseInt(schoolIdValue));
          schoolName = school?.schoolName || null;
        } catch (err) {
          console.warn('Failed to look up school:', err.message);
        }
      }

      const userIdValue = getCaseInsensitiveField(firstRow, 'user_id');
      if (userIdValue) {
        try {
          const user = await userService.getUserNamebyId(parseInt(userIdValue));
          uploaderName = user
            ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email
            : null;
        } catch (err) {
          console.warn('Failed to look up user:', err.message);
        }
      }

      const donationDriveIdValue = getCaseInsensitiveField(firstRow, 'donation_drive_id');
      if (donationDriveIdValue) {
        try {
          const drive = await donationService.getDonationDriveById(parseInt(donationDriveIdValue));
          donationDriveName = drive?.driveName || null;
        } catch (err) {
          console.warn('Failed to look up donation drive:', err.message);
        }
      }
    }

    return res.status(200).json({
      success: true,
      data: { 
        headers, 
        rows,
        metadata: {
          schoolName,
          uploaderName,
          donationDriveName,
          totalRows: rows.length,
        },
      },
    });
  } catch (error) {
    console.error('Error getting validated file content:', error);
    return res.status(500).json({
      success: false,
      message: 'Error reading file content from S3',
      error: error.message,
    });
  }
};

const PRE_PROCESSING_PREFIX = 'donations/pre-processing/';
const VALIDATED_PREFIX = 'donations/validated/';
const FAILED_PREFIX = 'donations/failed/';

//POST /api/donation-drive/approve-file - Move a CSV/file from pre-processing (pending) to validated (approved).
const approveDonationFile = async (req, res) => {
  try {
    const { key } = req.body || {};
    if (!key || typeof key !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Request body must include "key" (S3 key of the file in pre-processing).',
      });
    }
    const normalizedKey = key.replace(/^\/+/, '').trim();
    if (!normalizedKey.startsWith(PRE_PROCESSING_PREFIX) || normalizedKey === PRE_PROCESSING_PREFIX) {
      return res.status(400).json({
        success: false,
        message: 'Key must be under donations/pre-processing/ (pending file).',
      });
    }
    const bucketName = process.env.S3_BUCKET_NAME;
    if (!bucketName) {
      return res.status(500).json({
        success: false,
        message: 'S3 bucket not configured.',
      });
    }
    const fileName = normalizedKey.slice(PRE_PROCESSING_PREFIX.length);
    if (!fileName) {
      return res.status(400).json({
        success: false,
        message: 'Invalid key: no file name after pre-processing prefix.',
      });
    }
    const user_id = req.user.id
    const destKey = VALIDATED_PREFIX + fileName;
    await moveObject(normalizedKey, destKey, bucketName, user_id);
    return res.status(200).json({
      success: true,
      message: 'File moved to validated.',
      data: { key: destKey, previousKey: normalizedKey },
    });
  } catch (error) {
    console.error('Error approving donation file:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to move file to validated',
      error: error.message,
    });
  }
};

// POST /api/donation-drive/deny-file - Move a CSV/file from pre-processing (pending) to failed.
const denyDonationFile = async (req, res) => {
    try {
        const { key } = req.body || {};
        if (!key || typeof key !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'Request body must include "key" (S3 key of the file in pre-processing).',
            });
        }

        const normalizedKey = key.replace(/^\/+/, '').trim();
        if (!normalizedKey.startsWith(PRE_PROCESSING_PREFIX) || normalizedKey === PRE_PROCESSING_PREFIX) {
            return res.status(400).json({
                success: false,
                message: 'Key must be under donations/pre-processing/ (pending file).',
            });
        }

        const bucketName = process.env.S3_BUCKET_NAME;
        if (!bucketName) {
            return res.status(500).json({
                success: false,
                message: 'S3 bucket not configured.',
            });
        }

        const fileName = normalizedKey.slice(PRE_PROCESSING_PREFIX.length);
        if (!fileName) {
            return res.status(400).json({
                success: false,
                message: 'Invalid key: no file name after pre-processing prefix.',
            });
        }

        const destKey = FAILED_PREFIX + fileName;
        await moveObject(normalizedKey, destKey, bucketName);

        return res.status(200).json({
            success: true,
            message: 'File moved to failed.',
            data: { key: destKey, previousKey: normalizedKey },
        });
    } catch (error) {
        console.error('Error denying donation file:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to move file to failed',
            error: error.message,
        });
    }
};

// GET /api/donation-drive/validated-files - List objects from all 3 folders: failed, pre-processing, validated
const getValidatedDonationFiles = async (req, res) => {
  try {
    const bucketName = process.env.S3_BUCKET_NAME;
    if (!bucketName) {
      return res.status(500).json({
        success: false,
        message: 'S3 bucket not configured. Please set S3_BUCKET_NAME environment variable.',
      });
    }

    const allFiles = [];
    for (const { prefix, folder } of DONATION_S3_FOLDERS) {
      const objects = await listObjects(prefix, bucketName);
      objects.forEach((obj) => {
        allFiles.push({
          key: obj.Key,
          size: obj.Size,
          lastModified: obj.LastModified,
          etag: obj.ETag ? obj.ETag.replace(/"/g, '') : null,
          folder,
        });
      });
    }

    const byFolder = {
      failed: allFiles.filter((f) => f.folder === 'failed'),
      'pre-processing': allFiles.filter((f) => f.folder === 'pre-processing'),
      validated: allFiles.filter((f) => f.folder === 'validated'),
    };

    return res.status(200).json({
      success: true,
      data: {
        folders: DONATION_S3_FOLDERS.map((f) => f.folder),
        count: allFiles.length,
        files: allFiles,
        byFolder: {
          failed: byFolder.failed.length,
          'pre-processing': byFolder['pre-processing'].length,
          validated: byFolder.validated.length,
        },
      },
    });
  } catch (error) {
    console.error('Error listing donation files from S3:', error);
    return res.status(500).json({
      success: false,
      message: 'Error listing donation files from S3',
      error: error.message,
    });
  }
};


/**
 * GET /api/donation-drive/:id/csv-template
 * Generate and download a pre-populated CSV template for a donation drive.
 *
 * Pre-populated columns (from DB):
 *   category_name, colour_name, size_name, item_type_id,
 *   user_id, school_id, donation_drive_id, to_stored_at (default: "school")
 *
 * Blank columns (donor fills in):
 *   quantity, to_status, remarks
 *
 * One row is generated per (item_type × size_option) combination for the
 * school that owns the requested donation drive.
 */
const generateDonationCSVTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { categoryId, location } = req.query;

    // location must be 'school' or 'tcc'
    if (!location || !['school', 'tcc'].includes(location.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Query parameter "location" is required. Must be "school" or "tcc".',
      });
    }

    const isSchool = location.toLowerCase() === 'school';
    const locationLabel = isSchool ? 'School' : 'TCC';

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ success: false, message: 'Invalid donation drive ID' });
    }

    // Fetch donation drive
    const donationDrive = await donationService.getDonationDriveById(parseInt(id));
    if (!donationDrive) {
      return res.status(404).json({ success: false, message: 'Donation drive not found' });
    }

    const schoolId = donationDrive.schoolId;
    if (!schoolId) {
      return res.status(400).json({ success: false, message: 'Donation drive has no associated school' });
    }

    // Resolve requesting user from JWT token
    let resolvedUserId = null;
    const cognitoSub = req.user?.sub;
    const tokenEmailCandidate =
      req.user?.email ||
      req.user?.username ||
      req.user?.['cognito:username'] ||
      req.user?.preferred_username ||
      null;
    const rawGroups = req.user?.['cognito:groups'];
    const groups = Array.isArray(rawGroups) ? rawGroups : rawGroups ? [String(rawGroups)] : [];
    const mappedRole =
      groups.includes('TCCAdministrators') || groups.includes('TCCAdminstrators')
        ? 'Admin'
        : groups.includes('SchoolStaff')
          ? 'SchoolStaff'
          : groups.includes('ParentSupportGroup')
            ? 'PsgVolunteer'
            : 'Admin';

    if (cognitoSub) {
      const dbUser = await userService.ensureUserFromToken({
        cognitoSub,
        email: tokenEmailCandidate && String(tokenEmailCandidate).includes('@') ? String(tokenEmailCandidate) : null,
        fullName: req.user?.name || null,
        firstName: req.user?.given_name || null,
        lastName: req.user?.family_name || null,
        role: mappedRole,
      });
      resolvedUserId = dbUser.id;
    } else {
      return res.status(401).json({
        success: false,
        message: 'Missing user identity (Authorization header required)',
      });
    }

    // Fetch all item types for the school
    const itemTypes = await itemTypeService.getAllItemTypesBySchoolIdForCSV(schoolId);

    if (!itemTypes || itemTypes.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No item types found for school ID ${schoolId}`,
      });
    }

    // Validate and normalize categoryId, if provided
    let categoryIdInt = null;
    if (categoryId) {
      if (typeof categoryId !== 'string' || !/^\d+$/.test(categoryId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid categoryId; must be a positive integer',
        });
      }
      categoryIdInt = Number(categoryId);
    }

    // If categoryId provided, filter to that category; otherwise include all
    const filteredItemTypes = categoryIdInt !== null
      ? itemTypes.filter(it => it.categoryId === categoryIdInt)
      : itemTypes;

    if (filteredItemTypes.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No item types found for the specified category',
      });
    }

    // Status columns differ by location
    // School: no "For Repurposing" (repurposing only happens at TCC)
    // TCC: includes "For Repurposing"
    const STATUS_COLUMNS = isSchool
      ? ['For PSG', 'For School Stock', 'For recycling/disposal']
      : ['For PSG', 'For Repurposing', 'For recycling/disposal'];

    const COLUMN_HEADERS = ['location', ...STATUS_COLUMNS, 'remarks'];

    // Group item types by category + colour + gender to deduplicate
    const itemTypesByKey = {};
    for (const itemType of filteredItemTypes) {
      const category = itemType.category?.categoryName ?? 'Unknown';
      const colourName = itemType.primaryColour?.colourName ?? 'Unknown';
      const gender = itemType.gender || '';

      let key = `${category} - ${colourName}`;
      if (gender && gender !== 'Unisex') {
        key += ` - ${gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase()}`;
      }

      if (!itemTypesByKey[key]) {
        itemTypesByKey[key] = [];
      }
      itemTypesByKey[key].push(itemType);
    }

    const excelWorkbook = new ExcelJS.Workbook();
    const fixedValuesRows = [];

    // ── Donations sheet — all item types stacked vertically ──────────────────
    const sheet = excelWorkbook.addWorksheet('Donations');

    // Set column widths
    const colWidths = [18, ...STATUS_COLUMNS.map(() => 22), 25];
    colWidths.forEach((w, i) => {
      sheet.getColumn(i + 1).width = w;
    });

    let currentRow = 1;

    for (const [key, itemTypesForKey] of Object.entries(itemTypesByKey)) {
      const itemType = itemTypesForKey[0];
      const categoryName = itemType.category?.categoryName ?? 'Unknown';
      const colourName = itemType.primaryColour?.colourName ?? 'Unknown';
      const gender = itemType.gender || '';
      const sizeOptions = itemType.sizeCategory?.sizeOptions ?? [];
      const hasMultipleSizes = sizeOptions.length > 1;

      // ── Row 1: Item type label (merged across all columns) ──
      const labelRow = sheet.getRow(currentRow);
      labelRow.getCell(1).value = key;
      labelRow.getCell(1).font = { bold: true, size: 12 };
      labelRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F5E9' } };
      labelRow.getCell(1).protection = { locked: true };

      sheet.mergeCells(currentRow, 1, currentRow, COLUMN_HEADERS.length);

      currentRow++;

      // ── Row 2: Column headers ──
      const headerRow = sheet.getRow(currentRow);
      COLUMN_HEADERS.forEach((h, idx) => {
        const cell = headerRow.getCell(idx + 1);
        cell.value = h;
        cell.font = { bold: true, size: 10 };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD3D3D3' } };
        cell.protection = { locked: true };
      });

      currentRow++;

      // ── Row 3: Data row (single location) ──
      const dataRow = sheet.getRow(currentRow);

      // Location cell (locked)
      dataRow.getCell(1).value = locationLabel;
      dataRow.getCell(1).protection = { locked: true };
      dataRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0F0' } };

      // Status quantity cells (unlocked, default 0)
      STATUS_COLUMNS.forEach((_, idx) => {
        const cell = dataRow.getCell(idx + 2);
        cell.value = 0;
        cell.protection = { locked: false };
      });

      // Remarks cell (unlocked, empty)
      dataRow.getCell(COLUMN_HEADERS.length).value = '';
      dataRow.getCell(COLUMN_HEADERS.length).protection = { locked: false };

      // Data validation for quantity cells (integer >= 0)
      STATUS_COLUMNS.forEach((_, idx) => {
        const colLetter = String.fromCharCode(65 + idx + 1); // B, C, D, ...
        sheet.dataValidations.add(`${colLetter}${currentRow}:${colLetter}${currentRow}`, {
          type: 'whole',
          operator: 'greaterThanOrEqual',
          formulae: [0],
          allowBlank: true,
          showErrorMessage: true,
          errorTitle: 'Invalid quantity',
          error: 'Please enter a whole number (0 or greater)',
        });
      });

      currentRow++;

      // ── Row 4: Empty separator ──
      currentRow++;

      // Add to fixed values
      fixedValuesRows.push({
        item_name: key,
        category_name: categoryName,
        colour_name: colourName,
        gender: gender || 'Unisex',
        item_type_id: itemType.id,
        user_id: resolvedUserId,
        school_id: schoolId,
        donation_drive_id: donationDrive.id,
        location: locationLabel,
        has_sizes: hasMultipleSizes ? 'yes' : 'no',
        available_sizes: sizeOptions.map(s => s.sizeName).join(', '),
      });
    }

    // Protect donations sheet
    await sheet.protect('', {
      selectLockedCells: true,
      selectUnlockedCells: true,
    });

    // ── Fixed values sheet ──────────────────────────────────────────────────
    const fixedSheet = excelWorkbook.addWorksheet('fixed values');
    const fixedHeaders = [
      'item_name', 'category_name', 'colour_name', 'gender', 'item_type_id',
      'user_id', 'school_id', 'donation_drive_id', 'location',
      'has_sizes', 'available_sizes'
    ];

    fixedSheet.columns = fixedHeaders.map(h => ({ header: h, key: h, width: 20 }));

    fixedSheet.getRow(1).eachCell({ includeEmpty: true }, cell => {
      cell.font = { bold: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD3D3D3' } };
    });

    for (const row of fixedValuesRows) {
      fixedSheet.addRow(fixedHeaders.map(h => row[h]));
    }

    await fixedSheet.protect('', {
      selectLockedCells: true,
      selectUnlockedCells: false,
    });

    // ── Instructions sheet ──────────────────────────────────────────────────
    const instrSheet = excelWorkbook.addWorksheet('Instructions');
    instrSheet.getColumn(1).width = 28;
    instrSheet.getColumn(2).width = 60;

    const addInstrRow = (label, value, { bold = false, headerRow = false } = {}) => {
      const row = instrSheet.addRow([label, value]);
      if (headerRow) {
        row.eachCell(cell => {
          cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2E7D32' } };
        });
      } else if (bold) {
        row.getCell(1).font = { bold: true };
      }
      return row;
    };

    addInstrRow('DONATION TEMPLATE GUIDE', '', { headerRow: true });
    instrSheet.addRow([]);
    addInstrRow(`LOCATION: ${locationLabel.toUpperCase()}`, '', { headerRow: true });
    instrSheet.addRow(['', `This template is for items stored at ${locationLabel}.`]);
    instrSheet.addRow([]);
    addInstrRow('HOW TO USE THIS FILE', '', { headerRow: true });
    instrSheet.addRow(['1.', 'All item types are listed in the "Donations" sheet, each in its own section.']);
    instrSheet.addRow(['2.', 'Grey cells (location, item names, headers) are locked — do NOT modify them.']);
    instrSheet.addRow(['3.', 'Enter quantities in the white cells for each status column.']);
    instrSheet.addRow(['4.', 'Add optional remarks in the remarks column.']);
    instrSheet.addRow(['5.', 'Leave cells as 0 for items you are not donating.']);
    instrSheet.addRow(['6.', 'The "fixed values" tab contains metadata — do NOT modify it.']);
    instrSheet.addRow(['7.', 'Save the file and upload it on the Donation Drives page.']);
    instrSheet.addRow([]);
    addInstrRow('STATUS COLUMNS', '', { headerRow: true });
    instrSheet.addRow(['For PSG', 'Items for PSG volunteers to use']);
    if (isSchool) {
      instrSheet.addRow(['For School Stock', 'Items for the school\'s general office stock']);
    }
    if (!isSchool) {
      instrSheet.addRow(['For Repurposing', 'Items to be repurposed into new products']);
    }
    instrSheet.addRow(['For recycling/disposal', 'Items to be recycled or disposed of']);
    instrSheet.addRow([]);
    addInstrRow('SIZE SPLITTING', '', { headerRow: true });
    instrSheet.addRow(['', 'Quantities default to "One Size" when uploaded.']);
    instrSheet.addRow(['', 'If an item type has multiple sizes (see "available_sizes" in fixed values),']);
    instrSheet.addRow(['', 'you can split quantities by size on the upload page before submitting.']);
    instrSheet.addRow([]);
    addInstrRow('NOTES', '', { headerRow: true });
    instrSheet.addRow(['', 'Do not rename, add, or remove any sheets.']);
    instrSheet.addRow(['', 'Do not change column headers or item type labels.']);
    instrSheet.addRow(['', 'Quantities must be whole numbers (0 or greater).']);
    instrSheet.addRow(['', 'Empty cells are treated as 0.']);

    await instrSheet.protect('', { selectLockedCells: true, selectUnlockedCells: false });

    // ── Generate and send ────────────────────────────────────────────────────
    const xlsxBuffer = await excelWorkbook.xlsx.writeBuffer();

    const safeDriveName = (donationDrive.driveName || 'donation_drive')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .substring(0, 50);

    let filename;
    if (categoryId) {
      const safeCategoryName = (filteredItemTypes[0].category?.categoryName || 'items')
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .substring(0, 30);
      filename = `donation_template_${safeCategoryName}_${locationLabel.toLowerCase()}_drive_${safeDriveName}_${donationDrive.id}.xlsx`;
    } else {
      filename = `donation_template_${locationLabel.toLowerCase()}_drive_${safeDriveName}_${donationDrive.id}.xlsx`;
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(xlsxBuffer);

  } catch (error) {
    console.error('Error generating donation CSV template:', error);
    return res.status(500).json({
      success: false,
      message: 'Error generating CSV template',
      error: error.message,
    });
  }
};

module.exports = {
  createDonationDrive,
  getAllDonationDrives,
  getDonationDriveById,
  updateDonationDrive,
  deleteDonationDrive,
  getDonationDrivesBySchool,
  getActiveDonationDrives,
  createDonationDetails,
  uploadDonationCSV,
  getValidatedDonationFiles,
  getValidatedFileContent,
  approveDonationFile,
  denyDonationFile,
  generateDonationCSVTemplate,
};