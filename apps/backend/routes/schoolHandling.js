const express = require('express');
const router = express.Router();
const {
    verifyAccessToken,
    verifyAccessTokenAndAssertTCCAdministratorRole,
    verifyAccessTokenAndAssertParentSupportGroupAndAbove,
} = require('../middlewares/cognitoJwt');

const schoolController = require('../controllers/schoolController');

// School profile + contacts
// Accessible by: TCC Admin, School Staff, PSG Volunteer of that school
router.get('/:schoolId/profile', verifyAccessTokenAndAssertParentSupportGroupAndAbove, schoolController.getSchoolProfile);

// Donation drive list with dates
// Accessible by: TCC Admin, School Staff, PSG Volunteer of that school
router.get('/:schoolId/drives', verifyAccessTokenAndAssertParentSupportGroupAndAbove, schoolController.getSchoolDriveList);

// Collection overview — total pieces + 4 core groups + kg
// Accessible by: TCC Admin, School Staff, PSG Volunteer of that school
router.get('/:schoolId/collection-overview', verifyAccessTokenAndAssertParentSupportGroupAndAbove, schoolController.getSchoolCollectionOverview);

// Inventory by item type
// Accessible by: TCC Admin (sees all 4 groups), School/PSG (sees school stock + PSG only)
// isAdmin query param controls which view is returned
router.get('/:schoolId/inventory-by-item', verifyAccessTokenAndAssertParentSupportGroupAndAbove, schoolController.getSchoolInventoryByItem);

// Single item type detail page
// Accessible by: TCC Admin, School Staff, PSG Volunteer of that school
router.get('/:schoolId/item/:itemTypeId', verifyAccessTokenAndAssertParentSupportGroupAndAbove, schoolController.getItemTypeDetail);

// Collaborations — admin only
router.get('/:schoolId/collaborations', verifyAccessTokenAndAssertTCCAdministratorRole, schoolController.getSchoolCollaborations);

// Products created — admin only
router.get('/:schoolId/products', verifyAccessTokenAndAssertTCCAdministratorRole, schoolController.getSchoolProductsCreated);

// GET /api/school
router.get('/', verifyAccessToken, schoolController.getAllSchools);

// POST /api/school/add-school
router.post('/add-school', verifyAccessTokenAndAssertTCCAdministratorRole, schoolController.addSchool);

module.exports = router;