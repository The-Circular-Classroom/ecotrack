// apps/backend/controllers/assemblyController.js
const assemblyService = require('../models/assemblyService');
const solver = require('javascript-lp-solver');

const SIZE_CLASSES = ['S', 'L'];

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function ingredientKey(itemTypeId, sizeClass) {
  return `it_${itemTypeId}_${sizeClass ?? 'ALL'}`;
}

function availableQty(stockMap, itemTypeId, sizeClass) {
  const buckets = stockMap[itemTypeId] ?? {};
  if (sizeClass == null) {
    return Object.values(buckets).reduce((s, v) => s + v, 0);
  }
  return buckets[sizeClass] ?? 0;
}

function buildStockMap(balances) {
  const stockMap = {};
  for (const b of balances) {
    const itId = b.itemTypeId;
    const sc = b.sizeOption?.sizeClass ?? 'ANY';
    if (!stockMap[itId]) stockMap[itId] = {};
    stockMap[itId][sc] = (stockMap[itId][sc] ?? 0) + b.quantity;
  }
  return stockMap;
}

function buildIngredientBreakdown(req, recipeTotals, stockMap) {
  const recipeUnitsMap = Object.fromEntries(recipeTotals.map((r) => [r.recipeId, r.unitsMade]));
  const consumed = {};

  for (const recipe of req.recipes) {
    const units = recipeUnitsMap[recipe.recipeId] ?? 0;
    if (units === 0) continue;

    for (const ing of recipe.ingredients) {
      const key = ingredientKey(ing.itemTypeId, ing.sizeClass);
      if (!consumed[key]) {
        consumed[key] = {
          itemTypeId: ing.itemTypeId,
          sizeClass: ing.sizeClass ?? 'ALL',
          categoryName: ing.categoryName,
          schoolName: ing.schoolName,
          qtyConsumed: 0,
          qtyAvailable: availableQty(stockMap, ing.itemTypeId, ing.sizeClass),
        };
      }
      consumed[key].qtyConsumed += units * Number(ing.quantityRequired);
    }
  }

  return Object.values(consumed).map((entry) => {
    // Fractional remainder is physically discarded, so round consumed up to nearest whole item
    const ceiled = Math.ceil(entry.qtyConsumed);
    return {
      ...entry,
      qtyConsumed: ceiled,
      qtyLeftover: Math.max(0, entry.qtyAvailable - ceiled),
    };
  });
}

function buildRecipeBreakdown(req, recipeTotals, stockMap) {
  const recipeUnitsMap = Object.fromEntries(recipeTotals.map((r) => [r.recipeId, r.unitsMade]));

  return req.recipes
    .map((recipe) => {
      const unitsMade = recipeUnitsMap[recipe.recipeId] ?? 0;
      const ingredients = recipe.ingredients.map((ing) => {
        const qtyConsumed = unitsMade * Number(ing.quantityRequired);
        const qtyAvailable = availableQty(stockMap, ing.itemTypeId, ing.sizeClass);

        return {
          itemTypeId: ing.itemTypeId,
          sizeClass: ing.sizeClass ?? 'ALL',
          categoryName: ing.categoryName,
          schoolName: ing.schoolName,
          quantityRequired: Number(ing.quantityRequired),
          qtyConsumed: qtyConsumed,
          qtyAvailable,
          qtyLeftover: Math.max(0, qtyAvailable - qtyConsumed),
        };
      });

      return {
        recipeId: recipe.recipeId,
        recipeName: recipe.recipeName,
        styleName: recipe.styleName ?? null,
        unitsMade,
        ingredients,
      };
    })
    .filter((recipe) => recipe.unitsMade > 0);
}

function solveForSchool(schoolRequests, stockMap) {
  // Pre-compute available stock per ingredient key
  const ingredientCapacity = {};
  for (const req of schoolRequests) {
    for (const recipe of req.recipes) {
      for (const ing of recipe.ingredients) {
        const key = ingredientKey(ing.itemTypeId, ing.sizeClass);
        if (!(key in ingredientCapacity)) {
          ingredientCapacity[key] = availableQty(stockMap, ing.itemTypeId, ing.sizeClass);
        }
      }
    }
  }

  // Helper: build the ingredient + product-cap coefficients for every variable.
  // The caller supplies an `objCoeff` function (varName, req, recipe) → number.
  function buildModel(opType, objCoeff, productConstraints) {
    const model = { optimize: 'obj', opType, constraints: {}, variables: {} };
    for (const [key, cap] of Object.entries(ingredientCapacity)) {
      model.constraints[key] = { max: cap };
    }
    for (const req of schoolRequests) {
      model.constraints[`prod_${req.productId}`] = productConstraints(req);
      for (const recipe of req.recipes) {
        const varName = `v_${req.productId}_${recipe.recipeId}`;
        const varDef = { obj: objCoeff(req, recipe) };
        for (const ing of recipe.ingredients) {
          const key = ingredientKey(ing.itemTypeId, ing.sizeClass);
          varDef[key] = (varDef[key] ?? 0) + Number(ing.quantityRequired);
        }
        varDef[`prod_${req.productId}`] = 1;
        model.variables[varName] = varDef;
      }
    }
    return model;
  }

  // ── Phase 1: maximise total sets assembled up to each product's target ───────
  const phase1Result = solver.Solve(
    buildModel(
      'max',
      () => 1,                                        // every set assembled counts +1
      (req) => ({ max: req.targetQuantity }),
    ),
  );

  // Floor per-product totals (can't physically pack a fractional set)
  const productTotals = {};
  for (const req of schoolRequests) {
    let total = 0;
    for (const recipe of req.recipes) {
      total += Math.floor(phase1Result[`v_${req.productId}_${recipe.recipeId}`] ?? 0);
    }
    productTotals[req.productId] = total;
  }

  // ── Phase 2: minimise ingredient consumption, holding set counts fixed ───────
  // Priority: use the recipe that consumes the fewest total ingredient units per set.
  const phase2Result = solver.Solve(
    buildModel(
      'min',
      (_req, recipe) =>
        recipe.ingredients.reduce((s, ing) => s + Number(ing.quantityRequired), 0),
      (req) => {
        const fixed = productTotals[req.productId];
        return { min: fixed, max: fixed };          // equality — hold sets at phase-1 result
      },
    ),
  );

  const finalResult = phase2Result?.feasible ? phase2Result : phase1Result;

  // ── Build output ─────────────────────────────────────────────────────────────
  const output = [];
  for (const req of schoolRequests) {
    const recipeTotals = [];
    let totalMade = 0;

    for (const recipe of req.recipes) {
      const varName = `v_${req.productId}_${recipe.recipeId}`;
      const units = Math.floor(finalResult[varName] ?? 0);
      totalMade += units;
      if (units > 0) {
        recipeTotals.push({ recipeId: recipe.recipeId, recipeName: recipe.recipeName, unitsMade: units });
      }
    }

    const ingredientBreakdown = buildIngredientBreakdown(req, recipeTotals, stockMap);
    const recipeBreakdown = buildRecipeBreakdown(req, recipeTotals, stockMap);

    output.push({
      productId: req.productId,
      productName: req.productName,
      targetQuantity: req.targetQuantity,
      actualMade: totalMade,
      shortfall: Math.max(0, req.targetQuantity - totalMade),
      chosenRecipes: recipeTotals,
      recipeBreakdown,
      ingredients: ingredientBreakdown,
    });
  }

  return output;
}

// ─── HANDLERS ─────────────────────────────────────────────────────────────────

/**
 * GET /api/assembly/products
 * Query params: schoolId (optional, integer)
 */
const getProducts = async (req, res) => {
  try {
    const schoolId = req.query.schoolId ? Number(req.query.schoolId) : null;

    if (req.query.schoolId && isNaN(schoolId)) {
      return res.status(400).json({ success: false, message: 'schoolId must be a valid integer' });
    }

    const products = await assemblyService.getProducts(schoolId);

    const grouped = {};
    for (const product of products) {
      const sid = product.school?.id ?? 'unknown';
      if (!grouped[sid]) {
        grouped[sid] = {
          school: product.school ?? { id: null, schoolName: 'Unknown' },
          products: [],
        };
      }

      const recipeCount = product.productStyles.reduce(
        (sum, ps) => sum + ps.productRecipes.length,
        0,
      );

      grouped[sid].products.push({
        id: product.id,
        productName: product.productName,
        productType: product.productType,
        recipeCount,
        productStyles: product.productStyles,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Products fetched successfully',
      data: Object.values(grouped),
    });
  } catch (error) {
    console.error('Error fetching assembly products:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching assembly products',
      error: error.message,
    });
  }
};

/**
 * POST /api/assembly/calculate
 * Body: { requests: [{ schoolId, productId, targetQuantity }] }
 */
const calculateAssembly = async (req, res) => {
  try {
    const { requests } = req.body;

    if (!Array.isArray(requests) || requests.length === 0) {
      return res.status(400).json({ success: false, message: 'requests must be a non-empty array' });
    }

    const errors = [];
    for (let i = 0; i < requests.length; i++) {
      const r = requests[i];
      if (!r.schoolId || !Number.isInteger(Number(r.schoolId))) {
        errors.push(`requests[${i}].schoolId must be a valid integer`);
      }
      if (!r.productId || !Number.isInteger(Number(r.productId))) {
        errors.push(`requests[${i}].productId must be a valid integer`);
      }
      const qty = Number(r.targetQuantity);
      if (!r.targetQuantity || !Number.isInteger(qty) || qty < 1) {
        errors.push(`requests[${i}].targetQuantity must be a positive integer`);
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors });
    }

    const normalised = requests.map((r) => ({
      schoolId: Number(r.schoolId),
      productId: Number(r.productId),
      targetQuantity: Number(r.targetQuantity),
    }));

    // ── Fetch data from model ──
    const productIds = [...new Set(normalised.map((r) => r.productId))];
    const schoolIds = [...new Set(normalised.map((r) => r.schoolId))];

    const products = await assemblyService.getProductsByIds(productIds);
    const productMap = Object.fromEntries(products.map((p) => [p.id, p]));

    // Verify each requested product actually belongs to the stated school
    for (const req of normalised) {
      const product = productMap[req.productId];
      if (product && product.schoolId !== req.schoolId) {
        return res.status(400).json({
          success: false,
          message: `Product ${req.productId} does not belong to school ${req.schoolId}. Stock cannot be mixed across schools.`,
        });
      }
    }

    const stockBySchool = {};
    await Promise.all(
      schoolIds.map(async (sid) => {
        const balances = await assemblyService.getStockBalancesForSchool(sid);
        stockBySchool[sid] = buildStockMap(balances);
      }),
    );

    // ── Group requests by school and flatten recipes ──
    const bySchool = {};
    for (const req of normalised) {
      if (!bySchool[req.schoolId]) bySchool[req.schoolId] = [];
      const product = productMap[req.productId];
      if (!product) continue;

      const recipes = [];
      for (const style of product.productStyles) {
        for (const recipe of style.productRecipes) {
          recipes.push({
            recipeId: recipe.id,
            recipeName: recipe.recipeName,
            styleName: style.style?.styleName ?? null,
            ingredients: recipe.recipeIngredients.map((ri) => ({
              itemTypeId: ri.itemTypeId,
              quantityRequired: ri.quantityRequired,
              sizeClass: ri.sizeClass ?? null,
              categoryName: ri.itemType?.category?.categoryName ?? null,
              schoolName: ri.itemType?.school?.schoolName ?? null,
            })),
          });
        }
      }

      bySchool[req.schoolId].push({
        productId: req.productId,
        productName: product.productName,
        targetQuantity: req.targetQuantity,
        recipes,
      });
    }

    // ── Solve ILP per school ──
    const schoolResults = [];

    for (const [schoolIdStr, schoolRequests] of Object.entries(bySchool)) {
      const schoolId = Number(schoolIdStr);
      const stockMap = stockBySchool[schoolId] ?? {};

      const assemblable = schoolRequests.filter((r) => r.recipes.length > 0);
      const unassemblable = schoolRequests
        .filter((r) => r.recipes.length === 0)
        .map((r) => ({
          productId: r.productId,
          productName: r.productName,
          targetQuantity: r.targetQuantity,
          actualMade: 0,
          shortfall: r.targetQuantity,
          unassemblable: true,
          reason: 'No recipes defined for this product',
          chosenRecipes: [],
          ingredients: [],
        }));

      let solvedProducts = [];
      if (assemblable.length > 0) {
        solvedProducts = solveForSchool(assemblable, stockMap);
      }

      const wasteMap = {};
      for (const prod of solvedProducts) {
        for (const ing of prod.ingredients) {
          const key = ingredientKey(ing.itemTypeId, ing.sizeClass);
          if (!wasteMap[key]) {
            wasteMap[key] = {
              itemTypeId: ing.itemTypeId,
              sizeClass: ing.sizeClass,
              categoryName: ing.categoryName,
              schoolName: ing.schoolName,
              qtyAvailable: ing.qtyAvailable,
              qtyConsumed: 0,
            };
          }
          wasteMap[key].qtyConsumed += ing.qtyConsumed;
        }
      }

      const wasteSummary = Object.values(wasteMap).map((w) => ({
        ...w,
        qtyLeftover: Math.max(0, w.qtyAvailable - w.qtyConsumed),
        utilizationPct:
          w.qtyAvailable > 0 ? Math.round((w.qtyConsumed / w.qtyAvailable) * 100) : 0,
      }));

      const schoolName =
        products.find((p) => p.schoolId === schoolId)?.school?.schoolName ?? `School ${schoolId}`;

      schoolResults.push({
        school: { id: schoolId, schoolName },
        products: [...solvedProducts, ...unassemblable],
        wasteSummary,
        totalMade: solvedProducts.reduce((s, p) => s + p.actualMade, 0),
        totalTargeted: schoolRequests.reduce((s, p) => s + p.targetQuantity, 0),
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Assembly plan calculated successfully',
      data: schoolResults,
    });
  } catch (error) {
    console.error('Error calculating assembly plan:', error);
    return res.status(500).json({
      success: false,
      message: 'Error calculating assembly plan',
      error: error.message,
    });
  }
};

function parseAndValidateRecipePayload(body) {
  const { productStyleId, recipeName, ingredients } = body ?? {};
  const errors = [];

  const styleId = Number(productStyleId);
  if (!Number.isInteger(styleId) || styleId < 1) {
    errors.push('productStyleId must be a valid positive integer');
  }

  const trimmedName = typeof recipeName === 'string' ? recipeName.trim() : '';
  if (!trimmedName) {
    errors.push('recipeName is required');
  } else if (trimmedName.length > 50) {
    errors.push('recipeName must not exceed 50 characters');
  }

  if (!Array.isArray(ingredients) || ingredients.length === 0) {
    errors.push('ingredients must be a non-empty array');
  }

  const normalisedIngredients = [];
  const ingredientKeys = new Set();

  if (Array.isArray(ingredients)) {
    for (let i = 0; i < ingredients.length; i++) {
      const ing = ingredients[i] ?? {};
      const itemTypeId = Number(ing.itemTypeId);
      if (!Number.isInteger(itemTypeId) || itemTypeId < 1) {
        errors.push(`ingredients[${i}].itemTypeId must be a valid positive integer`);
      }

      const qty = Number(ing.quantityRequired);
      let normalisedQty = null;
      if (!Number.isFinite(qty) || qty <= 0) {
        errors.push(`ingredients[${i}].quantityRequired must be a positive number`);
      } else if (!Number.isInteger(qty * 10)) {
        errors.push(`ingredients[${i}].quantityRequired must have at most 1 decimal place`);
      } else {
        // qty is finite, positive, and has at most 1 decimal place
        normalisedQty = qty;
      }

      let sizeClass = null;
      if (ing.sizeClass != null && String(ing.sizeClass).trim() !== '') {
        const candidate = String(ing.sizeClass).trim().toUpperCase();
        if (!SIZE_CLASSES.includes(candidate)) {
          errors.push(`ingredients[${i}].sizeClass must be one of ${SIZE_CLASSES.join(', ')}`);
        } else {
          sizeClass = candidate;
        }
      }

      if (Number.isInteger(itemTypeId)) {
        const key = String(itemTypeId);
        if (ingredientKeys.has(key)) {
          errors.push(`ingredients[${i}] duplicates a previous ingredient with the same itemTypeId`);
        }
        ingredientKeys.add(key);
      }

      normalisedIngredients.push({
        itemTypeId,
        quantityRequired: normalisedQty,
        sizeClass,
      });
    }
  }

  return {
    errors,
    payload: {
      productStyleId: styleId,
      recipeName: trimmedName,
      ingredients: normalisedIngredients,
    },
  };
}

async function validateStyleAndIngredientSchools(productStyleId, ingredientItemTypeIds) {
  const productStyle = await assemblyService.getProductStyleById(productStyleId);
  if (!productStyle) {
    return { valid: false, status: 404, message: 'Product style not found' };
  }

  const productSchoolId = productStyle.product?.schoolId;
  if (!productSchoolId) {
    return {
      valid: false,
      status: 400,
      message: 'Selected product style is not linked to a school',
    };
  }

  const uniqueIngredientItemTypeIds = Array.from(new Set(ingredientItemTypeIds));
  const itemTypes = await assemblyService.getItemTypesByIds(uniqueIngredientItemTypeIds);
  if (itemTypes.length !== uniqueIngredientItemTypeIds.length) {
    return {
      valid: false,
      status: 400,
      message: 'One or more ingredient item types do not exist',
    };
  }

  const outOfSchool = itemTypes.find((it) => it.schoolId !== productSchoolId);
  if (outOfSchool) {
    return {
      valid: false,
      status: 400,
      message: `Ingredient itemTypeId ${outOfSchool.id} does not belong to the same school as the selected product style`,
    };
  }

  return { valid: true, productStyle, itemTypes };
}

const getItemTypes = async (req, res) => {
  try {
    const schoolId = Number(req.query.schoolId);
    if (!Number.isInteger(schoolId) || schoolId < 1) {
      return res.status(400).json({
        success: false,
        message: 'schoolId query parameter must be a valid positive integer',
      });
    }

    const itemTypes = await assemblyService.getItemTypesBySchool(schoolId);
    return res.status(200).json({
      success: true,
      message: 'Item types fetched successfully',
      data: itemTypes,
    });
  } catch (error) {
    console.error('Error fetching item types for assembly configuration:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching item types for assembly configuration',
      error: error.message,
    });
  }
};

const createRecipe = async (req, res) => {
  try {
    const { errors, payload } = parseAndValidateRecipePayload(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors });
    }

    const ingredientIds = payload.ingredients.map((ing) => ing.itemTypeId);
    const validation = await validateStyleAndIngredientSchools(payload.productStyleId, ingredientIds);
    if (!validation.valid) {
      return res.status(validation.status).json({ success: false, message: validation.message });
    }

    const created = await assemblyService.createRecipe(payload);
    return res.status(201).json({
      success: true,
      message: 'Recipe created successfully',
      data: created,
    });
  } catch (error) {
    console.error('Error creating recipe:', error);
    return res.status(500).json({
      success: false,
      message: 'Error creating recipe',
      error: error.message,
    });
  }
};

const getProductOptions = async (_req, res) => {
  try {
    const [productTypes, styles] = await Promise.all([
      assemblyService.getProductTypes(),
      assemblyService.getStyles(),
    ]);

    return res.status(200).json({
      success: true,
      message: 'Product options fetched successfully',
      data: {
        productTypes,
        styles,
      },
    });
  } catch (error) {
    console.error('Error fetching product options:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching product options',
      error: error.message,
    });
  }
};

const createProduct = async (req, res) => {
  try {
    const { schoolId, productName, productTypeId, styleId } = req.body ?? {};

    const normalisedSchoolId = Number(schoolId);
    const normalisedProductTypeId = Number(productTypeId);
    const normalisedStyleId = Number(styleId);
    const normalisedProductName = typeof productName === 'string' ? productName.trim() : '';

    const errors = [];

    if (!Number.isInteger(normalisedSchoolId) || normalisedSchoolId < 1) {
      errors.push('schoolId must be a valid positive integer');
    }

    if (!normalisedProductName) {
      errors.push('productName is required');
    } else if (normalisedProductName.length > 50) {
      errors.push('productName must not exceed 50 characters');
    }

    if (!Number.isInteger(normalisedProductTypeId) || normalisedProductTypeId < 1) {
      errors.push('productTypeId must be a valid positive integer');
    }

    if (!Number.isInteger(normalisedStyleId) || normalisedStyleId < 1) {
      errors.push('styleId must be a valid positive integer');
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
    }

    const [productTypes, styles] = await Promise.all([
      assemblyService.getProductTypes(),
      assemblyService.getStyles(),
    ]);

    const productTypeExists = productTypes.some((pt) => pt.id === normalisedProductTypeId);
    const styleExists = styles.some((st) => st.id === normalisedStyleId);

    if (!productTypeExists) {
      return res.status(400).json({ success: false, message: 'Selected product type does not exist' });
    }
    if (!styleExists) {
      return res.status(400).json({ success: false, message: 'Selected style does not exist' });
    }

    const existingProductsAtSchool = await assemblyService.getProducts(normalisedSchoolId);
    const duplicate = existingProductsAtSchool.find(
      (product) =>
        String(product.productName).toLowerCase() === normalisedProductName.toLowerCase() &&
        product.productType?.id === normalisedProductTypeId,
    );

    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: 'A product with the same name and product type already exists for this school',
      });
    }

    const created = await assemblyService.createProductWithStyle({
      schoolId: normalisedSchoolId,
      productName: normalisedProductName,
      productTypeId: normalisedProductTypeId,
      styleId: normalisedStyleId,
    });

    return res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: created,
    });
  } catch (error) {
    console.error('Error creating product:', error);
    return res.status(500).json({
      success: false,
      message: 'Error creating product',
      error: error.message,
    });
  }
};

const createStyle = async (req, res) => {
  try {
    const { styleName } = req.body ?? {};
    const normalisedStyleName = typeof styleName === 'string' ? styleName.trim() : '';

    if (!normalisedStyleName) {
      return res.status(400).json({ success: false, message: 'styleName is required' });
    }

    if (normalisedStyleName.length > 50) {
      return res.status(400).json({ success: false, message: 'styleName must not exceed 50 characters' });
    }

    const existing = await assemblyService.findStyleByName(normalisedStyleName);
    if (existing) {
      return res.status(409).json({ success: false, message: 'Style already exists' });
    }

    const created = await assemblyService.createStyle(normalisedStyleName);
    return res.status(201).json({
      success: true,
      message: 'Style created successfully',
      data: created,
    });
  } catch (error) {
    console.error('Error creating style:', error);
    return res.status(500).json({
      success: false,
      message: 'Error creating style',
      error: error.message,
    });
  }
};

const createProductType = async (req, res) => {
  try {
    const { typeName } = req.body ?? {};
    const normalisedTypeName = typeof typeName === 'string' ? typeName.trim() : '';

    if (!normalisedTypeName) {
      return res.status(400).json({ success: false, message: 'typeName is required' });
    }

    if (normalisedTypeName.length > 50) {
      return res.status(400).json({ success: false, message: 'typeName must not exceed 50 characters' });
    }

    const existing = await assemblyService.findProductTypeByName(normalisedTypeName);
    if (existing) {
      return res.status(409).json({ success: false, message: 'Product type already exists' });
    }

    const created = await assemblyService.createProductType(normalisedTypeName);
    return res.status(201).json({
      success: true,
      message: 'Product type created successfully',
      data: created,
    });
  } catch (error) {
    console.error('Error creating product type:', error);
    return res.status(500).json({
      success: false,
      message: 'Error creating product type',
      error: error.message,
    });
  }
};

const updateRecipe = async (req, res) => {
  try {
    const recipeId = Number(req.params.recipeId);
    if (!Number.isInteger(recipeId) || recipeId < 1) {
      return res.status(400).json({ success: false, message: 'recipeId must be a valid positive integer' });
    }

    const existingRecipe = await assemblyService.getRecipeById(recipeId);
    if (!existingRecipe) {
      return res.status(404).json({ success: false, message: 'Recipe not found' });
    }

    const { recipeName, ingredients } = req.body ?? {};
    const { errors, payload } = parseAndValidateRecipePayload({
      productStyleId: existingRecipe.productStyleId,
      recipeName,
      ingredients,
    });

    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors });
    }

    const ingredientIds = payload.ingredients.map((ing) => ing.itemTypeId);
    const validation = await validateStyleAndIngredientSchools(existingRecipe.productStyleId, ingredientIds);
    if (!validation.valid) {
      return res.status(validation.status).json({ success: false, message: validation.message });
    }

    const updated = await assemblyService.updateRecipe(recipeId, {
      recipeName: payload.recipeName,
      ingredients: payload.ingredients,
    });

    return res.status(200).json({
      success: true,
      message: 'Recipe updated successfully',
      data: updated,
    });
  } catch (error) {
    console.error('Error updating recipe:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating recipe',
      error: error.message,
    });
  }
};

const deleteRecipe = async (req, res) => {
  try {
    const recipeId = Number(req.params.recipeId);
    if (!Number.isInteger(recipeId) || recipeId < 1) {
      return res.status(400).json({ success: false, message: 'recipeId must be a valid positive integer' });
    }

    const existingRecipe = await assemblyService.getRecipeById(recipeId);
    if (!existingRecipe) {
      return res.status(404).json({ success: false, message: 'Recipe not found' });
    }

    await assemblyService.deleteRecipe(recipeId);
    return res.status(200).json({ success: true, message: 'Recipe deleted successfully' });
  } catch (error) {
    console.error('Error deleting recipe:', error);
    return res.status(500).json({
      success: false,
      message: 'Error deleting recipe',
      error: error.message,
    });
  }
};

const updateProduct = async (req, res) => {
  try {
    const productId = Number(req.params.productId);
    if (!Number.isInteger(productId) || productId < 1) {
      return res.status(400).json({ success: false, message: 'productId must be a valid positive integer' });
    }

    const { productName } = req.body ?? {};
    const normalisedProductName = typeof productName === 'string' ? productName.trim() : '';

    if (!normalisedProductName) {
      return res.status(400).json({ success: false, message: 'productName is required' });
    }

    if (normalisedProductName.length > 50) {
      return res.status(400).json({ success: false, message: 'productName must not exceed 50 characters' });
    }

    const existing = await assemblyService.getProductById(productId);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const productsAtSchool = await assemblyService.getProducts(existing.schoolId);
    const duplicate = productsAtSchool.find(
      (product) =>
        product.id !== productId &&
        String(product.productName).toLowerCase() === normalisedProductName.toLowerCase() &&
        product.productType?.id === existing.productTypeId,
    );

    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: 'A product with the same name and product type already exists for this school',
      });
    }

    const updated = await assemblyService.updateProductName(productId, normalisedProductName);
    return res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: updated,
    });
  } catch (error) {
    console.error('Error updating product:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating product',
      error: error.message,
    });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const productId = Number(req.params.productId);
    if (!Number.isInteger(productId) || productId < 1) {
      return res.status(400).json({ success: false, message: 'productId must be a valid positive integer' });
    }

    const existing = await assemblyService.getProductById(productId);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    await assemblyService.deleteProduct(productId);
    return res.status(200).json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    if (error?.code === 'P2003') {
      return res.status(409).json({
        success: false,
        message: 'Cannot delete product because it is referenced by styles, recipes, or transactions',
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Error deleting product',
      error: error.message,
    });
  }
};

const updateProductType = async (req, res) => {
  try {
    const productTypeId = Number(req.params.productTypeId);
    if (!Number.isInteger(productTypeId) || productTypeId < 1) {
      return res.status(400).json({ success: false, message: 'productTypeId must be a valid positive integer' });
    }

    const { typeName } = req.body ?? {};
    const normalisedTypeName = typeof typeName === 'string' ? typeName.trim() : '';

    if (!normalisedTypeName) {
      return res.status(400).json({ success: false, message: 'typeName is required' });
    }

    if (normalisedTypeName.length > 50) {
      return res.status(400).json({ success: false, message: 'typeName must not exceed 50 characters' });
    }

    const existing = await assemblyService.getProductTypeById(productTypeId);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Product type not found' });
    }

    const duplicate = await assemblyService.findProductTypeByName(normalisedTypeName);
    if (duplicate && duplicate.id !== productTypeId) {
      return res.status(409).json({ success: false, message: 'Product type already exists' });
    }

    const updated = await assemblyService.updateProductTypeName(productTypeId, normalisedTypeName);
    return res.status(200).json({
      success: true,
      message: 'Product type updated successfully',
      data: updated,
    });
  } catch (error) {
    console.error('Error updating product type:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating product type',
      error: error.message,
    });
  }
};

const deleteProductType = async (req, res) => {
  try {
    const productTypeId = Number(req.params.productTypeId);
    if (!Number.isInteger(productTypeId) || productTypeId < 1) {
      return res.status(400).json({ success: false, message: 'productTypeId must be a valid positive integer' });
    }

    const existing = await assemblyService.getProductTypeById(productTypeId);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Product type not found' });
    }

    await assemblyService.deleteProductType(productTypeId);
    return res.status(200).json({ success: true, message: 'Product type deleted successfully' });
  } catch (error) {
    console.error('Error deleting product type:', error);
    if (error?.code === 'P2003') {
      return res.status(409).json({
        success: false,
        message: 'Cannot delete product type because it is assigned to one or more products',
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Error deleting product type',
      error: error.message,
    });
  }
};

const updateStyle = async (req, res) => {
  try {
    const styleId = Number(req.params.styleId);
    if (!Number.isInteger(styleId) || styleId < 1) {
      return res.status(400).json({ success: false, message: 'styleId must be a valid positive integer' });
    }

    const { styleName } = req.body ?? {};
    const normalisedStyleName = typeof styleName === 'string' ? styleName.trim() : '';

    if (!normalisedStyleName) {
      return res.status(400).json({ success: false, message: 'styleName is required' });
    }

    if (normalisedStyleName.length > 50) {
      return res.status(400).json({ success: false, message: 'styleName must not exceed 50 characters' });
    }

    const existing = await assemblyService.getStyleById(styleId);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Style not found' });
    }

    const duplicate = await assemblyService.findStyleByName(normalisedStyleName);
    if (duplicate && duplicate.id !== styleId) {
      return res.status(409).json({ success: false, message: 'Style already exists' });
    }

    const updated = await assemblyService.updateStyleName(styleId, normalisedStyleName);
    return res.status(200).json({
      success: true,
      message: 'Style updated successfully',
      data: updated,
    });
  } catch (error) {
    console.error('Error updating style:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating style',
      error: error.message,
    });
  }
};

const deleteStyle = async (req, res) => {
  try {
    const styleId = Number(req.params.styleId);
    if (!Number.isInteger(styleId) || styleId < 1) {
      return res.status(400).json({ success: false, message: 'styleId must be a valid positive integer' });
    }

    const existing = await assemblyService.getStyleById(styleId);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Style not found' });
    }

    await assemblyService.deleteStyle(styleId);
    return res.status(200).json({ success: true, message: 'Style deleted successfully' });
  } catch (error) {
    console.error('Error deleting style:', error);
    if (error?.code === 'P2003') {
      return res.status(409).json({
        success: false,
        message: 'Cannot delete style because it is assigned to one or more products',
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Error deleting style',
      error: error.message,
    });
  }
};

module.exports = {
  getProducts,
  calculateAssembly,
  getItemTypes,
  getProductOptions,
  createProduct,
  createProductType,
  createStyle,
  updateProduct,
  deleteProduct,
  updateProductType,
  deleteProductType,
  updateStyle,
  deleteStyle,
  createRecipe,
  updateRecipe,
  deleteRecipe,
};
