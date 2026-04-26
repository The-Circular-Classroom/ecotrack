const prisma = require("../services/database/prismaClient");

// GET -- Get all brands
async function getAllBrands() {
  return prisma.brandSupplier.findMany({
    include: {
      sizeCategories: {
        include: {
          sizeOptions: true,
        },
      },
    },
    orderBy: { id: "asc" },
  });
}

// GET -- Get a brand by its ID
async function getBrandById(id) {
  return prisma.brandSupplier.findUnique({
    where: { id },
  });
}

// CREATE -- Create a new brand
async function createBrand(brand_supplier) {
  return prisma.brandSupplier.create({
    data: {
      brandSupplier: brand_supplier,
    },
  });
}

// UPDATE -- Update an existing brand
async function updateBrand(id, brand_supplier) {
  return prisma.brandSupplier.update({
    where: { id },
    data: {
      brandSupplier: brand_supplier,
    },
  });
}

// DELETE -- Delete a brand and its size categories and size options
async function deleteBrand(id) {
  return prisma.$transaction(async (tx) => {
    await tx.sizeOption.deleteMany({
      where: { sizeCategory: { brandSupplierId: id } },
    });
    await tx.sizeCategory.deleteMany({ where: { brandSupplierId: id } });
    return tx.brandSupplier.delete({ where: { id } });
  });
}

// GET -- Get all size categories for a brand
async function getSizeCategoriesByBrandId(id) {
  return prisma.sizeCategory.findMany({
    where: { brandSupplierId: id },
    include: {
      itemTypes: true,
      sizeOptions: {
        include: {
          transactions: true,
          inventoryBalances: true,
        },
      },
    },
  });
}

module.exports = {
  getAllBrands,
  getBrandById,
  createBrand,
  updateBrand,
  deleteBrand,
  getSizeCategoriesByBrandId,
};
