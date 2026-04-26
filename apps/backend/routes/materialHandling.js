const express = require("express");
const materialController = require("../controllers/materialController");
const { verifyAccessTokenAndAssertTCCAdministratorRole } = require('../middlewares/cognitoJwt');

const router = express.Router();

// POST /api/material - Create a new material
router.post("/", verifyAccessTokenAndAssertTCCAdministratorRole, materialController.createMaterial);

// GET /api/material - Get all materials
router.get("/", verifyAccessTokenAndAssertTCCAdministratorRole, materialController.getAllMaterials);

// GET /api/material/:id - Get a material by ID
router.get("/:id", verifyAccessTokenAndAssertTCCAdministratorRole, materialController.getMaterialById);

// PATCH /api/material/:id - Update a material
router.patch("/:id", verifyAccessTokenAndAssertTCCAdministratorRole, materialController.updateMaterial);

// DELETE /api/material/:id - Delete a material
router.delete("/:id", verifyAccessTokenAndAssertTCCAdministratorRole, materialController.deleteMaterial);

module.exports = router;