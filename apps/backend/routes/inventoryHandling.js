// apps/backend/routes/inventoryHandling.js
const express = require("express");
const inventoryController = require("../controllers/inventoryController");
const {
  verifyAccessTokenAndAssertParentSupportGroupAndAbove,
  verifyAccessTokenAndAssertTCCAdministratorRole,
} = require('../middlewares/cognitoJwt');

const router = express.Router();

// GET /api/inventory - Get all inventory items
router.get("/", verifyAccessTokenAndAssertParentSupportGroupAndAbove, inventoryController.getAllInventoryItems);

// GET /api/inventory/balances - Get all inventory balances or filter by itemTypeId
router.get("/balances", verifyAccessTokenAndAssertParentSupportGroupAndAbove, inventoryController.getInventoryBalances);

// GET /api/inventory/:schoolId - List inventory for a specific school
router.get("/:schoolId", verifyAccessTokenAndAssertParentSupportGroupAndAbove, inventoryController.listSchoolInventory);

// PATCH /api/inventory/update-item-condition - Update inventory item condition
// ✅ allow PSG + SchoolStaff + TCC
router.patch("/update-item-condition", verifyAccessTokenAndAssertParentSupportGroupAndAbove, inventoryController.updateInventoryItemCondition);

module.exports = router;