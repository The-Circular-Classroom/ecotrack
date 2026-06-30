'use client';

import { useEffect, useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import InputAdornment from '@mui/material/InputAdornment';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import SearchRounded from '@mui/icons-material/SearchRounded';
import AddRounded from '@mui/icons-material/AddRounded';
import RefreshRounded from '@mui/icons-material/RefreshRounded';
import EditRounded from '@mui/icons-material/EditRounded';
import DeleteRounded from '@mui/icons-material/DeleteRounded';
import { DataGrid, GridColDef, GridPaginationModel } from '@mui/x-data-grid';
import SnackbarAlert from '@/components/SnackbarAlert';
import StyledConfirmDialog from '@/components/StyledConfirmDialog';

// --- Types ---

interface ItemType {
  id: number;
  schoolId: number;
  categoryId: number;
  primaryColourId: number;
  secondaryColourId: number | null;
  patternId: number | null;
  materialId: number | null;
  sizeCategoryId: number;
  gender: string;
  imageUrl: string | null;
  createdDate: string;
  school: { id: number; schoolName: string };
  category: { id: number; categoryName: string };
  primaryColour: { id: number; colourName: string };
  secondaryColour?: { id: number; colourName: string } | null;
  pattern?: { id: number; patternName: string } | null;
  material?: { id: number; materialName: string } | null;
  sizeCategory: { id: number; sizeType: string };
}

interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'warning' | 'info';
}

interface ReferenceData {
  schools: Array<{ id: number; schoolName: string }>;
  categories: Array<{ id: number; categoryName: string }>;
  colours: Array<{ id: number; colourName: string }>;
  sizeCategories: Array<{ id: number; sizeType: string }>;
  materials: Array<{ id: number; materialName: string }>;
  patterns: Array<{ id: number; patternName: string }>;
}

interface ItemFormData {
  schoolId: number | '';
  categoryId: number | '';
  primaryColourId: number | '';
  secondaryColourId: number | '' | null;
  patternId: number | '' | null;
  materialId: number | '' | null;
  sizeCategoryId: number | '';
  gender: string;
}

const INITIAL_FORM_DATA: ItemFormData = {
  schoolId: '',
  categoryId: '',
  primaryColourId: '',
  secondaryColourId: '',
  patternId: '',
  materialId: '',
  sizeCategoryId: '',
  gender: 'Unisex',
};

export default function InventoryPage() {
  const [items, setItems] = useState<ItemType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 25,
  });
  const [totalRows, setTotalRows] = useState(0);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'info',
  });

  // CRUD state
  const [referenceData, setReferenceData] = useState<ReferenceData>({
    schools: [],
    categories: [],
    colours: [],
    sizeCategories: [],
    materials: [],
    patterns: [],
  });
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [formData, setFormData] = useState<ItemFormData>(INITIAL_FORM_DATA);
  const [editingItem, setEditingItem] = useState<ItemType | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<ItemType | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // --- Fetch inventory items ---

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(paginationModel.page + 1),
        pageSize: String(paginationModel.pageSize),
      });

      const res = await fetch(`/api/inventory/item-types?${params.toString()}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || `Request failed with status ${res.status}`);
      }
      const json: { itemTypes: ItemType[]; pagination: PaginationInfo } = await res.json();
      setItems(json.itemTypes);
      setTotalRows(json.pagination.total);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load inventory items';
      setError(message);
      setSnackbar({ open: true, message, severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [paginationModel.page, paginationModel.pageSize]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // --- Fetch reference data for form dropdowns ---

  const fetchReferenceData = useCallback(async () => {
    try {
      const [schoolsRes, categoriesRes, coloursRes, sizesRes, materialsRes, patternsRes] =
        await Promise.all([
          fetch('/api/inventory/item-types?page=1&pageSize=1'),
          fetch('/api/inventory/categories'),
          fetch('/api/inventory/colours'),
          fetch('/api/inventory/sizes'),
          fetch('/api/inventory/materials'),
          fetch('/api/inventory/patterns'),
        ]);

      // We need schools list - extract unique schools from items or use a dedicated endpoint
      // Since there's no /api/schools endpoint yet, we fetch distinct schools from item-types
      // But actually let's fetch items with a large page to get unique schools
      // Better approach: fetch from the balance endpoint which includes school info
      const [categories, colours, sizes, materials, patterns] = await Promise.all([
        categoriesRes.ok ? categoriesRes.json() : { categories: [] },
        coloursRes.ok ? coloursRes.json() : { colours: [] },
        sizesRes.ok ? sizesRes.json() : { sizeCategories: [] },
        materialsRes.ok ? materialsRes.json() : { materials: [] },
        patternsRes.ok ? patternsRes.json() : { patterns: [] },
      ]);

      // For schools, try fetching from a dedicated endpoint or extract from balance data
      let schools: Array<{ id: number; schoolName: string }> = [];
      try {
        const schoolsResponse = await fetch('/api/schools');
        if (schoolsResponse.ok) {
          const schoolsData = await schoolsResponse.json();
          schools = schoolsData.data || schoolsData.schools || [];
        }
      } catch {
        // Fallback: extract unique schools from existing items
        const uniqueSchools = new Map<number, string>();
        items.forEach((item) => {
          if (item.school) {
            uniqueSchools.set(item.school.id, item.school.schoolName);
          }
        });
        schools = Array.from(uniqueSchools.entries()).map(([id, schoolName]) => ({
          id,
          schoolName,
        }));
      }

      setReferenceData({
        schools,
        categories: categories.categories || [],
        colours: colours.colours || [],
        sizeCategories: sizes.sizeCategories || [],
        materials: materials.materials || [],
        patterns: patterns.patterns || [],
      });
    } catch {
      setSnackbar({
        open: true,
        message: 'Failed to load form options',
        severity: 'warning',
      });
    }
  }, [items]);

  // --- CRUD handlers ---

  const handleAddClick = () => {
    setEditingItem(null);
    setFormData(INITIAL_FORM_DATA);
    fetchReferenceData();
    setFormDialogOpen(true);
  };

  const handleEditClick = (item: ItemType) => {
    setEditingItem(item);
    setFormData({
      schoolId: item.schoolId,
      categoryId: item.categoryId,
      primaryColourId: item.primaryColourId,
      secondaryColourId: item.secondaryColourId ?? '',
      patternId: item.patternId ?? '',
      materialId: item.materialId ?? '',
      sizeCategoryId: item.sizeCategoryId,
      gender: item.gender,
    });
    fetchReferenceData();
    setFormDialogOpen(true);
  };

  const handleDeleteClick = (item: ItemType) => {
    setDeletingItem(item);
    setDeleteDialogOpen(true);
  };

  const handleFormClose = () => {
    setFormDialogOpen(false);
    setEditingItem(null);
    setFormData(INITIAL_FORM_DATA);
  };

  const handleFormSubmit = async () => {
    if (!formData.schoolId || !formData.categoryId || !formData.primaryColourId || !formData.sizeCategoryId) {
      setSnackbar({
        open: true,
        message: 'Please fill in all required fields',
        severity: 'warning',
      });
      return;
    }

    setFormSubmitting(true);
    try {
      const payload = {
        schoolId: Number(formData.schoolId),
        categoryId: Number(formData.categoryId),
        primaryColourId: Number(formData.primaryColourId),
        secondaryColourId: formData.secondaryColourId ? Number(formData.secondaryColourId) : null,
        patternId: formData.patternId ? Number(formData.patternId) : null,
        materialId: formData.materialId ? Number(formData.materialId) : null,
        sizeCategoryId: Number(formData.sizeCategoryId),
        gender: formData.gender,
      };

      let res: Response;
      if (editingItem) {
        res = await fetch(`/api/inventory/item-types/${editingItem.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/inventory/item-types', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || `Request failed with status ${res.status}`);
      }

      setSnackbar({
        open: true,
        message: editingItem ? 'Item updated successfully' : 'Item created successfully',
        severity: 'success',
      });
      handleFormClose();
      fetchItems();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save item';
      setSnackbar({ open: true, message, severity: 'error' });
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingItem) return;

    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/inventory/item-types/${deletingItem.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || `Delete failed with status ${res.status}`);
      }

      setSnackbar({
        open: true,
        message: 'Item deleted successfully',
        severity: 'success',
      });
      setDeleteDialogOpen(false);
      setDeletingItem(null);
      fetchItems();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete item';
      setSnackbar({ open: true, message, severity: 'error' });
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchItems();
    setSnackbar({ open: true, message: 'Inventory refreshed', severity: 'success' });
  };

  // --- Client-side filter ---

  const filteredItems = items.filter((item) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.school?.schoolName?.toLowerCase().includes(query) ||
      item.category?.categoryName?.toLowerCase().includes(query) ||
      item.primaryColour?.colourName?.toLowerCase().includes(query) ||
      item.gender?.toLowerCase().includes(query) ||
      item.sizeCategory?.sizeType?.toLowerCase().includes(query) ||
      item.material?.materialName?.toLowerCase().includes(query) ||
      item.pattern?.patternName?.toLowerCase().includes(query)
    );
  });

  // --- Columns with actions ---

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 70 },
    {
      field: 'school',
      headerName: 'School',
      flex: 1,
      minWidth: 150,
      valueGetter: (_value: unknown, row: ItemType) => row.school?.schoolName ?? '',
    },
    {
      field: 'category',
      headerName: 'Category',
      flex: 1,
      minWidth: 130,
      valueGetter: (_value: unknown, row: ItemType) => row.category?.categoryName ?? '',
    },
    {
      field: 'primaryColour',
      headerName: 'Colour',
      width: 120,
      valueGetter: (_value: unknown, row: ItemType) => row.primaryColour?.colourName ?? '',
    },
    {
      field: 'gender',
      headerName: 'Gender',
      width: 100,
    },
    {
      field: 'sizeCategory',
      headerName: 'Size Type',
      width: 120,
      valueGetter: (_value: unknown, row: ItemType) => row.sizeCategory?.sizeType ?? '',
    },
    {
      field: 'material',
      headerName: 'Material',
      width: 120,
      valueGetter: (_value: unknown, row: ItemType) => row.material?.materialName ?? '—',
    },
    {
      field: 'pattern',
      headerName: 'Pattern',
      width: 120,
      valueGetter: (_value: unknown, row: ItemType) => row.pattern?.patternName ?? '—',
    },
    {
      field: 'createdDate',
      headerName: 'Created',
      width: 120,
      valueGetter: (_value: unknown, row: ItemType) => {
        if (!row.createdDate) return '';
        return new Date(row.createdDate).toLocaleDateString();
      },
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Box display="flex" gap={0.5}>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => handleEditClick(params.row as ItemType)}>
              <EditRounded fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" color="error" onClick={() => handleDeleteClick(params.row as ItemType)}>
              <DeleteRounded fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  // --- Error state (full page) ---

  if (error && items.length === 0) {
    return (
      <Box p={3}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Inventory Management
        </Typography>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="outlined" startIcon={<RefreshRounded />} onClick={handleRefresh}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Inventory Management
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={3}>
        Manage item types, view stock levels, and track inventory across schools.
      </Typography>

      {/* Toolbar */}
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          mb: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          flexWrap: 'wrap',
        }}
      >
        <TextField
          size="small"
          placeholder="Search items..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRounded fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
          sx={{ minWidth: 250, flex: 1, maxWidth: 400 }}
        />
        <Box sx={{ display: 'flex', gap: 1, ml: 'auto' }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<RefreshRounded />}
            onClick={handleRefresh}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            size="small"
            startIcon={<AddRounded />}
            color="primary"
            onClick={handleAddClick}
          >
            Add Item
          </Button>
        </Box>
      </Paper>

      {/* DataGrid */}
      <Paper variant="outlined" sx={{ width: '100%' }}>
        <DataGrid
          rows={filteredItems}
          columns={columns}
          loading={loading}
          paginationMode="server"
          rowCount={totalRows}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[10, 25, 50, 100]}
          disableRowSelectionOnClick
          autoHeight
          sx={{
            border: 'none',
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: 'action.hover',
            },
            '& .MuiDataGrid-cell': {
              borderBottom: '1px solid',
              borderColor: 'divider',
            },
          }}
          slots={{
            noRowsOverlay: () => (
              <Box
                display="flex"
                alignItems="center"
                justifyContent="center"
                height="100%"
                p={4}
              >
                <Typography color="text.secondary">
                  {searchQuery ? 'No items match your search.' : 'No inventory items found.'}
                </Typography>
              </Box>
            ),
            loadingOverlay: () => (
              <Box
                display="flex"
                alignItems="center"
                justifyContent="center"
                height="100%"
              >
                <CircularProgress size={32} />
              </Box>
            ),
          }}
        />
      </Paper>

      {/* Create/Edit Dialog */}
      <Dialog open={formDialogOpen} onClose={formSubmitting ? undefined : handleFormClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>
          {editingItem ? 'Edit Item Type' : 'Add Item Type'}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <TextField
            select
            label="School *"
            value={formData.schoolId}
            onChange={(e) => setFormData({ ...formData, schoolId: Number(e.target.value) || '' })}
            size="small"
            disabled={!!editingItem}
            fullWidth
          >
            <MenuItem value="">Select school</MenuItem>
            {referenceData.schools.map((s) => (
              <MenuItem key={s.id} value={s.id}>
                {s.schoolName}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Category *"
            value={formData.categoryId}
            onChange={(e) => setFormData({ ...formData, categoryId: Number(e.target.value) || '' })}
            size="small"
            fullWidth
          >
            <MenuItem value="">Select category</MenuItem>
            {referenceData.categories.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.categoryName}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Primary Colour *"
            value={formData.primaryColourId}
            onChange={(e) => setFormData({ ...formData, primaryColourId: Number(e.target.value) || '' })}
            size="small"
            fullWidth
          >
            <MenuItem value="">Select colour</MenuItem>
            {referenceData.colours.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.colourName}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Secondary Colour"
            value={formData.secondaryColourId ?? ''}
            onChange={(e) => setFormData({ ...formData, secondaryColourId: Number(e.target.value) || null })}
            size="small"
            fullWidth
          >
            <MenuItem value="">None</MenuItem>
            {referenceData.colours.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.colourName}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Size Category *"
            value={formData.sizeCategoryId}
            onChange={(e) => setFormData({ ...formData, sizeCategoryId: Number(e.target.value) || '' })}
            size="small"
            fullWidth
          >
            <MenuItem value="">Select size category</MenuItem>
            {referenceData.sizeCategories.map((s) => (
              <MenuItem key={s.id} value={s.id}>
                {s.sizeType}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Gender"
            value={formData.gender}
            onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
            size="small"
            fullWidth
          >
            <MenuItem value="Unisex">Unisex</MenuItem>
            <MenuItem value="Male">Male</MenuItem>
            <MenuItem value="Female">Female</MenuItem>
          </TextField>

          <TextField
            select
            label="Material"
            value={formData.materialId ?? ''}
            onChange={(e) => setFormData({ ...formData, materialId: Number(e.target.value) || null })}
            size="small"
            fullWidth
          >
            <MenuItem value="">None</MenuItem>
            {referenceData.materials.map((m) => (
              <MenuItem key={m.id} value={m.id}>
                {m.materialName}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Pattern"
            value={formData.patternId ?? ''}
            onChange={(e) => setFormData({ ...formData, patternId: Number(e.target.value) || null })}
            size="small"
            fullWidth
          >
            <MenuItem value="">None</MenuItem>
            {referenceData.patterns.map((p) => (
              <MenuItem key={p.id} value={p.id}>
                {p.patternName}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button variant="outlined" onClick={handleFormClose} disabled={formSubmitting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleFormSubmit}
            disabled={formSubmitting}
            startIcon={formSubmitting ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            {formSubmitting
              ? 'Saving...'
              : editingItem
                ? 'Update'
                : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <StyledConfirmDialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setDeletingItem(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Item Type"
        message={
          deletingItem
            ? `Are you sure you want to delete item #${deletingItem.id} (${deletingItem.category?.categoryName ?? 'Unknown'} — ${deletingItem.school?.schoolName ?? 'Unknown'})? This cannot be undone.`
            : 'Are you sure you want to delete this item?'
        }
        confirmLabel="Delete"
        confirmColor="error"
        loading={deleteLoading}
      />

      {/* Snackbar */}
      <SnackbarAlert
        open={snackbar.open}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        message={snackbar.message}
        severity={snackbar.severity}
      />
    </Box>
  );
}
