const express = require('express');
const router = express.Router();
const {
    verifyAccessTokenAndAssertTCCAdministratorRole,
} = require('../middlewares/cognitoJwt');

const overviewController = require('../controllers/overviewController');

// All overview routes are TCC Admin only
router.use(verifyAccessTokenAndAssertTCCAdministratorRole);

// GET /api/overview/kpi-totals - get overall KPI totals of all schools
router.get('/kpi-totals', overviewController.getNetworkKPITotals);

// GET /api/overview/inventory-by-school - get inventory count of a school, grouped by categories
router.get('/inventory-by-school', overviewController.getInventoryBySchoolWithCategoryBreakdown);

// GET /api/overview/inventory-by-category - get inventory count of each categories
router.get('/inventory-by-category', overviewController.getInventoryByCategoryWithGroupBreakdown);

// GET /api/overview/yearly-trend - get yearly trend across the years
router.get('/yearly-trend', overviewController.getYearlyTrend);

// GET /api/overview/drive-participation - get drive participations across the different schools
router.get('/drive-participation', overviewController.getDriveParticipationSummary);

// GET /api/overview/repurposing-by-colour - get repurposing information by colour
router.get('/repurposing-by-colour', overviewController.getRepurposingMaterialsByColour);

// GET /api/overview/product-projections - get product projections
router.get('/product-projections', overviewController.getProductProjections);

module.exports = router;