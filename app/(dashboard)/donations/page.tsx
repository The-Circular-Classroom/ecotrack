'use client';

import { useEffect, useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import AddRounded from '@mui/icons-material/AddRounded';
import LocationOnRounded from '@mui/icons-material/LocationOnRounded';
import SchoolRounded from '@mui/icons-material/SchoolRounded';
import CalendarMonthRounded from '@mui/icons-material/CalendarMonthRounded';
import PersonRounded from '@mui/icons-material/PersonRounded';
import SnackbarAlert from '@/components/SnackbarAlert';

// Types
interface DonationDrive {
  id: number;
  driveName: string;
  startDate: string;
  endDate: string;
  location: string;
  schoolId: number | null;
  createdByUserId: number;
  school: { id: number; schoolName: string } | null;
  createdBy: { id: number; fullName: string; email: string };
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

type DriveStatus = 'active' | 'upcoming' | 'past';

function getDriveStatus(startDate: string, endDate: string): DriveStatus {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (now >= start && now <= end) return 'active';
  if (now < start) return 'upcoming';
  return 'past';
}

function getStatusColor(status: DriveStatus): 'success' | 'info' | 'default' {
  switch (status) {
    case 'active':
      return 'success';
    case 'upcoming':
      return 'info';
    case 'past':
      return 'default';
  }
}

function getStatusLabel(status: DriveStatus): string {
  switch (status) {
    case 'active':
      return 'Active';
    case 'upcoming':
      return 'Upcoming';
    case 'past':
      return 'Past';
  }
}

function getDriveProgress(startDate: string, endDate: string): number {
  const now = new Date().getTime();
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();

  if (now <= start) return 0;
  if (now >= end) return 100;

  const total = end - start;
  const elapsed = now - start;
  return Math.round((elapsed / total) * 100);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function DonationsPage() {
  const [drives, setDrives] = useState<DonationDrive[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active'>('all');
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'info',
  });

  // Create dialog state
  const [createOpen, setCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createForm, setCreateForm] = useState({
    driveName: '',
    startDate: '',
    endDate: '',
    location: '',
  });

  // Fetch drives
  const fetchDrives = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filter === 'active') {
        params.set('active', 'true');
      }

      const res = await fetch(`/api/donations/drives?${params.toString()}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || `Request failed with status ${res.status}`);
      }
      const json: { drives: DonationDrive[]; pagination: PaginationInfo } = await res.json();
      setDrives(json.drives);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load donation drives';
      setError(message);
      setSnackbar({ open: true, message, severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchDrives();
  }, [fetchDrives]);

  // Handle filter change
  const handleFilterChange = (
    _event: React.MouseEvent<HTMLElement>,
    newFilter: 'all' | 'active' | null
  ) => {
    if (newFilter !== null) {
      setFilter(newFilter);
    }
  };

  // Create drive
  const handleCreate = async () => {
    if (!createForm.driveName || !createForm.startDate || !createForm.endDate || !createForm.location) {
      setSnackbar({
        open: true,
        message: 'All fields are required',
        severity: 'warning',
      });
      return;
    }

    if (new Date(createForm.startDate) > new Date(createForm.endDate)) {
      setSnackbar({
        open: true,
        message: 'Start date must be before end date',
        severity: 'warning',
      });
      return;
    }

    setCreateLoading(true);
    try {
      const body = {
        driveName: createForm.driveName,
        startDate: createForm.startDate,
        endDate: createForm.endDate,
        location: createForm.location,
        createdByUserId: 1, // Current user placeholder
      };

      const res = await fetch('/api/donations/drives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to create donation drive');
      }

      setSnackbar({ open: true, message: 'Donation drive created successfully', severity: 'success' });
      setCreateOpen(false);
      setCreateForm({ driveName: '', startDate: '', endDate: '', location: '' });
      fetchDrives();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create donation drive';
      setSnackbar({ open: true, message, severity: 'error' });
    } finally {
      setCreateLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress color="primary" />
      </Box>
    );
  }

  // Error state with no data
  if (error && drives.length === 0) {
    return (
      <Box p={3}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Donation Drives
        </Typography>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="outlined" onClick={() => fetchDrives()}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Donation Drives
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={3}>
        Manage donation drives, track progress, and create new campaigns.
      </Typography>

      {/* Toolbar */}
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          mb: 3,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          flexWrap: 'wrap',
        }}
      >
        <ToggleButtonGroup
          value={filter}
          exclusive
          onChange={handleFilterChange}
          size="small"
          aria-label="Filter drives"
        >
          <ToggleButton value="all" aria-label="All drives">
            All
          </ToggleButton>
          <ToggleButton value="active" aria-label="Active drives">
            Active
          </ToggleButton>
        </ToggleButtonGroup>

        <Box sx={{ ml: 'auto' }}>
          <Button
            variant="contained"
            size="small"
            startIcon={<AddRounded />}
            color="primary"
            onClick={() => setCreateOpen(true)}
          >
            Create Drive
          </Button>
        </Box>
      </Paper>

      {/* Drive Cards */}
      {drives.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">
            {filter === 'active'
              ? 'No active donation drives found.'
              : 'No donation drives found. Create one to get started.'}
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {drives.map((drive) => {
            const status = getDriveStatus(drive.startDate, drive.endDate);
            const progress = getDriveProgress(drive.startDate, drive.endDate);

            return (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={drive.id}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 3,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderTop: '4px solid',
                    borderTopColor:
                      status === 'active'
                        ? 'success.main'
                        : status === 'upcoming'
                          ? 'info.main'
                          : 'grey.400',
                  }}
                >
                  {/* Header */}
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Typography variant="h6" fontWeight={600} sx={{ flex: 1, mr: 1 }}>
                      {drive.driveName}
                    </Typography>
                    <Chip
                      label={getStatusLabel(status)}
                      size="small"
                      color={getStatusColor(status)}
                      variant="filled"
                    />
                  </Box>

                  {/* Details */}
                  <Box display="flex" flexDirection="column" gap={1} mb={2} sx={{ flex: 1 }}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <LocationOnRounded fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {drive.location}
                      </Typography>
                    </Box>

                    {drive.school && (
                      <Box display="flex" alignItems="center" gap={1}>
                        <SchoolRounded fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {drive.school.schoolName}
                        </Typography>
                      </Box>
                    )}

                    <Box display="flex" alignItems="center" gap={1}>
                      <CalendarMonthRounded fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(drive.startDate)} – {formatDate(drive.endDate)}
                      </Typography>
                    </Box>

                    <Box display="flex" alignItems="center" gap={1}>
                      <PersonRounded fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {drive.createdBy.fullName}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Progress */}
                  <Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                      <Typography variant="caption" color="text.secondary">
                        Duration progress
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {progress}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={progress}
                      color={status === 'active' ? 'success' : status === 'upcoming' ? 'info' : 'inherit'}
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                  </Box>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Create Drive Dialog */}
      <Dialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create Donation Drive</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              label="Drive Name"
              required
              fullWidth
              value={createForm.driveName}
              onChange={(e) => setCreateForm((f) => ({ ...f, driveName: e.target.value }))}
              placeholder="e.g., Spring Clothing Drive 2025"
            />
            <TextField
              label="Start Date"
              type="date"
              required
              fullWidth
              value={createForm.startDate}
              onChange={(e) => setCreateForm((f) => ({ ...f, startDate: e.target.value }))}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label="End Date"
              type="date"
              required
              fullWidth
              value={createForm.endDate}
              onChange={(e) => setCreateForm((f) => ({ ...f, endDate: e.target.value }))}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label="Location"
              required
              fullWidth
              value={createForm.location}
              onChange={(e) => setCreateForm((f) => ({ ...f, location: e.target.value }))}
              placeholder="e.g., Main Hall, Building A"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)} disabled={createLoading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={createLoading}
            startIcon={createLoading ? <CircularProgress size={16} /> : undefined}
          >
            {createLoading ? 'Creating...' : 'Create Drive'}
          </Button>
        </DialogActions>
      </Dialog>

      <SnackbarAlert
        open={snackbar.open}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        message={snackbar.message}
        severity={snackbar.severity}
      />
    </Box>
  );
}
