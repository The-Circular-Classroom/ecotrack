const schoolInventoryService = require('../models/schoolService');
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

const USER_ROLE_LABELS = {
    SchoolStaff: 'School Staff',
    PsgVolunteer: 'PSG Volunteer',
};

// ─── 1. getSchoolProfile ───────────────────────────────────────────────────────
// Returns school info and contact persons (school staff + PSG volunteers).
// Powers the landing page header and contact directory.
// GET /api/school/:schoolId/profile

const getSchoolProfile = async (req, res) => {
    try {
        const schoolId = parsePositiveInteger(req.params.schoolId);
        if (!schoolId) {
            return res.status(400).json({ success: false, message: 'Invalid schoolId' });
        }

        const school = await schoolInventoryService.getSchoolWithContacts(schoolId);
        if (!school) {
            return res.status(404).json({ success: false, message: 'School not found' });
        }

        // Separate school staff from PSG volunteers
        const schoolStaff = school.users
            .filter((u) => u.role === 'SchoolStaff')
            .map((u) => ({
                id: u.id,
                name: u.fullName ?? `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim(),
                email: u.email,
                phoneNumber: u.phoneNumber ?? null,
                role: USER_ROLE_LABELS.SchoolStaff,
            }));

        const psgVolunteers = school.users
            .filter((u) => u.role === 'PsgVolunteer')
            .map((u) => ({
                id: u.id,
                name: u.fullName ?? `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim(),
                email: u.email,
                phoneNumber: u.phoneNumber ?? null,
                role: USER_ROLE_LABELS.PsgVolunteer,
            }));

        return res.status(200).json({
            success: true,
            message: 'School profile retrieved successfully',
            data: {
                schoolId: school.id,
                schoolName: school.schoolName,
                address: school.address,
                mrtDesc: school.mrtDesc,
                postalCode: school.postalCode,
                mainlevelCode: school.mainlevelCode,
                natureCode: school.natureCode,
                zoneCode: school.zoneCode,
                status: school.status,
                logoUrl: school.logoUrl,
                isCooperating: school.isCooperating,
                contacts: {
                    schoolStaff,
                    psgVolunteers,
                },
            },
        });
    } catch (error) {
        console.error('Error getting school profile:', error);
        return res.status(500).json({
            success: false,
            message: 'Error getting school profile',
            error: error.message,
        });
    }
};

// ─── 2. getSchoolDriveList ────────────────────────────────────────────────────
// Returns all donation drives for a school with dates and status.
// Powers the drive listing on the school landing page.
// GET /api/school/:schoolId/drives

const getSchoolDriveList = async (req, res) => {
    try {
        const schoolId = parsePositiveInteger(req.params.schoolId);
        if (!schoolId) {
            return res.status(400).json({ success: false, message: 'Invalid schoolId' });
        }

        const drives = await schoolInventoryService.getDrivesBySchool(schoolId);
        const now = new Date();

        const result = drives.map((drive) => {
            const start = new Date(drive.startDate);
            const end = new Date(drive.endDate);
            const isActive = start <= now && end >= now;
            const isUpcoming = start > now;
            const isCompleted = end < now;

            return {
                driveId: drive.id,
                driveName: drive.driveName,
                startDate: drive.startDate,
                endDate: drive.endDate,
                location: drive.location,
                status: isActive ? 'active' : isUpcoming ? 'upcoming' : 'completed',
                isActive,
                isUpcoming,
                isCompleted,
                createdBy: drive.createdBy
                    ? {
                        id: drive.createdBy.id,
                        name: drive.createdBy.fullName,
                        role: USER_ROLE_LABELS[drive.createdBy.role] ?? drive.createdBy.role,
                    }
                    : null,
            };
        });

        const summary = {
            total: result.length,
            active: result.filter((d) => d.isActive).length,
            upcoming: result.filter((d) => d.isUpcoming).length,
            completed: result.filter((d) => d.isCompleted).length,
        };

        return res.status(200).json({
            success: true,
            message: 'School drive list retrieved successfully',
            data: { summary, drives: result },
        });
    } catch (error) {
        console.error('Error getting school drive list:', error);
        return res.status(500).json({
            success: false,
            message: 'Error getting school drive list',
            error: error.message,
        });
    }
};

// ─── 3. getSchoolCollectionOverview ──────────────────────────────────────────
// Returns total pieces split into the four core groups + estimated weight.
// Powers the collection overview section on the school landing page.
// Format: total pieces first → four categories → kg calculation.
// GET /api/school/:schoolId/collection-overview

const getSchoolCollectionOverview = async (req, res) => {
    try {
        const schoolId = parsePositiveInteger(req.params.schoolId);
        if (!schoolId) {
            return res.status(400).json({ success: false, message: 'Invalid schoolId' });
        }

        const balances = await schoolInventoryService.getSchoolInventoryBalances(schoolId);

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

        // Compute percentages for each core group
        const percentages = {};
        ['schoolStock', 'psg', 'repurposing', 'waste'].forEach((key) => {
            percentages[key] = totals.totalPieces > 0
                ? Number(((totals[key] / totals.totalPieces) * 100).toFixed(1))
                : 0;
        });

        return res.status(200).json({
            success: true,
            message: 'School collection overview retrieved successfully',
            data: {
                schoolId,
                ...totals,
                percentages,
            },
        });
    } catch (error) {
        console.error('Error getting school collection overview:', error);
        return res.status(500).json({
            success: false,
            message: 'Error getting school collection overview',
            error: error.message,
        });
    }
};

// ─── 4. getSchoolInventoryByItem ──────────────────────────────────────────────
// Returns inventory grouped by item type for a school.
//
// School/PSG view (isAdmin = false):
//   - Shows School Stock + PSG quantities only
//   - Excludes repurposing and waste quantities
//
// Admin view (isAdmin = true):
//   - Shows all four core groups
//
// Powers the "Inventory by Items" page grid.
// GET /api/school/:schoolId/inventory-by-item?isAdmin=false

const getSchoolInventoryByItem = async (req, res) => {
    try {
        const schoolId = parsePositiveInteger(req.params.schoolId);
        const isAdmin = req.query.isAdmin === 'true' || req.user?.role === 'Admin';

        if (!schoolId) {
            return res.status(400).json({ success: false, message: 'Invalid schoolId' });
        }

        const balances = await schoolInventoryService.getInventoryByItemTypeForSchool(schoolId);

        // Group by itemTypeId
        const itemMap = {};

        for (const balance of balances) {
            const itemType = balance.itemType;
            if (!itemType) continue;

            const qty = balance.quantity ?? 0;
            const group = mapToCoreCategoryGroup(balance.itemStatus);

            // School/PSG view excludes repurposing and waste
            if (!isAdmin && (group === 'repurposing' || group === 'waste')) continue;

            if (!itemMap[itemType.id]) {
                itemMap[itemType.id] = {
                    itemTypeId: itemType.id,
                    categoryId: itemType.category?.id ?? null,
                    categoryName: itemType.category?.categoryName ?? 'Unknown',
                    gender: itemType.gender,
                    imageUrl: itemType.imageUrl,
                    primaryColour: itemType.primaryColour ?? null,
                    secondaryColour: itemType.secondaryColour ?? null,
                    weightKg: decimalToNumber(itemType.category?.weightKg),
                    totalPieces: 0,
                    ...emptyCoreGroups(),
                    sizes: {},
                };
            }

            const entry = itemMap[itemType.id];
            entry.totalPieces += qty;
            if (group) entry[group] += qty;

            // Aggregate sizes — only School Stock + PSG for school view
            if (balance.sizeOption && (isAdmin || group === 'schoolStock' || group === 'psg')) {
                const sizeKey = balance.sizeOption.id;
                if (!entry.sizes[sizeKey]) {
                    entry.sizes[sizeKey] = {
                        sizeOptionId: balance.sizeOption.id,
                        sizeName: balance.sizeOption.sizeName,
                        sizeClass: balance.sizeOption.sizeClass,
                        sortOrder: balance.sizeOption.sortOrder,
                        schoolStock: 0,
                        psg: 0,
                        ...(isAdmin ? { repurposing: 0, waste: 0 } : {}),
                        total: 0,
                    };
                }

                entry.sizes[sizeKey].total += qty;
                if (group && entry.sizes[sizeKey][group] !== undefined) {
                    entry.sizes[sizeKey][group] += qty;
                }
            }
        }

        // Category order from client requirements
        const CATEGORY_ORDER = [
            'Uniform Shirt', 'Uniform Shorts', 'Uniform Pants',
            'Uniform Skirt', 'Skort', 'Pinafore', 'Polo Shirt',
            'PE Shirt', 'PE Shorts', 'House Shirt', 'Tie', 'Belt',
        ];

        const result = Object.values(itemMap)
            .map((item) => ({
                ...item,
                sizes: Object.values(item.sizes).sort((a, b) => a.sortOrder - b.sortOrder),
                estimatedWeightKg: Number((item.totalPieces * item.weightKg).toFixed(3)),
            }))
            .sort((a, b) => {
                const ai = CATEGORY_ORDER.indexOf(a.categoryName);
                const bi = CATEGORY_ORDER.indexOf(b.categoryName);
                if (ai === -1 && bi === -1) return a.categoryName.localeCompare(b.categoryName);
                if (ai === -1) return 1;
                if (bi === -1) return -1;
                return ai - bi;
            });

        return res.status(200).json({
            success: true,
            message: 'School inventory by item retrieved successfully',
            data: {
                schoolId,
                isAdmin,
                items: result,
            },
        });
    } catch (error) {
        console.error('Error getting school inventory by item:', error);
        return res.status(500).json({
            success: false,
            message: 'Error getting school inventory by item',
            error: error.message,
        });
    }
};

// ─── 5. getItemTypeDetail ──────────────────────────────────────────────────────
// Returns full detail for a single item type.
//
// School/PSG view: shows total pieces by category, sizes for School Stock + PSG only.
// Admin view: shows all four core groups with full size breakdown per group.
//
// Powers the "Actual Item Page".
// GET /api/school/:schoolId/item/:itemTypeId?isAdmin=false

const getItemTypeDetail = async (req, res) => {
    try {
        const schoolId = parsePositiveInteger(req.params.schoolId);
        const itemTypeId = parsePositiveInteger(req.params.itemTypeId);
        const isAdmin = req.query.isAdmin === 'true' || req.user?.role === 'Admin';

        if (!schoolId || !itemTypeId) {
            return res.status(400).json({ success: false, message: 'Invalid schoolId or itemTypeId' });
        }

        const [itemType, balances] = await Promise.all([
            schoolInventoryService.getItemTypeById(itemTypeId),
            schoolInventoryService.getItemTypeBalances(itemTypeId),
        ]);

        if (!itemType || itemType.school?.id !== schoolId) {
            return res.status(404).json({ success: false, message: 'Item type not found for this school' });
        }

        // Aggregate totals by core group
        const totals = {
            totalPieces: 0,
            ...emptyCoreGroups(),
            totalWeightKg: 0,
        };

        // Size breakdown — school view shows School Stock + PSG only
        // Admin view shows all four groups
        const sizeMap = {};

        for (const balance of balances) {
            const qty = balance.quantity ?? 0;
            const group = mapToCoreCategoryGroup(balance.itemStatus);
            const weightKg = decimalToNumber(itemType.category?.weightKg) * qty;

            totals.totalPieces += qty;
            totals.totalWeightKg += weightKg;
            if (group) totals[group] += qty;

            // Size breakdown
            if (balance.sizeOption) {
                const sizeKey = balance.sizeOption.id;

                if (!sizeMap[sizeKey]) {
                    sizeMap[sizeKey] = {
                        sizeOptionId: balance.sizeOption.id,
                        sizeName: balance.sizeOption.sizeName,
                        sizeClass: balance.sizeOption.sizeClass,
                        sortOrder: balance.sizeOption.sortOrder,
                        lastUpdated: balance.lastUpdated,
                        schoolStock: 0,
                        psg: 0,
                        ...(isAdmin ? { repurposing: 0, waste: 0 } : {}),
                        total: 0,
                    };
                }

                // Only include school stock and PSG in size breakdown for school view
                const includeInSizeBreakdown = isAdmin || group === 'schoolStock' || group === 'psg';
                if (includeInSizeBreakdown) {
                    sizeMap[sizeKey].total += qty;
                    if (group && sizeMap[sizeKey][group] !== undefined) {
                        sizeMap[sizeKey][group] += qty;
                    }
                    // Track most recent lastUpdated
                    if (!sizeMap[sizeKey].lastUpdated || balance.lastUpdated > sizeMap[sizeKey].lastUpdated) {
                        sizeMap[sizeKey].lastUpdated = balance.lastUpdated;
                    }
                }
            }
        }

        totals.totalWeightKg = Number(totals.totalWeightKg.toFixed(3));

        const sizes = Object.values(sizeMap)
            .filter((s) => s.total > 0)
            .sort((a, b) => a.sortOrder - b.sortOrder);

        // For admin view: also split the size listing by core group
        const sizesForAdmin = isAdmin ? {
            schoolStock: sizes.filter((s) => s.schoolStock > 0).map((s) => ({ ...s, quantity: s.schoolStock })),
            psg: sizes.filter((s) => s.psg > 0).map((s) => ({ ...s, quantity: s.psg })),
            repurposing: { total: totals.repurposing }, // no size breakdown for repurposing
            waste: { total: totals.waste },              // no size breakdown for waste
        } : null;

        return res.status(200).json({
            success: true,
            message: 'Item type detail retrieved successfully',
            data: {
                schoolId,
                itemTypeId,
                isAdmin,
                // Item metadata
                categoryName: itemType.category?.categoryName ?? null,
                gender: itemType.gender,
                imageUrl: itemType.imageUrl,
                primaryColour: itemType.primaryColour,
                secondaryColour: itemType.secondaryColour,
                pattern: itemType.pattern,
                material: itemType.material,
                tags: itemType.itemTypeTags?.map((t) => t.tag) ?? [],
                availableSizes: itemType.sizeCategory?.sizeOptions ?? [],
                sizeType: itemType.sizeCategory?.sizeType ?? null,
                brandSupplier: itemType.sizeCategory?.brandSupplier ?? null,
                // Quantities
                totals,
                // Size breakdown (school + PSG only for school view)
                sizes,
                // Admin-only split view
                ...(isAdmin ? { sizesForAdmin } : {}),
            },
        });
    } catch (error) {
        console.error('Error getting item type detail:', error);
        return res.status(500).json({
            success: false,
            message: 'Error getting item type detail',
            error: error.message,
        });
    }
};

// ─── 6. getSchoolCollaborations ───────────────────────────────────────────────
// Returns all SchoolPartnership records for a school.
// Admin only — powers the Collaborations section on the admin school view.
// GET /api/school/:schoolId/collaborations

const getSchoolCollaborations = async (req, res) => {
    try {
        const schoolId = parsePositiveInteger(req.params.schoolId);
        if (!schoolId) {
            return res.status(400).json({ success: false, message: 'Invalid schoolId' });
        }

        const partnerships = await schoolInventoryService.getSchoolPartnerships(schoolId);

        // Group by year for easier rendering
        const byYear = {};
        for (const p of partnerships) {
            const year = p.yearConducted ?? 'Year unknown';
            if (!byYear[year]) byYear[year] = [];
            byYear[year].push({
                id: p.id,
                activityName: p.activityName,
                remarks: p.remarks,
            });
        }

        return res.status(200).json({
            success: true,
            message: 'School collaborations retrieved successfully',
            data: {
                schoolId,
                total: partnerships.length,
                collaborations: partnerships.map((p) => ({
                    id: p.id,
                    activityName: p.activityName,
                    yearConducted: p.yearConducted,
                    remarks: p.remarks,
                })),
                byYear: Object.entries(byYear)
                    .sort(([a], [b]) => Number(b) - Number(a))
                    .map(([year, activities]) => ({ year, activities })),
            },
        });
    } catch (error) {
        console.error('Error getting school collaborations:', error);
        return res.status(500).json({
            success: false,
            message: 'Error getting school collaborations',
            error: error.message,
        });
    }
};

// ─── 7. getSchoolProductsCreated ──────────────────────────────────────────────
// Returns all products and prototypes created for a school.
// Admin only — powers the Products Created and Prototypes sections.
// GET /api/school/:schoolId/products

const getSchoolProductsCreated = async (req, res) => {
    try {
        const schoolId = parsePositiveInteger(req.params.schoolId);
        if (!schoolId) {
            return res.status(400).json({ success: false, message: 'Invalid schoolId' });
        }

        const products = await schoolInventoryService.getProductsBySchool(schoolId);

        const result = products.map((product) => {
            const totalRecipes = product.productStyles.reduce(
                (sum, style) => sum + (style.productRecipes?.length ?? 0), 0
            );
            const totalStyles = product.productStyles.length;

            return {
                productId: product.id,
                productName: product.productName,
                productType: product.productType?.typeName ?? null,
                createdDate: product.createdDate,
                totalStyles,
                totalRecipes,
                styles: product.productStyles.map((style) => ({
                    styleId: style.id,
                    styleName: style.style?.styleName ?? null,
                    imageUrl: style.imageUrl,
                    createdDate: style.createdDate,
                    lastUpdated: style.lastUpdated,
                    recipes: style.productRecipes.map((recipe) => ({
                        recipeId: recipe.id,
                        recipeName: recipe.recipeName,
                        createdDate: recipe.createdDate,
                    })),
                })),
            };
        });

        return res.status(200).json({
            success: true,
            message: 'School products retrieved successfully',
            data: {
                schoolId,
                totalProducts: result.length,
                totalStyles: result.reduce((sum, p) => sum + p.totalStyles, 0),
                totalRecipes: result.reduce((sum, p) => sum + p.totalRecipes, 0),
                products: result,
            },
        });
    } catch (error) {
        console.error('Error getting school products:', error);
        return res.status(500).json({
            success: false,
            message: 'Error getting school products',
            error: error.message,
        });
    }
};

// IMPORT FROM INVENTORY BACKEND
const getAllSchools = async (req, res) => {
    try {
        const schools = await schoolInventoryService.getAllSchools();
        return res.status(200).json({
            success: true,
            message: 'Schools fetched successfully',
            data: schools
        });
    }
    catch (error) {
        console.error('Error fetching schools:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching schools',
            error: error.message,
        });
    }
};

const addSchool = async (req, res) => {
    try {
        const {
            school_name,
            address,
            mrt_desc,
            dgp_code,
            mainlevel_code,
            nature_code,
            type_code,
            postal_code,
            zone_code,
            status,
            is_cooperating,
            logo_url,
            school_email,
            school_number
        } = req.body;
        //to add: validation checkers
        await schoolInventoryService.createSchool({
            school_name,
            address,
            mrt_desc,
            dgp_code,
            mainlevel_code,
            nature_code,
            type_code,
            postal_code,
            zone_code,
            status,
            is_cooperating,
            logo_url,
            school_email,
            school_number
        });
        return res.status(200).json({
            success: true,
            message: 'School created successfully',
        });
    } catch (error) {
        console.error('Database error during school creation:', error);
        return res.status(500).json({
            success: false,
            message: 'Database error during school creation',
            error: error.message,
        });
    }
};

module.exports = {
    getSchoolProfile,
    getSchoolDriveList,
    getSchoolCollectionOverview,
    getSchoolInventoryByItem,
    getItemTypeDetail,
    getSchoolCollaborations,
    getSchoolProductsCreated,
    getAllSchools,
    addSchool
};
