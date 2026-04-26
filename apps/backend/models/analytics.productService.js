const prisma = require('../services/database/prismaClient');

// ── All recipes with ingredients + product/style metadata ────────────────────
// Used by: getProductProjections
// Returns the full recipe tree needed to compute how many products can be made.
async function getAllRecipesWithIngredients() {
    return prisma.productRecipe.findMany({
        select: {
            id: true,
            recipeName: true,
            productStyle: {
                select: {
                    product: {
                        select: {
                            id: true,
                            productName: true,
                            school: { select: { id: true, schoolName: true } },
                            productType: { select: { typeName: true } },
                        },
                    },
                    style: { select: { styleName: true } },
                },
            },
            recipeIngredients: {
                select: {
                    id: true,
                    quantityRequired: true,
                    sizeClass: true,
                    itemType: {
                        select: {
                            id: true,
                            schoolId: true,
                            category: { select: { id: true, categoryName: true } },
                            primaryColour: {
                                select: { id: true, colourName: true, hexcode: true },
                            },
                        },
                    },
                },
            },
        },
    });
}

// ── All products with their styles ───────────────────────────────────────────
// Useful for product listing pages.
async function getAllProductsWithStyles() {
    return prisma.product.findMany({
        select: {
            id: true,
            productName: true,
            school: { select: { id: true, schoolName: true } },
            productType: { select: { typeName: true } },
            productStyles: {
                select: {
                    id: true,
                    style: { select: { styleName: true } },
                    imageUrl: true,
                },
            },
        },
        orderBy: { productName: 'asc' },
    });
}

module.exports = {
    getAllRecipesWithIngredients,
    getAllProductsWithStyles,
};