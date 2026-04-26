const express = require("express");
const patternController = require("../controllers/patternController");
const { verifyAccessTokenAndAssertTCCAdministratorRole } = require('../middlewares/cognitoJwt');

const router = express.Router();

// POST /api/pattern - Create a new pattern
router.post("/", verifyAccessTokenAndAssertTCCAdministratorRole, patternController.createPattern);

// GET /api/pattern - Get all patterns
router.get("/", verifyAccessTokenAndAssertTCCAdministratorRole, patternController.getAllPatterns);

// GET /api/pattern/:id - Get a pattern by ID
router.get("/:id", verifyAccessTokenAndAssertTCCAdministratorRole, patternController.getPatternById);

// PATCH /api/pattern/:id - Update a pattern
router.patch("/:id", verifyAccessTokenAndAssertTCCAdministratorRole, patternController.updatePattern);

// DELETE /api/pattern/:id - Delete a pattern
router.delete("/:id", verifyAccessTokenAndAssertTCCAdministratorRole, patternController.deletePattern);

module.exports = router;