const express = require("express");
const colourController = require("../controllers/colourController");
const { verifyAccessTokenAndAssertTCCAdministratorRole } = require('../middlewares/cognitoJwt');

const router = express.Router();

// POST /api/colour - Create a new colour
router.post("/", verifyAccessTokenAndAssertTCCAdministratorRole, colourController.createColour);

// GET /api/colour - Get all categories
router.get("/", verifyAccessTokenAndAssertTCCAdministratorRole, colourController.getAllColours);

// GET /api/colour/:id - Get a colour by ID
router.get("/:id", verifyAccessTokenAndAssertTCCAdministratorRole, colourController.getColourById);

// PATCH /api/colour/:id - Update a colour
router.patch("/:id", verifyAccessTokenAndAssertTCCAdministratorRole, colourController.updateColour);

// DELETE /api/colour/:id - Delete a colour
router.delete("/:id", verifyAccessTokenAndAssertTCCAdministratorRole, colourController.deleteColour);

module.exports = router;