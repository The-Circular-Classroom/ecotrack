// apps/backend/routes/itemTypeHandling.js
const express = require("express");
const itemTypeController = require("../controllers/itemTypeController");
const { verifyAccessTokenAndAssertParentSupportGroupAndAbove, verifyAccessTokenAndAssertTCCAdministratorRole } = require('../middlewares/cognitoJwt');
const multer = require('multer');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    ['image/jpeg', 'image/png', 'image/jpg'].includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error('Invalid file type'));
  },
});

const router = express.Router();

// Important: define specific routes BEFORE "/:id" to avoid interception
// GET /api/item-type/admin/items (TCC only)
router.get("/admin/items", verifyAccessTokenAndAssertTCCAdministratorRole, itemTypeController.getAdminItemTypePreset);

// POST /api/item-type
router.post("/", verifyAccessTokenAndAssertTCCAdministratorRole, itemTypeController.createItemType);

// GET /api/item-type
router.get("/", verifyAccessTokenAndAssertTCCAdministratorRole, itemTypeController.listItemTypes);

// GET /api/item-type/preset - List all item type presets (TCC only)
router.get("/preset", verifyAccessTokenAndAssertTCCAdministratorRole, itemTypeController.getAllItemTypePresets);

// GET /api/item-type/preset/:id - Get a specific item type preset by ID (TCC only)
router.get("/preset/:id", verifyAccessTokenAndAssertTCCAdministratorRole, itemTypeController.getItemTypePresetById);

// GET /api/item-type/:id
router.get("/:id", verifyAccessTokenAndAssertTCCAdministratorRole, itemTypeController.getItemTypeById);

// PATCH /api/item-type/:id
router.patch("/:id", verifyAccessTokenAndAssertTCCAdministratorRole, itemTypeController.updateItemType);

// DELETE /api/item-type/:id
router.delete("/:id", verifyAccessTokenAndAssertTCCAdministratorRole, itemTypeController.deleteItemType);

// GET /api/item-type/psg/items
router.get("/psg/items", verifyAccessTokenAndAssertParentSupportGroupAndAbove, itemTypeController.getPSGItemTypePreset);

// POST /api/item-type/preset - Create a new item type preset (TCC only)
router.post("/preset", verifyAccessTokenAndAssertTCCAdministratorRole, upload.single('image'), itemTypeController.createItemTypePreset);

// PATCH /api/item-type/preset/:id - Update an item type preset (TCC only)
router.patch("/preset/:id", verifyAccessTokenAndAssertTCCAdministratorRole, upload.single('image'), itemTypeController.updateItemTypePreset);

// DELETE /api/item-type/preset/:id - Delete an item type preset (TCC only)
router.delete("/preset/:id", verifyAccessTokenAndAssertTCCAdministratorRole, itemTypeController.deleteItemTypePreset);


module.exports = router;
