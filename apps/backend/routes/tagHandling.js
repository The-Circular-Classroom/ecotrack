const express = require("express");
const tagController = require("../controllers/tagController");
const { verifyAccessTokenAndAssertTCCAdministratorRole } = require('../middlewares/cognitoJwt');

const router = express.Router();

// POST /api/tag - Create a new tag
router.post("/", verifyAccessTokenAndAssertTCCAdministratorRole, tagController.createTag);

// GET /api/tag - Get all tags
router.get("/", verifyAccessTokenAndAssertTCCAdministratorRole, tagController.getAllTags);

// GET /api/tag/:id - Get a tag by ID
router.get("/:id", verifyAccessTokenAndAssertTCCAdministratorRole, tagController.getTagById);

// PATCH /api/tag/:id - Update a tag
router.patch("/:id", verifyAccessTokenAndAssertTCCAdministratorRole, tagController.updateTag);

// DELETE /api/tag/:id - Delete a tag
router.delete("/:id", verifyAccessTokenAndAssertTCCAdministratorRole, tagController.deleteTag);

// GET /api/tag/:id/get-item-type-tags - Get all tags associated with a specific item type
router.get("/:id/get-item-type-tags", verifyAccessTokenAndAssertTCCAdministratorRole, tagController.getItemTypeTagsById);

// GET /api/tag/item-type/:item_type_id/get-item-type-tags - Get all tags associated with a specific item type
router.get("/:id/item-type/:item_type_id/get-item-type-tags", verifyAccessTokenAndAssertTCCAdministratorRole, tagController.getItemTypeTagsByItemTypeId);

module.exports = router;