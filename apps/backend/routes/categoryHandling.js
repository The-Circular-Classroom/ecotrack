const express = require("express");
const categoryController = require("../controllers/categoryController");
const { verifyAccessTokenAndAssertTCCAdministratorRole } = require('../middlewares/cognitoJwt');

const router = express.Router();

// POST /api/category - Create a new category
router.post("/", verifyAccessTokenAndAssertTCCAdministratorRole, categoryController.createCategory);

// GET /api/category - Get all categories
router.get("/", verifyAccessTokenAndAssertTCCAdministratorRole, categoryController.getAllCategories);

// GET /api/category/:id - Get a category by ID
router.get("/:id", verifyAccessTokenAndAssertTCCAdministratorRole, categoryController.getCategoryById);

// PATCH /api/category/:id - Update a category
router.patch("/:id", verifyAccessTokenAndAssertTCCAdministratorRole, categoryController.updateCategory);

// DELETE /api/category/:id - Delete a category
router.delete("/:id", verifyAccessTokenAndAssertTCCAdministratorRole, categoryController.deleteCategory);

module.exports = router;