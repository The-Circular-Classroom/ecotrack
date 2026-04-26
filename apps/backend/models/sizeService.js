const prisma = require("../services/database/prismaClient");

// GET -- Get all size categories with optional filtering by brand/supplier ID and/or size type
async function getAllSizeCategories(brand_supplier_id, size_type) {
  return prisma.sizeCategory.findMany({
    where: {
      brandSupplierId: brand_supplier_id ? brand_supplier_id : undefined,
      sizeType: size_type ? size_type : undefined,
    },
    include: {
      brandSupplier: true,
      sizeOptions: true,
    },
    orderBy: { id: "asc" },
  });
}

// CREATE -- Create a new size category
async function createSizeCategory(brand_supplier_id, size_type) {
  return prisma.sizeCategory.create({
    data: {
      brandSupplierId: brand_supplier_id,
      sizeType: size_type,
    },
  });
}

// UPDATE -- Update an existing size category
async function updateSizeCategory(id, updates) {
  return prisma.sizeCategory.update({
    where: { id },
    data: updates,
  });
}

// DELETE -- Delete a size category
async function deleteSizeCategory(id) {
  return prisma.sizeCategory.delete({
    where: { id },
  });
}

// GET -- Get all size options
async function getAllSizeOptions() {
  return prisma.sizeOption.findMany({
    include: {
      sizeCategory: {
        include: {
          brandSupplier: true,
        },
      },
    },
    orderBy: [{ sizeCategoryId: "asc" }, { sortOrder: "asc" }],
  });
}

// GET -- Get a size option by its ID
async function getSizeOptionById(id) {
  return prisma.sizeOption.findUnique({
    where: { id },
    include: {
      sizeCategory: {
        include: {
          brandSupplier: true,
        },
      },
    },
  });
}

// CREATE -- Create a new size option
async function createSizeOption(
  size_category_id,
  size_name,
  size_class,
  sort_order,
) {
  return prisma.sizeOption.create({
    data: {
      sizeCategoryId: size_category_id,
      sizeName: size_name,
      sizeClass: size_class,
      sortOrder: sort_order,
    },
  });
}

// UPDATE -- Update an existing size option
async function updateSizeOption(id, updates) {
  return prisma.sizeOption.update({
    where: { id },
    data: updates,
  });
}

// DELETE -- Delete a size option
async function deleteSizeOption(id) {
  return prisma.sizeOption.delete({
    where: { id },
  });
}

module.exports = {
  getAllSizeCategories,
  createSizeCategory,
  updateSizeCategory,
  deleteSizeCategory,
  getAllSizeOptions,
  getSizeOptionById,
  createSizeOption,
  updateSizeOption,
  deleteSizeOption,
};
