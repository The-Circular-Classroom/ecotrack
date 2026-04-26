// apps/backend/models/assemblyService.js
const prisma = require('../services/database/prismaClient');

const USABLE_STATUSES = ['ForSale', 'ForRepurpose'];

async function getProducts(schoolId = null) {
  const where = schoolId ? { schoolId } : {};

  return prisma.product.findMany({
    where,
    orderBy: [{ school: { schoolName: 'asc' } }, { productName: 'asc' }],
    include: {
      school: { select: { id: true, schoolName: true } },
      productType: { select: { id: true, typeName: true } },
      productStyles: {
        include: {
          style: { select: { id: true, styleName: true } },
          productRecipes: {
            include: {
              recipeIngredients: {
                include: {
                  itemType: {
                    select: {
                      id: true,
                      gender: true,
                      school: { select: { id: true, schoolName: true } },
                      category: { select: { id: true, categoryName: true } },
                      primaryColour: { select: { colourName: true, hexcode: true } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });
}

/**
 * Fetch products by a list of IDs (with their school, styles, recipes and ingredients).
 * Used by calculateAssembly to enrich plan requests with recipe data.
 */
async function getProductsByIds(productIds) {
  return prisma.product.findMany({
    where: { id: { in: productIds } },
    include: {
      school: { select: { id: true, schoolName: true } },
      productStyles: {
        include: {
          style: { select: { id: true, styleName: true } },
          productRecipes: {
            include: {
              recipeIngredients: {
                include: {
                  itemType: {
                    select: {
                      id: true,
                      school: { select: { id: true, schoolName: true } },
                      category: { select: { id: true, categoryName: true } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });
}

/**
 * Fetch raw inventory balance rows for a school.
 * Returns only the fields needed for stock calculations.
 */
async function getStockBalancesForSchool(schoolId) {
  return prisma.inventoryBalance.findMany({
    where: {
      itemStatus: { in: USABLE_STATUSES },
      quantity: { gt: 0 },
      itemType: { schoolId },
    },
    select: {
      quantity: true,
      itemTypeId: true,
      sizeOption: { select: { sizeClass: true } },
    },
  });
}

async function getItemTypesBySchool(schoolId) {
  return prisma.itemType.findMany({
    where: { schoolId },
    orderBy: [{ category: { categoryName: 'asc' } }, { id: 'asc' }],
    select: {
      id: true,
      schoolId: true,
      gender: true,
      school: { select: { id: true, schoolName: true } },
      category: { select: { id: true, categoryName: true } },
      sizeCategory: {
        select: {
          id: true,
          sizeType: true,
          sizeOptions: {
            orderBy: { sortOrder: 'asc' },
            select: { id: true, sizeName: true, sizeClass: true },
          },
        },
      },
    },
  });
}

async function getProductStyleById(productStyleId) {
  return prisma.productStyle.findUnique({
    where: { id: productStyleId },
    include: {
      product: {
        include: {
          school: { select: { id: true, schoolName: true } },
        },
      },
    },
  });
}

async function getItemTypesByIds(itemTypeIds) {
  if (!Array.isArray(itemTypeIds) || itemTypeIds.length === 0) return [];

  return prisma.itemType.findMany({
    where: { id: { in: itemTypeIds } },
    select: {
      id: true,
      schoolId: true,
      category: { select: { id: true, categoryName: true } },
    },
  });
}

async function createRecipe({ productStyleId, recipeName, ingredients }) {
  return prisma.productRecipe.create({
    data: {
      productStyleId,
      recipeName,
      recipeIngredients: {
        create: ingredients.map((ing) => ({
          itemTypeId: ing.itemTypeId,
          quantityRequired: ing.quantityRequired,
          sizeClass: ing.sizeClass,
        })),
      },
    },
    include: {
      recipeIngredients: {
        include: {
          itemType: {
            select: {
              id: true,
              category: { select: { id: true, categoryName: true } },
              school: { select: { id: true, schoolName: true } },
            },
          },
        },
      },
      productStyle: {
        include: {
          product: { select: { id: true, productName: true, schoolId: true } },
          style: { select: { id: true, styleName: true } },
        },
      },
    },
  });
}

async function getRecipeById(recipeId) {
  return prisma.productRecipe.findUnique({
    where: { id: recipeId },
    include: {
      recipeIngredients: true,
      productStyle: {
        include: {
          product: {
            include: {
              school: { select: { id: true, schoolName: true } },
            },
          },
          style: { select: { id: true, styleName: true } },
        },
      },
    },
  });
}

async function updateRecipe(recipeId, { recipeName, ingredients }) {
  return prisma.$transaction(async (tx) => {
    await tx.recipeIngredient.deleteMany({ where: { recipeId } });

    return tx.productRecipe.update({
      where: { id: recipeId },
      data: {
        recipeName,
        recipeIngredients: {
          create: ingredients.map((ing) => ({
            itemTypeId: ing.itemTypeId,
            quantityRequired: ing.quantityRequired,
            sizeClass: ing.sizeClass,
          })),
        },
      },
      include: {
        recipeIngredients: {
          include: {
            itemType: {
              select: {
                id: true,
                category: { select: { id: true, categoryName: true } },
                school: { select: { id: true, schoolName: true } },
              },
            },
          },
        },
        productStyle: {
          include: {
            product: { select: { id: true, productName: true, schoolId: true } },
            style: { select: { id: true, styleName: true } },
          },
        },
      },
    });
  });
}

async function deleteRecipe(recipeId) {
  return prisma.productRecipe.delete({ where: { id: recipeId } });
}

async function getProductTypes() {
  return prisma.productType.findMany({
    orderBy: { typeName: 'asc' },
    select: { id: true, typeName: true },
  });
}

async function getStyles() {
  return prisma.style.findMany({
    orderBy: { styleName: 'asc' },
    select: { id: true, styleName: true },
  });
}

async function createProductWithStyle({ schoolId, productName, productTypeId, styleId }) {
  return prisma.product.create({
    data: {
      schoolId,
      productName,
      productTypeId,
      productStyles: {
        create: {
          styleId,
        },
      },
    },
    include: {
      school: { select: { id: true, schoolName: true } },
      productType: { select: { id: true, typeName: true } },
      productStyles: {
        include: {
          style: { select: { id: true, styleName: true } },
          productRecipes: {
            include: {
              recipeIngredients: {
                include: {
                  itemType: {
                    select: {
                      id: true,
                      category: { select: { id: true, categoryName: true } },
                      school: { select: { id: true, schoolName: true } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });
}

async function findStyleByName(styleName) {
  return prisma.style.findFirst({
    where: {
      styleName: {
        equals: styleName,
        mode: 'insensitive',
      },
    },
    select: { id: true, styleName: true },
  });
}

async function createStyle(styleName) {
  return prisma.style.create({
    data: { styleName },
    select: { id: true, styleName: true },
  });
}

async function findProductTypeByName(typeName) {
  return prisma.productType.findFirst({
    where: {
      typeName: {
        equals: typeName,
        mode: 'insensitive',
      },
    },
    select: { id: true, typeName: true },
  });
}

async function createProductType(typeName) {
  return prisma.productType.create({
    data: { typeName },
    select: { id: true, typeName: true },
  });
}

async function getProductById(productId) {
  return prisma.product.findUnique({
    where: { id: productId },
    include: {
      school: { select: { id: true, schoolName: true } },
      productType: { select: { id: true, typeName: true } },
    },
  });
}

async function updateProductName(productId, productName) {
  return prisma.product.update({
    where: { id: productId },
    data: { productName },
    include: {
      school: { select: { id: true, schoolName: true } },
      productType: { select: { id: true, typeName: true } },
    },
  });
}

async function deleteProduct(productId) {
  return prisma.product.delete({ where: { id: productId } });
}

async function getProductTypeById(productTypeId) {
  return prisma.productType.findUnique({
    where: { id: productTypeId },
    select: { id: true, typeName: true },
  });
}

async function updateProductTypeName(productTypeId, typeName) {
  return prisma.productType.update({
    where: { id: productTypeId },
    data: { typeName },
    select: { id: true, typeName: true },
  });
}

async function deleteProductType(productTypeId) {
  return prisma.productType.delete({ where: { id: productTypeId } });
}

async function getStyleById(styleId) {
  return prisma.style.findUnique({
    where: { id: styleId },
    select: { id: true, styleName: true },
  });
}

async function updateStyleName(styleId, styleName) {
  return prisma.style.update({
    where: { id: styleId },
    data: { styleName },
    select: { id: true, styleName: true },
  });
}

async function deleteStyle(styleId) {
  return prisma.style.delete({ where: { id: styleId } });
}

module.exports = {
  getProducts,
  getProductsByIds,
  getStockBalancesForSchool,
  getItemTypesBySchool,
  getProductStyleById,
  getItemTypesByIds,
  createRecipe,
  getRecipeById,
  updateRecipe,
  deleteRecipe,
  getProductTypes,
  getStyles,
  createProductWithStyle,
  getProductById,
  updateProductName,
  deleteProduct,
  findStyleByName,
  createStyle,
  getStyleById,
  updateStyleName,
  deleteStyle,
  findProductTypeByName,
  createProductType,
  getProductTypeById,
  updateProductTypeName,
  deleteProductType,
};
