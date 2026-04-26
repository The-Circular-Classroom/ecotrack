// apps/backend/controllers/itemTypeController.js
const itemTypeService = require("../models/itemTypeService");
const sizeService = require("../models/sizeService");
const userService = require("../models/userService");
const inventoryService = require("../models/inventoryService");
const tagService = require("../models/tagService");
const { uploadToS3, deleteFromS3 } = require('../services/uploads/s3Service');

function parseIntOrUndefined(v) {
  if (v === undefined) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

const createItemType = async (req, res) => {
  try {
    const body = req.body;

    // required fields (now includes gender)
    const required = ["schoolId", "categoryId", "primaryColourId", "sizeCategoryId", "gender"];
    for (const k of required) {
      if (body[k] === undefined || body[k] === null || body[k] === "") {
        return res.status(400).json({ message: `Missing required field: ${k}` });
      }
    }

    // validate gender enum
    const allowedGenders = new Set(["Unisex", "Male", "Female"]);
    if (!allowedGenders.has(body.gender)) {
      return res.status(400).json({
        message: `Invalid gender. Allowed values: ${Array.from(allowedGenders).join(", ")}`,
      });
    }

    const created = await itemTypeService.createItemType({
      gender: body.gender, // required now
      imageUrl: body.imageUrl,
      schoolId: Number(body.schoolId),
      categoryId: Number(body.categoryId),
      primaryColourId: Number(body.primaryColourId),
      secondaryColourId:
        body.secondaryColourId !== undefined
          ? body.secondaryColourId === null
            ? null
            : Number(body.secondaryColourId)
          : undefined,
      patternId:
        body.patternId !== undefined ? (body.patternId === null ? null : Number(body.patternId)) : undefined,
      materialId:
        body.materialId !== undefined ? (body.materialId === null ? null : Number(body.materialId)) : undefined,
      sizeCategoryId: Number(body.sizeCategoryId),
    });

    return res.status(201).json(created);
  } catch (err) {
    console.error("Create ItemType error:", err);
    return res.status(500).json({ message: "Failed to create item type" });
  }
};

const getItemTypeById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const item = await itemTypeService.getItemTypeById(id);
    if (!item) return res.status(404).json({ message: "ItemType not found" });
    return res.json(item);
  } catch {
    return res.status(500).json({ message: "Failed to fetch item type" });
  }
};

const listItemTypes = async (req, res) => {
  try {
    const result = await itemTypeService.listItemTypes({
      schoolId: parseIntOrUndefined(req.query.schoolId),
      categoryId: parseIntOrUndefined(req.query.categoryId),
      gender: req.query.gender,
      q: req.query.q,
      page: parseIntOrUndefined(req.query.page) ?? 1,
      pageSize: parseIntOrUndefined(req.query.pageSize) ?? 20,
    });
    return res.json(result);
  } catch {
    return res.status(500).json({ message: "Failed to list item types" });
  }
};

const updateItemType = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const body = req.body;

    const updated = await itemTypeService.updateItemType(id, {
      gender: body.gender,
      imageUrl: body.imageUrl,
      schoolId: body.schoolId ? Number(body.schoolId) : undefined,
      categoryId: body.categoryId ? Number(body.categoryId) : undefined,
      primaryColourId: body.primaryColourId ? Number(body.primaryColourId) : undefined,
      secondaryColourId:
        body.secondaryColourId !== undefined
          ? body.secondaryColourId === null
            ? null
            : Number(body.secondaryColourId)
          : undefined,
      patternId: body.patternId !== undefined ? (body.patternId === null ? null : Number(body.patternId)) : undefined,
      materialId:
        body.materialId !== undefined ? (body.materialId === null ? null : Number(body.materialId)) : undefined,
      sizeCategoryId: body.sizeCategoryId ? Number(body.sizeCategoryId) : undefined,
    });

    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ message: "Failed to update item type" });
  }
};

const deleteItemType = async (req, res) => {
  try {
    const id = Number(req.params.id);
    await itemTypeService.deleteItemType(id);
    return res.status(204).send();
  } catch (err) {
    // Most common: foreign key restriction due to transactions/inventory balances.
    return res.status(409).json({
      message:
        "Cannot delete item type because it is referenced by inventory balances or transactions. Consider soft delete.",
    });
  }
};

/**
 * GET /api/item-type/psg/items
 * Updated: prefer req.user.sub (Cognito) → userService.getSchoolIdByCognitoSub(sub)
 * Legacy support: user_id (numeric DB id)
 */
const getPSGItemTypePreset = async (req, res) => {
  try {
    const cognitoSub = req.user?.sub;

    let school_id = null;

    if (cognitoSub) {
      const user = await userService.getSchoolIdByCognitoSub(cognitoSub);
      school_id = user?.schoolId ?? null;
    } else {
      // legacy fallback (avoid using this in frontend)
      const user_id = req.query.user_id ?? req.body?.user_id;
      if (user_id == null) {
        return res.status(400).json({
          message: "Missing user identity. Provide Authorization header (preferred) or user_id (legacy).",
        });
      }

      const parsedUserId = parseIntOrUndefined(user_id);
      if (parsedUserId === undefined) {
        return res.status(400).json({ message: "user_id must be a numeric value" });
      }

      const user = await userService.getSchoolIdByUserId(parsedUserId);
      school_id = user?.schoolId ?? null;
    }

    if (school_id == null) {
      return res.status(400).json({ message: "User has no school" });
    }

    const page = parseIntOrUndefined(req.query.page) ?? 1;
    const pageSize = Math.min(100, Math.max(1, parseIntOrUndefined(req.query.pageSize) ?? 50));
    const categoryId = parseIntOrUndefined(req.query.categoryId);
    const itemStatus = req.query.itemStatus || undefined;
    const storedAt = req.query.storedAt || undefined;

    const [itemTypes, totalItemTypes] = await Promise.all([
      itemTypeService.getItemTypeBySchoolId(school_id, {
        page,
        pageSize,
        categoryId,
        itemStatus,
        storedAt,
      }),
      itemTypeService.getItemTypeCountBySchoolId(school_id, categoryId ?? undefined),
    ]);

    const rows = [];
    for (const it of itemTypes) {
      const gender = it.gender ?? null;
      const image_url = it.imageUrl ?? null;
      const school_name = it.school?.schoolName ?? null;
      const category_name = it.category?.categoryName ?? null;
      const colour_name = it.primaryColour?.colourName ?? null;
      const hexcode = it.primaryColour?.hexcode ?? null;
      const pattern_name = it.pattern?.patternName ?? null;
      const material_name = it.material?.materialName ?? null;

      for (const bal of it.inventoryBalance) {
        rows.push({
          item_type_id: it.id,
          gender,
          image_url,
          school_name,
          category_name,
          colour_name,
          hexcode,
          pattern_name,
          material_name,
          size_name: bal.sizeOption?.sizeName ?? null,
          size_sort_order: bal.sizeOption?.sortOrder ?? null,
          brand: bal.sizeOption?.sizeCategory?.brandSupplier?.brandSupplier ?? null,
          quantity: bal.quantity,
          item_status: bal.itemStatus,
          stored_at: bal.storedAt,
          school_id: school_id,
        });
      }

      if (it.inventoryBalance.length === 0) {
        rows.push({
          item_type_id: it.id,
          gender,
          image_url: it.imageUrl ?? null,
          school_name,
          category_name: it.category?.categoryName ?? null,
          colour_name: it.primaryColour?.colourName ?? null,
          hexcode: it.primaryColour?.hexcode ?? null,
          pattern_name: it.pattern?.patternName ?? null,
          material_name: it.material?.materialName ?? null,
          size_name: null,
          size_sort_order: null,
          brand: null,
          quantity: null,
          item_status: null,
          stored_at: null,
          school_id: school_id,
        });
      }
    }

    const totalPages = Math.max(1, Math.ceil(totalItemTypes / pageSize));

    return res.status(200).json({
      success: true,
      school_id,
      count: rows.length,
      data: rows,
      meta: {
        page,
        pageSize,
        totalItemTypes,
        totalPages,
      },
    });
  } catch (err) {
    console.error("Error fetching item type presets by school ID:", err);
    return res.status(500).json({ message: "Failed to fetch item type presets by school ID" });
  }
};

const getAllItemTypePresets = async (req, res) => {
  try {
    const [itemTypes, totalItemTypes] = await Promise.all([
      itemTypeService.getAllItemTypes(),
      itemTypeService.getAllItemTypesCount(),
    ]);

    // Deduplicate by item_type_id — frontend only needs one row per preset
    const seen = new Set();
    const rows = [];

    for (const it of itemTypes) {
      if (seen.has(it.id)) continue;
      seen.add(it.id);

      // Grab brand: prefer inventoryBalance sizeOption chain, fall back to direct sizeCategory (for newly created presets with no inventory yet)
      const brand =
        it.inventoryBalance?.[0]?.sizeOption?.sizeCategory?.brandSupplier?.brandSupplier ??
        it.sizeCategory?.brandSupplier?.brandSupplier ??
        null;

      rows.push({
        item_type_id: it.id,
        image_url: it.imageUrl ?? null,
        school_name: it.school?.schoolName ?? null,
        category_name: it.category?.categoryName ?? null,
        material: it.material?.materialName ?? null,
        colour_name: it.primaryColour?.colourName ?? null,
        hexcode: it.primaryColour?.hexcode ?? null,
        gender: it.gender ?? null,
        brand
      });
    }

    return res.status(200).json({
      success: true,
      count: rows.length,
      total: totalItemTypes,
      data: rows
    });
  } catch (err) {
    console.error('Error fetching all item type presets:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch all item type presets',
    });
  }
};

const getItemTypePresetById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ success: false, message: 'Invalid ID' });
    }

    const item = await itemTypeService.getItemTypeById(Number(id));

    if (!item) {
      return res.status(404).json({ success: false, message: 'Item type not found' });
    }

    return res.status(200).json({
      success: true,
      data: {
        item_type_id: item.id,
        schoolId: item.schoolId,
        schoolName: item.school?.schoolName ?? null,
        categoryId: item.categoryId,
        primaryColourId: item.primaryColourId,
        secondaryColourId: item.secondaryColourId ?? null,
        brandSupplierId: item.sizeCategory?.brandSupplierId ?? null,
        sizeType: item.sizeCategory?.sizeType ?? null,
        materialId: item.materialId ?? null,
        patternId: item.patternId ?? null,
        gender: item.gender,
        imageUrl: item.imageUrl ?? null,
        tags: item.itemTypeTags?.map(t => t.tagId) ?? [],
      }
    });
  } catch (err) {
    console.error('Error fetching item type preset by ID:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch item type preset' });
  }
};

const createItemTypePreset = async (req, res) => {
  try {
    const { schoolId, schoolName, categoryId, primaryColourId, brandSupplierId, sizeType, gender, ...optionalFields } = req.body;

    // Validate required fields
    const required = { schoolId, schoolName, categoryId, primaryColourId, brandSupplierId, sizeType, gender };
    const missingField = Object.entries(required).find(([_, value]) => value === undefined || value === null || value === "");

    if (missingField) {
      return res.status(400).json({
        success: false,
        message: `Missing required field: ${missingField[0]}`
      });
    }

    // Verify size category exists
    const sizeCategory = await sizeService.getAllSizeCategories(Number(brandSupplierId), sizeType);
    if (!sizeCategory || sizeCategory.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Size category not found'
      });
    }

    // Verify tags exist (if provided)
    if (optionalFields.tags && optionalFields.tags.length > 0) {
      const tagChecks = await Promise.all(
        optionalFields.tags.map(tagId => tagService.getTagById(Number(tagId)))
      );

      const invalidTags = optionalFields.tags.filter((tagId, index) => !tagChecks[index]);

      if (invalidTags.length > 0) {
        return res.status(404).json({
          success: false,
          message: `Tags not found: ${invalidTags.join(', ')}`
        });
      }
    }

    // Upload image to S3 (if provided)
    let imageUrl = null;
    if (req.file) {
      const bucketName = process.env.S3_IMAGE_BUCKET_NAME;
      if (!bucketName) {
        return res.status(500).json({
          success: false,
          message: 'S3 image bucket not configured. Please set S3_IMAGE_BUCKET_NAME environment variable.'
        });
      }

      const timestamp = Date.now();

      // Enhanced filename sanitization for security
      const sanitizedFileName = req.file.originalname
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        .replace(/^\.+/, '') // Remove leading dots
        .replace(/\.{2,}/g, '.') // Replace multiple dots with single dot
        .substring(0, 100); // Limit filename length

      // Validate sanitized filename
      if (!sanitizedFileName || sanitizedFileName === '') {
        return res.status(400).json({
          success: false,
          message: 'Invalid filename after sanitization'
        });
      }

      const s3Key = `uniform-graphics/schools/${schoolName}/${timestamp}_${sanitizedFileName}`;
      const result = await uploadToS3(req.file.buffer, s3Key, bucketName);
      imageUrl = result.location;
    }

    // Helper to convert to number if defined and not null
    const formattedNumber = (value) =>
      value !== undefined ? (value === null ? null : Number(value)) : undefined;

    // Build base item type object
    const baseItemType = {
      schoolId: Number(schoolId),
      categoryId: Number(categoryId),
      primaryColourId: Number(primaryColourId),
      sizeCategoryId: Number(sizeCategory[0].id),
      brandSupplierId: formattedNumber(brandSupplierId),
      gender,
      materialId: formattedNumber(optionalFields.materialId),
      secondaryColourId: formattedNumber(optionalFields.secondaryColourId),
      patternId: formattedNumber(optionalFields.patternId),
      imageUrl: imageUrl
    };

    // Step 1: Create ONE item type
    const createdItem = await itemTypeService.createItemType(baseItemType);

    // Step 2: Create item_type_tag records (if tags provided)
    if (optionalFields.tags && optionalFields.tags.length > 0) {
      await Promise.all(
        optionalFields.tags.map(tagId =>
          tagService.createItemTypeTag(Number(createdItem.id), Number(tagId))
        )
      );
    }

    // Step 3: Create 5 inventory balance records (one per status) for each store location
    const statuses = ['ForSale', 'Sold', 'ForRepurpose', 'Repurposed', 'Disposed'];
    const storeAt = ['School', 'TCC', 'Exited'];

    // Create School records first, then TCC
    for (const location of storeAt) {
      await Promise.all(
        sizeCategory[0].sizeOptions.flatMap(sizeOption =>
          statuses.map(status =>
            inventoryService.incrementBalance({
              item_type_id: createdItem.id,
              size_option_id: sizeOption.id,
              quantity: 0,
              status,
              stored_at: location,
            })
          )
        )
      );
    }

    return res.status(201).json({
      success: true,
      message: "Item type preset created successfully",
      data: createdItem,
    });
  } catch (error) {
    console.error('Error creating item type preset:', error);
    return res.status(500).json({
      success: false,
      message: 'Error creating item type preset',
      error: error.message
    });
  }
};

const updateItemTypePreset = async (req, res) => {
  try {
    const { id } = req.params;
    const { schoolId, schoolName, categoryId, primaryColourId, brandSupplierId, sizeType, gender, ...optionalFields } = req.body;

    // Validate required fields
    const required = { schoolId, schoolName, categoryId, primaryColourId, brandSupplierId, sizeType, gender };
    const missingField = Object.entries(required).find(([_, value]) => value === undefined || value === null || value === "");

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({
        success: false,
        message: "Invalid or missing item type ID"
      });
    }

    if (missingField) {
      return res.status(400).json({
        success: false,
        message: `Missing required field: ${missingField[0]}`
      });
    }

    // Check if item type exists
    const existingItemType = await itemTypeService.getItemTypeById(Number(id));
    if (!existingItemType) {
      return res.status(404).json({
        success: false,
        message: "Item type not found"
      });
    }

    // Verify size category exists
    const sizeCategory = await sizeService.getAllSizeCategories(Number(brandSupplierId), sizeType);
    if (!sizeCategory || sizeCategory.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Size category not found'
      });
    }

    // Verify tags exist (if provided)
    if (optionalFields.tags && optionalFields.tags.length > 0) {
      const tagChecks = await Promise.all(
        optionalFields.tags.map(tagId => tagService.getTagById(Number(tagId)))
      );

      const invalidTags = optionalFields.tags.filter((tagId, index) => !tagChecks[index]);

      if (invalidTags.length > 0) {
        return res.status(404).json({
          success: false,
          message: "Tags not found"
        });
      }
    }

    // Handle image — 3 cases: new upload, remove, or keep existing
    const bucketName = process.env.S3_IMAGE_BUCKET_NAME;
    let imageUrl = existingItemType.imageUrl; // default: keep existing

    if (req.file) {
      // Case 1: New image uploaded — delete old from S3 first, then upload new
      if (!bucketName) {
        return res.status(500).json({
          success: false,
          message: 'S3 image bucket not configured. Please set S3_IMAGE_BUCKET_NAME environment variable.'
        });
      }

      if (existingItemType.imageUrl) {
        try {
          await deleteFromS3(existingItemType.imageUrl, bucketName);
        } catch (err) {
          console.warn('Failed to delete old image from S3:', err.message);
        }
      }

      const sanitizedFileName = req.file.originalname
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        .replace(/^\.+/, '')
        .replace(/\.{2,}/g, '.')
        .substring(0, 100);

      if (!sanitizedFileName) {
        return res.status(400).json({
          success: false,
          message: 'Invalid filename after sanitization'
        });
      }

      const s3Key = `uniform-graphics/schools/${schoolName}/${Date.now()}_${sanitizedFileName}`;
      const result = await uploadToS3(req.file.buffer, s3Key, bucketName);
      imageUrl = result.location;

    } else if (optionalFields.removeImage === 'true' || optionalFields.removeImage === true) {
      // Case 2: User explicitly removed image — delete from S3
      if (existingItemType.imageUrl) {
        if (!bucketName) {
          return res.status(500).json({
            success: false,
            message: 'S3 image bucket not configured. Please set S3_IMAGE_BUCKET_NAME environment variable.'
          });
        }
        try {
          await deleteFromS3(existingItemType.imageUrl, bucketName);
        } catch (err) {
          console.warn('Failed to delete image from S3:', err.message);
        }
      }
      imageUrl = null;
    }

    // Helper to convert to number if defined and not null
    const formattedNumber = (value) => {
      if (value === undefined) return undefined;
      if (value === null || value === 'null') return null;
      return Number(value);
    };

    const updateData = {
      schoolId: Number(schoolId),
      categoryId: Number(categoryId),
      primaryColourId: Number(primaryColourId),
      brandSupplierId: Number(brandSupplierId),
      sizeCategoryId: Number(sizeCategory[0].id),
      gender,
      materialId: formattedNumber(optionalFields.materialId),
      secondaryColourId: formattedNumber(optionalFields.secondaryColourId),
      patternId: formattedNumber(optionalFields.patternId),
      imageUrl,
    };

    // Update item type
    await itemTypeService.updateItemType(Number(id), updateData);

    // Update tags if provided (only modifies changed tags)
    if (optionalFields.tags !== undefined) {
      // Step 1: Check if tags exist before deleting
      const existingItemTypeTags = await tagService.getItemTypeTagsByItemTypeId(Number(id));
      const existingTagIds = existingItemTypeTags.map(tag => tag.tagId);

      // Step 2: Convert new tags to numbers for comparison
      const newTagIds = optionalFields.tags.map(id => Number(id));

      // Step 3: Calculate differences between existing and new tags
      // tagsToDelete: tags that exist in database but not in the new request
      // Example: existing [2, 5, 8], new [2, 6] → delete [5, 8]
      const tagsToDelete = existingTagIds.filter(tagId => !newTagIds.includes(tagId));

      // tagsToAdd: tags that exist in new request but not in database
      // Example: existing [2, 5], new [2, 5, 6] → add [6]
      const tagsToAdd = newTagIds.filter(tagId => !existingTagIds.includes(tagId));

      // Step 4: Delete tags that were removed (only if there are any)
      if (tagsToDelete.length > 0) {
        await Promise.all(
          tagsToDelete.map(tagId =>
            tagService.deleteItemTypeTag(Number(id), tagId)
          )
        );
      }

      // Step 5: Add new tags (only if there are any)
      if (tagsToAdd.length > 0) {
        await Promise.all(
          tagsToAdd.map(tagId =>
            tagService.createItemTypeTag(Number(id), tagId)
          )
        );
      }

      // Step 6: Log if no changes were needed
      // This happens when the new tags array is identical to existing tags
      if (tagsToDelete.length === 0 && tagsToAdd.length === 0) {
        console.log('No tag changes needed');
      }
    }

    // Fetch updated item type
    const updatedItem = await itemTypeService.getItemTypeById(Number(id));

    return res.status(200).json({
      success: true,
      message: "Item type preset updated successfully",
      data: updatedItem,
    });
  } catch (error) {
    console.error('Error updating item type preset:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating item type preset',
      error: error.message
    });
  }
};

const deleteItemTypePreset = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({
        success: false,
        message: "Invalid or missing item type ID"
      });
    }

    // Check if item type exists
    const existingItemType = await itemTypeService.getItemTypeById(Number(id));
    if (!existingItemType) {
      return res.status(404).json({
        success: false,
        message: "Item type not found"
      });
    }

    // Check if any inventory balance has quantity > 0 for any status
    const existingInventoryBalances = await inventoryService.getInventoryBalance(Number(id));
    const hasQuantity = existingInventoryBalances.some(balance => balance.quantity > 0);
    if (hasQuantity) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete. Inventory balances with quantity greater than 0 exist for any status for this size option"
      });
    }

    // Delete related records in order
    // Step 1: Check whether item type tags exist, then delete if they do
    const existingItemTypeTags = await tagService.getItemTypeTagsByItemTypeId(Number(id));
    if (existingItemTypeTags.length > 0) {
      await tagService.deleteAllItemTypeTags(Number(id));
    }

    // Step 2: Delete inventory balances for this specific size option
    await inventoryService.deleteInventoryBalancesByPreset(Number(id));

    // Step 3: Delete image from S3 if exists
    if (existingItemType.imageUrl) {
      const bucketName = process.env.S3_IMAGE_BUCKET_NAME;
      if (bucketName) {
        try {
          await deleteFromS3(existingItemType.imageUrl, bucketName);
        } catch (err) {
          console.warn('Failed to delete image from S3:', err.message);
        }
      }
    }

    // Step 4: Delete item type
    await itemTypeService.deleteItemType(Number(id));

    return res.status(200).json({
      success: true,
      message: "Item type preset deleted successfully"
    });
  } catch (error) {
    console.error('Error deleting item type preset:', error);
    return res.status(500).json({
      success: false,
      message: 'Error deleting item type preset',
      error: error.message
    });
  }
};

const getAdminItemTypePreset = async (req, res) => {
  try {
    const schoolId = Number(req.query.schoolId);
    if (!Number.isFinite(schoolId)) {
      return res.status(400).json({ message: "schoolId is required and must be numeric" });
    }

    const page = parseIntOrUndefined(req.query.page) ?? 1;
    const pageSize = Math.min(100, Math.max(1, parseIntOrUndefined(req.query.pageSize) ?? 50));
    const categoryId = parseIntOrUndefined(req.query.categoryId);
    const itemStatus = req.query.itemStatus || undefined;
    const storedAt = req.query.storedAt || undefined;

    const [itemTypes, totalItemTypes] = await Promise.all([
      itemTypeService.getItemTypeBySchoolId(schoolId, {
        page,
        pageSize,
        categoryId,
        itemStatus,
        storedAt,
      }),
      itemTypeService.getItemTypeCountBySchoolId(schoolId, categoryId ?? undefined),
    ]);

    const rows = [];
    for (const it of itemTypes) {
      const gender = it.gender ?? null;
      const image_url = it.imageUrl ?? null;
      const school_name = it.school?.schoolName ?? null;
      const category_name = it.category?.categoryName ?? null;
      const primary_colour = it.primaryColour?.colourName ?? null;
      const secondary_colour = it.secondaryColour?.colourName ?? null;
      const primary_colour_hexcode = it.primaryColour?.hexcode ?? null;
      const secondary_colour_hexcode = it.secondaryColour?.hexcode ?? null;
      const pattern_name = it.pattern?.patternName ?? null;
      const material_name = it.material?.materialName ?? null;

      for (const bal of it.inventoryBalance) {
        rows.push({
          item_type_id: it.id,
          gender,
          image_url,
          school_name,
          category_name,
          primary_colour,
          secondary_colour,
          primary_colour_hexcode,
          secondary_colour_hexcode,
          pattern_name,
          material_name,
          size_name: bal.sizeOption?.sizeName ?? null,
          size_sort_order: bal.sizeOption?.sortOrder ?? null,
          brand: bal.sizeOption?.sizeCategory?.brandSupplier?.brandSupplier ?? null,
          quantity: bal.quantity,
          item_status: bal.itemStatus,
          stored_at: bal.storedAt,
          school_id: schoolId,
        });
      }

      if (it.inventoryBalance.length === 0) {
        rows.push({
          item_type_id: it.id,
          gender,
          image_url,
          school_name,
          category_name,
          primary_colour,
          secondary_colour,
          primary_colour_hexcode,
          secondary_colour_hexcode,
          pattern_name,
          material_name,
          size_name: null,
          size_sort_order: null,
          brand: null,
          quantity: null,
          item_status: null,
          stored_at: null,
          school_id: schoolId,
        });
      }
    }

    const totalPages = Math.max(1, Math.ceil(totalItemTypes / pageSize));

    return res.status(200).json({
      success: true,
      school_id: schoolId,
      count: rows.length,
      data: rows,
      meta: { page, pageSize, totalItemTypes, totalPages },
    });
  } catch (err) {
    console.error("Error fetching admin item type presets:", err);
    return res.status(500).json({ message: "Failed to fetch admin item type presets" });
  }
};

module.exports = {
  createItemType,
  getItemTypeById,
  listItemTypes,
  updateItemType,
  deleteItemType,
  getPSGItemTypePreset,
  getAllItemTypePresets,
  getItemTypePresetById,
  createItemTypePreset,
  updateItemTypePreset,
  deleteItemTypePreset,
  getAdminItemTypePreset
}