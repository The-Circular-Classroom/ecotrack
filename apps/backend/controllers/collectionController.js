const transactionService = require('../models/transactionService');
const inventoryService = require('../models/inventoryService');
const donationService = require('../models/donationService');
const categoryService = require('../models/categoryService');

function parsePositiveInteger(value) {
    if (value === undefined || value === null || value === '') return null;
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 1) return null;
    return parsed;
}

function getYearRange(year) {
    return {
        start: new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0)),
        end: new Date(Date.UTC(year + 1, 0, 1, 0, 0, 0, 0)),
    };
}

function getMonthConstrainedRange(year, startMonth = null, endMonth = null) {
    if (!year) {
        return { start: null, end: null };
    }

    const safeStartMonth = startMonth ?? 1;
    const safeEndMonth = endMonth ?? 12;

    return {
        start: new Date(Date.UTC(year, safeStartMonth - 1, 1, 0, 0, 0, 0)),
        end: new Date(Date.UTC(year, safeEndMonth, 1, 0, 0, 0, 0)),
    };
}

function decimalToNumber(value) {
    if (value === undefined || value === null) return 0;
    return Number(value);
}

function parseBooleanFlag(value) {
    if (value === undefined || value === null || value === '') return false;
    const normalised = String(value).trim().toLowerCase();
    return normalised === 'true' || normalised === '1' || normalised === 'yes';
}

function parseMonth(value) {
    if (value === undefined || value === null || value === '') return null;
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 12) return null;
    return parsed;
}

// ─── READ ──────────────────────────────────────────────────────────

// GET /api/collection/donation-volume- get donation drive volume using school id
const getDonationDriveVolume = async (req, res) => {
    try {

        const {
            school_id,
        } = req.query;

        if (!school_id) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: school_id'
            });
        }

        const [transactions, drives, itemTypes] = await transactionService.getDonationVolumeBySchool(school_id);

        const itemTypeMap = Object.fromEntries(itemTypes.map(it => [it.id, it]));
        const driveMap = Object.fromEntries(drives.map(d => [d.id, d]));

        const driveAggMap = {};
        for (const t of transactions) {
            const driveId = t.donationDriveId;
            const itemType = itemTypeMap[t.itemTypeId];
            const category = itemType?.category;
            if (!category) continue;

            if (!driveAggMap[driveId]) {
                driveAggMap[driveId] = {
                    drive: driveMap[driveId] ?? null,
                    byCategory: {},
                };
            }

            if (!driveAggMap[driveId].byCategory[category.id]) {
                driveAggMap[driveId].byCategory[category.id] = {
                    category,
                    totalQuantityDonated: 0,
                    transactionCount: 0,
                };
            }

            driveAggMap[driveId].byCategory[category.id].totalQuantityDonated += t._sum.quantity ?? 0;
            driveAggMap[driveId].byCategory[category.id].transactionCount += t._count.id ?? 0;
        }

        const donationVolume = Object.values(driveAggMap).map(entry => ({
            drive: entry.drive,
            byCategory: Object.values(entry.byCategory),
        }));

        return res.status(200).json({
            success: true,
            message: 'Donation drive created successfully',
            data: donationVolume
        });

    } catch (error) {
        console.error('Error getting Donation trend:', error);

        return res.status(500).json({
            success: false,
            message: 'Error getting Donation trend',
            error: error.message
        });
    }
}


// GET /api/collection/inventory-count- get inventory counts using school id
const getCurrentInventoryCountSchool = async (req, res) => {
    try {
        console.log('Get inventroy Count request received');

        const inventory = await inventoryService.getInventoryCountBySchoolAndSize();

        // Group by school -> item category -> size
        const grouped = {};

        for (const record of inventory) {
            const school = record.itemType?.school;
            const category = record.itemType?.category;
            const size = record.sizeOption;

            if (!school) continue;

            if (!grouped[school.id]) {
                grouped[school.id] = {
                    schoolId: school.id,
                    schoolName: school.schoolName,
                    items: {},
                };
            }

            const categoryKey = category?.categoryName ?? 'Unknown';
            if (!grouped[school.id].items[categoryKey]) {
                grouped[school.id].items[categoryKey] = {};
            }

            const sizeKey = size?.sizeName ?? 'Unknown';
            if (!grouped[school.id].items[categoryKey][sizeKey]) {
                grouped[school.id].items[categoryKey][sizeKey] = {
                    sizeClass: size?.sizeClass,
                    forSale: 0,
                    sold: 0,
                    repurposed: 0,
                    disposed: 0,
                    generalOffice: 0,
                    forRepurpose: 0,
                    total: 0,
                };
            }

            const entry = grouped[school.id].items[categoryKey][sizeKey];
            entry.total += record.quantity;

            switch (record.itemStatus) {
                case 'ForSale': entry.forSale += record.quantity; break;
                case 'Sold': entry.sold += record.quantity; break;
                case 'Repurposed': entry.repurposed += record.quantity; break;
                case 'Disposed': entry.disposed += record.quantity; break;
                case 'ForRepurpose': entry.forRepurpose += record.quantity; break;
                case 'GeneralOffice': entry.generalOffice += record.quantity; break;
            }
        }

        const inventoryCountSchool = Object.values(grouped);


        return res.status(200).json({
            success: true,
            message: 'Inventory count retrieving successfully',
            data: inventoryCountSchool
        });

    } catch (error) {
        console.error('Error getting inventory Count:', error);

        return res.status(500).json({
            success: false,
            message: 'Error getting inventory Count',
            error: error.message
        });
    }
}

// GET /api/collection/school-rankings- get school rankings of collection rate for a specific year
const getSchoolRankings = async (req, res) => {
    try {
        console.log('Get school collection ranking request received');

        const year = parseInt(req.query.year ?? req.body?.year);
        const metric = String(req.query.metric ?? 'sellThrough');

        if (!year) {
            return res.status(400).json({
                success: false,
                message: 'Missing required field: year'
            });
        }

        const { start, end } = getYearRange(year);
        const transactions = await transactionService.getAnalyticsTransactions({
            startDate: start,
            endDate: end,
            transactionTypes: ['DonationIn', 'Sale', 'Repurposing'],
        });

        const schoolMap = {};

        for (const tx of transactions) {
            const school = tx.itemType?.school;
            if (!school) continue;

            if (!schoolMap[school.id]) {
            schoolMap[school.id] = {
                schoolId: school.id,
                schoolName: school.schoolName,
                totalDonated: 0,
                totalSold: 0,
                totalRepurposed: 0,
            };
            }

            if (tx.transactionType === 'DonationIn') {
                schoolMap[school.id].totalDonated += tx.quantity;
            } else if (tx.transactionType === 'Sale') {
            schoolMap[school.id].totalSold += tx.quantity;
            } else if (tx.transactionType === 'Repurposing') {
            schoolMap[school.id].totalRepurposed += tx.quantity;
            }
        }

        const schools = Object.values(schoolMap).map(s => ({
            ...s,
            redistributionRate:
            s.totalDonated > 0
                ? parseFloat(((s.totalSold / s.totalDonated) * 100).toFixed(2))
                : 0,
            recoveryRate:
            s.totalDonated > 0
                ? parseFloat((((s.totalSold + s.totalRepurposed) / s.totalDonated) * 100).toFixed(2))
                : 0,
        }));

        const metricKey = metric === 'recovery' ? 'recoveryRate' : 'redistributionRate';
        const networkAverage =
            schools.length > 0
            ? parseFloat(
                (
                    schools.reduce((sum, s) => sum + s[metricKey], 0) /
                    schools.length
                ).toFixed(2)
                )
                : 0;

        const ranked = schools
            .map(s => ({
            ...s,
            deviationFromAverage: parseFloat(
                (s[metricKey] - networkAverage).toFixed(2)
            ),
            }))
            .sort((a, b) => b[metricKey] - a[metricKey])
            .map((s, index) => ({ rank: index + 1, ...s }));

        const ranking_result =  {
            metricUsed: metricKey,
            networkAverage,
            lastUpdated: new Date(),
            schools: ranked,
        };


        return res.status(200).json({
            success: true,
            message: `School rankings for year ${year} retrieved successfully`,
            data: ranking_result
        });

    } catch (error) {
        console.error('Error getting school rankings:', error);

        return res.status(500).json({
            success: false,
            message: 'Error getting school rankings',
            error: error.message
        });
    }
}

const getInventoryBreakdownBySchool = async (req, res) => {
    try {
        console.log('Get inventory count for all catergory request received');

        const inventory = await inventoryService.getTotalInventoryBySchool();

        const schoolMap = {};

        for (const record of inventory) {
            const school = record.itemType?.school;
            if (!school) continue;

            if (!schoolMap[school.id]) {
                schoolMap[school.id] = {
                    schoolId: school.id,
                    schoolName: school.schoolName,
                    totalItems: 0,
                };
            }

            schoolMap[school.id].totalItems += record.quantity;
        }

        const result = Object.values(schoolMap).sort((a, b) => b.totalItems - a.totalItems);


        return res.status(200).json({
            success: true,
            message: `School inventory count retrieved successfully`,
            data: result
        });

    } catch (error) {
        console.error('Error getting school inventory count:', error);

        return res.status(500).json({
            success: false,
            message: 'Error getting school inventory count',
            error: error.message
        });
    }
}

const getActiveDrivePerformance = async (req, res) => {
    try {
        const schoolId = parsePositiveInteger(req.query.schoolId);
        const drives = await buildDrivePerformance({ schoolId, activeOnly: true });

        return res.status(200).json({
            success: true,
            message: 'Active drive performance retrieved successfully',
            data: {
                filters: { schoolId },
                drives,
            },
        });
    } catch (error) {
        console.error('Error getting active drive performance:', error);

        return res.status(500).json({
            success: false,
            message: 'Error getting active drive performance',
            error: error.message,
        });
    }
};

async function buildDrivePerformance({ schoolId = null, activeOnly = false, year = null, startMonth = null, endMonth = null } = {}) {
    const driveFilters = {};
    if (schoolId) {
        driveFilters.school_id = schoolId;
    }
    if (activeOnly) {
        driveFilters.active_only = true;
    }

    const driveResult = await donationService.getAllDonationDrives(driveFilters);
    let drives = driveResult.data ?? [];
    const range = year ? getMonthConstrainedRange(year, startMonth, endMonth) : { start: null, end: null };

    if (year) {
        drives = drives.filter((drive) => new Date(drive.startDate) < range.end && new Date(drive.endDate) >= range.start);
    }

    const transactions = await transactionService.getAnalyticsTransactions({
        startDate: range.start,
        endDate: range.end,
        schoolId,
        transactionTypes: ['DonationIn'],
        activeDrivesOnly: activeOnly,
        requireDonationDrive: true,
    });

    const driveMap = {};

    for (const drive of drives) {
        driveMap[drive.id] = {
            driveId: drive.id,
            driveName: drive.driveName,
            schoolId: drive.school?.id ?? null,
            schoolName: drive.school?.schoolName ?? 'Unknown',
            location: drive.location,
            startDate: drive.startDate,
            endDate: drive.endDate,
            isActive: new Date(drive.startDate) <= new Date() && new Date(drive.endDate) >= new Date(),
            transactionCount: 0,
            totalQuantity: 0,
            totalEstimatedWeightKg: 0,
            categories: {},
            sizes: {},
        };
    }

        for (const tx of transactions) {
            const drive = tx.donationDrive;
            const category = tx.itemType?.category;
            const sizeOption = tx.sizeOption;
            if (!drive || !driveMap[drive.id] || !category) continue;

            const qty = tx.quantity ?? 0;
            const weightKg = decimalToNumber(category.weightKg) * qty;
            const driveEntry = driveMap[drive.id];

            driveEntry.transactionCount += 1;
            driveEntry.totalQuantity += qty;
            driveEntry.totalEstimatedWeightKg += weightKg;

            if (!driveEntry.categories[category.id]) {
                driveEntry.categories[category.id] = {
                    categoryId: category.id,
                    categoryName: category.categoryName,
                    totalQuantity: 0,
                    totalEstimatedWeightKg: 0,
                };
            }

            driveEntry.categories[category.id].totalQuantity += qty;
            driveEntry.categories[category.id].totalEstimatedWeightKg += weightKg;

            const sizeKey = sizeOption?.id ?? 'unknown';
            if (!driveEntry.sizes[sizeKey]) {
                driveEntry.sizes[sizeKey] = {
                    sizeOptionId: sizeOption?.id ?? null,
                    sizeName: sizeOption?.sizeName ?? 'Unknown',
                    sizeClass: sizeOption?.sizeClass ?? null,
                    totalQuantity: 0,
                };
            }
            driveEntry.sizes[sizeKey].totalQuantity += qty;
        }

    const now = new Date();
    return Object.values(driveMap)
        .map((drive) => {
            const driveStart = new Date(drive.startDate);
            const driveEnd = new Date(drive.endDate);
            const elapsedDays = Math.max(1, Math.ceil((Math.min(now.getTime(), driveEnd.getTime()) - driveStart.getTime()) / (1000 * 60 * 60 * 24)));
            const remainingDays = Math.max(0, Math.ceil((driveEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

            return {
                ...drive,
                totalEstimatedWeightKg: Number(drive.totalEstimatedWeightKg.toFixed(3)),
                averageDailyQuantity: Number((drive.totalQuantity / elapsedDays).toFixed(2)),
                averageDailyWeightKg: Number((drive.totalEstimatedWeightKg / elapsedDays).toFixed(3)),
                remainingDays,
                categories: Object.values(drive.categories)
                    .map((category) => ({
                        ...category,
                        totalEstimatedWeightKg: Number(category.totalEstimatedWeightKg.toFixed(3)),
                    }))
                    .sort((a, b) => b.totalQuantity - a.totalQuantity),
                sizes: Object.values(drive.sizes)
                    .sort((a, b) => b.totalQuantity - a.totalQuantity || String(a.sizeName).localeCompare(String(b.sizeName))),
            };
        })
        .sort((a, b) => new Date(a.endDate) - new Date(b.endDate));
}

const getDrivePerformance = async (req, res) => {
    try {
        const schoolId = parsePositiveInteger(req.query.schoolId);
        const year = parsePositiveInteger(req.query.year);
        const startMonth = parseMonth(req.query.startMonth);
        const endMonth = parseMonth(req.query.endMonth);
        const activeOnly = parseBooleanFlag(req.query.activeOnly);

        if ((req.query.startMonth && !startMonth) || (req.query.endMonth && !endMonth)) {
            return res.status(400).json({
                success: false,
                message: 'startMonth and endMonth must be integers from 1 to 12',
            });
        }

        if ((startMonth || endMonth) && !year) {
            return res.status(400).json({
                success: false,
                message: 'year is required when filtering by startMonth or endMonth',
            });
        }

        if (startMonth && endMonth && startMonth > endMonth) {
            return res.status(400).json({
                success: false,
                message: 'startMonth must be less than or equal to endMonth',
            });
        }

        const drives = await buildDrivePerformance({ schoolId, activeOnly, year, startMonth, endMonth });

        return res.status(200).json({
            success: true,
            message: 'Drive performance retrieved successfully',
            data: {
                filters: { schoolId, year, startMonth, endMonth, activeOnly },
                drives,
            },
        });
    } catch (error) {
        console.error('Error getting drive performance:', error);

        return res.status(500).json({
            success: false,
            message: 'Error getting drive performance',
            error: error.message,
        });
    }
};

const getDonationBreakdown = async (req, res) => {
    try {
        const schoolId = parsePositiveInteger(req.query.schoolId);
        const year = parsePositiveInteger(req.query.year);
        const startMonth = parseMonth(req.query.startMonth);
        const endMonth = parseMonth(req.query.endMonth);

        if ((req.query.startMonth && !startMonth) || (req.query.endMonth && !endMonth)) {
            return res.status(400).json({
                success: false,
                message: 'startMonth and endMonth must be integers from 1 to 12',
            });
        }

        if ((startMonth || endMonth) && !year) {
            return res.status(400).json({
                success: false,
                message: 'year is required when filtering by startMonth or endMonth',
            });
        }

        if (startMonth && endMonth && startMonth > endMonth) {
            return res.status(400).json({
                success: false,
                message: 'startMonth must be less than or equal to endMonth',
            });
        }

        const range = year ? getMonthConstrainedRange(year, startMonth, endMonth) : { start: null, end: null };
        const transactions = await transactionService.getAnalyticsTransactions({
            startDate: range.start,
            endDate: range.end,
            schoolId,
            transactionTypes: ['DonationIn'],
        });
        const schoolMap = {};

        for (const tx of transactions) {
            const school = tx.itemType?.school;
            const category = tx.itemType?.category;
            const sizeOption = tx.sizeOption;
            if (!school || !category) continue;

            if (!schoolMap[school.id]) {
                schoolMap[school.id] = {
                    schoolId: school.id,
                    schoolName: school.schoolName,
                    totalQuantity: 0,
                    totalEstimatedWeightKg: 0,
                    categories: {},
                    sizes: {},
                };
            }

            const qty = tx.quantity ?? 0;
            const weightKg = decimalToNumber(category.weightKg) * qty;
            schoolMap[school.id].totalQuantity += qty;
            schoolMap[school.id].totalEstimatedWeightKg += weightKg;

            if (!schoolMap[school.id].categories[category.id]) {
                schoolMap[school.id].categories[category.id] = {
                    categoryId: category.id,
                    categoryName: category.categoryName,
                    totalQuantity: 0,
                    totalEstimatedWeightKg: 0,
                };
            }

            schoolMap[school.id].categories[category.id].totalQuantity += qty;
            schoolMap[school.id].categories[category.id].totalEstimatedWeightKg += weightKg;

            const sizeKey = sizeOption?.id ?? 'unknown';
            if (!schoolMap[school.id].sizes[sizeKey]) {
                schoolMap[school.id].sizes[sizeKey] = {
                    sizeOptionId: sizeOption?.id ?? null,
                    sizeName: sizeOption?.sizeName ?? 'Unknown',
                    sizeClass: sizeOption?.sizeClass ?? null,
                    totalQuantity: 0,
                };
            }
            schoolMap[school.id].sizes[sizeKey].totalQuantity += qty;
        }

        const schools = Object.values(schoolMap).map((school) => ({
            schoolId: school.schoolId,
            schoolName: school.schoolName,
            totalQuantity: school.totalQuantity,
            totalEstimatedWeightKg: Number(school.totalEstimatedWeightKg.toFixed(3)),
            categories: Object.values(school.categories)
                .map((category) => ({
                    ...category,
                    totalEstimatedWeightKg: Number(category.totalEstimatedWeightKg.toFixed(3)),
                }))
                .sort((a, b) => b.totalQuantity - a.totalQuantity),
            sizes: Object.values(school.sizes)
                .sort((a, b) => b.totalQuantity - a.totalQuantity || String(a.sizeName).localeCompare(String(b.sizeName))),
        })).sort((a, b) => a.schoolName.localeCompare(b.schoolName));

        return res.status(200).json({
            success: true,
            message: 'Donation breakdown retrieved successfully',
            data: {
                filters: { schoolId, year, startMonth, endMonth },
                schools,
            },
        });
    } catch (error) {
        console.error('Error getting donation breakdown:', error);

        return res.status(500).json({
            success: false,
            message: 'Error getting donation breakdown',
            error: error.message,
        });
    }
};

const getStockByStorageLocation = async (req, res) => {
    try {
        const schoolId = parsePositiveInteger(req.query.schoolId);
        const balances = await inventoryService.getInventorySnapshot({ schoolId, positiveOnly: true });
        const schoolMap = {};

        for (const balance of balances) {
            const school = balance.itemType?.school;
            const category = balance.itemType?.category;
            if (!school || !category) continue;

            if (!schoolMap[school.id]) {
                schoolMap[school.id] = {
                    schoolId: school.id,
                    schoolName: school.schoolName,
                    locations: {},
                };
            }

            if (!schoolMap[school.id].locations[balance.storedAt]) {
                schoolMap[school.id].locations[balance.storedAt] = {
                    storedAt: balance.storedAt,
                    totalQuantity: 0,
                    totalEstimatedWeightKg: 0,
                    statuses: {},
                };
            }

            const locationEntry = schoolMap[school.id].locations[balance.storedAt];
            const qty = balance.quantity ?? 0;
            const weightKg = decimalToNumber(category.weightKg) * qty;

            locationEntry.totalQuantity += qty;
            locationEntry.totalEstimatedWeightKg += weightKg;

            if (!locationEntry.statuses[balance.itemStatus]) {
                locationEntry.statuses[balance.itemStatus] = {
                    itemStatus: balance.itemStatus,
                    quantity: 0,
                    estimatedWeightKg: 0,
                };
            }

            locationEntry.statuses[balance.itemStatus].quantity += qty;
            locationEntry.statuses[balance.itemStatus].estimatedWeightKg += weightKg;
        }

        const schools = Object.values(schoolMap).map((school) => ({
            schoolId: school.schoolId,
            schoolName: school.schoolName,
            locations: Object.values(school.locations)
                .map((location) => ({
                    storedAt: location.storedAt,
                    totalQuantity: location.totalQuantity,
                    totalEstimatedWeightKg: Number(location.totalEstimatedWeightKg.toFixed(3)),
                    statuses: Object.values(location.statuses).map((status) => ({
                        ...status,
                        estimatedWeightKg: Number(status.estimatedWeightKg.toFixed(3)),
                    })),
                }))
                .sort((a, b) => b.totalQuantity - a.totalQuantity),
        })).sort((a, b) => a.schoolName.localeCompare(b.schoolName));

        return res.status(200).json({
            success: true,
            message: 'Stock by storage location retrieved successfully',
            data: {
                filters: { schoolId },
                schools,
            },
        });
    } catch (error) {
        console.error('Error getting stock by storage location:', error);

        return res.status(500).json({
            success: false,
            message: 'Error getting stock by storage location',
            error: error.message,
        });
    }
};

const getCooperationAnalytics = async (req, res) => {
    try {
        const year = parsePositiveInteger(req.query.year);
        if (!year) {
            return res.status(400).json({
                success: false,
                message: 'year query parameter is required and must be a positive integer',
            });
        }

        const { start, end } = getYearRange(year);
        const transactions = await transactionService.getAnalyticsTransactions({
            startDate: start,
            endDate: end,
            transactionTypes: ['DonationIn', 'Sale', 'Repurposing', 'Disposal'],
        });
        const groups = {
            cooperating: { label: 'Cooperating', schoolIds: new Set(), donated: 0, sold: 0, repurposed: 0, disposed: 0, donatedKg: 0, soldKg: 0, repurposedKg: 0, disposedKg: 0 },
            nonCooperating: { label: 'Non-cooperating', schoolIds: new Set(), donated: 0, sold: 0, repurposed: 0, disposed: 0, donatedKg: 0, soldKg: 0, repurposedKg: 0, disposedKg: 0 },
        };

        for (const tx of transactions) {
            const school = tx.itemType?.school;
            const category = tx.itemType?.category;
            if (!school || !category) continue;

            const group = school.isCooperating ? groups.cooperating : groups.nonCooperating;
            const qty = tx.quantity ?? 0;
            const weightKg = decimalToNumber(category.weightKg) * qty;
            group.schoolIds.add(school.id);

            if (tx.transactionType === 'DonationIn') {
                group.donated += qty;
                group.donatedKg += weightKg;
            } else if (tx.transactionType === 'Sale') {
                group.sold += qty;
                group.soldKg += weightKg;
            } else if (tx.transactionType === 'Repurposing') {
                group.repurposed += qty;
                group.repurposedKg += weightKg;
            } else if (tx.transactionType === 'Disposal') {
                group.disposed += qty;
                group.disposedKg += weightKg;
            }
        }

        const data = Object.values(groups).map((group) => {
            const recovered = group.sold + group.repurposed;
            const recoveredKg = group.soldKg + group.repurposedKg;
            return {
                label: group.label,
                schoolCount: group.schoolIds.size,
                donated: group.donated,
                sold: group.sold,
                repurposed: group.repurposed,
                disposed: group.disposed,
                donatedKg: Number(group.donatedKg.toFixed(3)),
                soldKg: Number(group.soldKg.toFixed(3)),
                repurposedKg: Number(group.repurposedKg.toFixed(3)),
                disposedKg: Number(group.disposedKg.toFixed(3)),
                recovered,
                recoveredKg: Number(recoveredKg.toFixed(3)),
                sellThroughRate: group.donated > 0 ? Number(((group.sold / group.donated) * 100).toFixed(2)) : 0,
                recoveryRate: group.donated > 0 ? Number(((recovered / group.donated) * 100).toFixed(2)) : 0,
                disposalRate: recovered + group.disposed > 0 ? Number(((group.disposed / (recovered + group.disposed)) * 100).toFixed(2)) : 0,
            };
        });

        return res.status(200).json({
            success: true,
            message: `Cooperation analytics for ${year} retrieved successfully`,
            data: {
                filters: { year },
                groups: data,
            },
        });
    } catch (error) {
        console.error('Error getting cooperation analytics:', error);

        return res.status(500).json({
            success: false,
            message: 'Error getting cooperation analytics',
            error: error.message,
        });
    }
};

const getSustainabilityMetrics = async (req, res) => {
    try {
        const year = parsePositiveInteger(req.query.year);
        const schoolId = parsePositiveInteger(req.query.schoolId);

        if (!year) {
            return res.status(400).json({
                success: false,
                message: 'year query parameter is required and must be a positive integer',
            });
        }

        const { start, end } = getYearRange(year);
        const transactions = await transactionService.getAnalyticsTransactions({
            startDate: start,
            endDate: end,
            schoolId,
            transactionTypes: ['DonationIn', 'Sale', 'Repurposing', 'Disposal'],
        });
        const summary = {
            donatedUnits: 0,
            soldUnits: 0,
            repurposedUnits: 0,
            disposedUnits: 0,
            donatedKg: 0,
            soldKg: 0,
            repurposedKg: 0,
            disposedKg: 0,
        };
        const categories = {};

        for (const tx of transactions) {
            const category = tx.itemType?.category;
            if (!category) continue;

            const qty = tx.quantity ?? 0;
            const weightKg = decimalToNumber(category.weightKg) * qty;

            if (!categories[category.id]) {
                categories[category.id] = {
                    categoryId: category.id,
                    categoryName: category.categoryName,
                    donatedUnits: 0,
                    soldUnits: 0,
                    repurposedUnits: 0,
                    disposedUnits: 0,
                    donatedKg: 0,
                    soldKg: 0,
                    repurposedKg: 0,
                    disposedKg: 0,
                };
            }

            const categoryEntry = categories[category.id];

            if (tx.transactionType === 'DonationIn') {
                summary.donatedUnits += qty;
                summary.donatedKg += weightKg;
                categoryEntry.donatedUnits += qty;
                categoryEntry.donatedKg += weightKg;
            } else if (tx.transactionType === 'Sale') {
                summary.soldUnits += qty;
                summary.soldKg += weightKg;
                categoryEntry.soldUnits += qty;
                categoryEntry.soldKg += weightKg;
            } else if (tx.transactionType === 'Repurposing') {
                summary.repurposedUnits += qty;
                summary.repurposedKg += weightKg;
                categoryEntry.repurposedUnits += qty;
                categoryEntry.repurposedKg += weightKg;
            } else if (tx.transactionType === 'Disposal') {
                summary.disposedUnits += qty;
                summary.disposedKg += weightKg;
                categoryEntry.disposedUnits += qty;
                categoryEntry.disposedKg += weightKg;
            }
        }

        const divertedUnits = summary.soldUnits + summary.repurposedUnits;
        const divertedKg = summary.soldKg + summary.repurposedKg;

        return res.status(200).json({
            success: true,
            message: `Sustainability metrics for ${year} retrieved successfully`,
            data: {
                filters: { year, schoolId },
                summary: {
                    ...summary,
                    donatedKg: Number(summary.donatedKg.toFixed(3)),
                    soldKg: Number(summary.soldKg.toFixed(3)),
                    repurposedKg: Number(summary.repurposedKg.toFixed(3)),
                    disposedKg: Number(summary.disposedKg.toFixed(3)),
                    divertedUnits,
                    divertedKg: Number(divertedKg.toFixed(3)),
                    diversionRate: summary.donatedUnits > 0 ? Number(((divertedUnits / summary.donatedUnits) * 100).toFixed(2)) : 0,
                },
                categories: Object.values(categories)
                    .map((category) => ({
                        ...category,
                        donatedKg: Number(category.donatedKg.toFixed(3)),
                        soldKg: Number(category.soldKg.toFixed(3)),
                        repurposedKg: Number(category.repurposedKg.toFixed(3)),
                        disposedKg: Number(category.disposedKg.toFixed(3)),
                    }))
                    .sort((a, b) => b.donatedKg - a.donatedKg),
            },
        });
    } catch (error) {
        console.error('Error getting sustainability metrics:', error);

        return res.status(500).json({
            success: false,
            message: 'Error getting sustainability metrics',
            error: error.message,
        });
    }
};

const getCollectionFunnel = async (req, res) => {
    try {
        const year = parsePositiveInteger(req.query.year);
        const schoolId = parsePositiveInteger(req.query.schoolId);

        if (!year) {
            return res.status(400).json({
                success: false,
                message: 'year query parameter is required and must be a positive integer'
            });
        }

        const { start, end } = getYearRange(year);
        const [transactions, inventoryBalances] = await Promise.all([
            transactionService.getCollectionFunnelTransactions({ startDate: start, endDate: end, schoolId }),
            inventoryService.getInventorySnapshot({ schoolId }),
        ]);

        const schoolMap = {};

        const ensureSchoolCategory = (schoolIdValue, schoolName, categoryName) => {
            if (!schoolMap[schoolIdValue]) {
                schoolMap[schoolIdValue] = {
                    schoolId: schoolIdValue,
                    schoolName,
                    totals: {
                        donated: 0,
                        sold: 0,
                        repurposed: 0,
                        disposed: 0,
                        currentForSale: 0,
                        currentForRepurpose: 0,
                    },
                    categories: {},
                };
            }

            if (!schoolMap[schoolIdValue].categories[categoryName]) {
                schoolMap[schoolIdValue].categories[categoryName] = {
                    categoryName,
                    donated: 0,
                    sold: 0,
                    repurposed: 0,
                    disposed: 0,
                    currentForSale: 0,
                    currentForRepurpose: 0,
                };
            }

            return schoolMap[schoolIdValue].categories[categoryName];
        };

        for (const tx of transactions) {
            const school = tx.itemType?.school;
            const category = tx.itemType?.category;

            if (!school || !category) continue;

            const entry = ensureSchoolCategory(school.id, school.schoolName, category.categoryName);
            const qty = tx.quantity ?? 0;

            switch (tx.transactionType) {
                case 'DonationIn':
                    entry.donated += qty;
                    schoolMap[school.id].totals.donated += qty;
                    break;
                case 'Sale':
                    entry.sold += qty;
                    schoolMap[school.id].totals.sold += qty;
                    break;
                case 'Repurposing':
                    entry.repurposed += qty;
                    schoolMap[school.id].totals.repurposed += qty;
                    break;
                case 'Disposal':
                    entry.disposed += qty;
                    schoolMap[school.id].totals.disposed += qty;
                    break;
            }
        }

        for (const balance of inventoryBalances) {
            const school = balance.itemType?.school;
            const category = balance.itemType?.category;

            if (!school || !category) continue;

            const entry = ensureSchoolCategory(school.id, school.schoolName, category.categoryName);
            const qty = balance.quantity ?? 0;

            if (balance.itemStatus === 'ForSale') {
                entry.currentForSale += qty;
                schoolMap[school.id].totals.currentForSale += qty;
            } else if (balance.itemStatus === 'ForRepurpose') {
                entry.currentForRepurpose += qty;
                schoolMap[school.id].totals.currentForRepurpose += qty;
            }
        }

        const schools = Object.values(schoolMap).map((school) => {
            const totals = school.totals;
            const processed = totals.sold + totals.repurposed + totals.disposed;
            const sellThroughRate = totals.donated > 0
                ? Number(((totals.sold / totals.donated) * 100).toFixed(2))
                : 0;
            const recoveryRate = totals.donated > 0
                ? Number((((totals.sold + totals.repurposed) / totals.donated) * 100).toFixed(2))
                : 0;
            const disposalRate = processed > 0
                ? Number(((totals.disposed / processed) * 100).toFixed(2))
                : 0;

            const categories = Object.values(school.categories)
                .map((category) => {
                    const categoryProcessed = category.sold + category.repurposed + category.disposed;
                    return {
                        ...category,
                        sellThroughRate: category.donated > 0
                            ? Number(((category.sold / category.donated) * 100).toFixed(2))
                            : 0,
                        recoveryRate: category.donated > 0
                            ? Number((((category.sold + category.repurposed) / category.donated) * 100).toFixed(2))
                            : 0,
                        disposalRate: categoryProcessed > 0
                            ? Number(((category.disposed / categoryProcessed) * 100).toFixed(2))
                            : 0,
                    };
                })
                .sort((a, b) => b.donated - a.donated || a.categoryName.localeCompare(b.categoryName));

            return {
                schoolId: school.schoolId,
                schoolName: school.schoolName,
                totals: {
                    ...totals,
                    sellThroughRate,
                    recoveryRate,
                    disposalRate,
                },
                categories,
            };
        }).sort((a, b) => a.schoolName.localeCompare(b.schoolName));

        return res.status(200).json({
            success: true,
            message: `Collection funnel for ${year} retrieved successfully`,
            data: {
                filters: {
                    year,
                    schoolId,
                },
                schools,
            }
        });
    } catch (error) {
        console.error('Error getting collection funnel:', error);

        return res.status(500).json({
            success: false,
            message: 'Error getting collection funnel',
            error: error.message
        });
    }
};

const getMonthlyCollectionTrends = async (req, res) => {
    try {
        const year = parsePositiveInteger(req.query.year);
        const schoolId = parsePositiveInteger(req.query.schoolId);

        if (!year) {
            return res.status(400).json({
                success: false,
                message: 'year query parameter is required and must be a positive integer'
            });
        }

        const { start, end } = getYearRange(year);
        const transactions = await transactionService.getMonthlyCollectionTrends({ startDate: start, endDate: end, schoolId });
        const createMonthlyEntry = (month) => ({
            month,
            donated: 0,
            sold: 0,
            repurposed: 0,
            disposed: 0,
            donatedKg: 0,
            soldKg: 0,
            repurposedKg: 0,
            disposedKg: 0,
            transferred: 0,
            statusChanged: 0,
        });
        const roundMonthlyWeights = (entry) => ({
            ...entry,
            donatedKg: Number(entry.donatedKg.toFixed(3)),
            soldKg: Number(entry.soldKg.toFixed(3)),
            repurposedKg: Number(entry.repurposedKg.toFixed(3)),
            disposedKg: Number(entry.disposedKg.toFixed(3)),
        });
        const monthly = Array.from({ length: 12 }, (_, index) => createMonthlyEntry(index + 1));
        const schoolBreakdown = {};

        for (const tx of transactions) {
            const monthIndex = new Date(tx.transactionDate).getUTCMonth();
            const school = tx.itemType?.school;
            const weightKg = decimalToNumber(tx.itemType?.category?.weightKg) * (tx.quantity ?? 0);

            if (!school || monthIndex < 0 || monthIndex > 11) continue;

            const qty = tx.quantity ?? 0;
            const monthEntry = monthly[monthIndex];

            if (!schoolBreakdown[school.id]) {
                schoolBreakdown[school.id] = {
                    schoolId: school.id,
                    schoolName: school.schoolName,
                    months: Array.from({ length: 12 }, (_, index) => createMonthlyEntry(index + 1)),
                };
            }

            const schoolMonthEntry = schoolBreakdown[school.id].months[monthIndex];

            switch (tx.transactionType) {
                case 'DonationIn':
                    monthEntry.donated += qty;
                    monthEntry.donatedKg += weightKg;
                    schoolMonthEntry.donated += qty;
                    schoolMonthEntry.donatedKg += weightKg;
                    break;
                case 'Sale':
                    monthEntry.sold += qty;
                    monthEntry.soldKg += weightKg;
                    schoolMonthEntry.sold += qty;
                    schoolMonthEntry.soldKg += weightKg;
                    break;
                case 'Repurposing':
                    monthEntry.repurposed += qty;
                    monthEntry.repurposedKg += weightKg;
                    schoolMonthEntry.repurposed += qty;
                    schoolMonthEntry.repurposedKg += weightKg;
                    break;
                case 'Disposal':
                    monthEntry.disposed += qty;
                    monthEntry.disposedKg += weightKg;
                    schoolMonthEntry.disposed += qty;
                    schoolMonthEntry.disposedKg += weightKg;
                    break;
                case 'Transfer':
                    monthEntry.transferred += qty;
                    schoolMonthEntry.transferred += qty;
                    break;
                case 'StatusChange':
                    monthEntry.statusChanged += qty;
                    schoolMonthEntry.statusChanged += qty;
                    break;
            }
        }

        return res.status(200).json({
            success: true,
            message: `Monthly collection trends for ${year} retrieved successfully`,
            data: {
                filters: {
                    year,
                    schoolId,
                },
                monthly: monthly.map(roundMonthlyWeights),
                schools: Object.values(schoolBreakdown)
                    .map((school) => ({
                        ...school,
                        months: school.months.map(roundMonthlyWeights),
                    }))
                    .sort((a, b) => a.schoolName.localeCompare(b.schoolName)),
            }
        });
    } catch (error) {
        console.error('Error getting monthly collection trends:', error);

        return res.status(500).json({
            success: false,
            message: 'Error getting monthly collection trends',
            error: error.message
        });
    }
};
const getOverallSummarisedInventory = async (req, res) => {
    try {
        console.log('Get overall inventory count request received');

        let inventory = await inventoryService.getInventoryCountByCategory();
        let categories = await categoryService.getAllCategories();
        let totalCount = 0, totalWeight = 0;
        for (let categoryData of inventory) {
            let matchingCategory = categories.find(category => category.id === categoryData.itemType.category.id);
            if (matchingCategory) {
                totalCount += categoryData.quantity;
                totalWeight += categoryData.quantity * matchingCategory.weightKg;
            }
        }
        return res.status(200).json({
            success: true,
            message: `Overall inventory count retrieved successfully`,
            data: {
                totalCount,
                totalWeight: Math.round(totalWeight * 100) / 100
            }
        });
    } catch (error) {
        console.error('Error getting overall inventory count:', error);
        return res.status(500).json({
            success: false,
            message: 'Error getting overall inventory count',
            error: error.message
        });
    }
};

const getOverallInventoryByCategory = async (req, res) => {
    try {
        console.log('Get overall inventory count by category request received');
        let inventory = await inventoryService.getInventoryCountByCategory();
        let categories = await categoryService.getAllCategories();
        let responseData = [];
        for (let categoryData of inventory) {
            matchingCategory = categories.find(category => category.id === categoryData.itemType.category.id);
            if (matchingCategory) {
                if (responseData.find(category => category.categoryName === matchingCategory.categoryName)) {
                    responseData.find(category => category.categoryName === matchingCategory.categoryName).totalCount += categoryData.quantity;
                    responseData.find(category => category.categoryName === matchingCategory.categoryName).totalWeight += categoryData.quantity * matchingCategory.weightKg;
                } else {
                    responseData.push({
                        categoryName: matchingCategory.categoryName,
                        totalCount: categoryData.quantity,
                        totalWeight: Math.round(categoryData.quantity * matchingCategory.weightKg * 100) / 100
                    });
                }
            }
        };
        for (let data of responseData) {
            data.totalWeight = Math.round(data.totalWeight * 100) / 100;
        }
        return res.status(200).json({
            success: true,
            message: `Overall inventory count by category retrieved successfully`,
            data: responseData
        });
    } catch (error) {
        console.error('Error getting overall inventory count by category:', error);
        return res.status(500).json({
            success: false,
            message: 'Error getting overall inventory count by category',
            error: error.message
        });
    }
}

module.exports = {
    getDonationDriveVolume,
    getCurrentInventoryCountSchool,
    getSchoolRankings,
    getInventoryBreakdownBySchool,
    getOverallSummarisedInventory,
    getOverallInventoryByCategory,
    getActiveDrivePerformance,
    getDrivePerformance,
    getDonationBreakdown,
    getStockByStorageLocation,
    getCooperationAnalytics,
    getSustainabilityMetrics,
    getCollectionFunnel,
    getMonthlyCollectionTrends,
}
