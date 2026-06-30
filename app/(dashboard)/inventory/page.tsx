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
import SearchRounded from '@mui/icons-material/SearchRounded';
import AddRounded from '@mui/icons-material/AddRounded';
import RefreshRounded from '@mui/icons-material/RefreshRounded';
import { DataGrid, GridColDef, GridPaginationModel } from '@mui/x-data-grid';
import SnackbarAlert from '@/components/SnackbarAlert';

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
];

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

  const handleRefresh = () => {
    fetchItems();
    setSnackbar({ open: true, message: 'Inventory refreshed', severity: 'success' });
  };

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

      <SnackbarAlert
        open={snackbar.open}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        message={snackbar.message}
        severity={snackbar.severity}
      />
    </Box>
  );
}
