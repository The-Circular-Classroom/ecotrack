const inventoryService = require('../models/inventoryService');
const transactionService = require('../models/transactionService');
const donationService = require('../models/donationService');
const schoolService = require('../models/schoolService');
const productService = require('../models/productService');
const { mapToCoreCategoryGroup, emptyCoreGroups } = require('../utils/inventorySnapshotGroups');

// ─── HELPERS ───────────────────────────────────────────────────────────────────

function parsePositiveInteger(value) {
    if (value === undefined || value === null || value === '') return null;
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 1) return null;
    return parsed;
}

function decimalToNumber(value) {
    if (value === null || value === undefined) return 0;
    return Number(value);
}

// Snapshot group mapping is status-driven and mutually exclusive:
// GeneralOffice -> schoolStock, ForSale -> psg,
// ForRepurpose -> repurposing, Disposed -> waste.

// ─── 1. getNetworkKPITotals ────────────────────────────────────────────────────
// GET /api/collection/overview/kpi-totals

const getNetworkKPITotals = async (req, res) => {
    try {
        const balances = await inventoryService.getBalancesForKPI();

        const totals = {
            totalPieces: 0,
            ...emptyCoreGroups(),
            totalWeightKg: 0,
        };

        for (const balance of balances) {
            const qty = balance.quantity ?? 0;
            const weightKg = decimalToNumber(balance.itemType?.category?.weightKg) * qty;
            const group = mapToCoreCategoryGroup(balance.itemStatus);

            totals.totalPieces += qty;
            totals.totalWeightKg += weightKg;
            if (group) totals[group] += qty;
        }

        totals.totalWeightKg = Number(totals.totalWeightKg.toFixed(3));

        return res.status(200).json({
            success: true,
            message: 'Network KPI totals retrieved successfully',
            data: totals,
        });
    } catch (error) {
        console.error('Error getting network KPI totals:', error);
        return res.status(500).json({
            success: false,
            message: 'Error getting network KPI totals',
            error: error.message,
        });
    }
};

// ─── 2. getInventoryBySchoolWithCategoryBreakdown ──────────────────────────────
// GET /api/collection/overview/inventory-by-school

const getInventoryBySchoolWithCategoryBreakdown = async (req, res) => {
    try {
        const balances = await inventoryService.getBalancesForSchoolBreakdown();

        const schoolMap = {};

        for (const balance of balances) {
            const school = balance.itemType?.school;
            if (!school) continue;

            const qty = balance.quantity ?? 0;
            const weightKg = decimalToNumber(balance.itemType?.category?.weightKg) * qty;
            const group = mapToCoreCategoryGroup(balance.itemStatus);

            if (!schoolMap[school.id]) {
                schoolMap[school.id] = {
                    schoolId: school.id,
                    schoolName: school.schoolName,
                    totalPieces: 0,
                    totalWeightKg: 0,
                    ...emptyCoreGroups(),
                };
            }

            schoolMap[school.id].totalPieces += qty;
            schoolMap[school.id].totalWeightKg += weightKg;
            if (group) schoolMap[school.id][group] += qty;
        }

        const result = Object.values(schoolMap)
            .map((school) => ({
                ...school,
                totalWeightKg: Number(school.totalWeightKg.toFixed(3)),
            }))
            .sort((a, b) => b.totalPieces - a.totalPieces);

        return res.status(200).json({
            success: true,
            message: 'Inventory by school with category breakdown retrieved successfully',
            data: result,
        });
    } catch (error) {
        console.error('Error getting inventory by school breakdown:', error);
        return res.status(500).json({
            success: false,
            message: 'Error getting inventory by school breakdown',
            error: error.message,
        });
    }
};

// ─── 3. getInventoryByCategoryWithGroupBreakdown ───────────────────────────────
// GET /api/collection/overview/inventory-by-category

const getInventoryByCategoryWithGroupBreakdown = async (req, res) => {
    try {
        const balances = await inventoryService.getBalancesForCategoryBreakdown();

        const categoryMap = {};

        for (const balance of balances) {
            const category = balance.itemType?.category;
            if (!category) continue;

            const qty = balance.quantity ?? 0;
            const weightKg = decimalToNumber(category.weightKg) * qty;
            const group = mapToCoreCategoryGroup(balance.itemStatus);

            if (!categoryMap[category.id]) {
                categoryMap[category.id] = {
                    categoryId: category.id,
                    categoryName: category.categoryName,
                    totalPieces: 0,
                    totalWeightKg: 0,
                    ...emptyCoreGroups(),
                };
            }

            categoryMap[category.id].totalPieces += qty;
            categoryMap[category.id].totalWeightKg += weightKg;
            if (group) categoryMap[category.id][group] += qty;
        }

        const result = Object.values(categoryMap)
            .map((category) => ({
                ...category,
                totalWeightKg: Number(category.totalWeightKg.toFixed(3)),
            }))
            .sort((a, b) => b.totalPieces - a.totalPieces);

        return res.status(200).json({
            success: true,
            message: 'Inventory by category with group breakdown retrieved successfully',
            data: result,
        });
    } catch (error) {
        console.error('Error getting inventory by category breakdown:', error);
        return res.status(500).json({
            success: false,
            message: 'Error getting inventory by category breakdown',
            error: error.message,
        });
    }
};

// ─── 4. getYearlyTrend ────────────────────────────────────────────────────────
// GET /api/collection/overview/yearly-trend?startYear=2021&endYear=2026

const getYearlyTrend = async (req, res) => {
    try {
        const currentYear = new Date().getFullYear();
        const startYear = parsePositiveInteger(req.query.startYear) ?? currentYear - 5;
        const endYear = parsePositiveInteger(req.query.endYear) ?? currentYear;

        if (startYear > endYear) {
            return res.status(400).json({
                success: false,
                message: 'startYear must be less than or equal to endYear',
            });
        }

        const transactions = await transactionService.getTransactionsForYearlyTrend({
            startYear,
            endYear,
        });

        const yearMap = {};
        for (let y = startYear; y <= endYear; y++) {
            yearMap[y] = {
                year: y,
                donated: 0,
                sold: 0,
                repurposed: 0,
                disposed: 0,
                totalWeightKg: 0,
            };
        }

        for (const tx of transactions) {
            const year = new Date(tx.transactionDate).getUTCFullYear();
            if (!yearMap[year]) continue;

            const qty = tx.quantity ?? 0;
            const weightKg = decimalToNumber(tx.itemType?.category?.weightKg) * qty;

            yearMap[year].totalWeightKg += weightKg;

            switch (tx.transactionType) {
                case 'DonationIn':  yearMap[year].donated += qty; break;
                case 'Sale':        yearMap[year].sold += qty; break;
                case 'Repurposing': yearMap[year].repurposed += qty; break;
                case 'Disposal':    yearMap[year].disposed += qty; break;
            }
        }

        const result = Object.values(yearMap).map((entry) => ({
            ...entry,
            totalWeightKg: Number(entry.totalWeightKg.toFixed(3)),
        }));

        return res.status(200).json({
            success: true,
            message: 'Yearly trend retrieved successfully',
            data: {
                filters: { startYear, endYear },
                years: result,
            },
        });
    } catch (error) {
        console.error('Error getting yearly trend:', error);
        return res.status(500).json({
            success: false,
            message: 'Error getting yearly trend',
            error: error.message,
        });
    }
};

// ─── 5. getDriveParticipationSummary ──────────────────────────────────────────
// GET /api/collection/overview/drive-participation?year=2026

const getDriveParticipationSummary = async (req, res) => {
    try {
        const year = parsePositiveInteger(req.query.year);

        const [totalSchools, drives] = await Promise.all([
            schoolService.getTotalSchoolCount(),
            donationService.getDrivesForParticipation(year),
        ]);

        const schoolMap = {};
        for (const drive of drives) {
            if (!drive.school) continue;
            const sid = drive.school.id;

            if (!schoolMap[sid]) {
                schoolMap[sid] = {
                    schoolId: sid,
                    schoolName: drive.school.schoolName,
                    isCooperating: drive.school.isCooperating,
                    driveCount: 0,
                    drives: [],
                };
            }

            schoolMap[sid].driveCount += 1;
            schoolMap[sid].drives.push({
                driveId: drive.id,
                driveName: drive.driveName,
                startDate: drive.startDate,
                endDate: drive.endDate,
                isActive:
                    new Date(drive.startDate) <= new Date() &&
                    new Date(drive.endDate) >= new Date(),
            });
        }

        const participatingSchools = Object.values(schoolMap).sort((a, b) =>
            a.schoolName.localeCompare(b.schoolName)
        );

        const participatingCount = participatingSchools.length;
        const participationRate =
            totalSchools > 0
                ? Number(((participatingCount / totalSchools) * 100).toFixed(2))
                : 0;

        return res.status(200).json({
            success: true,
            message: 'Drive participation summary retrieved successfully',
            data: {
                filters: { year },
                totalSchools,
                participatingCount,
                nonParticipatingCount: totalSchools - participatingCount,
                participationRate,
                schools: participatingSchools,
            },
        });
    } catch (error) {
        console.error('Error getting drive participation summary:', error);
        return res.status(500).json({
            success: false,
            message: 'Error getting drive participation summary',
            error: error.message,
        });
    }
};

// ─── 6. getRepurposingMaterialsByColour ───────────────────────────────────────
// GET /api/collection/overview/repurposing-by-colour

const getRepurposingMaterialsByColour = async (req, res) => {
    try {
        const balances = await inventoryService.getRepurposeBalancesWithColour();

        const colourMap = {};

        for (const balance of balances) {
            const colour = balance.itemType?.primaryColour;
            if (!colour) continue;

            const qty = balance.quantity ?? 0;
            const weightKg = decimalToNumber(balance.itemType?.category?.weightKg) * qty;

            if (!colourMap[colour.id]) {
                colourMap[colour.id] = {
                    colourId: colour.id,
                    colourName: colour.colourName,
                    hexcode: colour.hexcode,
                    totalPieces: 0,
                    totalWeightKg: 0,
                };
            }

            colourMap[colour.id].totalPieces += qty;
            colourMap[colour.id].totalWeightKg += weightKg;
        }

        const result = Object.values(colourMap)
            .map((colour) => ({
                ...colour,
                totalWeightKg: Number(colour.totalWeightKg.toFixed(3)),
            }))
            .sort((a, b) => b.totalPieces - a.totalPieces);

        const grandTotal = result.reduce((sum, c) => sum + c.totalPieces, 0);
        const grandWeightKg = Number(
            result.reduce((sum, c) => sum + c.totalWeightKg, 0).toFixed(3)
        );

        return res.status(200).json({
            success: true,
            message: 'Repurposing materials by colour retrieved successfully',
            data: {
                grandTotal,
                grandWeightKg,
                colours: result,
            },
        });
    } catch (error) {
        console.error('Error getting repurposing materials by colour:', error);
        return res.status(500).json({
            success: false,
            message: 'Error getting repurposing materials by colour',
            error: error.message,
        });
    }
};

// ─── 7. getProductProjections ─────────────────────────────────────────────────
// GET /api/collection/overview/product-projections

const getProductProjections = async (req, res) => {
    try {
        const [recipes, repurposeStock] = await Promise.all([
            productService.getAllRecipesWithIngredients(),
            inventoryService.getRepurposeBalancesForProjections(),
        ]);

        // Build lookup: itemTypeId → { S: qty, L: qty, any: total }
        const stockLookup = {};
        for (const balance of repurposeStock) {
            const itemTypeId = balance.itemType?.id;
            if (!itemTypeId) continue;

            const sizeClass = balance.sizeOption?.sizeClass ?? 'any';
            const qty = balance.quantity ?? 0;

            if (!stockLookup[itemTypeId]) {
                stockLookup[itemTypeId] = { S: 0, L: 0, any: 0 };
            }

            if (sizeClass !== 'any') {
                stockLookup[itemTypeId][sizeClass] =
                    (stockLookup[itemTypeId][sizeClass] ?? 0) + qty;
            }
            // Always accumulate into any so we can fall back if no sizeClass is specified
            stockLookup[itemTypeId].any += qty;
        }

        const projections = recipes
            .map((recipe) => {
                const ingredients = recipe.recipeIngredients ?? [];

                if (!ingredients.length) {
                    return {
                        recipeId: recipe.id,
                        recipeName: recipe.recipeName,
                        productName: recipe.productStyle?.product?.productName ?? 'Unknown',
                        styleName: recipe.productStyle?.style?.styleName ?? null,
                        productType: recipe.productStyle?.product?.productType?.typeName ?? null,
                        school: recipe.productStyle?.product?.school ?? null,
                        estimatedUnits: 0,
                        limitingIngredient: null,
                        ingredients: [],
                    };
                }

                let minPossible = Infinity;
                let limitingIngredient = null;

                const ingredientDetails = ingredients.map((ingredient) => {
                    const itemTypeId = ingredient.itemType?.id;
                    const qtyRequired = decimalToNumber(ingredient.quantityRequired);
                    const sizeClass = ingredient.sizeClass;

                    if (!itemTypeId || qtyRequired <= 0) {
                        return {
                            itemTypeId,
                            categoryName: ingredient.itemType?.category?.categoryName ?? 'Unknown',
                            colourName: ingredient.itemType?.primaryColour?.colourName ?? null,
                            hexcode: ingredient.itemType?.primaryColour?.hexcode ?? null,
                            sizeClass,
                            quantityRequired: qtyRequired,
                            availableStock: 0,
                            possibleUnits: 0,
                        };
                    }

                    const stock = stockLookup[itemTypeId];
                    const available = stock
                        ? sizeClass
                            ? (stock[sizeClass] ?? 0)
                            : stock.any
                        : 0;

                    const possible = Math.floor(available / qtyRequired);

                    if (possible < minPossible) {
                        minPossible = possible;
                        limitingIngredient =
                            ingredient.itemType?.category?.categoryName ?? 'Unknown';
                    }

                    return {
                        itemTypeId,
                        categoryName: ingredient.itemType?.category?.categoryName ?? 'Unknown',
                        colourName: ingredient.itemType?.primaryColour?.colourName ?? null,
                        hexcode: ingredient.itemType?.primaryColour?.hexcode ?? null,
                        sizeClass,
                        quantityRequired: qtyRequired,
                        availableStock: available,
                        possibleUnits: possible,
                    };
                });

                const estimatedUnits = minPossible === Infinity ? 0 : minPossible;

                return {
                    recipeId: recipe.id,
                    recipeName: recipe.recipeName,
                    productName: recipe.productStyle?.product?.productName ?? 'Unknown',
                    styleName: recipe.productStyle?.style?.styleName ?? null,
                    productType: recipe.productStyle?.product?.productType?.typeName ?? null,
                    school: recipe.productStyle?.product?.school ?? null,
                    estimatedUnits,
                    limitingIngredient: estimatedUnits > 0 ? limitingIngredient : null,
                    ingredients: ingredientDetails,
                };
            })
            .sort((a, b) => b.estimatedUnits - a.estimatedUnits);

        const totalEstimatedProducts = projections.reduce(
            (sum, p) => sum + p.estimatedUnits,
            0
        );

        return res.status(200).json({
            success: true,
            message: 'Product projections retrieved successfully',
            data: {
                totalEstimatedProducts,
                projections,
            },
        });
    } catch (error) {
        console.error('Error getting product projections:', error);
        return res.status(500).json({
            success: false,
            message: 'Error getting product projections',
            error: error.message,
        });
    }
};

module.exports = {
    getNetworkKPITotals,
    getInventoryBySchoolWithCategoryBreakdown,
    getInventoryByCategoryWithGroupBreakdown,
    getYearlyTrend,
    getDriveParticipationSummary,
    getRepurposingMaterialsByColour,
    getProductProjections,
};
