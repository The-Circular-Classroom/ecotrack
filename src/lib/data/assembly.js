import { prisma } from '@/lib/prisma';

function productInclude() {
  return {
    school: { select: { id: true, schoolName: true } },
    productType: true,
    productStyles: {
      include: {
        style: true,
        productRecipes: {
          include: {
            recipeIngredients: {
              include: {
                itemType: {
                  select: {
                    id: true,
                    category: { select: { id: true, categoryName: true } },
                    primaryColour: { select: { id: true, colourName: true } },
                    school: { select: { id: true, schoolName: true } },
                  },
                },
              },
            },
          },
        },
      },
    },
  };
}

function parseIntOrNull(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const parsed = Number.parseInt(String(value), 10);
  return Number.isNaN(parsed) ? null : parsed;
}

export async function getProducts({ schoolId } = {}) {
  return prisma.product.findMany({
    where: schoolId ? { schoolId: Number(schoolId) } : undefined,
    orderBy: { id: 'asc' },
    include: productInclude(),
  });
}

export async function getProductOptions() {
  const [productTypes, styles] = await Promise.all([
    prisma.productType.findMany({ orderBy: { typeName: 'asc' } }),
    prisma.style.findMany({ orderBy: { styleName: 'asc' } }),
  ]);

  return { productTypes, styles };
}

export async function getItemTypes({ schoolId } = {}) {
  return prisma.itemType.findMany({
    where: schoolId ? { schoolId: Number(schoolId) } : undefined,
    orderBy: { id: 'asc' },
    include: {
      school: true,
      category: true,
      primaryColour: true,
      secondaryColour: true,
      pattern: true,
      material: true,
      sizeCategory: true,
    },
  });
}

export async function calculateAssembly(requests = []) {
  const requestList = Array.isArray(requests) ? requests : [];
  const results = [];

  for (const request of requestList) {
    const product = await prisma.product.findUnique({
      where: { id: Number(request.productId) },
      include: productInclude(),
    });

    if (!product) {
      results.push({ ...request, error: 'Product not found' });
      continue;
    }

    const targetQuantity = parseIntOrNull(request.targetQuantity) ?? 1;
    const recipeSummary = [];

    for (const productStyle of product.productStyles) {
      for (const recipe of productStyle.productRecipes) {
        for (const ingredient of recipe.recipeIngredients) {
          recipeSummary.push({
            productStyleId: productStyle.id,
            productStyleName: productStyle.style?.styleName ?? null,
            recipeId: recipe.id,
            recipeName: recipe.recipeName,
            itemTypeId: ingredient.itemTypeId,
            itemTypeName: ingredient.itemType?.category?.categoryName ?? `Item Type ${ingredient.itemTypeId}`,
            quantityRequired: Number(ingredient.quantityRequired) * targetQuantity,
            sizeClass: ingredient.sizeClass,
          });
        }
      }
    }

    results.push({
      ...request,
      product,
      targetQuantity,
      ingredients: recipeSummary,
    });
  }

  return results;
}

export async function createProduct(input) {
  const product = await prisma.product.create({
    data: {
      productName: input.productName,
      schoolId: parseIntOrNull(input.schoolId),
      productTypeId: Number(input.productTypeId),
      productStyles: input.styleId
        ? { create: [{ styleId: Number(input.styleId) }] }
        : undefined,
    },
    include: productInclude(),
  });

  return product;
}

export async function updateProduct(productId, input) {
  return prisma.product.update({
    where: { id: Number(productId) },
    data: {
      ...(input.productName ? { productName: input.productName } : {}),
      ...(input.schoolId !== undefined ? { schoolId: parseIntOrNull(input.schoolId) } : {}),
      ...(input.productTypeId !== undefined ? { productTypeId: Number(input.productTypeId) } : {}),
    },
    include: productInclude(),
  });
}

export async function deleteProduct(productId) {
  return prisma.product.delete({ where: { id: Number(productId) } });
}

export async function createProductType(input) {
  return prisma.productType.create({ data: { typeName: input.typeName } });
}

export async function updateProductType(productTypeId, input) {
  return prisma.productType.update({
    where: { id: Number(productTypeId) },
    data: { ...(input.typeName ? { typeName: input.typeName } : {}) },
  });
}

export async function deleteProductType(productTypeId) {
  return prisma.productType.delete({ where: { id: Number(productTypeId) } });
}

export async function createStyle(input) {
  return prisma.style.create({ data: { styleName: input.styleName } });
}

export async function updateStyle(styleId, input) {
  return prisma.style.update({
    where: { id: Number(styleId) },
    data: { ...(input.styleName ? { styleName: input.styleName } : {}) },
  });
}

export async function deleteStyle(styleId) {
  return prisma.style.delete({ where: { id: Number(styleId) } });
}

export async function createRecipe(input) {
  return prisma.productRecipe.create({
    data: {
      recipeName: input.recipeName,
      productStyleId: Number(input.productStyleId),
      recipeIngredients: Array.isArray(input.ingredients)
        ? {
            create: input.ingredients.map((ingredient) => ({
              itemTypeId: Number(ingredient.itemTypeId),
              quantityRequired: ingredient.quantityRequired,
              sizeClass: ingredient.sizeClass || null,
            })),
          }
        : undefined,
    },
    include: {
      recipeIngredients: { include: { itemType: true } },
    },
  });
}

export async function updateRecipe(recipeId, input) {
  return prisma.productRecipe.update({
    where: { id: Number(recipeId) },
    data: {
      ...(input.recipeName ? { recipeName: input.recipeName } : {}),
      ...(Array.isArray(input.ingredients)
        ? {
            recipeIngredients: {
              deleteMany: {},
              create: input.ingredients.map((ingredient) => ({
                itemTypeId: Number(ingredient.itemTypeId),
                quantityRequired: ingredient.quantityRequired,
                sizeClass: ingredient.sizeClass || null,
              })),
            },
          }
        : {}),
    },
    include: {
      recipeIngredients: { include: { itemType: true } },
    },
  });
}

export async function deleteRecipe(recipeId) {
  return prisma.productRecipe.delete({ where: { id: Number(recipeId) } });
}
