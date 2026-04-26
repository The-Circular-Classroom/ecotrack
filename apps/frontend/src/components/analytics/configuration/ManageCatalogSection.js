'use client';

import {
  Backdrop,
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Typography,
  Select,
  TextField,
  Button,
  CircularProgress,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import { useMemo, useState } from 'react';
import { FaPlus } from 'react-icons/fa6';
import { IoClose } from 'react-icons/io5';
import { FiEdit3, FiTrash2 } from 'react-icons/fi';
import CustomButton from '@/components/ui/CustomButton';

const emptyCreateProductRow = () => ({
  schoolId: '',
  productName: '',
  productTypeId: '',
  productStyleId: '',
});

const dataGridSx = {
  border: 'none',
  '& .MuiDataGrid-columnHeaders': {
    backgroundColor: 'var(--color-bg-light)',
    fontWeight: 600,
  },
  '& .MuiDataGrid-cell .MuiTypography-root': {
    lineHeight: 1.3,
  },
};

export default function ManageCatalogSection({
  schoolGroups,
  onCatalogProductChange,
  productEditName,
  onProductEditNameChange,
  productTypeOptions,
  onProductTypeChange,
  productTypeEditName,
  onProductTypeEditNameChange,
  styleOptions,
  onStyleForManageChange,
  styleEditName,
  onStyleEditNameChange,
  newProductTypeName,
  onNewProductTypeNameChange,
  onCreateProductType,
  newStyleName,
  onNewStyleNameChange,
  onCreateStyle,
  onCreateProduct,
  loadingCatalog,
  loadingProductOptions,
  busy,
  onUpdateProduct,
  onDeleteProduct,
  onUpdateProductType,
  onDeleteProductType,
  onUpdateStyle,
  onDeleteStyle,
  newProductSchoolId,
  onNewProductSchoolChange,
  newProductName,
  onNewProductNameChange,
  newProductTypeId,
  onNewProductTypeChange,
  newProductStyleId,
  onNewProductStyleIdChange,
}) {
  const CREATE_TYPES = [
    { value: 'products', label: 'Product' },
    { value: 'productTypes', label: 'Product Type' },
    { value: 'styles', label: 'Style' },
  ];

  const [dialogType, setDialogType] = useState('products');
  const [selectedProductSchoolIdForEdit, setSelectedProductSchoolIdForEdit] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState('create');
  const [createProductRows, setCreateProductRows] = useState([emptyCreateProductRow()]);
  const [createProductTypeRows, setCreateProductTypeRows] = useState(['']);
  const [createStyleRows, setCreateStyleRows] = useState(['']);

  const allProducts = useMemo(
    () =>
      schoolGroups.flatMap((group) =>
        (group.products ?? []).map((product) => ({
          ...product,
          schoolId: group.school?.id,
          schoolName: group.school?.schoolName ?? '-',
        })),
      ),
    [schoolGroups],
  );

  const productRows = useMemo(
    () =>
      allProducts.map((product) => ({
        id: product.id,
        name: product.productName,
        schoolId: product.schoolId,
        schoolName: product.schoolName,
      })),
    [allProducts],
  );

  const productTypeRows = useMemo(
    () =>
      productTypeOptions.map((entry) => ({
        id: entry.id,
        name: entry.typeName,
      })),
    [productTypeOptions],
  );

  const styleRows = useMemo(
    () =>
      styleOptions.map((entry) => ({
        id: entry.id,
        name: entry.styleName,
      })),
    [styleOptions],
  );

  const actionColumn = (type) => ({
    field: 'actions',
    headerName: 'Actions',
    width: 100,
    sortable: false,
    filterable: false,
    disableColumnMenu: true,
    renderCell: (params) => (
      <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', gap: 0.5 }}>
        <CustomButton
          iconOnly
          icon={<FiEdit3 size={14} />}
          onClick={(event) => {
            event.stopPropagation();
            openEditDialog(type, params.row);
          }}
          disabled={busy}
        />
        <CustomButton
          iconOnly
          variant="iconDanger"
          icon={<FiTrash2 size={14} />}
          onClick={(event) => {
            event.stopPropagation();
            handleDeleteRow(type, params.row);
          }}
          disabled={busy}
        />
      </Box>
    ),
  });

  const productColumns = [
    {
      field: 'name',
      headerName: 'Name',
      flex: 1,
      minWidth: 170,
      renderCell: ({ value }) => (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <Typography variant="body2" sx={{ color: '#111827' }}>
            {value || '-'}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'schoolName',
      headerName: 'School',
      minWidth: 160,
      flex: 1,
      renderCell: ({ value }) => (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <Typography variant="body2" sx={{ color: '#111827' }}>
            {value || '-'}
          </Typography>
        </Box>
      ),
    },
    actionColumn('products'),
  ];

  const productTypeColumns = [
    {
      field: 'name',
      headerName: 'Name',
      flex: 1,
      minWidth: 170,
      renderCell: ({ value }) => (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <Typography variant="body2" sx={{ color: '#111827' }}>
            {value || '-'}
          </Typography>
        </Box>
      ),
    },
    actionColumn('productTypes'),
  ];

  const styleColumns = [
    {
      field: 'name',
      headerName: 'Name',
      flex: 1,
      minWidth: 170,
      renderCell: ({ value }) => (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <Typography variant="body2" sx={{ color: '#111827' }}>
            {value || '-'}
          </Typography>
        </Box>
      ),
    },
    actionColumn('styles'),
  ];

  const handleCreateTypeChange = (type) => {
    setDialogType(type);

    if (type === 'products') {
      onNewProductNameChange('');
      onNewProductTypeChange('');
      onNewProductStyleIdChange('');
      onNewProductSchoolChange('');
      setCreateProductRows([emptyCreateProductRow()]);
      return;
    }

    if (type === 'productTypes') {
      onNewProductTypeNameChange('');
      setCreateProductTypeRows(['']);
      return;
    }

    onNewStyleNameChange('');
    setCreateStyleRows(['']);
  };

  const openCreateDialog = (type) => {
    setDialogType(type);
    setDialogMode('create');
    setDialogOpen(true);

    if (type === 'products') {
      onNewProductNameChange('');
      onNewProductTypeChange('');
      onNewProductStyleIdChange('');
      onNewProductSchoolChange('');
      setCreateProductRows([emptyCreateProductRow()]);
      onCatalogProductChange('');
      onProductEditNameChange('');
      setSelectedProductSchoolIdForEdit('');
      return;
    }

    if (type === 'productTypes') {
      onProductTypeChange('');
      onProductTypeEditNameChange('');
      onNewProductTypeNameChange('');
      setCreateProductTypeRows(['']);
      return;
    }

    onStyleForManageChange('');
    onStyleEditNameChange('');
    onNewStyleNameChange('');
    setCreateStyleRows(['']);
  };

  const openEditDialog = (type, row) => {
    setDialogType(type);
    setDialogMode('edit');
    setDialogOpen(true);

    if (type === 'products') {
      onCatalogProductChange(String(row.id));
      setSelectedProductSchoolIdForEdit(String(row.schoolId ?? ''));
      onProductEditNameChange(row.name);
      return;
    }

    if (type === 'productTypes') {
      onProductTypeChange(String(row.id));
      onProductTypeEditNameChange(row.name);
      return;
    }

    onStyleForManageChange(String(row.id));
    onStyleEditNameChange(row.name);
  };

  const handleDeleteRow = async (type, row) => {
    if (type === 'products') {
      await onDeleteProduct(row.id);
      return;
    }

    if (type === 'productTypes') {
      await onDeleteProductType(row.id);
      return;
    }

    await onDeleteStyle(row.id);
  };

  const handleDialogSubmit = async () => {
    const isCreateProductValid =
      createProductRows.length > 0 &&
      createProductRows.every(
        (row) =>
          row.productName.trim() && row.schoolId && row.productTypeId && row.productStyleId,
      );
    const isCreateProductTypeValid =
      createProductTypeRows.length > 0 && createProductTypeRows.every((row) => row.trim());
    const isCreateStyleValid = createStyleRows.length > 0 && createStyleRows.every((row) => row.trim());
    const isEditProductValid = productEditName.trim();
    const isEditProductTypeValid = productTypeEditName.trim();
    const isEditStyleValid = styleEditName.trim();

    const canSubmitDialog =
      dialogMode === 'create'
        ? dialogType === 'products'
          ? isCreateProductValid
          : dialogType === 'productTypes'
            ? isCreateProductTypeValid
            : isCreateStyleValid
        : dialogType === 'products'
          ? isEditProductValid
          : dialogType === 'productTypes'
            ? isEditProductTypeValid
            : isEditStyleValid;

    if (!canSubmitDialog || busy) {
      return;
    }

    if (dialogType === 'products') {
      if (dialogMode === 'create') {
        const rowsToCreate = createProductRows.map((row) => ({
          ...row,
          productName: row.productName.trim(),
        }));

        for (const row of rowsToCreate) {
          onNewProductSchoolChange(row.schoolId);
          onNewProductNameChange(row.productName);
          onNewProductTypeChange(row.productTypeId);
          onNewProductStyleIdChange(row.productStyleId);
          await onCreateProduct();
        }
        setCreateProductRows([emptyCreateProductRow()]);
      } else {
        await onUpdateProduct();
      }
      setDialogOpen(false);
      return;
    }

    if (dialogType === 'productTypes') {
      if (dialogMode === 'create') {
        const rowsToCreate = createProductTypeRows.map((row) => row.trim());
        for (const rowName of rowsToCreate) {
          onNewProductTypeNameChange(rowName);
          await onCreateProductType();
        }
        setCreateProductTypeRows(['']);
      } else {
        await onUpdateProductType();
      }
      setDialogOpen(false);
      return;
    }

    if (dialogMode === 'create') {
      const rowsToCreate = createStyleRows.map((row) => row.trim());
      for (const rowName of rowsToCreate) {
        onNewStyleNameChange(rowName);
        await onCreateStyle();
      }
      setCreateStyleRows(['']);
    } else {
      await onUpdateStyle();
    }
    setDialogOpen(false);
  };

  const updateCreateProductTypeRow = (index, value) => {
    setCreateProductTypeRows((prevRows) =>
      prevRows.map((rowValue, rowIndex) => (rowIndex === index ? value : rowValue)),
    );
  };

  const addCreateProductTypeRow = () => {
    setCreateProductTypeRows((prevRows) => [...prevRows, '']);
  };

  const removeCreateProductTypeRow = (index) => {
    setCreateProductTypeRows((prevRows) => prevRows.filter((_, rowIndex) => rowIndex !== index));
  };

  const updateCreateProductRow = (index, key, value) => {
    setCreateProductRows((prevRows) =>
      prevRows.map((rowValue, rowIndex) =>
        rowIndex === index
          ? {
              ...rowValue,
              [key]: value,
            }
          : rowValue,
      ),
    );
  };

  const addCreateProductRow = () => {
    setCreateProductRows((prevRows) => [...prevRows, emptyCreateProductRow()]);
  };

  const removeCreateProductRow = (index) => {
    setCreateProductRows((prevRows) => prevRows.filter((_, rowIndex) => rowIndex !== index));
  };

  const updateCreateStyleRow = (index, value) => {
    setCreateStyleRows((prevRows) =>
      prevRows.map((rowValue, rowIndex) => (rowIndex === index ? value : rowValue)),
    );
  };

  const addCreateStyleRow = () => {
    setCreateStyleRows((prevRows) => [...prevRows, '']);
  };

  const removeCreateStyleRow = (index) => {
    setCreateStyleRows((prevRows) => prevRows.filter((_, rowIndex) => rowIndex !== index));
  };

  const dialogTitle =
    dialogMode === 'create'
      ? `Create ${dialogType === 'products' ? 'Product' : dialogType === 'productTypes' ? 'Product Type' : 'Style'}`
      : `Edit ${dialogType === 'products' ? 'Product' : dialogType === 'productTypes' ? 'Product Type' : 'Style'}`;

  const isCreateProductValid =
    createProductRows.length > 0 &&
    createProductRows.every(
      (row) => row.productName.trim() && row.schoolId && row.productTypeId && row.productStyleId,
    );
  const isCreateProductTypeValid =
    createProductTypeRows.length > 0 && createProductTypeRows.every((row) => row.trim());
  const isCreateStyleValid = createStyleRows.length > 0 && createStyleRows.every((row) => row.trim());
  const isEditProductValid = productEditName.trim();
  const isEditProductTypeValid = productTypeEditName.trim();
  const isEditStyleValid = styleEditName.trim();

  const canSubmitDialog =
    dialogMode === 'create'
      ? dialogType === 'products'
        ? isCreateProductValid
        : dialogType === 'productTypes'
          ? isCreateProductTypeValid
          : isCreateStyleValid
      : dialogType === 'products'
        ? isEditProductValid
        : dialogType === 'productTypes'
          ? isEditProductTypeValid
          : isEditStyleValid;

  const createCount =
    dialogType === 'products'
      ? createProductRows.length
      : dialogType === 'productTypes'
        ? createProductTypeRows.length
        : createStyleRows.length;

  const createCtaLabel =
    dialogType === 'products' ? 'Product' : dialogType === 'productTypes' ? 'Product Type' : 'Style';

  return (
    <div className="space-y-6">
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          mb: 4,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            fontWeight={700}
            sx={{ color: 'var(--color-darker)' }}
          >
            Catalog Configuration
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Create, edit, and delete products, product types, and styles.
          </Typography>
        </Box>
        <CustomButton icon={<FaPlus />} onClick={() => openCreateDialog('products')} disabled={busy}>
          Add New Item
        </CustomButton>
      </Box>

      <Box
        sx={{
          display: 'flex',
          gap: 2,
          alignItems: 'flex-start',
          flexDirection: { xs: 'column', md: 'row' },
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0, width: { xs: '100%', md: 'auto' } }}>
          <Typography
            variant="h6"
            fontWeight={700}
            sx={{
              color: 'var(--color-darker)',
              mb: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            Products
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
              ({productRows.length} total products)
            </Typography>
          </Typography>
          <Box
            sx={{
              height: 400,
              backgroundColor: '#fff',
              borderRadius: 2,
              boxShadow: 1,
              overflow: 'hidden',
            }}
          >
            <DataGrid
              rows={productRows}
              columns={productColumns}
              getRowId={(row) => `products_${row.id}`}
              loading={busy || loadingCatalog || loadingProductOptions}
              disableRowSelectionOnClick
              pageSizeOptions={[10, 25, 50]}
              initialState={{
                pagination: { paginationModel: { pageSize: 10 } },
              }}
              density="comfortable"
              sx={{ ...dataGridSx, height: '100%' }}
              localeText={{
                noRowsLabel: 'No products found.',
              }}
            />
          </Box>
        </Box>

        <Box sx={{ flex: 1, minWidth: 0, width: { xs: '100%', md: 'auto' } }}>
          <Typography
            variant="h6"
            fontWeight={700}
            sx={{
              color: 'var(--color-darker)',
              mb: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            Product Types
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
              ({productTypeRows.length} total product types)
            </Typography>
          </Typography>
          <Box
            sx={{
              height: 400,
              backgroundColor: '#fff',
              borderRadius: 2,
              boxShadow: 1,
              overflow: 'hidden',
            }}
          >
            <DataGrid
              rows={productTypeRows}
              columns={productTypeColumns}
              getRowId={(row) => `productTypes_${row.id}`}
              loading={busy || loadingProductOptions}
              disableRowSelectionOnClick
              pageSizeOptions={[10, 25, 50]}
              initialState={{
                pagination: { paginationModel: { pageSize: 10 } },
              }}
              density="comfortable"
              sx={{ ...dataGridSx, height: '100%' }}
              localeText={{
                noRowsLabel: 'No product types found.',
              }}
            />
          </Box>
        </Box>

        <Box sx={{ flex: 1, minWidth: 0, width: { xs: '100%', md: 'auto' } }}>
          <Typography
            variant="h6"
            fontWeight={700}
            sx={{
              color: 'var(--color-darker)',
              mb: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            Styles
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
              ({styleRows.length} total styles)
            </Typography>
          </Typography>
          <Box
            sx={{
              height: 400,
              backgroundColor: '#fff',
              borderRadius: 2,
              boxShadow: 1,
              overflow: 'hidden',
            }}
          >
            <DataGrid
              rows={styleRows}
              columns={styleColumns}
              getRowId={(row) => `styles_${row.id}`}
              loading={busy || loadingProductOptions}
              disableRowSelectionOnClick
              pageSizeOptions={[10, 25, 50]}
              initialState={{
                pagination: { paginationModel: { pageSize: 10 } },
              }}
              density="comfortable"
              sx={{ ...dataGridSx, height: '100%' }}
              localeText={{
                noRowsLabel: 'No styles found.',
              }}
            />
          </Box>
        </Box>
      </Box>

      {dialogMode === 'create' ? (
        <Backdrop open={dialogOpen} onClick={() => setDialogOpen(false)} sx={{ zIndex: 50, p: 2 }}>
          <div
            className="bg-white rounded-lg shadow-xl flex flex-col"
            style={{ width: 640, maxHeight: '85vh' }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex justify-between items-center px-8 py-5 border-b shrink-0">
              <h2 className="text-lg font-semibold text-gray-900">{dialogTitle}</h2>
              <button
                onClick={() => setDialogOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none cursor-pointer"
              >
                <IoClose />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-8 py-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Type<span className="text-red-500 ml-0.5">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {CREATE_TYPES.map((typeOption) => (
                    <button
                      key={typeOption.value}
                      type="button"
                      className={`px-3 py-2 border rounded-md text-sm font-medium transition-all cursor-pointer ${
                        dialogType === typeOption.value
                          ? 'bg-[var(--color-main)] text-white border-[var(--color-main)]'
                          : 'bg-white text-gray-500 border-gray-300 hover:border-gray-400'
                      }`}
                      onClick={() => handleCreateTypeChange(typeOption.value)}
                    >
                      {typeOption.label}
                    </button>
                  ))}
                </div>
              </div>

              {dialogType === 'products' && (
                <div className="space-y-5">
                  {createProductRows.map((row, index) => (
                    <div key={`product-row-${index}`} className="border border-gray-200 rounded-lg p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          #{index + 1}
                        </span>
                        {createProductRows.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeCreateProductRow(index)}
                            className="text-red-400 hover:text-red-600 cursor-pointer transition-colors"
                            title="Remove entry"
                            disabled={busy}
                          >
                            <FiTrash2 size={14} />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <FormControl size="small" fullWidth>
                          <InputLabel id={`product-school-label-${index}`}>School</InputLabel>
                          <Select
                            labelId={`product-school-label-${index}`}
                            label="School"
                            value={row.schoolId}
                            onChange={(e) => {
                              updateCreateProductRow(index, 'schoolId', e.target.value);
                              if (index === 0) {
                                onNewProductSchoolChange(e.target.value);
                              }
                            }}
                            disabled={busy}
                          >
                            {schoolGroups.map((group) => (
                              <MenuItem key={group.school.id} value={String(group.school.id)}>
                                {group.school.schoolName}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>

                        <TextField
                          fullWidth
                          size="small"
                          label="Product Name"
                          value={row.productName}
                          onChange={(e) => {
                            updateCreateProductRow(index, 'productName', e.target.value);
                            if (index === 0) {
                              onNewProductNameChange(e.target.value);
                            }
                          }}
                          disabled={busy}
                        />

                        <FormControl size="small" fullWidth>
                          <InputLabel id={`product-type-label-${index}`}>Product Type</InputLabel>
                          <Select
                            labelId={`product-type-label-${index}`}
                            label="Product Type"
                            value={row.productTypeId}
                            onChange={(e) => {
                              updateCreateProductRow(index, 'productTypeId', e.target.value);
                              if (index === 0) {
                                onNewProductTypeChange(e.target.value);
                              }
                            }}
                            disabled={busy || loadingProductOptions}
                          >
                            {productTypeOptions.map((option) => (
                              <MenuItem key={option.id} value={String(option.id)}>
                                {option.typeName}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>

                        <FormControl size="small" fullWidth>
                          <InputLabel id={`product-style-label-${index}`}>Initial Style</InputLabel>
                          <Select
                            labelId={`product-style-label-${index}`}
                            label="Initial Style"
                            value={row.productStyleId}
                            onChange={(e) => {
                              updateCreateProductRow(index, 'productStyleId', e.target.value);
                              if (index === 0) {
                                onNewProductStyleIdChange(e.target.value);
                              }
                            }}
                            disabled={busy || loadingProductOptions}
                          >
                            {styleOptions.map((option) => (
                              <MenuItem key={option.id} value={String(option.id)}>
                                {option.styleName}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addCreateProductRow}
                    className="flex items-center gap-1.5 text-sm text-[var(--color-main)] hover:text-[var(--color-main-hover)] font-medium cursor-pointer transition-colors"
                    disabled={busy}
                  >
                    <FaPlus size={12} />
                    Add more
                  </button>
                </div>
              )}

              {dialogType === 'productTypes' && (
                <div className="space-y-5">
                  {createProductTypeRows.map((row, index) => (
                    <div key={`product-type-row-${index}`} className="border border-gray-200 rounded-lg p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          #{index + 1}
                        </span>
                        {createProductTypeRows.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeCreateProductTypeRow(index)}
                            className="text-red-400 hover:text-red-600 cursor-pointer transition-colors"
                            title="Remove entry"
                            disabled={busy}
                          >
                            <FiTrash2 size={14} />
                          </button>
                        )}
                      </div>
                      <TextField
                        fullWidth
                        size="small"
                        label="Product Type Name"
                        value={row}
                        onChange={(e) => {
                          updateCreateProductTypeRow(index, e.target.value);
                          onNewProductTypeNameChange(e.target.value);
                        }}
                        disabled={busy}
                      />
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addCreateProductTypeRow}
                    className="flex items-center gap-1.5 text-sm text-[var(--color-main)] hover:text-[var(--color-main-hover)] font-medium cursor-pointer transition-colors"
                    disabled={busy}
                  >
                    <FaPlus size={12} />
                    Add more
                  </button>
                </div>
              )}

              {dialogType === 'styles' && (
                <div className="space-y-5">
                  {createStyleRows.map((row, index) => (
                    <div key={`style-row-${index}`} className="border border-gray-200 rounded-lg p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          #{index + 1}
                        </span>
                        {createStyleRows.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeCreateStyleRow(index)}
                            className="text-red-400 hover:text-red-600 cursor-pointer transition-colors"
                            title="Remove entry"
                            disabled={busy}
                          >
                            <FiTrash2 size={14} />
                          </button>
                        )}
                      </div>
                      <TextField
                        fullWidth
                        size="small"
                        label="Style Name"
                        value={row}
                        onChange={(e) => {
                          updateCreateStyleRow(index, e.target.value);
                          onNewStyleNameChange(e.target.value);
                        }}
                        disabled={busy}
                      />
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addCreateStyleRow}
                    className="flex items-center gap-1.5 text-sm text-[var(--color-main)] hover:text-[var(--color-main-hover)] font-medium cursor-pointer transition-colors"
                    disabled={busy}
                  >
                    <FaPlus size={12} />
                    Add more
                  </button>
                </div>
              )}
            </div>

            <div className="flex gap-3 px-8 py-5 border-t shrink-0">
              <CustomButton variant="ghost" onClick={() => setDialogOpen(false)} className="flex-1">
                Cancel
              </CustomButton>
              <CustomButton onClick={handleDialogSubmit} disabled={busy || !canSubmitDialog} className="flex-1">
                {busy
                  ? 'Adding...'
                  : `Add New ${createCtaLabel}${createCount > 1 ? ` (${createCount})` : ''}`}
              </CustomButton>
            </div>
          </div>
        </Backdrop>
      ) : (
        <Dialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          fullWidth
          maxWidth="sm"
          PaperProps={{
            sx: {
              borderRadius: 3,
              boxShadow: '0 10px 30px rgba(2, 6, 23, 0.16)',
            },
          }}
        >
          <DialogTitle sx={{ pb: 1.25, borderBottom: '1px solid #e5e7eb', fontWeight: 700 }}>
            {dialogTitle}
          </DialogTitle>
          <DialogContent className="space-y-4" sx={{ pt: 2.5, mt: 1 }}>
            {dialogType === 'products' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormControl size="small" fullWidth>
                  <InputLabel id="product-school-label">School</InputLabel>
                  <Select
                    labelId="product-school-label"
                    label="School"
                    notched
                    value={selectedProductSchoolIdForEdit}
                    onChange={(e) => {
                      onNewProductSchoolChange(e.target.value);
                    }}
                    disabled
                    sx={{
                      '& .MuiOutlinedInput-notchedOutline legend': {
                        maxWidth: '100%',
                      },
                    }}
                  >
                    {schoolGroups.map((group) => (
                      <MenuItem key={group.school.id} value={String(group.school.id)}>
                        {group.school.schoolName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  size="small"
                  label="Product name"
                  InputLabelProps={{ shrink: true }}
                  value={productEditName}
                  onChange={(e) => onProductEditNameChange(e.target.value)}
                  disabled={busy}
                  sx={{
                    '& .MuiOutlinedInput-notchedOutline legend': {
                      maxWidth: '100%',
                    },
                  }}
                />
              </div>
            )}

            {dialogType === 'productTypes' && (
              <TextField
                fullWidth
                size="small"
                label="Product type name"
                InputLabelProps={{ shrink: true }}
                value={productTypeEditName}
                onChange={(e) => onProductTypeEditNameChange(e.target.value)}
                disabled={busy}
                sx={{
                  '& .MuiOutlinedInput-notchedOutline legend': {
                    maxWidth: '100%',
                  },
                }}
              />
            )}

            {dialogType === 'styles' && (
              <TextField
                fullWidth
                size="small"
                label="Style name"
                InputLabelProps={{ shrink: true }}
                value={styleEditName}
                onChange={(e) => onStyleEditNameChange(e.target.value)}
                disabled={busy}
                sx={{
                  '& .MuiOutlinedInput-notchedOutline legend': {
                    maxWidth: '100%',
                  },
                }}
              />
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5, pt: 1.5, borderTop: '1px solid #e5e7eb' }}>
            <Button onClick={() => setDialogOpen(false)} sx={{ textTransform: 'none' }}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleDialogSubmit}
              disabled={busy || !canSubmitDialog}
              startIcon={busy ? <CircularProgress size={14} color="inherit" /> : <SaveOutlinedIcon />}
              sx={{
                textTransform: 'none',
                borderRadius: '10px',
                fontWeight: 600,
                backgroundColor: '#69aa56',
                '&:hover': { backgroundColor: '#55923e' },
              }}
            >
              Save
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </div>
  );
}
