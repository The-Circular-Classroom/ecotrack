'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { usePathname } from 'next/navigation';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import DeleteConfirmModal from '@/components/ui/DeleteConfirmModal';
import SnackbarAlert from '@/components/SnackbarAlert';
import { getRoleFromSession } from '@/utils/auth';
import AnalyticsConfigSectionNav from '@/components/analytics/configuration/AnalyticsConfigSectionNav';
import ManageRecipesSection from '@/components/analytics/configuration/ManageRecipesSection';
import ManageCatalogSection from '@/components/analytics/configuration/ManageCatalogSection';

function buildIngredientKey(itemTypeId, sizeClass) {
  return `it_${itemTypeId}_${sizeClass ?? 'ALL'}`;
}

function createIngredientRow(overrides = {}) {
  const { rowId: providedRowId, ...restOverrides } = overrides;
  const fallbackId = `row_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  const generatedRowId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : fallbackId;

  return {
    rowId: providedRowId || generatedRowId,
    itemTypeId: '',
    quantityRequired: '',
    sizeClass: '',
    ...restOverrides,
  };
}

export default function AnalyticsConfigurationPage() {
  const pathname = usePathname();
  const [analyticsApiUrl] = useState(() => process.env.NEXT_PUBLIC_API_URL);

  const [role] = useState(() => getRoleFromSession() || 'UNKNOWN');

  const [schoolGroups, setSchoolGroups] = useState([]);
  const [loadingCatalog, setLoadingCatalog] = useState(() => (getRoleFromSession() || 'UNKNOWN') === 'TCC_ADMIN');
  const [catalogError, setCatalogError] = useState(null);

  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedStyleId, setSelectedStyleId] = useState('');

  const [itemTypes, setItemTypes] = useState([]);
  const [loadingItemTypes, setLoadingItemTypes] = useState(false);
  const [itemTypesError, setItemTypesError] = useState(null);

  const [productTypeOptions, setProductTypeOptions] = useState([]);
  const [styleOptions, setStyleOptions] = useState([]);
  const [loadingProductOptions, setLoadingProductOptions] = useState(false);

  const [newProductSchoolId, setNewProductSchoolId] = useState('');
  const [newProductName, setNewProductName] = useState('');
  const [newProductTypeId, setNewProductTypeId] = useState('');
  const [newProductTypeName, setNewProductTypeName] = useState('');
  const [newProductStyleId, setNewProductStyleId] = useState('');
  const [newStyleName, setNewStyleName] = useState('');
  const [creatingProduct, setCreatingProduct] = useState(false);
  const [updatingCatalog, setUpdatingCatalog] = useState(false);

  const [selectedCatalogProductId, setSelectedCatalogProductId] = useState('');
  const [productEditName, setProductEditName] = useState('');
  const [selectedProductTypeIdForManage, setSelectedProductTypeIdForManage] = useState('');
  const [productTypeEditName, setProductTypeEditName] = useState('');
  const [selectedStyleIdForManage, setSelectedStyleIdForManage] = useState('');
  const [styleEditName, setStyleEditName] = useState('');

  const [toast, setToast] = useState({ open: false, severity: 'success', message: '' });

  const [mode, setMode] = useState('create');
  const [editingRecipeId, setEditingRecipeId] = useState(null);
  const [recipeName, setRecipeName] = useState('');
  const [ingredientRows, setIngredientRows] = useState(() => [createIngredientRow()]);

  const [saving, setSaving] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(null);

  const showToast = useCallback((severity, message) => {
    setToast({ open: true, severity, message });
  }, []);

  const activeSection = useMemo(() => {
    const normalizedPath = pathname.replace(/\/+$/, '');
    if (normalizedPath.endsWith('/recipes')) return 'manage-recipes';
    return 'catalog';
  }, [pathname]);

  const headerConfig = useMemo(() => {
    if (activeSection === 'catalog') {
      return {
        title: 'Catalog Configuration',
        subtitle: 'Create, edit, and delete products, product types, and styles.',
      };
    }

    return {
      title: 'Recipe Configuration',
      subtitle: 'Create, edit, and delete product recipes used by the repurposing planner.',
    };
  }, [activeSection]);

  const fetchCatalog = useCallback(async () => {
    try {
      setLoadingCatalog(true);
      setCatalogError(null);

      const token = sessionStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Authentication required. Please sign in again.');
      }
      const res = await fetch(`${analyticsApiUrl}/api/assembly/products`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Failed to load products (${res.status})`);

      const body = await res.json();
      setSchoolGroups(body.data ?? []);
    } catch (err) {
      setCatalogError(err.message);
      showToast('error', err.message);
    } finally {
      setLoadingCatalog(false);
    }
  }, [analyticsApiUrl, showToast]);

  useEffect(() => {
    if (role !== 'TCC_ADMIN') return;
    fetchCatalog();
  }, [fetchCatalog, role]);

  const fetchProductOptions = useCallback(async () => {
    const token = sessionStorage.getItem('accessToken');
    if (!token) {
      setProductTypeOptions([]);
      setStyleOptions([]);
      showToast('error', 'Authentication required. Please sign in again.');
      return [];
    }
    setLoadingProductOptions(true);

    try {
      const res = await fetch(`${analyticsApiUrl}/api/assembly/product-options`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error(`Failed to load product options (${res.status})`);
      const body = await res.json();

      setProductTypeOptions(body?.data?.productTypes ?? []);
      setStyleOptions(body?.data?.styles ?? []);
      return body?.data?.styles ?? [];
    } catch {
      setProductTypeOptions([]);
      setStyleOptions([]);
      return [];
    } finally {
      setLoadingProductOptions(false);
    }
  }, [analyticsApiUrl, showToast]);

  useEffect(() => {
    if (role !== 'TCC_ADMIN') return;
    fetchProductOptions();
  }, [fetchProductOptions, role]);

  useEffect(() => {
    if (!selectedSchoolId) {
      setItemTypes([]);
      setItemTypesError(null);
      return;
    }

    const token = sessionStorage.getItem('accessToken');
    if (!token) {
      setItemTypes([]);
      setItemTypesError('Authentication required. Please sign in again.');
      showToast('error', 'Authentication required. Please sign in again.');
      return;
    }

    setLoadingItemTypes(true);
    setItemTypesError(null);

    fetch(`${analyticsApiUrl}/api/assembly/item-types?schoolId=${selectedSchoolId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) {
          if (res.status === 401) {
            throw new Error('Session expired while loading item types. Please sign in again.');
          }
          throw new Error(`Failed to load item types (${res.status})`);
        }
        return res.json();
      })
      .then((body) => setItemTypes(body.data ?? []))
      .catch((err) => {
        setItemTypesError(err.message);
        showToast('error', err.message);
      })
      .finally(() => setLoadingItemTypes(false));
  }, [analyticsApiUrl, selectedSchoolId, showToast]);

  const selectedSchoolGroup = useMemo(
    () => schoolGroups.find((group) => String(group.school.id) === String(selectedSchoolId)),
    [schoolGroups, selectedSchoolId],
  );

  const products = useMemo(() => selectedSchoolGroup?.products ?? [], [selectedSchoolGroup]);

  const selectedProduct = useMemo(
    () => products.find((p) => String(p.id) === String(selectedProductId)),
    [products, selectedProductId],
  );

  const styles = useMemo(() => selectedProduct?.productStyles ?? [], [selectedProduct]);

  const selectedStyle = useMemo(
    () => styles.find((s) => String(s.id) === String(selectedStyleId)),
    [styles, selectedStyleId],
  );

  const recipes = useMemo(() => selectedStyle?.productRecipes ?? [], [selectedStyle]);

  const resetEditor = useCallback(() => {
    setMode('create');
    setEditingRecipeId(null);
    setRecipeName('');
    setIngredientRows([createIngredientRow()]);
  }, []);

  const handleSchoolChange = useCallback((schoolId) => {
    setSelectedSchoolId(schoolId);
    setSelectedProductId('');
    setSelectedStyleId('');
    resetEditor();
  }, [resetEditor]);

  const handleProductChange = useCallback((productId) => {
    setSelectedProductId(productId);
    setSelectedStyleId('');
    resetEditor();
  }, [resetEditor]);

  const handleStyleChange = useCallback((styleId) => {
    setSelectedStyleId(styleId);
    resetEditor();
  }, [resetEditor]);

  const handleCreateProduct = useCallback(async () => {
    const schoolId = Number(newProductSchoolId);
    const productName = newProductName.trim();

    if (!Number.isInteger(schoolId) || schoolId < 1) {
      showToast('error', 'Select a school for the new product.');
      return;
    }
    if (!productName) {
      showToast('error', 'Enter a product name.');
      return;
    }
    setCreatingProduct(true);
    const token = sessionStorage.getItem('accessToken');

    try {
      const productTypeId = Number(newProductTypeId);
      if (!Number.isInteger(productTypeId) || productTypeId < 1) {
        showToast('error', 'Select a product type.');
        return;
      }

      const styleId = Number(newProductStyleId);
      if (!Number.isInteger(styleId) || styleId < 1) {
        showToast('error', 'Select an initial style.');
        return;
      }

      const res = await fetch(`${analyticsApiUrl}/api/assembly/products`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          schoolId,
          productName,
          productTypeId,
          styleId,
        }),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          body.message ||
            (Array.isArray(body.errors) ? body.errors.join('; ') : '') ||
            `Failed to create product (${res.status})`,
        );
      }

      const createdProduct = body?.data;

      await fetchCatalog();
      await fetchProductOptions();

      showToast('success', 'Product created successfully.');
      setNewProductName('');
      setNewProductTypeId('');
      setNewProductStyleId('');

      if (createdProduct?.id) {
        setSelectedSchoolId(String(schoolId));
        setSelectedProductId(String(createdProduct.id));
        const createdStyleId = createdProduct.productStyles?.[0]?.id;
        setSelectedStyleId(createdStyleId ? String(createdStyleId) : '');
        showToast('success', 'Product created. You can now add recipes for it.');
      }
    } catch (err) {
      showToast('error', err.message);
    } finally {
      setCreatingProduct(false);
    }
  }, [
    analyticsApiUrl,
    fetchCatalog,
    fetchProductOptions,
    newProductName,
    newProductSchoolId,
    newProductStyleId,
    newProductTypeId,
    showToast,
  ]);

  const handleCatalogProductChange = useCallback((productId) => {
    setSelectedCatalogProductId(productId);
    const product = schoolGroups
      .flatMap((group) => group.products ?? [])
      .find((entry) => String(entry.id) === String(productId));
    setProductEditName(product?.productName ?? '');
  }, [schoolGroups]);

  const handleProductTypeManageChange = useCallback((productTypeId) => {
    setSelectedProductTypeIdForManage(productTypeId);
    const selected = productTypeOptions.find((pt) => String(pt.id) === String(productTypeId));
    setProductTypeEditName(selected?.typeName ?? '');
  }, [productTypeOptions]);

  const handleStyleManageChange = useCallback((styleId) => {
    setSelectedStyleIdForManage(styleId);
    const selected = styleOptions.find((style) => String(style.id) === String(styleId));
    setStyleEditName(selected?.styleName ?? '');
  }, [styleOptions]);

  const handleUpdateProduct = useCallback(async () => {
    const productId = Number(selectedCatalogProductId);
    const productName = productEditName.trim();
    if (!Number.isInteger(productId) || productId < 1) {
      showToast('error', 'Select a product to edit.');
      return;
    }
    if (!productName) {
      showToast('error', 'Product name is required.');
      return;
    }

    const token = sessionStorage.getItem('accessToken');
    if (!token) {
      showToast('error', 'Authentication required. Please sign in again.');
      return;
    }

    setUpdatingCatalog(true);
    try {
      const res = await fetch(`${analyticsApiUrl}/api/assembly/products/${productId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productName }),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.message || `Failed to update product (${res.status})`);
      }

      await fetchCatalog();
      showToast('success', 'Product name updated successfully.');
    } catch (err) {
      showToast('error', err.message);
    } finally {
      setUpdatingCatalog(false);
    }
  }, [analyticsApiUrl, fetchCatalog, productEditName, selectedCatalogProductId, showToast]);

  const handleDeleteProduct = useCallback((productIdParam) => {
    const productId = Number(productIdParam ?? selectedCatalogProductId);
    if (!Number.isInteger(productId) || productId < 1) {
      showToast('error', 'Select a product to delete.');
      return;
    }

    const product = schoolGroups
      .flatMap((group) => group.products ?? [])
      .find((item) => Number(item.id) === productId);

    setDeleteDialog({
      kind: 'product',
      id: productId,
      title: 'Delete Product',
      description: (
        <>
          Are you sure you want to delete{' '}
          <span className="font-medium text-gray-700">{product?.productName ?? 'this product'}</span>
          ? This action cannot be undone.
        </>
      ),
    });
  }, [schoolGroups, selectedCatalogProductId, showToast]);

  const handleUpdateProductType = useCallback(async () => {
    const productTypeId = Number(selectedProductTypeIdForManage);
    const typeName = productTypeEditName.trim();
    if (!Number.isInteger(productTypeId) || productTypeId < 1) {
      showToast('error', 'Select a product type to edit.');
      return;
    }
    if (!typeName) {
      showToast('error', 'Product type name is required.');
      return;
    }

    const token = sessionStorage.getItem('accessToken');
    if (!token) {
      showToast('error', 'Authentication required. Please sign in again.');
      return;
    }

    setUpdatingCatalog(true);
    try {
      const res = await fetch(`${analyticsApiUrl}/api/assembly/product-types/${productTypeId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ typeName }),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.message || `Failed to update product type (${res.status})`);
      }

      await Promise.all([fetchCatalog(), fetchProductOptions()]);
      showToast('success', 'Product type updated successfully.');
    } catch (err) {
      showToast('error', err.message);
    } finally {
      setUpdatingCatalog(false);
    }
  }, [
    analyticsApiUrl,
    fetchCatalog,
    fetchProductOptions,
    productTypeEditName,
    selectedProductTypeIdForManage,
    showToast,
  ]);

  const handleDeleteProductType = useCallback((productTypeIdParam) => {
    const productTypeId = Number(productTypeIdParam ?? selectedProductTypeIdForManage);
    if (!Number.isInteger(productTypeId) || productTypeId < 1) {
      showToast('error', 'Select a product type to delete.');
      return;
    }

    const productType = productTypeOptions.find((entry) => Number(entry.id) === productTypeId);

    setDeleteDialog({
      kind: 'productType',
      id: productTypeId,
      title: 'Delete Product Type',
      description: (
        <>
          Are you sure you want to delete{' '}
          <span className="font-medium text-gray-700">{productType?.typeName ?? 'this product type'}</span>
          ? This action cannot be undone.
        </>
      ),
    });
  }, [productTypeOptions, selectedProductTypeIdForManage, showToast]);

  const handleUpdateStyle = useCallback(async () => {
    const styleId = Number(selectedStyleIdForManage);
    const styleName = styleEditName.trim();
    if (!Number.isInteger(styleId) || styleId < 1) {
      showToast('error', 'Select a style to edit.');
      return;
    }
    if (!styleName) {
      showToast('error', 'Style name is required.');
      return;
    }

    const token = sessionStorage.getItem('accessToken');
    if (!token) {
      showToast('error', 'Authentication required. Please sign in again.');
      return;
    }

    setUpdatingCatalog(true);
    try {
      const res = await fetch(`${analyticsApiUrl}/api/assembly/styles/${styleId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ styleName }),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.message || `Failed to update style (${res.status})`);
      }

      await Promise.all([fetchCatalog(), fetchProductOptions()]);
      showToast('success', 'Style updated successfully.');
    } catch (err) {
      showToast('error', err.message);
    } finally {
      setUpdatingCatalog(false);
    }
  }, [
    analyticsApiUrl,
    fetchCatalog,
    fetchProductOptions,
    selectedStyleIdForManage,
    showToast,
    styleEditName,
  ]);

  const handleDeleteStyle = useCallback((styleIdParam) => {
    const styleId = Number(styleIdParam ?? selectedStyleIdForManage);
    if (!Number.isInteger(styleId) || styleId < 1) {
      showToast('error', 'Select a style to delete.');
      return;
    }

    const style = styleOptions.find((entry) => Number(entry.id) === styleId);

    setDeleteDialog({
      kind: 'style',
      id: styleId,
      title: 'Delete Style',
      description: (
        <>
          Are you sure you want to delete{' '}
          <span className="font-medium text-gray-700">{style?.styleName ?? 'this style'}</span>
          ? This action cannot be undone.
        </>
      ),
    });
  }, [selectedStyleIdForManage, showToast, styleOptions]);

  const handleCreateProductType = useCallback(async () => {
    const typeName = newProductTypeName.trim();
    if (!typeName) {
      showToast('error', 'Product type name is required.');
      return;
    }

    const token = sessionStorage.getItem('accessToken');
    if (!token) {
      showToast('error', 'Authentication required. Please sign in again.');
      return;
    }

    setUpdatingCatalog(true);
    try {
      const res = await fetch(`${analyticsApiUrl}/api/assembly/product-types`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ typeName }),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.message || `Failed to create product type (${res.status})`);
      }

      await fetchProductOptions();
      setNewProductTypeName('');
      showToast('success', 'Product type created successfully.');
    } catch (err) {
      showToast('error', err.message);
    } finally {
      setUpdatingCatalog(false);
    }
  }, [analyticsApiUrl, fetchProductOptions, newProductTypeName, showToast]);

  const handleCreateStyle = useCallback(async () => {
    const styleName = newStyleName.trim();
    if (!styleName) {
      showToast('error', 'Style name is required.');
      return;
    }

    const token = sessionStorage.getItem('accessToken');
    if (!token) {
      showToast('error', 'Authentication required. Please sign in again.');
      return;
    }

    setUpdatingCatalog(true);
    try {
      const res = await fetch(`${analyticsApiUrl}/api/assembly/styles`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ styleName }),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.message || `Failed to create style (${res.status})`);
      }

      await fetchProductOptions();
      setNewStyleName('');
      showToast('success', 'Style created successfully.');
    } catch (err) {
      showToast('error', err.message);
    } finally {
      setUpdatingCatalog(false);
    }
  }, [analyticsApiUrl, fetchProductOptions, newStyleName, showToast]);

  const beginEdit = useCallback((recipe) => {
    setMode('edit');
    setEditingRecipeId(recipe.id);
    setRecipeName(recipe.recipeName ?? '');
    setIngredientRows(
      recipe.recipeIngredients?.length
        ? recipe.recipeIngredients.map((ri) => ({
            rowId: ri.id ? `existing_${ri.id}` : undefined,
            itemTypeId: String(ri.itemTypeId),
            quantityRequired: String(ri.quantityRequired),
            sizeClass: ri.sizeClass ?? '',
          })).map((row) => createIngredientRow(row))
        : [createIngredientRow()],
    );
  }, []);

  const validateAndBuildPayload = useCallback(() => {
    const trimmedName = recipeName.trim();
    if (!trimmedName) return { error: 'Recipe name is required.' };

    const builtIngredients = [];
    const seen = new Set();

    for (let i = 0; i < ingredientRows.length; i++) {
      const row = ingredientRows[i];
      const itemTypeId = Number(row.itemTypeId);
      const quantityRequired = Number(row.quantityRequired);
      const sizeClass = row.sizeClass ? String(row.sizeClass).toUpperCase() : null;

      if (!Number.isInteger(itemTypeId) || itemTypeId < 1) {
        return { error: `Ingredient row ${i + 1}: select an item type.` };
      }

      if (!Number.isFinite(quantityRequired) || quantityRequired <= 0) {
        return { error: `Ingredient row ${i + 1}: quantity must be a positive number.` };
      }

      if (sizeClass && !['S', 'L'].includes(sizeClass)) {
        return { error: `Ingredient row ${i + 1}: size class must be S or L.` };
      }

      const ingredientKey = buildIngredientKey(itemTypeId, sizeClass);
      if (seen.has(ingredientKey)) {
        return { error: `Ingredient row ${i + 1}: duplicate ingredient with the same item type and size class.` };
      }
      seen.add(ingredientKey);

      builtIngredients.push({ itemTypeId, quantityRequired, sizeClass });
    }

    if (builtIngredients.length === 0) {
      return { error: 'Add at least one ingredient row.' };
    }

    return {
      payload: {
        recipeName: trimmedName,
        ingredients: builtIngredients,
      },
    };
  }, [ingredientRows, recipeName]);

  const handleSave = useCallback(async () => {
    if (!selectedStyleId) {
      showToast('error', 'Select a school, product, and style first.');
      return;
    }

    const built = validateAndBuildPayload();
    if (built.error) {
      showToast('error', built.error);
      return;
    }

    const token = sessionStorage.getItem('accessToken');
    setSaving(true);

    try {
      const isEdit = mode === 'edit' && editingRecipeId;
      const endpoint = isEdit
        ? `${analyticsApiUrl}/api/assembly/recipes/${editingRecipeId}`
        : `${analyticsApiUrl}/api/assembly/recipes`;

      const body = isEdit
        ? built.payload
        : { ...built.payload, productStyleId: Number(selectedStyleId) };

      const res = await fetch(endpoint, {
        method: isEdit ? 'PUT' : 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const responseBody = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          responseBody.message ||
            (Array.isArray(responseBody.errors) ? responseBody.errors.join('; ') : '') ||
            `Failed to save recipe (${res.status})`,
        );
      }

      await fetchCatalog();
      showToast('success', isEdit ? 'Recipe updated successfully.' : 'Recipe created successfully.');
      resetEditor();
    } catch (err) {
      showToast('error', err.message);
    } finally {
      setSaving(false);
    }
  }, [analyticsApiUrl, editingRecipeId, fetchCatalog, mode, resetEditor, selectedStyleId, showToast, validateAndBuildPayload]);

  const handleDelete = useCallback((recipeId) => {
    const recipeIdNumber = Number(recipeId);
    const recipe = recipes.find((entry) => Number(entry.id) === recipeIdNumber);

    setDeleteDialog({
      kind: 'recipe',
      id: recipeIdNumber,
      title: 'Delete Recipe',
      description: (
        <>
          Are you sure you want to delete{' '}
          <span className="font-medium text-gray-700">{recipe?.recipeName ?? 'this recipe'}</span>
          ? This action cannot be undone.
        </>
      ),
    });
  }, [recipes]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteDialog) return;

    const token = sessionStorage.getItem('accessToken');
    if (!token) {
      showToast('error', 'Authentication required. Please sign in again.');
      setDeleteDialog(null);
      return;
    }

    const isRecipeDelete = deleteDialog.kind === 'recipe';
    if (isRecipeDelete) {
      setSaving(true);
    } else {
      setUpdatingCatalog(true);
    }

    try {
      if (deleteDialog.kind === 'product') {
        const res = await fetch(`${analyticsApiUrl}/api/assembly/products/${deleteDialog.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });

        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(body.message || `Failed to delete product (${res.status})`);
        }

        await fetchCatalog();
        setSelectedCatalogProductId('');
        setProductEditName('');
        showToast('success', 'Product deleted successfully.');
      } else if (deleteDialog.kind === 'productType') {
        const res = await fetch(`${analyticsApiUrl}/api/assembly/product-types/${deleteDialog.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });

        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(body.message || `Failed to delete product type (${res.status})`);
        }

        await Promise.all([fetchCatalog(), fetchProductOptions()]);
        setSelectedProductTypeIdForManage('');
        setProductTypeEditName('');
        showToast('success', 'Product type deleted successfully.');
      } else if (deleteDialog.kind === 'style') {
        const res = await fetch(`${analyticsApiUrl}/api/assembly/styles/${deleteDialog.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });

        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(body.message || `Failed to delete style (${res.status})`);
        }

        await Promise.all([fetchCatalog(), fetchProductOptions()]);
        setSelectedStyleIdForManage('');
        setStyleEditName('');
        showToast('success', 'Style deleted successfully.');
      } else if (deleteDialog.kind === 'recipe') {
        const res = await fetch(`${analyticsApiUrl}/api/assembly/recipes/${deleteDialog.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });

        const responseBody = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(responseBody.message || `Failed to delete recipe (${res.status})`);
        }

        await fetchCatalog();
        showToast('success', 'Recipe deleted successfully.');
        if (editingRecipeId === deleteDialog.id) {
          resetEditor();
        }
      }
    } catch (err) {
      showToast('error', err.message);
    } finally {
      if (isRecipeDelete) {
        setSaving(false);
      } else {
        setUpdatingCatalog(false);
      }
      setDeleteDialog(null);
    }
  }, [
    analyticsApiUrl,
    deleteDialog,
    editingRecipeId,
    fetchCatalog,
    fetchProductOptions,
    resetEditor,
    showToast,
  ]);

  const addIngredientRow = useCallback(() => {
    setIngredientRows((prev) => [...prev, createIngredientRow()]);
  }, []);

  const updateIngredientRow = useCallback((rowId, updatedRow) => {
    setIngredientRows((prev) => prev.map((row) => (row.rowId === rowId ? { ...updatedRow, rowId } : row)));
  }, []);

  const removeIngredientRow = useCallback((rowId) => {
    setIngredientRows((prev) => (prev.length === 1 ? prev : prev.filter((row) => row.rowId !== rowId)));
  }, []);

  if (role === 'UNKNOWN') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }

  if (role !== 'TCC_ADMIN') {
    return null;
  }

  return (
    <Box className="mx-9 py-4 sm:py-6 lg:py-10">
      <div className="flex flex-col lg:flex-row gap-8">
        <AnalyticsConfigSectionNav
          activeSection={activeSection}
        />

        <div className="flex-1 min-w-0 space-y-6">
          {activeSection !== 'catalog' && (
            <Box>
              <Typography variant="h4" fontWeight={700} sx={{ color: 'var(--color-darker)' }}>
                {headerConfig.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {headerConfig.subtitle}
              </Typography>
            </Box>
          )}

          {catalogError && (
            <Paper elevation={0} className="border border-amber-200 bg-amber-50 rounded-2xl px-5 py-4">
              <p className="text-sm text-amber-700 font-semibold">Could not load product catalogue</p>
              <p className="text-xs text-amber-600 mt-0.5">{catalogError}</p>
            </Paper>
          )}

          {activeSection === 'catalog' && (
            <div className="space-y-6">
              <ManageCatalogSection
                schoolGroups={schoolGroups}
                onCatalogProductChange={handleCatalogProductChange}
                productEditName={productEditName}
                onProductEditNameChange={setProductEditName}
                productTypeOptions={productTypeOptions}
                onProductTypeChange={handleProductTypeManageChange}
                productTypeEditName={productTypeEditName}
                onProductTypeEditNameChange={setProductTypeEditName}
                styleOptions={styleOptions}
                onStyleForManageChange={handleStyleManageChange}
                styleEditName={styleEditName}
                onStyleEditNameChange={setStyleEditName}
                newProductTypeName={newProductTypeName}
                onNewProductTypeNameChange={setNewProductTypeName}
                onCreateProductType={handleCreateProductType}
                newStyleName={newStyleName}
                onNewStyleNameChange={setNewStyleName}
                onCreateStyle={handleCreateStyle}
                newProductSchoolId={newProductSchoolId}
                onNewProductSchoolChange={setNewProductSchoolId}
                newProductName={newProductName}
                onNewProductNameChange={setNewProductName}
                newProductTypeId={newProductTypeId}
                onNewProductTypeChange={setNewProductTypeId}
                newProductStyleId={newProductStyleId}
                onNewProductStyleIdChange={setNewProductStyleId}
                loadingCatalog={loadingCatalog}
                loadingProductOptions={loadingProductOptions}
                busy={updatingCatalog}
                onCreateProduct={handleCreateProduct}
                onUpdateProduct={handleUpdateProduct}
                onDeleteProduct={handleDeleteProduct}
                onUpdateProductType={handleUpdateProductType}
                onDeleteProductType={handleDeleteProductType}
                onUpdateStyle={handleUpdateStyle}
                onDeleteStyle={handleDeleteStyle}
              />
            </div>
          )}

          {activeSection === 'manage-recipes' && (
            <ManageRecipesSection
              schoolGroups={schoolGroups}
              selectedSchoolId={selectedSchoolId}
              onSchoolChange={handleSchoolChange}
              products={products}
              selectedProductId={selectedProductId}
              onProductChange={handleProductChange}
              styles={styles}
              selectedStyleId={selectedStyleId}
              onStyleChange={handleStyleChange}
              recipes={recipes}
              onBeginEdit={beginEdit}
              onDeleteRecipe={handleDelete}
              mode={mode}
              onCancelEdit={resetEditor}
              recipeName={recipeName}
              onRecipeNameChange={setRecipeName}
              onAddIngredient={addIngredientRow}
              loadingItemTypes={loadingItemTypes}
              itemTypesError={itemTypesError}
              ingredientRows={ingredientRows}
              itemTypes={itemTypes}
              onIngredientChange={updateIngredientRow}
              onIngredientRemove={removeIngredientRow}
              saving={saving}
              onSaveRecipe={handleSave}
            />
          )}
        </div>
      </div>

      {loadingCatalog && (
        <p className="text-sm text-gray-500">Loading product catalogue...</p>
      )}

      {deleteDialog && (
        <DeleteConfirmModal
          open={!!deleteDialog}
          onClose={() => setDeleteDialog(null)}
          onConfirm={handleDeleteConfirm}
          loading={deleteDialog.kind === 'recipe' ? saving : updatingCatalog}
          title={deleteDialog.title}
          description={deleteDialog.description}
        />
      )}

      <SnackbarAlert
        open={toast.open}
        autoHideDuration={3500}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        message={toast.message}
        severity={toast.severity}
      />
    </Box>
  );
}
