const express = require("express");
const sizeController = require("../controllers/sizeController");
const { verifyAccessTokenAndAssertTCCAdministratorRole } = require('../middlewares/cognitoJwt');

const router = express.Router();

// ── Size Category ────────────────────────────────────────────────────────
// POST /api/size/category - Create a new size category
router.post("/category", verifyAccessTokenAndAssertTCCAdministratorRole, sizeController.createSizeCategory);

// GET /api/size/categories - Get all size category info
router.get("/categories", verifyAccessTokenAndAssertTCCAdministratorRole, sizeController.getAllSizeCategories);

// PATCH /api/size/category/:id - Update a size category
router.patch("/category/:id", verifyAccessTokenAndAssertTCCAdministratorRole, sizeController.updateSizeCategory);

// DELETE /api/size/category/:id - Delete a size category
router.delete("/category/:id", verifyAccessTokenAndAssertTCCAdministratorRole, sizeController.deleteSizeCategory);

// ── Size Option ────────────────────────────────────────────────────────
// POST /api/size/option - Create a new size option
router.post("/option", verifyAccessTokenAndAssertTCCAdministratorRole, sizeController.createSizeOption);

// GET /api/size/options - Get all size options
router.get("/options", verifyAccessTokenAndAssertTCCAdministratorRole, sizeController.getAllSizeOptions);

// GET /api/size/option/:id - Get a size option by ID
router.get("/option/:id", verifyAccessTokenAndAssertTCCAdministratorRole, sizeController.getSizeOptionById);

// PATCH /api/size/option/:id - Update a size option
router.patch("/option/:id", verifyAccessTokenAndAssertTCCAdministratorRole, sizeController.updateSizeOption);

// DELETE /api/size/option/:id - Delete a size option
router.delete("/option/:id", verifyAccessTokenAndAssertTCCAdministratorRole, sizeController.deleteSizeOption);

module.exports = router;