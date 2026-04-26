const express = require("express");
const brandController = require("../controllers/brandController");
const { verifyAccessTokenAndAssertTCCAdministratorRole } = require('../middlewares/cognitoJwt');

const router = express.Router();

// POST /api/brand - Create a new brand
router.post("/", verifyAccessTokenAndAssertTCCAdministratorRole, brandController.createBrand);

// GET /api/brand - Get all brands
router.get("/", verifyAccessTokenAndAssertTCCAdministratorRole, brandController.getAllBrands);

// GET /api/brand/:id - Get a brand by ID
router.get("/:id", verifyAccessTokenAndAssertTCCAdministratorRole, brandController.getBrandById);

// PATCH /api/brand/:id - Update a brand
router.patch("/:id", verifyAccessTokenAndAssertTCCAdministratorRole, brandController.updateBrand);

// DELETE /api/brand/:id - Delete a brand
router.delete("/:id", verifyAccessTokenAndAssertTCCAdministratorRole, brandController.deleteBrand);

module.exports = router;