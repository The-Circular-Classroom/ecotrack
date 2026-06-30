'use client';

import { useEffect, useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import InputAdornment from '@mui/material/InputAdornment';
import Chip from '@mui/material/Chip';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import SearchRounded from '@mui/icons-material/SearchRounded';
import AddRounded from '@mui/icons-material/AddRounded';
import EditRounded from '@mui/icons-material/EditRounded';
import DeleteRounded from '@mui/icons-material/DeleteRounded';
import CloseRounded from '@mui/icons-material/CloseRounded';
import SyncRounded from '@mui/icons-material/SyncRounded';
import { DataGrid, GridColDef, GridPaginationModel } from '@mui/x-data-grid';
import CreateUserModal from '@/components/CreateUserModal';
import StyledConfirmDialog from '@/components/StyledConfirmDialog';
import StatusBadge from '@/components/ui/StatusBadge';
import SnackbarAlert from '@/components/SnackbarAlert';

// Types
interface User {
  id: number;
  username?: string;
  email: string;
  role: string;
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  isActive: boolean;
  schoolId: number | null;
  schoolName?: string | null;
  createdAt?: string;
  createdDate?: string;
}

interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'warning' | 'info';
}

// Role chip color mapping
const ROLE_COLORS: Record<string, 'error' | 'primary' | 'secondary' | 'success'> = {
  Admin: 'error',
  SchoolStaff: 'primary',
  PsgVolunteer: 'secondary',
  Parent: 'success',
};

const ROLES = ['Admin', 'SchoolStaff', 'PsgVolunteer', 'Parent'] as const;

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });
  const [totalRows, setTotalRows] = useState(0);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'info',
  });

  // Create modal state
  const [createOpen, setCreateOpen] = useState(false);

  // Edit drawer state
  const [editOpen, setEditOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    role: '',
    isActive: true,
    schoolId: '',
  });

  // Delete dialog state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);

  // Fetch users from GET /api/users/list?page=&limit=&username=
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(paginationModel.page + 1),
        limit: String(paginationModel.pageSize),
      });
      if (searchQuery.trim()) {
        params.set('username', searchQuery.trim());
      }

      const res = await fetch(`/api/users/list?${params.toString()}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || `Request failed with status ${res.status}`);
      }
      const json = await res.json();
      setUsers(json.data || []);
      setTotalRows(json.total || 0);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load users';
      setError(message);
      setSnackbar({ open: true, message, severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [paginationModel.page, paginationModel.pageSize, searchQuery]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Search on Enter key
  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setPaginationModel((prev) => ({ ...prev, page: 0 }));
    }
  };

  // Sync / refresh
  const handleSync = () => {
    fetchUsers();
  };

  // Create user success callback
  const handleCreateSuccess = () => {
    setSnackbar({ open: true, message: 'User created successfully', severity: 'success' });
    fetchUsers();
  };

  // Edit user
  const handleEditOpen = (user: User) => {
    setEditUser(user);
    setEditForm({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      role: user.role,
      isActive: user.isActive,
      schoolId: user.schoolId?.toString() || '',
    });
    setEditOpen(true);
  };

  const handleEditSave = async () => {
    if (!editUser) return;
    setEditLoading(true);
    try {
      const body: Record<string, unknown> = {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        role: editForm.role,
        isActive: editForm.isActive,
        schoolId: editForm.schoolId ? parseInt(editForm.schoolId, 10) : null,
      };

      const res = await fetch(`/api/users/${editUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to update user');
      }

      setSnackbar({ open: true, message: 'User updated successfully', severity: 'success' });
      setEditOpen(false);
      setEditUser(null);
      fetchUsers();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update user';
      setSnackbar({ open: true, message, severity: 'error' });
    } finally {
      setEditLoading(false);
    }
  };

  // Delete user
  const handleDeleteOpen = (user: User) => {
    setDeleteUser(user);
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteUser) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/users/${deleteUser.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to delete user');
      }

      setSnackbar({ open: true, message: 'User deleted successfully', severity: 'success' });
      setDeleteOpen(false);
      setDeleteUser(null);
      fetchUsers();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete user';
      setSnackbar({ open: true, message, severity: 'error' });
    } finally {
      setDeleteLoading(false);
    }
  };

  // DataGrid columns
  const columns: GridColDef[] = [
    {
      field: 'fullName',
      headerName: 'Name',
      flex: 1,
      minWidth: 180,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2" fontWeight={500}>
            {params.row.fullName || `${params.row.firstName || ''} ${params.row.lastName || ''}`.trim() || '—'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {params.row.email}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'role',
      headerName: 'Role',
      width: 140,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          color={ROLE_COLORS[params.value as string] || 'default'}
          variant="filled"
        />
      ),
    },
    {
      field: 'isActive',
      headerName: 'Status',
      width: 110,
      renderCell: (params) => (
        <StatusBadge status={params.value ? 'active' : 'inactive'} />
      ),
    },
    {
      field: 'schoolId',
      headerName: 'School',
      width: 120,
      valueGetter: (_value: unknown, row: User) => row.schoolName || row.schoolId || '—',
    },
    {
      field: 'createdAt',
      headerName: 'Created',
      width: 120,
      valueGetter: (_value: unknown, row: User) => {
        const date = row.createdAt || row.createdDate;
        if (!date) return '';
        return new Date(date).toLocaleDateString();
      },
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Box>
          <IconButton
            size="small"
            onClick={() => handleEditOpen(params.row)}
            aria-label="Edit user"
          >
            <EditRounded fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => handleDeleteOpen(params.row)}
            aria-label="Delete user"
            color="error"
          >
            <DeleteRounded fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ];

  // Error state with no data
  if (error && users.length === 0) {
    return (
      <Box p={3}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          User Management
        </Typography>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="outlined" onClick={handleSync}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        User Management
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={3}>
        Create, update, and manage platform user accounts and roles.
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
          placeholder="Search by username..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleSearchKeyDown}
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
            startIcon={<SyncRounded />}
            onClick={handleSync}
          >
            Sync
          </Button>
          <Button
            variant="contained"
            size="small"
            startIcon={<AddRounded />}
            color="primary"
            onClick={() => setCreateOpen(true)}
          >
            Add User
          </Button>
        </Box>
      </Paper>

      {/* DataGrid */}
      <Paper variant="outlined" sx={{ width: '100%' }}>
        <DataGrid
          rows={users}
          columns={columns}
          loading={loading}
          paginationMode="server"
          rowCount={totalRows}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[10, 25, 50, 100]}
          disableRowSelectionOnClick
          autoHeight
          rowHeight={60}
          sx={{
            border: 'none',
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: 'action.hover',
            },
            '& .MuiDataGrid-cell': {
              borderBottom: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              alignItems: 'center',
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
                  {searchQuery ? 'No users match your search.' : 'No users found.'}
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

      {/* Create User Modal */}
      <CreateUserModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      {/* Edit User Drawer */}
      <Drawer
        anchor="right"
        open={editOpen}
        onClose={() => setEditOpen(false)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 400 } } }}
      >
        <Box p={3}>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
            <Typography variant="h6">Edit User</Typography>
            <IconButton onClick={() => setEditOpen(false)} aria-label="Close drawer">
              <CloseRounded />
            </IconButton>
          </Box>

          {editUser && (
            <Box display="flex" flexDirection="column" gap={2}>
              <TextField
                label="Email"
                fullWidth
                value={editUser.email}
                disabled
                helperText="Email cannot be changed"
              />
              <TextField
                label="First Name"
                fullWidth
                value={editForm.firstName}
                onChange={(e) => setEditForm((f) => ({ ...f, firstName: e.target.value }))}
              />
              <TextField
                label="Last Name"
                fullWidth
                value={editForm.lastName}
                onChange={(e) => setEditForm((f) => ({ ...f, lastName: e.target.value }))}
              />
              <FormControl fullWidth>
                <InputLabel id="edit-role-label">Role</InputLabel>
                <Select
                  labelId="edit-role-label"
                  label="Role"
                  value={editForm.role}
                  onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value }))}
                >
                  {ROLES.map((role) => (
                    <MenuItem key={role} value={role}>
                      {role}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="School ID (optional)"
                type="number"
                fullWidth
                value={editForm.schoolId}
                onChange={(e) => setEditForm((f) => ({ ...f, schoolId: e.target.value }))}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={editForm.isActive}
                    onChange={(e) => setEditForm((f) => ({ ...f, isActive: e.target.checked }))}
                    color="success"
                  />
                }
                label={editForm.isActive ? 'Active' : 'Inactive'}
              />

              <Box display="flex" gap={1} mt={2}>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={handleEditSave}
                  disabled={editLoading}
                  startIcon={editLoading ? <CircularProgress size={16} /> : undefined}
                >
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </Button>
              </Box>
            </Box>
          )}
        </Box>
      </Drawer>

      {/* Delete Confirmation Dialog */}
      <StyledConfirmDialog
        open={deleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          setDeleteUser(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete User"
        message={
          <>
            Are you sure you want to delete{' '}
            <strong>{deleteUser?.fullName || deleteUser?.email}</strong>? This action cannot be undone.
          </>
        }
        confirmLabel="Delete"
        confirmColor="error"
        loading={deleteLoading}
      />

      <SnackbarAlert
        open={snackbar.open}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        message={snackbar.message}
        severity={snackbar.severity}
      />
    </Box>
  );
}
