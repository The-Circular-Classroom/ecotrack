const path = require('path');
const { generateAdminReport, generateSchoolReport } = require('../services/reports/pdfReportService');

// ─── Service imports ───────────────────────────────────────────────────────────
const inventoryService = require('../models/inventoryService');
const transactionService = require('../models/transactionService');
const donationService = require('../models/donationService');
const schoolService = require('../models/schoolService');
const productService = require('../models/productService');
const userService = require('../models/userService');
const { mapToCoreCategoryGroup, emptyCoreGroups } = require('../utils/inventorySnapshotGroups');

const https = require('https');
const http = require('http');

// ─── Logo paths ────────────────────────────────────────────────────────────────
const TCC_HEADER_LOGO = path.join(__dirname, '../assets/Logo-Symbol-green.png');
const TCC_FOOTER_LOGO = path.join(__dirname, '../assets/Logo-Symbol-green.png');

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB safety limit for downloaded images

// ─── Helpers ───────────────────────────────────────────────────────────────────

function fetchImageBuffer(url, timeoutMs = 5000, maxBytes = MAX_IMAGE_BYTES) {
    return new Promise((resolve) => {
        if (!url) return resolve(null);

        let parsedUrl;
        try {
            parsedUrl = new URL(url);
        } catch {
            return resolve(null);
        }

        // Enforce HTTPS to avoid insecure and internal HTTP calls
        if (parsedUrl.protocol !== 'https:') {
            return resolve(null);
        }

        let finished = false;
        const req = https.get(parsedUrl, (res) => {
            if (res.statusCode !== 200) {
                res.resume(); // drain data to free up memory
                if (!finished) {
                    finished = true;
                    return resolve(null);
                }
                return;
            }

            const chunks = [];
            let totalBytes = 0;

            res.on('data', (chunk) => {
                if (finished) return;
                totalBytes += chunk.length;
                if (totalBytes > maxBytes) {
                    finished = true;
                    req.destroy();
                    return resolve(null);
                }
                chunks.push(chunk);
            });

            res.on('end', () => {
                if (finished) return;
                finished = true;
                return resolve(Buffer.concat(chunks));
            });

            res.on('error', () => {
                if (finished) return;
                finished = true;
                return resolve(null);
            });
        });

        req.on('error', () => {
            if (finished) return;
            finished = true;
            return resolve(null);
        });

        req.setTimeout(timeoutMs, () => {
            if (finished) return;
            finished = true;
            req.destroy();
            return resolve(null);
        });
    });
}

function decimalToNumber(value) {
    if (value === null || value === undefined) return 0;
    return Number(value);
}

const USER_ROLE_LABELS = {
    SchoolStaff: 'School Staff',
    PsgVolunteer: 'PSG Volunteer',
};

const CATEGORY_ORDER = [
    'Uniform Shirt', 'Uniform Shorts', 'Uniform Pants',
    'Uniform Skirt', 'Skort', 'Pinafore', 'Polo Shirt',
    'PE Shirt', 'PE Shorts', 'House Shirt', 'Tie', 'Belt',
];

/**
 * Build period activity KPIs + circularity rates from funnel data.
 */
function buildPeriodActivity(funnel, kpiTotals) {
    const schools = funnel?.schools || [];
    const totals = schools.reduce((acc, s) => ({
        donated:         acc.donated         + (s.donated || 0),
        sold:            acc.sold            + (s.sold || 0),
        repurposed:      acc.repurposed      + (s.repurposed || 0),
        disposed:        acc.disposed        + (s.disposed || 0),
        donatedWeightKg: acc.donatedWeightKg + (s.donatedWeightKg || 0),
    }), { donated: 0, sold: 0, repurposed: 0, disposed: 0, donatedWeightKg: 0 });

    const donated   = totals.donated || 1;
    const processed = (totals.sold + totals.repurposed + totals.disposed) || 1;

    return {
        ...totals,
        onHand: kpiTotals?.totalPieces || 0,
        donatedWeightKg: Number(totals.donatedWeightKg.toFixed(3)),
        rates: {
            sellThroughRate: ((totals.sold / donated) * 100).toFixed(1),
            repurposeRate:   ((totals.repurposed / donated) * 100).toFixed(1),
            recoveryRate:    (((totals.sold + totals.repurposed) / donated) * 100).toFixed(1),
            disposalRate:    ((totals.disposed / processed) * 100).toFixed(1),
        },
    };
}

/**
 * Normalise sustainability data into the shape the PDF expects.
 */
function normaliseSustainability(raw) {
    if (!raw) return null;
    const summary = raw.summary || raw;
    return {
        divertedKg:    summary.divertedKg    ?? ((summary.soldKg || 0) + (summary.repurposedKg || 0)),
        donatedKg:     summary.donatedKg     ?? 0,
        soldKg:        summary.soldKg        ?? 0,
        repurposedKg:  summary.repurposedKg  ?? 0,
        disposedKg:    summary.disposedKg    ?? 0,
        diversionRate: summary.diversionRate ?? 0,
        categories:    raw.categories        ?? [],
    };
}

/**
 * Normalise active drives into the shape the PDF expects.
 */
function normaliseActiveDrives(raw) {
    if (!raw || !raw.length) return null;
    const drives = raw;
    return {
        drives,
        totalQuantity: drives.reduce((s, d) => s + (d.totalQuantity || 0), 0),
        totalWeightKg: drives.reduce((s, d) => s + (d.totalEstimatedWeightKg || 0), 0),
    };
}

// ════════════════════════════════════════════════════════════════════════════════
//  ADMIN REPORT — ALL-TIME FETCHERS
// ════════════════════════════════════════════════════════════════════════════════

async function fetchKPITotals() {
    const balances = await inventoryService.getBalancesForKPI();
    const totals = { totalPieces: 0, ...emptyCoreGroups(), totalWeightKg: 0 };

    for (const balance of balances) {
        const qty = balance.quantity ?? 0;
        const weightKg = decimalToNumber(balance.itemType?.category?.weightKg) * qty;
        const group = mapToCoreCategoryGroup(balance.itemStatus);
        totals.totalPieces += qty;
        totals.totalWeightKg += weightKg;
        if (group) totals[group] += qty;
    }

    totals.totalWeightKg = Number(totals.totalWeightKg.toFixed(3));
    return totals;
}

async function fetchInventoryBySchool() {
    const balances = await inventoryService.getBalancesForSchoolBreakdown();
    const schoolMap = {};

    for (const balance of balances) {
        const school = balance.itemType?.school;
        if (!school) continue;
        const qty = balance.quantity ?? 0;
        const weightKg = decimalToNumber(balance.itemType?.category?.weightKg) * qty;
        const group = mapToCoreCategoryGroup(balance.itemStatus);

        if (!schoolMap[school.id]) {
            schoolMap[school.id] = { schoolId: school.id, schoolName: school.schoolName, totalPieces: 0, totalWeightKg: 0, ...emptyCoreGroups() };
        }
        schoolMap[school.id].totalPieces += qty;
        schoolMap[school.id].totalWeightKg += weightKg;
        if (group) schoolMap[school.id][group] += qty;
    }

    return Object.values(schoolMap)
        .map((s) => ({ ...s, totalWeightKg: Number(s.totalWeightKg.toFixed(3)) }))
        .sort((a, b) => b.totalPieces - a.totalPieces);
}

async function fetchInventoryByCategory() {
    const balances = await inventoryService.getBalancesForCategoryBreakdown();
    const categoryMap = {};

    for (const balance of balances) {
        const category = balance.itemType?.category;
        if (!category) continue;
        const qty = balance.quantity ?? 0;
        const weightKg = decimalToNumber(category.weightKg) * qty;
        const group = mapToCoreCategoryGroup(balance.itemStatus);

        if (!categoryMap[category.id]) {
            categoryMap[category.id] = { categoryId: category.id, categoryName: category.categoryName, totalPieces: 0, totalWeightKg: 0, ...emptyCoreGroups() };
        }
        categoryMap[category.id].totalPieces += qty;
        categoryMap[category.id].totalWeightKg += weightKg;
        if (group) categoryMap[category.id][group] += qty;
    }

    return Object.values(categoryMap)
        .map((c) => ({ ...c, totalWeightKg: Number(c.totalWeightKg.toFixed(3)) }))
        .sort((a, b) => b.totalPieces - a.totalPieces);
}

async function fetchYearlyTrend(year) {
    const currentYear = new Date().getFullYear();
    const startYear = year ? year - 5 : currentYear - 5;
    const endYear = year || currentYear;

    const transactions = await transactionService.getTransactionsForYearlyTrend({ startYear, endYear });
    const yearMap = {};
    for (let y = startYear; y <= endYear; y++) {
        yearMap[y] = { year: y, donated: 0, sold: 0, repurposed: 0, disposed: 0, totalWeightKg: 0 };
    }

    for (const tx of transactions) {
        const y = new Date(tx.transactionDate).getUTCFullYear();
        if (!yearMap[y]) continue;
        const qty = tx.quantity ?? 0;
        yearMap[y].totalWeightKg += decimalToNumber(tx.itemType?.category?.weightKg) * qty;
        switch (tx.transactionType) {
            case 'DonationIn':  yearMap[y].donated += qty; break;
            case 'Sale':        yearMap[y].sold += qty; break;
            case 'Repurposing': yearMap[y].repurposed += qty; break;
            case 'Disposal':    yearMap[y].disposed += qty; break;
        }
    }

    return {
        filters: { startYear, endYear },
        years: Object.values(yearMap).map((e) => ({ ...e, totalWeightKg: Number(e.totalWeightKg.toFixed(3)) })),
    };
}

async function fetchRepurposingByColour() {
    const balances = await inventoryService.getRepurposeBalancesWithColour();
    const colourMap = {};

    for (const balance of balances) {
        const colour = balance.itemType?.primaryColour;
        if (!colour) continue;
        const qty = balance.quantity ?? 0;
        const weightKg = decimalToNumber(balance.itemType?.category?.weightKg) * qty;

        if (!colourMap[colour.id]) {
            colourMap[colour.id] = { colourId: colour.id, colourName: colour.colourName, hexcode: colour.hexcode, totalPieces: 0, totalWeightKg: 0 };
        }
        colourMap[colour.id].totalPieces += qty;
        colourMap[colour.id].totalWeightKg += weightKg;
    }

    const colours = Object.values(colourMap)
        .map((c) => ({ ...c, totalWeightKg: Number(c.totalWeightKg.toFixed(3)) }))
        .sort((a, b) => b.totalPieces - a.totalPieces);

    return {
        grandTotal: colours.reduce((sum, c) => sum + c.totalPieces, 0),
        grandWeightKg: Number(colours.reduce((sum, c) => sum + c.totalWeightKg, 0).toFixed(3)),
        colours,
    };
}

async function fetchProductProjections() {
    const [recipes, repurposeStock] = await Promise.all([
        productService.getAllRecipesWithIngredients(),
        inventoryService.getRepurposeBalancesForProjections(),
    ]);

    const stockLookup = {};
    for (const balance of repurposeStock) {
        const itemTypeId = balance.itemType?.id;
        if (!itemTypeId) continue;
        const sizeClass = balance.sizeOption?.sizeClass ?? 'any';
        const qty = balance.quantity ?? 0;
        if (!stockLookup[itemTypeId]) stockLookup[itemTypeId] = { S: 0, L: 0, any: 0 };
        if (sizeClass !== 'any') stockLookup[itemTypeId][sizeClass] = (stockLookup[itemTypeId][sizeClass] ?? 0) + qty;
        stockLookup[itemTypeId].any += qty;
    }

    const projections = recipes.map((recipe) => {
        const ingredients = recipe.recipeIngredients ?? [];
        if (!ingredients.length) {
            return { recipeId: recipe.id, recipeName: recipe.recipeName, productName: recipe.productStyle?.product?.productName ?? 'Unknown', productType: recipe.productStyle?.product?.productType?.typeName ?? null, estimatedUnits: 0, limitingIngredient: null };
        }

        let minPossible = Infinity;
        let limitingIngredient = null;

        for (const ing of ingredients) {
            const itemTypeId = ing.itemType?.id;
            const qtyReq = decimalToNumber(ing.quantityRequired);
            if (!itemTypeId || qtyReq <= 0) continue;
            const stock = stockLookup[itemTypeId];
            const available = stock ? (ing.sizeClass ? (stock[ing.sizeClass] ?? 0) : stock.any) : 0;
            const possible = Math.floor(available / qtyReq);
            if (possible < minPossible) {
                minPossible = possible;
                limitingIngredient = ing.itemType?.category?.categoryName ?? 'Unknown';
            }
        }

        return {
            recipeId: recipe.id,
            recipeName: recipe.recipeName,
            productName: recipe.productStyle?.product?.productName ?? 'Unknown',
            productType: recipe.productStyle?.product?.productType?.typeName ?? null,
            estimatedUnits: minPossible === Infinity ? 0 : minPossible,
            limitingIngredient: minPossible > 0 && minPossible !== Infinity ? limitingIngredient : null,
        };
    }).sort((a, b) => b.estimatedUnits - a.estimatedUnits);

    return {
        totalEstimatedProducts: projections.reduce((sum, p) => sum + p.estimatedUnits, 0),
        projections,
    };
}

// ════════════════════════════════════════════════════════════════════════════════
//  ADMIN REPORT — YEAR-FILTERED FETCHERS
// ════════════════════════════════════════════════════════════════════════════════

async function fetchSchoolRankings(year) {
    if (!year) year = new Date().getFullYear();

    const start = new Date(Date.UTC(year, 0, 1));
    const end = new Date(Date.UTC(year + 1, 0, 1));

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
            schoolMap[school.id] = { schoolId: school.id, schoolName: school.schoolName, totalDonated: 0, totalSold: 0, totalRepurposed: 0 };
        }

        if (tx.transactionType === 'DonationIn') schoolMap[school.id].totalDonated += tx.quantity;
        else if (tx.transactionType === 'Sale') schoolMap[school.id].totalSold += tx.quantity;
        else if (tx.transactionType === 'Repurposing') schoolMap[school.id].totalRepurposed += tx.quantity;
    }

    const schools = Object.values(schoolMap).map((s) => ({
        ...s,
        redistributionRate: s.totalDonated > 0 ? parseFloat(((s.totalSold / s.totalDonated) * 100).toFixed(2)) : 0,
    }));

    const networkAverage = schools.length > 0
        ? parseFloat((schools.reduce((sum, s) => sum + s.redistributionRate, 0) / schools.length).toFixed(2))
        : 0;

    const ranked = schools
        .map((s) => ({ ...s, deviationFromAverage: parseFloat((s.redistributionRate - networkAverage).toFixed(2)) }))
        .sort((a, b) => b.redistributionRate - a.redistributionRate)
        .map((s, i) => ({ rank: i + 1, ...s }));

    return { networkAverage, schools: ranked };
}

async function fetchDriveParticipation(year) {
    const [totalSchools, drives] = await Promise.all([
        schoolService.getTotalSchoolCount(),
        donationService.getDrivesForParticipation(year),
    ]);

    const schoolMap = {};
    for (const drive of drives) {
        if (!drive.school) continue;
        const sid = drive.school.id;
        if (!schoolMap[sid]) {
            schoolMap[sid] = { schoolId: sid, schoolName: drive.school.schoolName, driveCount: 0, drives: [] };
        }
        schoolMap[sid].driveCount += 1;
        schoolMap[sid].drives.push({ driveId: drive.id, driveName: drive.driveName });
    }

    const schools = Object.values(schoolMap).sort((a, b) => a.schoolName.localeCompare(b.schoolName));
    const participatingCount = schools.length;

    return {
        filters: { year },
        totalSchools,
        participatingCount,
        nonParticipatingCount: totalSchools - participatingCount,
        participationRate: totalSchools > 0 ? Number(((participatingCount / totalSchools) * 100).toFixed(2)) : 0,
        schools,
    };
}

/**
 * Fetch funnel data (donated/sold/repurposed/disposed) for a given year.
 * Groups by school so buildPeriodActivity can aggregate.
 */
async function fetchFunnel(year) {
    if (!year) year = new Date().getFullYear();

    const start = new Date(Date.UTC(year, 0, 1));
    const end = new Date(Date.UTC(year + 1, 0, 1));

    const transactions = await transactionService.getAnalyticsTransactions({
        startDate: start,
        endDate: end,
        transactionTypes: ['DonationIn', 'Sale', 'Repurposing', 'Disposal'],
    });

    const schoolMap = {};

    for (const tx of transactions) {
        const school = tx.itemType?.school;
        if (!school) continue;
        const qty = tx.quantity ?? 0;
        const weightKg = decimalToNumber(tx.itemType?.category?.weightKg) * qty;

        if (!schoolMap[school.id]) {
            schoolMap[school.id] = {
                schoolId: school.id,
                schoolName: school.schoolName,
                donated: 0, sold: 0, repurposed: 0, disposed: 0,
                donatedWeightKg: 0,
            };
        }

        const entry = schoolMap[school.id];
        switch (tx.transactionType) {
            case 'DonationIn':  entry.donated += qty; entry.donatedWeightKg += weightKg; break;
            case 'Sale':        entry.sold += qty; break;
            case 'Repurposing': entry.repurposed += qty; break;
            case 'Disposal':    entry.disposed += qty; break;
        }
    }

    return { schools: Object.values(schoolMap) };
}

/**
 * Fetch sustainability summary (weight diverted/sold/repurposed/disposed) for a given year.
 */
async function fetchSustainability(year) {
    if (!year) year = new Date().getFullYear();

    const start = new Date(Date.UTC(year, 0, 1));
    const end = new Date(Date.UTC(year + 1, 0, 1));

    const transactions = await transactionService.getAnalyticsTransactions({
        startDate: start,
        endDate: end,
        transactionTypes: ['DonationIn', 'Sale', 'Repurposing', 'Disposal'],
    });

    const summary = { donatedKg: 0, soldKg: 0, repurposedKg: 0, disposedKg: 0 };
    const categoryMap = {};

    for (const tx of transactions) {
        const category = tx.itemType?.category;
        if (!category) continue;
        const qty = tx.quantity ?? 0;
        const weightKg = decimalToNumber(category.weightKg) * qty;

        switch (tx.transactionType) {
            case 'DonationIn':  summary.donatedKg += weightKg; break;
            case 'Sale':        summary.soldKg += weightKg; break;
            case 'Repurposing': summary.repurposedKg += weightKg; break;
            case 'Disposal':    summary.disposedKg += weightKg; break;
        }

        if (tx.transactionType === 'Sale' || tx.transactionType === 'Repurposing') {
            if (!categoryMap[category.id]) {
                categoryMap[category.id] = { categoryName: category.categoryName, soldKg: 0, repurposedKg: 0 };
            }
            if (tx.transactionType === 'Sale') categoryMap[category.id].soldKg += weightKg;
            if (tx.transactionType === 'Repurposing') categoryMap[category.id].repurposedKg += weightKg;
        }
    }

    summary.divertedKg = summary.soldKg + summary.repurposedKg;
    const processed = summary.soldKg + summary.repurposedKg + summary.disposedKg;
    summary.diversionRate = processed > 0 ? Number(((summary.divertedKg / processed) * 100).toFixed(1)) : 0;

    for (const key of Object.keys(summary)) {
        if (typeof summary[key] === 'number') summary[key] = Number(summary[key].toFixed(3));
    }

    const categories = Object.values(categoryMap)
        .map((c) => ({ ...c, soldKg: Number(c.soldKg.toFixed(3)), repurposedKg: Number(c.repurposedKg.toFixed(3)) }))
        .sort((a, b) => (b.soldKg + b.repurposedKg) - (a.soldKg + a.repurposedKg));

    return { summary, categories };
}

/**
 * Fetch cooperation analytics — compare cooperating vs non-cooperating schools.
 */
async function fetchCooperationAnalytics(year) {
    if (!year) year = new Date().getFullYear();

    const start = new Date(Date.UTC(year, 0, 1));
    const end = new Date(Date.UTC(year + 1, 0, 1));

    const [allSchools, transactions] = await Promise.all([
        schoolService.getAllSchoolsWithCooperationFlag(),
        transactionService.getAnalyticsTransactions({
            startDate: start,
            endDate: end,
            transactionTypes: ['DonationIn', 'Sale', 'Repurposing', 'Disposal'],
        }),
    ]);

    const schoolCoopMap = {};
    for (const school of allSchools) {
        schoolCoopMap[school.id] = school.isCooperating;
    }

    const groups = {
        cooperating:    { label: 'Cooperating', schoolIds: new Set(), donated: 0, donatedKg: 0, sold: 0, soldKg: 0, repurposed: 0, repurposedKg: 0, disposed: 0, disposedKg: 0 },
        nonCooperating: { label: 'Non-Cooperating', schoolIds: new Set(), donated: 0, donatedKg: 0, sold: 0, soldKg: 0, repurposed: 0, repurposedKg: 0, disposed: 0, disposedKg: 0 },
    };

    for (const tx of transactions) {
        const school = tx.itemType?.school;
        if (!school) continue;
        const isCoop = schoolCoopMap[school.id] ?? false;
        const group = isCoop ? groups.cooperating : groups.nonCooperating;
        const qty = tx.quantity ?? 0;
        const weightKg = decimalToNumber(tx.itemType?.category?.weightKg) * qty;

        group.schoolIds.add(school.id);

        switch (tx.transactionType) {
            case 'DonationIn':  group.donated += qty; group.donatedKg += weightKg; break;
            case 'Sale':        group.sold += qty; group.soldKg += weightKg; break;
            case 'Repurposing': group.repurposed += qty; group.repurposedKg += weightKg; break;
            case 'Disposal':    group.disposed += qty; group.disposedKg += weightKg; break;
        }
    }

    return {
        groups: Object.values(groups).map((g) => {
            const recovered = g.sold + g.repurposed;
            const recoveredKg = g.soldKg + g.repurposedKg;
            const donated = g.donated || 1;
            const processed = (g.sold + g.repurposed + g.disposed) || 1;

            return {
                label: g.label,
                schoolCount: g.schoolIds.size,
                donated: g.donated,
                donatedKg: Number(g.donatedKg.toFixed(3)),
                recovered,
                recoveredKg: Number(recoveredKg.toFixed(3)),
                recoveryRate: Number(((recovered / donated) * 100).toFixed(1)),
                disposalRate: Number(((g.disposed / processed) * 100).toFixed(1)),
            };
        }),
    };
}

/**
 * Fetch currently active donation drives across all schools.
 */
async function fetchActiveDrives() {
    const driveResult = await donationService.getAllDonationDrives({});
    const allDrives = driveResult.data ?? [];
    const now = new Date();

    const activeDrives = allDrives.filter((d) => {
        const start = new Date(d.startDate);
        const end = new Date(d.endDate);
        return start <= now && end >= now;
    });

    if (activeDrives.length === 0) return [];

    const activeDriveIds = new Set(activeDrives.map((d) => d.id));

    const transactions = await transactionService.getAnalyticsTransactions({
        transactionTypes: ['DonationIn'],
        requireDonationDrive: true,
        donationDriveIds: Array.from(activeDriveIds),
    });

    const driveMap = {};
    for (const drive of activeDrives) {
        driveMap[drive.id] = {
            driveId: drive.id,
            driveName: drive.driveName,
            schoolName: drive.school?.schoolName ?? '—',
            startDate: drive.startDate,
            endDate: drive.endDate,
            totalQuantity: 0,
            totalEstimatedWeightKg: 0,
        };
    }

    for (const tx of transactions) {
        const driveId = tx.donationDrive?.id;
        if (!driveId || !driveMap[driveId]) continue;
        const qty = tx.quantity ?? 0;
        const weightKg = decimalToNumber(tx.itemType?.category?.weightKg) * qty;
        driveMap[driveId].totalQuantity += qty;
        driveMap[driveId].totalEstimatedWeightKg += weightKg;
    }

    return Object.values(driveMap).map((drive) => {
        const driveStart = new Date(drive.startDate);
        const driveEnd = new Date(drive.endDate);
        const elapsedDays = Math.max(1, Math.ceil((Math.min(now.getTime(), driveEnd.getTime()) - driveStart.getTime()) / (1000 * 60 * 60 * 24)));
        const remainingDays = Math.max(0, Math.ceil((driveEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

        return {
            ...drive,
            totalEstimatedWeightKg: Number(drive.totalEstimatedWeightKg.toFixed(3)),
            averageDailyQuantity: Number((drive.totalQuantity / elapsedDays).toFixed(2)),
            remainingDays,
        };
    });
}

// ════════════════════════════════════════════════════════════════════════════════
//  SCHOOL REPORT DATA FETCHERS
// ════════════════════════════════════════════════════════════════════════════════

async function fetchSchoolProfile(schoolId) {
    const school = await schoolService.getSchoolWithContacts(schoolId);
    if (!school) return null;

    const mapContact = (u, role) => ({
        id: u.id,
        name: u.fullName ?? `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim(),
        email: u.email,
        phoneNumber: u.phoneNumber ?? null,
        role,
    });

    return {
        schoolId: school.id,
        schoolName: school.schoolName,
        address: school.address,
        mrtDesc: school.mrtDesc,
        postalCode: school.postalCode,
        mainlevelCode: school.mainlevelCode,
        natureCode: school.natureCode,
        zoneCode: school.zoneCode,
        status: school.status,
        isCooperating: school.isCooperating,
        logoUrl: school.logoUrl,
        schoolEmail: school.schoolEmail ?? null,
        schoolNumber: school.schoolNumber ?? null,
        contacts: {
            schoolStaff: school.users.filter((u) => u.role === 'SchoolStaff').map((u) => mapContact(u, USER_ROLE_LABELS.SchoolStaff)),
            psgVolunteers: school.users.filter((u) => u.role === 'PsgVolunteer').map((u) => mapContact(u, USER_ROLE_LABELS.PsgVolunteer)),
        },
    };
}

async function fetchSchoolCollectionOverview(schoolId) {
    const balances = await schoolService.getSchoolInventoryBalances(schoolId);
    const totals = { totalPieces: 0, ...emptyCoreGroups(), totalWeightKg: 0 };

    for (const balance of balances) {
        const qty = balance.quantity ?? 0;
        const weightKg = decimalToNumber(balance.itemType?.category?.weightKg) * qty;
        const group = mapToCoreCategoryGroup(balance.itemStatus);
        totals.totalPieces += qty;
        totals.totalWeightKg += weightKg;
        if (group) totals[group] += qty;
    }

    totals.totalWeightKg = Number(totals.totalWeightKg.toFixed(3));

    const percentages = {};
    ['schoolStock', 'psg', 'repurposing', 'waste'].forEach((key) => {
        percentages[key] = totals.totalPieces > 0 ? Number(((totals[key] / totals.totalPieces) * 100).toFixed(1)) : 0;
    });

    return { schoolId, ...totals, percentages };
}

async function fetchSchoolInventoryByItem(schoolId) {
    const balances = await schoolService.getInventoryByItemTypeForSchool(schoolId);
    const itemMap = {};

    for (const balance of balances) {
        const itemType = balance.itemType;
        if (!itemType) continue;
        const qty = balance.quantity ?? 0;
        const group = mapToCoreCategoryGroup(balance.itemStatus);

        if (!itemMap[itemType.id]) {
            itemMap[itemType.id] = {
                itemTypeId: itemType.id,
                categoryName: itemType.category?.categoryName ?? 'Unknown',
                gender: itemType.gender,
                weightKg: decimalToNumber(itemType.category?.weightKg),
                totalPieces: 0,
                schoolStock: 0,
                psg: 0,
                repurposing: 0,
                waste: 0,
                sizes: {},
            };
        }

        const entry = itemMap[itemType.id];
        entry.totalPieces += qty;
        if (group) entry[group] = (entry[group] || 0) + qty;

        if (balance.sizeOption) {
            const sizeKey = balance.sizeOption.id;
            if (!entry.sizes[sizeKey]) {
                entry.sizes[sizeKey] = {
                    sizeOptionId: balance.sizeOption.id,
                    sizeName: balance.sizeOption.sizeName,
                    sortOrder: balance.sizeOption.sortOrder,
                    schoolStock: 0,
                    psg: 0,
                    total: 0,
                };
            }
            entry.sizes[sizeKey].total += qty;
            if (group && entry.sizes[sizeKey][group] !== undefined) {
                entry.sizes[sizeKey][group] += qty;
            }
        }
    }

    const items = Object.values(itemMap)
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

    return { schoolId, items };
}

async function fetchSchoolDriveList(schoolId) {
    const drives = await schoolService.getDrivesBySchool(schoolId);
    const now = new Date();

    const mapped = drives.map((drive) => {
        const start = new Date(drive.startDate);
        const end = new Date(drive.endDate);
        return {
            driveId: drive.id,
            driveName: drive.driveName,
            startDate: drive.startDate,
            endDate: drive.endDate,
            location: drive.location,
            status: start <= now && end >= now ? 'active' : start > now ? 'upcoming' : 'completed',
        };
    });

    return {
        summary: {
            total: mapped.length,
            active: mapped.filter((d) => d.status === 'active').length,
            upcoming: mapped.filter((d) => d.status === 'upcoming').length,
            completed: mapped.filter((d) => d.status === 'completed').length,
        },
        drives: mapped,
    };
}

async function fetchSchoolDrivePerformance(schoolId) {
    const driveResult = await donationService.getAllDonationDrives({ school_id: schoolId });
    const drives = driveResult.data ?? [];

    const transactions = await transactionService.getAnalyticsTransactions({
        schoolId,
        transactionTypes: ['DonationIn'],
        requireDonationDrive: true,
    });

    const driveMap = {};
    for (const drive of drives) {
        driveMap[drive.id] = {
            driveId: drive.id,
            driveName: drive.driveName,
            startDate: drive.startDate,
            endDate: drive.endDate,
            totalQuantity: 0,
            totalEstimatedWeightKg: 0,
            categories: {},
        };
    }

    for (const tx of transactions) {
        const drive = tx.donationDrive;
        const category = tx.itemType?.category;
        if (!drive || !driveMap[drive.id] || !category) continue;

        const qty = tx.quantity ?? 0;
        const weightKg = decimalToNumber(category.weightKg) * qty;
        const entry = driveMap[drive.id];
        entry.totalQuantity += qty;
        entry.totalEstimatedWeightKg += weightKg;

        if (!entry.categories[category.id]) {
            entry.categories[category.id] = { categoryId: category.id, categoryName: category.categoryName, totalQuantity: 0, totalEstimatedWeightKg: 0 };
        }
        entry.categories[category.id].totalQuantity += qty;
        entry.categories[category.id].totalEstimatedWeightKg += weightKg;
    }

    const now = new Date();
    return Object.values(driveMap).map((drive) => {
        const driveStart = new Date(drive.startDate);
        const driveEnd = new Date(drive.endDate);
        const elapsedDays = Math.max(1, Math.ceil((Math.min(now.getTime(), driveEnd.getTime()) - driveStart.getTime()) / (1000 * 60 * 60 * 24)));
        const remainingDays = Math.max(0, Math.ceil((driveEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

        return {
            ...drive,
            totalEstimatedWeightKg: Number(drive.totalEstimatedWeightKg.toFixed(3)),
            averageDailyQuantity: Number((drive.totalQuantity / elapsedDays).toFixed(2)),
            remainingDays,
            categories: Object.values(drive.categories)
                .map((c) => ({ ...c, totalEstimatedWeightKg: Number(c.totalEstimatedWeightKg.toFixed(3)) }))
                .sort((a, b) => b.totalQuantity - a.totalQuantity),
        };
    }).sort((a, b) => new Date(a.endDate) - new Date(b.endDate));
}

// ════════════════════════════════════════════════════════════════════════════════
//  SCHOOL REPORT — YEAR-FILTERED FETCHERS
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Fetch school funnel for a specific year (donated/sold/repurposed/disposed).
 */
async function fetchSchoolFunnel(schoolId, year) {
    if (!year) year = new Date().getFullYear();
    const start = new Date(Date.UTC(year, 0, 1));
    const end = new Date(Date.UTC(year + 1, 0, 1));

    const transactions = await transactionService.getAnalyticsTransactions({
        startDate: start,
        endDate: end,
        schoolId,
        transactionTypes: ['DonationIn', 'Sale', 'Repurposing', 'Disposal'],
    });

    const totals = { donated: 0, sold: 0, repurposed: 0, disposed: 0, donatedWeightKg: 0 };

    for (const tx of transactions) {
        const qty = tx.quantity ?? 0;
        const weightKg = decimalToNumber(tx.itemType?.category?.weightKg) * qty;

        switch (tx.transactionType) {
            case 'DonationIn':  totals.donated += qty; totals.donatedWeightKg += weightKg; break;
            case 'Sale':        totals.sold += qty; break;
            case 'Repurposing': totals.repurposed += qty; break;
            case 'Disposal':    totals.disposed += qty; break;
        }
    }

    return { schools: [{ schoolId, ...totals }] };
}

/**
 * Fetch school sustainability metrics for a specific year.
 */
async function fetchSchoolSustainability(schoolId, year) {
    if (!year) year = new Date().getFullYear();
    const start = new Date(Date.UTC(year, 0, 1));
    const end = new Date(Date.UTC(year + 1, 0, 1));

    const transactions = await transactionService.getAnalyticsTransactions({
        startDate: start,
        endDate: end,
        schoolId,
        transactionTypes: ['DonationIn', 'Sale', 'Repurposing', 'Disposal'],
    });

    const summary = { donatedKg: 0, soldKg: 0, repurposedKg: 0, disposedKg: 0 };
    const categoryMap = {};

    for (const tx of transactions) {
        const category = tx.itemType?.category;
        if (!category) continue;
        const qty = tx.quantity ?? 0;
        const weightKg = decimalToNumber(category.weightKg) * qty;

        switch (tx.transactionType) {
            case 'DonationIn':  summary.donatedKg += weightKg; break;
            case 'Sale':        summary.soldKg += weightKg; break;
            case 'Repurposing': summary.repurposedKg += weightKg; break;
            case 'Disposal':    summary.disposedKg += weightKg; break;
        }

        if (tx.transactionType === 'Sale' || tx.transactionType === 'Repurposing') {
            if (!categoryMap[category.id]) {
                categoryMap[category.id] = { categoryName: category.categoryName, soldKg: 0, repurposedKg: 0 };
            }
            if (tx.transactionType === 'Sale') categoryMap[category.id].soldKg += weightKg;
            if (tx.transactionType === 'Repurposing') categoryMap[category.id].repurposedKg += weightKg;
        }
    }

    summary.divertedKg = summary.soldKg + summary.repurposedKg;
    const processed = summary.soldKg + summary.repurposedKg + summary.disposedKg;
    summary.diversionRate = processed > 0 ? Number(((summary.divertedKg / processed) * 100).toFixed(1)) : 0;

    for (const key of Object.keys(summary)) {
        if (typeof summary[key] === 'number') summary[key] = Number(summary[key].toFixed(3));
    }

    const categories = Object.values(categoryMap)
        .map((c) => ({ ...c, soldKg: Number(c.soldKg.toFixed(3)), repurposedKg: Number(c.repurposedKg.toFixed(3)) }))
        .sort((a, b) => (b.soldKg + b.repurposedKg) - (a.soldKg + a.repurposedKg));

    return { summary, categories };
}

/**
 * Fetch school donation breakdown for a specific year.
 */
async function fetchSchoolDonationBreakdown(schoolId, year) {
    if (!year) year = new Date().getFullYear();
    const start = new Date(Date.UTC(year, 0, 1));
    const end = new Date(Date.UTC(year + 1, 0, 1));

    const transactions = await transactionService.getAnalyticsTransactions({
        startDate: start,
        endDate: end,
        schoolId,
        transactionTypes: ['DonationIn'],
    });

    let totalQuantity = 0;
    let totalEstimatedWeightKg = 0;
    const categoryMap = {};

    for (const tx of transactions) {
        const category = tx.itemType?.category;
        if (!category) continue;
        const qty = tx.quantity ?? 0;
        const weightKg = decimalToNumber(category.weightKg) * qty;

        totalQuantity += qty;
        totalEstimatedWeightKg += weightKg;

        if (!categoryMap[category.id]) {
            categoryMap[category.id] = { categoryId: category.id, categoryName: category.categoryName, totalQuantity: 0, totalEstimatedWeightKg: 0 };
        }
        categoryMap[category.id].totalQuantity += qty;
        categoryMap[category.id].totalEstimatedWeightKg += weightKg;
    }

    return {
        totalQuantity,
        totalEstimatedWeightKg: Number(totalEstimatedWeightKg.toFixed(3)),
        categories: Object.values(categoryMap)
            .map((c) => ({ ...c, totalEstimatedWeightKg: Number(c.totalEstimatedWeightKg.toFixed(3)) }))
            .sort((a, b) => b.totalQuantity - a.totalQuantity),
    };
}

/**
 * Fetch school monthly trends for a specific year.
 */
async function fetchSchoolMonthlyTrends(schoolId, year) {
    if (!year) year = new Date().getFullYear();
    const start = new Date(Date.UTC(year, 0, 1));
    const end = new Date(Date.UTC(year + 1, 0, 1));

    const transactions = await transactionService.getAnalyticsTransactions({
        startDate: start,
        endDate: end,
        schoolId,
        transactionTypes: ['DonationIn', 'Sale', 'Repurposing', 'Disposal'],
    });

    const monthly = Array.from({ length: 12 }, () => ({ donated: 0, sold: 0, repurposed: 0, disposed: 0 }));

    for (const tx of transactions) {
        const monthIndex = new Date(tx.transactionDate).getUTCMonth();
        if (monthIndex < 0 || monthIndex > 11) continue;
        const qty = tx.quantity ?? 0;

        switch (tx.transactionType) {
            case 'DonationIn':  monthly[monthIndex].donated += qty; break;
            case 'Sale':        monthly[monthIndex].sold += qty; break;
            case 'Repurposing': monthly[monthIndex].repurposed += qty; break;
            case 'Disposal':    monthly[monthIndex].disposed += qty; break;
        }
    }

    return { monthly };
}

/**
 * Fetch school collaborations (admin only).
 */
async function fetchSchoolCollaborationsData(schoolId) {
    const partnerships = await schoolService.getSchoolPartnerships(schoolId);

    const byYear = {};
    for (const p of partnerships) {
        const year = p.yearConducted ?? 'Unknown';
        if (!byYear[year]) byYear[year] = [];
        byYear[year].push({ id: p.id, activityName: p.activityName, remarks: p.remarks });
    }

    return {
        total: partnerships.length,
        byYear: Object.entries(byYear)
            .sort(([a], [b]) => Number(b) - Number(a))
            .map(([year, activities]) => ({ year, activities })),
    };
}

/**
 * Fetch school products created (admin only).
 */
async function fetchSchoolProductsData(schoolId) {
    const products = await schoolService.getProductsBySchool(schoolId);

    const result = products.map((product) => ({
        productId: product.id,
        productName: product.productName,
        productType: product.productType?.typeName ?? null,
        createdDate: product.createdDate,
        totalStyles: product.productStyles.length,
        totalRecipes: product.productStyles.reduce((sum, s) => sum + (s.productRecipes?.length ?? 0), 0),
    }));

    return {
        totalProducts: result.length,
        totalStyles: result.reduce((sum, p) => sum + p.totalStyles, 0),
        totalRecipes: result.reduce((sum, p) => sum + p.totalRecipes, 0),
        products: result,
    };
}

// ════════════════════════════════════════════════════════════════════════════════
//  CONTROLLERS
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Parse a value as a positive integer.
 * Returns the parsed number on success, or null on invalid input.
 */
function parsePositiveInteger(value) {
    const num = Number(value);
    if (!Number.isInteger(num) || num <= 0) {
        return null;
    }
    return num;
}

function getUserGroups(user) {
    const groups = user?.['cognito:groups'];
    if (Array.isArray(groups)) return groups;
    if (typeof groups === 'string' && groups.trim()) return [groups];
    return [];
}

function isTccAdmin(user) {
    const groups = getUserGroups(user);
    return groups.includes('TCCAdministrators') || user?.role === 'TCC_ADMIN' || user?.role === 'Admin';
}

async function findRequestUser(user) {
    const cognitoSub = user?.sub ?? user?.username ?? null;
    if (cognitoSub) {
        const dbUser = await userService.findUserByCognitoSub(cognitoSub);
        if (dbUser) return dbUser;
    }

    const email = user?.email ?? null;
    if (email) {
        return userService.findUserByEmail(email);
    }

    return null;
}

/**
 * GET /api/report/admin?year=2025
 */
const downloadAdminReport = async (req, res) => {
    try {
        const { year } = req.query;
        const currentYear = new Date().getFullYear();

        let reportYear = currentYear;
        if (year !== undefined) {
            const parsedYear = parsePositiveInteger(year);
            if (parsedYear === null) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid year parameter. Year must be a positive integer.',
                });
            }
            reportYear = parsedYear;
        }
        const [
            kpiTotals, inventoryBySchool, inventoryByCategory,
            yearlyTrend, repurposingByColour, productProjections,
            schoolRankings, driveParticipation,
            funnel, sustainabilityRaw, cooperationAnalytics, activeDrivesRaw,
        ] = await Promise.all([
            fetchKPITotals(),
            fetchInventoryBySchool(),
            fetchInventoryByCategory(),
            fetchYearlyTrend(reportYear),
            fetchRepurposingByColour(),
            fetchProductProjections(),
            fetchSchoolRankings(reportYear),
            fetchDriveParticipation(reportYear),
            fetchFunnel(reportYear),
            fetchSustainability(reportYear),
            fetchCooperationAnalytics(reportYear),
            fetchActiveDrives(),
        ]);

        const periodActivity = buildPeriodActivity(funnel, kpiTotals);
        const sustainability = normaliseSustainability(sustainabilityRaw);
        const activeDrives   = normaliseActiveDrives(activeDrivesRaw);

        const pdfBuffer = await generateAdminReport({
            kpiTotals, inventoryBySchool, inventoryByCategory,
            yearlyTrend, repurposingByColour, productProjections,
            schoolRankings, driveParticipation,
            periodActivity, sustainability, cooperationAnalytics, activeDrives,
            generatedAt: new Date(),
            generatedBy: req.user?.email || req.user?.username || null,
            reportYear,
            headerLogo: TCC_HEADER_LOGO,
            footerLogo: TCC_FOOTER_LOGO,
        });

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="tcc-admin-report-${reportYear}.pdf"`,
            'Content-Length': pdfBuffer.length,
        });
        return res.send(pdfBuffer);
    } catch (error) {
        console.error('Error generating admin PDF report:', error);
        return res.status(500).json({ success: false, message: 'Error generating admin PDF report', error: error.message });
    }
};

/**
 * GET /api/report/school/:school_id?year=2025
 */
const downloadSchoolReport = async (req, res) => {
    try {
        const { school_id } = req.params;
        const { year } = req.query;
        const schoolId = parsePositiveInteger(school_id);
        const parsedYear = year === undefined ? null : parsePositiveInteger(year);
        const reportYear = parsedYear ?? new Date().getFullYear();
        const isAdmin = isTccAdmin(req.user);

        if (!schoolId) {
            return res.status(400).json({ success: false, message: 'Invalid school id given' });
        }

        if (year !== undefined && parsedYear === null) {
            return res.status(400).json({
                success: false,
                message: 'Invalid year parameter. Year must be a positive integer.',
            });
        }

        if (!isAdmin) {
            const requestUser = await findRequestUser(req.user);
            if (!requestUser?.schoolId || requestUser.schoolId !== schoolId) {
                return res.status(403).json({ error: 'User is not authorized to perform this action' });
            }
        }

        // ── Fetch all data in parallel ──────────────────────────────────
        const fetchPromises = [
            // Part A — all-time
            fetchSchoolProfile(schoolId),
            fetchSchoolCollectionOverview(schoolId),
            fetchSchoolInventoryByItem(schoolId),
            fetchSchoolDriveList(schoolId),
            // Part B — year-filtered
            fetchSchoolDrivePerformance(schoolId),
            fetchSchoolFunnel(schoolId, reportYear),
            fetchSchoolSustainability(schoolId, reportYear),
            fetchSchoolDonationBreakdown(schoolId, reportYear),
            fetchSchoolMonthlyTrends(schoolId, reportYear),
        ];

        // Admin-only sections
        if (isAdmin) {
            fetchPromises.push(
                fetchSchoolCollaborationsData(schoolId),
                fetchSchoolProductsData(schoolId),
            );
        }

        const results = await Promise.all(fetchPromises);

        const [
            profile, collectionOverview, inventoryByItem, driveList,
            drivePerformance, funnel, sustainabilityRaw, donationBreakdown, monthlyTrends,
        ] = results;

        const collaborations = isAdmin ? results[9] : null;
        const productsCreated = isAdmin ? results[10] : null;

        if (!profile) {
            return res.status(404).json({ success: false, message: 'School not found' });
        }

        // ── Build derived data ──────────────────────────────────────────
        const periodActivity = buildPeriodActivity(funnel, collectionOverview);
        const sustainability = normaliseSustainability(sustainabilityRaw);

        // ── Resolve school logo from S3 URL in DB ───────────────────────
        const schoolLogoBuf = await fetchImageBuffer(profile.logoUrl);
        const headerLogo = schoolLogoBuf || TCC_HEADER_LOGO;

        // ── Generate PDF ────────────────────────────────────────────────
        const pdfBuffer = await generateSchoolReport({
            // Part A — all-time
            profile,
            collectionOverview,
            inventoryByItem,
            driveList,
            // Part B — year-filtered
            drivePerformance,
            periodActivity,
            sustainability,
            donationBreakdown,
            monthlyTrends,
            // Admin-only
            collaborations,
            productsCreated,
            // Meta
            generatedAt: new Date(),
            reportYear,
            headerLogo,
            footerLogo: TCC_FOOTER_LOGO,
        });

        const safeName = profile.schoolName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="tcc-school-report-${safeName}-${reportYear}.pdf"`,
            'Content-Length': pdfBuffer.length,
        });
        return res.send(pdfBuffer);
    } catch (error) {
        console.error('Error generating school PDF report:', error);
        return res.status(500).json({ success: false, message: 'Error generating school PDF report', error: error.message });
    }
};

module.exports = { downloadAdminReport, downloadSchoolReport };
