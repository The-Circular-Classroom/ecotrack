// apps/backend/routes/assemblyHandling.js
const express = require('express');
const router = express.Router();
const {
  verifyAccessTokenAndAssertTCCAdministratorRole,
} = require('../middlewares/cognitoJwt');
const assemblyController = require('../controllers/assemblyController');

// GET /api/assembly/products
// Returns all products grouped by school with their full recipe/ingredient trees.
// Used to populate the school + product selectors on the frontend.
router.get('/products', verifyAccessTokenAndAssertTCCAdministratorRole, assemblyController.getProducts);

// POST /api/assembly/calculate
// Body: { requests: [{ schoolId, productId, targetQuantity }] }
// Runs LP to find the optimal assembly plan minimising stock wastage per school.
router.post('/calculate', verifyAccessTokenAndAssertTCCAdministratorRole, assemblyController.calculateAssembly);

// GET /api/assembly/item-types?schoolId=1
// Returns ingredient item types for a school (used in recipe configuration UI).
router.get('/item-types', verifyAccessTokenAndAssertTCCAdministratorRole, assemblyController.getItemTypes);

// GET /api/assembly/product-options
// Returns product type and style options for creating a new product.
router.get('/product-options', verifyAccessTokenAndAssertTCCAdministratorRole, assemblyController.getProductOptions);

// POST /api/assembly/products
// Body: { schoolId, productName, productTypeId, styleId }
router.post('/products', verifyAccessTokenAndAssertTCCAdministratorRole, assemblyController.createProduct);

// PUT /api/assembly/products/:productId
// Body: { productName }
router.put('/products/:productId', verifyAccessTokenAndAssertTCCAdministratorRole, assemblyController.updateProduct);

// DELETE /api/assembly/products/:productId
router.delete('/products/:productId', verifyAccessTokenAndAssertTCCAdministratorRole, assemblyController.deleteProduct);

// POST /api/assembly/product-types
// Body: { typeName }
router.post('/product-types', verifyAccessTokenAndAssertTCCAdministratorRole, assemblyController.createProductType);

// PUT /api/assembly/product-types/:productTypeId
// Body: { typeName }
router.put('/product-types/:productTypeId', verifyAccessTokenAndAssertTCCAdministratorRole, assemblyController.updateProductType);

// DELETE /api/assembly/product-types/:productTypeId
router.delete('/product-types/:productTypeId', verifyAccessTokenAndAssertTCCAdministratorRole, assemblyController.deleteProductType);

// POST /api/assembly/styles
// Body: { styleName }
router.post('/styles', verifyAccessTokenAndAssertTCCAdministratorRole, assemblyController.createStyle);

// PUT /api/assembly/styles/:styleId
// Body: { styleName }
router.put('/styles/:styleId', verifyAccessTokenAndAssertTCCAdministratorRole, assemblyController.updateStyle);

// DELETE /api/assembly/styles/:styleId
router.delete('/styles/:styleId', verifyAccessTokenAndAssertTCCAdministratorRole, assemblyController.deleteStyle);

// POST /api/assembly/recipes
// Body: { productStyleId, recipeName, ingredients: [{ itemTypeId, quantityRequired, sizeClass? }] }
router.post('/recipes', verifyAccessTokenAndAssertTCCAdministratorRole, assemblyController.createRecipe);

// PUT /api/assembly/recipes/:recipeId
// Body: { recipeName, ingredients: [{ itemTypeId, quantityRequired, sizeClass? }] }
router.put('/recipes/:recipeId', verifyAccessTokenAndAssertTCCAdministratorRole, assemblyController.updateRecipe);

// DELETE /api/assembly/recipes/:recipeId
router.delete('/recipes/:recipeId', verifyAccessTokenAndAssertTCCAdministratorRole, assemblyController.deleteRecipe);

module.exports = router;
