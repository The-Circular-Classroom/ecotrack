const express = require('express');
const router = express.Router();
const { verifyAccessTokenAndAssertTCCAdministratorRole, verifyAccessTokenAndAssertParentSupportGroupAndAbove } = require('../middlewares/cognitoJwt');
const reportController = require('../controllers/reportController');

// GET /api/report/admin - get analytics report for TCC admin
router.get('/admin', verifyAccessTokenAndAssertTCCAdministratorRole, reportController.downloadAdminReport);

// GET /api/report/school - get analytics report for individual schools
router.get('/school/:school_id', verifyAccessTokenAndAssertParentSupportGroupAndAbove, reportController.downloadSchoolReport);

module.exports = router;
