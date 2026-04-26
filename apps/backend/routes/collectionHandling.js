const express = require('express');
const router = express.Router();
const {
    verifyAccessTokenAndAssertParentSupportGroupAndAbove,
    verifyAccessTokenAndAssertSchoolStaffAndAbove,
    verifyAccessTokenAndAssertTCCAdministratorRole,
} = require('../middlewares/cognitoJwt');
const collectionController = require('../controllers/collectionController');


// GET /api/collection/donation-volume- get donation drive volume using school id
router.get('/donation-volume', verifyAccessTokenAndAssertTCCAdministratorRole, collectionController.getDonationDriveVolume);

// GET /api/collection/inventory-count- get inventory counts using school id
router.get('/inventory-count', verifyAccessTokenAndAssertTCCAdministratorRole, collectionController.getCurrentInventoryCountSchool);

// GET /api/collection/school-rankings- get school rankings of collection rate for a specific year
router.get('/school-rankings', verifyAccessTokenAndAssertTCCAdministratorRole, collectionController.getSchoolRankings);

// GET /api/collection/active-drives
// Query: schoolId (optional)
router.get('/active-drives', verifyAccessTokenAndAssertTCCAdministratorRole, collectionController.getActiveDrivePerformance);

// GET /api/collection/drive-performance
// Query: year (optional), schoolId (optional), activeOnly (optional)
router.get('/drive-performance', verifyAccessTokenAndAssertTCCAdministratorRole, collectionController.getDrivePerformance);

// GET /api/collection/donation-breakdown
// Query: year (optional), schoolId (optional)
router.get('/donation-breakdown', verifyAccessTokenAndAssertTCCAdministratorRole, collectionController.getDonationBreakdown);

// GET /api/collection/stock-by-location
// Query: schoolId (optional)
router.get('/stock-by-location', verifyAccessTokenAndAssertTCCAdministratorRole, collectionController.getStockByStorageLocation);

// GET /api/collection/cooperation-analytics
// Query: year (required)
router.get('/cooperation-analytics', verifyAccessTokenAndAssertTCCAdministratorRole, collectionController.getCooperationAnalytics);

// GET /api/collection/sustainability
// Query: year (required), schoolId (optional)
router.get('/sustainability', verifyAccessTokenAndAssertTCCAdministratorRole, collectionController.getSustainabilityMetrics);

// GET /api/collection/funnel
// Query: year (required), schoolId (optional)
router.get('/funnel', verifyAccessTokenAndAssertTCCAdministratorRole, collectionController.getCollectionFunnel);

// GET /api/collection/monthly-trends
// Query: year (required), schoolId (optional)
router.get('/monthly-trends', verifyAccessTokenAndAssertTCCAdministratorRole, collectionController.getMonthlyCollectionTrends);

// GET /api/collection/active-drives
// Query: schoolId (optional)
router.get('/active-drives', verifyAccessTokenAndAssertTCCAdministratorRole, collectionController.getActiveDrivePerformance);

// GET /api/collection/drive-performance
// Query: year (optional), schoolId (optional), activeOnly (optional)
router.get('/drive-performance', verifyAccessTokenAndAssertTCCAdministratorRole, collectionController.getDrivePerformance);

// GET /api/collection/donation-breakdown
// Query: year (optional), schoolId (optional)
router.get('/donation-breakdown', verifyAccessTokenAndAssertTCCAdministratorRole, collectionController.getDonationBreakdown);

// GET /api/collection/stock-by-location
// Query: schoolId (optional)
router.get('/stock-by-location', verifyAccessTokenAndAssertTCCAdministratorRole, collectionController.getStockByStorageLocation);

// GET /api/collection/cooperation-analytics
// Query: year (required)
router.get('/cooperation-analytics', verifyAccessTokenAndAssertTCCAdministratorRole, collectionController.getCooperationAnalytics);

// GET /api/collection/sustainability
// Query: year (required), schoolId (optional)
router.get('/sustainability', verifyAccessTokenAndAssertTCCAdministratorRole, collectionController.getSustainabilityMetrics);

// GET /api/collection/funnel
// Query: year (required), schoolId (optional)
router.get('/funnel', verifyAccessTokenAndAssertTCCAdministratorRole, collectionController.getCollectionFunnel);

// GET /api/collection/monthly-trends
// Query: year (required), schoolId (optional)
router.get('/monthly-trends', verifyAccessTokenAndAssertTCCAdministratorRole, collectionController.getMonthlyCollectionTrends);

// GET /api/collection/school - get school total donation
router.get('/school', verifyAccessTokenAndAssertTCCAdministratorRole, collectionController.getInventoryBreakdownBySchool);

// GET /api/collection/overall-donations - get overall inventory count (Intentionally public-facing)
router.get('/overall-donations', collectionController.getOverallSummarisedInventory);

// GET /api/collection/overall-donations-by-category - get overall inventory count by category (Intentionally public-facing)
router.get('/overall-donations-by-category', collectionController.getOverallInventoryByCategory);

module.exports = router;
